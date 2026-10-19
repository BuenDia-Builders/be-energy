/**
 * simulate-testnet.ts — Simula 10 usuarios en Stellar Testnet
 *
 * Uso:
 *   npx tsx scripts/simulate-testnet.ts
 *
 * Requiere el servidor Next.js corriendo en localhost:3000 (o API_BASE custom)
 */

import * as StellarSdk from "@stellar/stellar-sdk";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
const ENERGY_TOKEN_CONTRACT =
  process.env.ENERGY_TOKEN_CONTRACT ||
  "CAUH3NUZGCNRHHVJK5S3FLXIS244GCNPC2LDZDU2SVOK66G3IGAGBBL2";
const GOVERNANCE_CONTRACT =
  process.env.GOVERNANCE_CONTRACT ||
  "CCH2EXXNSDW2BAKBIPFAG6CCZS6LV4VJFUP2CZZCW5LEY4JOAXBJD6YI";

const USERS_FILE = path.join(__dirname, ".testnet-users.json");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SimUser {
  name: string;
  keypair: { public: string; secret: string };
  role: "prosumer" | "consumer";
  panelCapacityKw: number | null;
  readings: { id: string; kwh: number; date: string }[];
  hdropBalance: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const MAX_RETRIES = 3;

async function api(
  method: string,
  endpoint: string,
  body?: Record<string, unknown>,
  retries = MAX_RETRIES
): Promise<unknown> {
  const url = `${API_BASE}${endpoint}`;
  const opts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url, opts);
    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      // Server returned HTML (error page) — retry after delay
      if (attempt < retries) {
        await sleep(5000 * attempt);
        continue;
      }
      throw new Error(
        `API ${method} ${endpoint} → ${res.status}: respuesta no-JSON (server error)`
      );
    }

    const json = await res.json();

    if (!res.ok) {
      throw new Error(
        `API ${method} ${endpoint} → ${res.status}: ${JSON.stringify(json)}`
      );
    }
    return json;
  }

  throw new Error(`API ${method} ${endpoint}: max retries exceeded`);
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function randomBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// User profiles
// ---------------------------------------------------------------------------

const USER_PROFILES: {
  name: string;
  role: "prosumer" | "consumer";
  panelKw: number | null;
}[] = [
  { name: "Casa Solar Norte", role: "prosumer", panelKw: 3.5 },
  { name: "Depto Sustentable", role: "prosumer", panelKw: 2.0 },
  { name: "Edificio Verde", role: "prosumer", panelKw: 8.0 },
  { name: "Taller EcoTech", role: "prosumer", panelKw: 5.5 },
  { name: "Granja Solar Sur", role: "prosumer", panelKw: 12.0 },
  { name: "Oficina Limpia", role: "prosumer", panelKw: 4.0 },
  { name: "Almacén Renovable", role: "prosumer", panelKw: 6.5 },
  { name: "Vecino Consumidor A", role: "consumer", panelKw: null },
  { name: "Vecino Consumidor B", role: "consumer", panelKw: null },
  { name: "Vecino Consumidor C", role: "consumer", panelKw: null },
];

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

async function step1_generateAndFund(): Promise<SimUser[]> {
  console.log("\n🔑  Paso 1: Generando 10 keypairs y fondeando con Friendbot...\n");

  const users: SimUser[] = [];

  for (const profile of USER_PROFILES) {
    const kp = StellarSdk.Keypair.random();
    const pub = kp.publicKey();

    process.stdout.write(`  ${profile.name} (${shortAddr(pub)}) — fondeando... `);

    const res = await fetch(
      `https://friendbot.stellar.org?addr=${pub}`
    );

    if (!res.ok) {
      const text = await res.text();
      // Friendbot may return 400 if already funded
      if (!text.includes("createAccountAlreadyExist")) {
        throw new Error(`Friendbot failed for ${pub}: ${text}`);
      }
      console.log("ya fondeado ✓");
    } else {
      console.log("✓");
    }

    users.push({
      name: profile.name,
      keypair: { public: pub, secret: kp.secret() },
      role: profile.role,
      panelCapacityKw: profile.panelKw,
      readings: [],
      hdropBalance: 0,
    });

    // Friendbot rate limiting
    await sleep(500);
  }

  return users;
}

async function step2_registerProsumers(users: SimUser[]) {
  console.log("\n📋  Paso 2: Registrando prosumidores vía API...\n");

  for (const u of users) {
    if (u.role !== "prosumer") continue;

    process.stdout.write(`  ${u.name} — registrando... `);

    try {
      await api("POST", "/api/members", {
        stellar_address: u.keypair.public,
        name: u.name,
        panel_capacity_kw: u.panelCapacityKw,
      });
      console.log("✓");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("409")) {
        console.log("ya existía ✓");
      } else {
        console.log(`✗ ${msg}`);
      }
    }
  }
}

async function step3_simulateReadings(users: SimUser[]) {
  console.log("\n📊  Paso 3: Simulando lecturas de energía (últimos 5 días)...\n");

  const prosumers = users.filter((u) => u.role === "prosumer");
  let count = 0;

  for (const u of prosumers) {
    for (let day = 1; day <= 5; day++) {
      const date = dateNDaysAgo(day);
      // Scale kWh by panel capacity for realism
      const maxKwh = Math.min((u.panelCapacityKw || 5) * 1.5, 15);
      const kwh = randomBetween(2, maxKwh);

      try {
        const result = (await api("POST", "/api/readings", {
          stellar_address: u.keypair.public,
          kwh_injected: kwh,
          reading_date: date,
        })) as { id: string };

        u.readings.push({ id: result.id, kwh, date });
        count++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("409")) {
          // Duplicate reading for this date, skip
        } else {
          console.log(`  ✗ ${u.name} ${date}: ${msg}`);
        }
      }
    }
    process.stdout.write(`  ${u.name}: ${u.readings.length} lecturas ✓\n`);
  }

  console.log(`\n  Total: ${count} lecturas creadas`);
}

async function step4_mintHdrop(users: SimUser[]) {
  console.log("\n⚡  Paso 4: Minteando HDROP por cada lectura...\n");

  const prosumers = users.filter((u) => u.role === "prosumer");
  let minted = 0;
  let failed = 0;

  for (const u of prosumers) {
    let userTotal = 0;

    for (const reading of u.readings) {
      process.stdout.write(`    mint ${reading.date} (${reading.kwh} kWh)... `);
      try {
        const result = (await api("POST", "/api/mint", {
          reading_id: reading.id,
        })) as { amount_hdrop: number; tx_hash: string };

        userTotal += result.amount_hdrop;
        minted++;
        console.log(`✓ ${result.tx_hash.slice(0, 10)}...`);

        // Soroban txs need spacing — the mint route does simulation + submit + polling
        await sleep(4000);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`✗ ${msg}`);
        failed++;
        // Extra cooldown after failure
        await sleep(3000);
      }
    }

    u.hdropBalance = userTotal;
    console.log(
      `  ${u.name}: ${userTotal.toFixed(2)} HDROP minteados (${u.readings.length} lecturas)`
    );
  }

  console.log(`\n  Total: ${minted} mints OK, ${failed} fallidos`);
}

async function step5_createOffers(users: SimUser[]) {
  console.log("\n🏪  Paso 5: Creando ofertas en marketplace...\n");

  const prosumers = users.filter((u) => u.role === "prosumer");

  const offers: { userId: number; amountKwh: number; pricePerKwh: number }[] = [
    { userId: 0, amountKwh: 10, pricePerKwh: 0.45 },
    { userId: 1, amountKwh: 5, pricePerKwh: 0.50 },
    { userId: 2, amountKwh: 25, pricePerKwh: 0.38 },
    { userId: 3, amountKwh: 8, pricePerKwh: 0.55 },
  ];

  const createdOffers: { id: string; idx: number }[] = [];

  for (const offer of offers) {
    const u = prosumers[offer.userId];
    const totalXlm = Math.round(offer.amountKwh * offer.pricePerKwh * 100) / 100;

    try {
      const result = (await api("POST", "/api/offers", {
        seller_address: u.keypair.public,
        amount_kwh: offer.amountKwh,
        price_per_kwh: offer.pricePerKwh,
        total_xlm: totalXlm,
      })) as { id: string };

      createdOffers.push({ id: result.id, idx: offer.userId });
      console.log(
        `  ${u.name}: ${offer.amountKwh} kWh @ ${offer.pricePerKwh} XLM/kWh ✓`
      );
      await sleep(1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ ${u.name}: ${msg}`);
      await sleep(2000);
    }
  }

  // Mark 2 offers as sold
  for (let i = 0; i < Math.min(2, createdOffers.length); i++) {
    try {
      await api("PATCH", "/api/offers", {
        id: createdOffers[i].id,
        status: "sold",
      });
      console.log(
        `  Oferta de ${prosumers[createdOffers[i].idx].name} marcada como vendida ✓`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ Marcar vendida: ${msg}`);
    }
  }
}

async function step6_p2pTransfers(users: SimUser[]) {
  console.log("\n🔄  Paso 6: Transfers P2P on-chain...\n");

  const server = new StellarSdk.rpc.Server(RPC_URL);
  const contract = new StellarSdk.Contract(ENERGY_TOKEN_CONTRACT);

  // Transfer scenarios: sender → receiver, amount in kWh (with 7 decimals)
  const transfers = [
    { from: 0, to: 7, amount: 2.0 },  // prosumer → consumer
    { from: 2, to: 8, amount: 5.0 },  // prosumer → consumer
    { from: 4, to: 9, amount: 3.0 },  // prosumer → consumer
  ];

  for (const t of transfers) {
    const sender = users[t.from];
    const receiver = users[t.to];

    if (sender.hdropBalance < t.amount) {
      console.log(
        `  ${sender.name} → ${receiver.name} (${t.amount} HDROP)... ⏭️ skip (balance ${sender.hdropBalance.toFixed(2)})`
      );
      continue;
    }

    const amountStroops = BigInt(Math.round(t.amount * 1e7));

    process.stdout.write(
      `  ${sender.name} → ${receiver.name} (${t.amount} HDROP)... `
    );

    try {
      const senderKeypair = StellarSdk.Keypair.fromSecret(sender.keypair.secret);
      const senderAccount = await server.getAccount(senderKeypair.publicKey());

      const tx = new StellarSdk.TransactionBuilder(senderAccount, {
        fee: "100000",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            "transfer",
            StellarSdk.nativeToScVal(sender.keypair.public, { type: "address" }),
            StellarSdk.nativeToScVal(receiver.keypair.public, { type: "address" }),
            StellarSdk.nativeToScVal(amountStroops, { type: "i128" })
          )
        )
        .setTimeout(30)
        .build();

      const prepared = await server.prepareTransaction(tx);
      prepared.sign(senderKeypair);
      const result = await server.sendTransaction(prepared);

      if (result.status === "ERROR") {
        console.log(`✗ submit error`);
        continue;
      }

      // Poll
      let txRes = await server.getTransaction(result.hash);
      while (txRes.status === "NOT_FOUND") {
        await sleep(1000);
        txRes = await server.getTransaction(result.hash);
      }

      if (txRes.status === "SUCCESS") {
        console.log(`✓ (${result.hash.slice(0, 12)}...)`);
      } else {
        console.log(`✗ status: ${txRes.status}`);
      }

      await sleep(1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`✗ ${msg}`);
    }
  }
}

async function step7_governanceProposals(users: SimUser[]) {
  console.log("\n🗳️  Paso 7: Propuestas de gobernanza...\n");

  const server = new StellarSdk.rpc.Server(RPC_URL);
  const contract = new StellarSdk.Contract(GOVERNANCE_CONTRACT);

  const proposals = [
    {
      proposer: users[0],
      title: "Instalar medidor inteligente comunitario",
    },
    {
      proposer: users[2],
      title: "Crear fondo de mantenimiento de paneles",
    },
  ];

  for (const p of proposals) {
    process.stdout.write(`  ${p.proposer.name}: "${p.title}"... `);

    try {
      const kp = StellarSdk.Keypair.fromSecret(p.proposer.keypair.secret);
      const account = await server.getAccount(kp.publicKey());

      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            "create_proposal",
            StellarSdk.nativeToScVal(p.proposer.keypair.public, {
              type: "address",
            }),
            StellarSdk.nativeToScVal(p.title, { type: "string" })
          )
        )
        .setTimeout(30)
        .build();

      const prepared = await server.prepareTransaction(tx);
      prepared.sign(kp);
      const result = await server.sendTransaction(prepared);

      if (result.status === "ERROR") {
        console.log("✗ submit error");
        continue;
      }

      let txRes = await server.getTransaction(result.hash);
      while (txRes.status === "NOT_FOUND") {
        await sleep(1000);
        txRes = await server.getTransaction(result.hash);
      }

      if (txRes.status === "SUCCESS") {
        console.log(`✓ (${result.hash.slice(0, 12)}...)`);
      } else {
        console.log(`✗ status: ${txRes.status}`);
      }

      await sleep(1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`✗ ${msg}`);
    }
  }
}

async function step8_summary(users: SimUser[]) {
  console.log("\n" + "=".repeat(80));
  console.log("  RESUMEN DE SIMULACIÓN");
  console.log("=".repeat(80) + "\n");

  console.log(
    "  Nombre".padEnd(28) +
      "Address".padEnd(14) +
      "Rol".padEnd(12) +
      "HDROP".padEnd(10)
  );
  console.log("  " + "-".repeat(60));

  for (const u of users) {
    console.log(
      `  ${u.name.padEnd(26)}${shortAddr(u.keypair.public).padEnd(14)}${u.role.padEnd(12)}${u.hdropBalance.toFixed(2)}`
    );
  }

  // Save keypairs to file
  const output = users.map((u) => ({
    name: u.name,
    publicKey: u.keypair.public,
    secretKey: u.keypair.secret,
    role: u.role,
    hdropBalance: u.hdropBalance,
  }));

  fs.writeFileSync(USERS_FILE, JSON.stringify(output, null, 2));
  console.log(`\n  Keypairs guardados en: ${USERS_FILE}`);
  console.log("  ⚠️  No commitear este archivo (está en .gitignore)\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  BeEnergy — Simulación Testnet (10 usuarios)           ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`\n  API: ${API_BASE}`);
  console.log(`  Red: Stellar Testnet`);

  // Check API is reachable
  try {
    await fetch(`${API_BASE}/api/members`);
  } catch {
    console.error(
      `\n  ✗ No se puede conectar a ${API_BASE}. ¿Está corriendo el servidor?`
    );
    console.error("    cd apps/web && pnpm dev\n");
    process.exit(1);
  }

  const users = await step1_generateAndFund();
  await step2_registerProsumers(users);
  await step3_simulateReadings(users);
  await step4_mintHdrop(users);
  await step5_createOffers(users);
  await step6_p2pTransfers(users);
  await step7_governanceProposals(users);
  await step8_summary(users);

  console.log("  ✅ Simulación completa.\n");
}

main().catch((err) => {
  console.error("\n  ✗ Error fatal:", err.message || err);
  process.exit(1);
});

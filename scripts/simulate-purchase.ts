/**
 * Simulacro de compra de certificado — circuito completo de negocio
 *
 * Escenario real:
 *   Cooperativa Solar Misiones genera energía durante febrero 2026.
 *   Sus 3 prosumers tienen paneles solares con medidores inteligentes.
 *   La cooperativa registra la generación del mes.
 *   Una empresa compradora ("GreenCorp SA") adquiere el certificado
 *   para su reporte ESG de carbono neutral.
 *
 * Pasos:
 *   1. Setup — wallets Stellar + fondear
 *   2. Cooperativa — registrar "Cooperativa Solar Misiones" con 3 prosumers
 *   3. Medidores — instalar 3 smart meters (uno por prosumer)
 *   4. Generación — 30 días de lecturas simuladas (curva solar realista)
 *   5. Registro — crear registro de generación con el total del mes
 *   6. Mint on-chain — tokenizar el registro en Stellar
 *   7. Compra/Retiro — GreenCorp SA retira el registro (burn on-chain)
 *
 * Los datos de Supabase se limpian al final.
 * Las transacciones en Stellar quedan permanentes y verificables.
 */

import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"
import * as StellarSdk from "@stellar/stellar-sdk"

config({ path: "apps/web/.env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org"
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
const CONTRACT = process.env.NEXT_PUBLIC_ENERGY_TOKEN_CONTRACT!
const MINTER_SECRET = process.env.MINTER_SECRET_KEY!

// ─── Helpers ───

function step(n: number, total: number, msg: string) {
  console.log(`\n[${n}/${total}] ${msg}`)
}

function ok(msg: string) {
  console.log(`  ✅ ${msg}`)
}

function fail(msg: string): never {
  console.error(`  ❌ ${msg}`)
  process.exit(1)
}

async function fundWithFriendbot(address: string) {
  const res = await fetch(`https://friendbot.stellar.org?addr=${address}`)
  if (!res.ok) throw new Error(`Friendbot failed for ${address}: ${res.status}`)
}

async function mintOnChain(toAddress: string, amountKwh: number): Promise<string> {
  const amountInStroops = BigInt(Math.round(amountKwh * 1e7))
  const server = new StellarSdk.rpc.Server(RPC_URL)
  const minterKeypair = StellarSdk.Keypair.fromSecret(MINTER_SECRET)
  const minterPublic = minterKeypair.publicKey()
  const minterAccount = await server.getAccount(minterPublic)
  const contract = new StellarSdk.Contract(CONTRACT)

  const tx = new StellarSdk.TransactionBuilder(minterAccount, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "mint_energy",
        StellarSdk.nativeToScVal(toAddress, { type: "address" }),
        StellarSdk.nativeToScVal(amountInStroops, { type: "i128" }),
        StellarSdk.nativeToScVal(minterPublic, { type: "address" })
      )
    )
    .setTimeout(30)
    .build()

  const prepared = await server.prepareTransaction(tx)
  prepared.sign(minterKeypair)

  const sendResult = await server.sendTransaction(prepared)
  if (sendResult.status === "ERROR") throw new Error("Mint tx failed to submit")

  let response = await server.getTransaction(sendResult.hash)
  while (response.status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 1500))
    response = await server.getTransaction(sendResult.hash)
  }

  if (response.status !== "SUCCESS") throw new Error(`Mint tx failed: ${response.status}`)
  return sendResult.hash
}

async function burnOnChain(amountKwh: number): Promise<string> {
  const amountInStroops = BigInt(Math.round(amountKwh * 1e7))
  const server = new StellarSdk.rpc.Server(RPC_URL)
  const minterKeypair = StellarSdk.Keypair.fromSecret(MINTER_SECRET)
  const minterPublic = minterKeypair.publicKey()
  const minterAccount = await server.getAccount(minterPublic)
  const contract = new StellarSdk.Contract(CONTRACT)

  const tx = new StellarSdk.TransactionBuilder(minterAccount, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "burn_energy",
        StellarSdk.nativeToScVal(minterPublic, { type: "address" }),
        StellarSdk.nativeToScVal(amountInStroops, { type: "i128" })
      )
    )
    .setTimeout(30)
    .build()

  const prepared = await server.prepareTransaction(tx)
  prepared.sign(minterKeypair)

  const sendResult = await server.sendTransaction(prepared)
  if (sendResult.status === "ERROR") throw new Error("Burn tx failed to submit")

  let response = await server.getTransaction(sendResult.hash)
  while (response.status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 1500))
    response = await server.getTransaction(sendResult.hash)
  }

  if (response.status !== "SUCCESS") throw new Error(`Burn tx failed: ${response.status}`)
  return sendResult.hash
}

// ─── Curva solar realista ───

function solarKwh(hour: number, capacityKw: number): number {
  // Gaussiana centrada a las 13:00, sigma ~3h
  const peak = 13
  const sigma = 3
  const factor = Math.exp(-0.5 * ((hour - peak) / sigma) ** 2)
  // Factor climático aleatorio 0.6–1.0
  const climate = 0.6 + Math.random() * 0.4
  // kWh en intervalo de 15 min = capacity * factor * climate * 0.25h
  return Math.round(capacityKw * factor * climate * 0.25 * 1000) / 1000
}

// ─── State ───

let cooperativeId: string
const prosumerIds: string[] = []
const meterIds: string[] = []
let certificateId: string
const keypairs: StellarSdk.Keypair[] = []
let buyerKeypair: StellarSdk.Keypair

// ─── Paso 1: Setup wallets ───

async function paso1() {
  step(1, 7, "Setup — crear wallets Stellar y fondear con Friendbot")

  // Admin de la cooperativa
  const adminKp = StellarSdk.Keypair.random()
  keypairs.push(adminKp)
  console.log(`  Admin cooperativa: ${adminKp.publicKey()}`)
  await fundWithFriendbot(adminKp.publicKey())
  ok("Admin fondeado")

  // 3 prosumers
  for (let i = 0; i < 3; i++) {
    const kp = StellarSdk.Keypair.random()
    keypairs.push(kp)
    await fundWithFriendbot(kp.publicKey())
    ok(`Prosumer ${i + 1} fondeado: ${kp.publicKey().slice(0, 12)}...`)
  }

  // Buyer (empresa compradora)
  buyerKeypair = StellarSdk.Keypair.random()
  console.log(`  Empresa compradora: ${buyerKeypair.publicKey()}`)
  await fundWithFriendbot(buyerKeypair.publicKey())
  ok("Buyer fondeado")
}

// ─── Paso 2: Registrar cooperativa + prosumers ───

async function paso2() {
  step(2, 7, "Registrar Cooperativa Solar Misiones + 3 prosumers")

  const adminPublic = keypairs[0].publicKey()

  const { data: coop, error: coopErr } = await supabase
    .from("cooperatives")
    .insert({
      name: "Cooperativa Solar Misiones",
      technology: "solar",
      admin_stellar_address: adminPublic,
      location: "Posadas, Misiones",
      province: "Misiones",
      token_contract_address: CONTRACT,
    })
    .select()
    .single()

  if (coopErr) fail(`Insert cooperativa: ${coopErr.message}`)
  cooperativeId = coop.id
  ok(`Cooperativa creada: ${coop.name} (${cooperativeId.slice(0, 8)}...)`)

  const prosumerNames = ["María García", "Juan Rodríguez", "Ana López"]
  for (let i = 0; i < 3; i++) {
    const { data: p, error: pErr } = await supabase
      .from("prosumers")
      .insert({
        stellar_address: keypairs[i + 1].publicKey(),
        cooperative_id: cooperativeId,
        name: prosumerNames[i],
        role: "prosumer",
      })
      .select()
      .single()

    if (pErr) fail(`Insert prosumer: ${pErr.message}`)
    prosumerIds.push(p.id)
    ok(`Prosumer: ${prosumerNames[i]} (${keypairs[i + 1].publicKey().slice(0, 12)}...)`)
  }
}

// ─── Paso 3: Instalar medidores ───

async function paso3() {
  step(3, 7, "Instalar 3 medidores inteligentes")

  const capacities = [5.0, 3.5, 4.2] // kW de cada instalación

  for (let i = 0; i < 3; i++) {
    const { data: meter, error: mErr } = await supabase
      .from("meters")
      .insert({
        cooperative_id: cooperativeId,
        member_stellar_address: keypairs[i + 1].publicKey(),
        device_type: "smart_meter",
        technology: "solar",
        capacity_kw: capacities[i],
      })
      .select()
      .single()

    if (mErr) fail(`Insert meter: ${mErr.message}`)
    meterIds.push(meter.id)
    ok(`Meter ${i + 1}: ${capacities[i]} kW (${meter.id.slice(0, 8)}...)`)
  }
}

// ─── Paso 4: Simular 28 días de generación (febrero 2026) ───

async function paso4() {
  step(4, 7, "Simular generación solar — febrero 2026 (28 días × 3 medidores)")

  const capacities = [5.0, 3.5, 4.2]
  let totalKwh = 0
  let totalReadings = 0

  for (let meterIdx = 0; meterIdx < 3; meterIdx++) {
    const rows: Record<string, unknown>[] = []

    for (let day = 1; day <= 28; day++) {
      const dateStr = `2026-02-${String(day).padStart(2, "0")}`

      // Lecturas cada 15 min de 6:00 a 20:00 (56 lecturas/día)
      for (let hour = 6; hour < 20; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          const kwh = solarKwh(hour + minute / 60, capacities[meterIdx])
          if (kwh <= 0) continue

          const ts = `${dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`
          rows.push({
            meter_id: meterIds[meterIdx],
            cooperative_id: cooperativeId,
            kwh_generated: kwh,
            kwh_injected: kwh,
            reading_timestamp: ts,
            reading_date: dateStr,
            interval_minutes: 15,
            source: "meter",
            status: "pending",
          })
          totalKwh += kwh
        }
      }
    }

    // Insert en batches de 500
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500)
      const { error: rErr } = await supabase.from("readings").insert(batch)
      if (rErr) fail(`Insert readings batch: ${rErr.message}`)
    }

    totalReadings += rows.length
    ok(`Meter ${meterIdx + 1} (${capacities[meterIdx]} kW): ${rows.length} lecturas`)
  }

  totalKwh = Math.round(totalKwh * 100) / 100
  ok(`Total generado: ${totalKwh.toLocaleString()} kWh en ${totalReadings} lecturas`)

  // Guardar para usar en paso 5
  ;(global as any).__totalKwh = totalKwh
}

// ─── Paso 5: Crear registro de generación ───

async function paso5() {
  const totalKwh = (global as any).__totalKwh as number
  step(5, 7, `Crear registro de generación por ${totalKwh.toLocaleString()} kWh`)

  const { data: cert, error: cErr } = await supabase
    .from("certificates")
    .insert({
      cooperative_id: cooperativeId,
      generation_period_start: "2026-02-01",
      generation_period_end: "2026-02-28",
      total_kwh: totalKwh,
      technology: "solar",
      location: "Posadas, Misiones",
      status: "pending",
    })
    .select()
    .single()

  if (cErr) fail(`Insert certificate: ${cErr.message}`)
  certificateId = cert.id
  ok(`Registro creado: ${certificateId}`)
  ok(`Período: 1-28 febrero 2026`)
  ok(`Energía: ${totalKwh.toLocaleString()} kWh solar`)
  ok(`CO₂ evitado: ~${Math.round(totalKwh * 0.4)} kg (factor 0.4 kg/kWh)`)
  ok(`Status: pending (esperando mint on-chain)`)
}

// ─── Paso 6: Mint on-chain ───

async function paso6() {
  const totalKwh = (global as any).__totalKwh as number
  step(6, 7, "Mint on-chain — tokenizar registro en Stellar Testnet")

  const minterPublic = StellarSdk.Keypair.fromSecret(MINTER_SECRET).publicKey()
  console.log(`  Contrato: ${CONTRACT}`)
  console.log(`  Minter:   ${minterPublic.slice(0, 12)}...`)
  console.log(`  ⏳ Minteando ${totalKwh.toLocaleString()} kWh...`)

  const mintTxHash = await mintOnChain(minterPublic, totalKwh)

  await supabase
    .from("certificates")
    .update({ status: "available", mint_tx_hash: mintTxHash, token_amount: totalKwh })
    .eq("id", certificateId)

  await supabase.from("mint_log").insert({
    certificate_id: certificateId,
    prosumer_address: keypairs[0].publicKey(),
    amount_hdrop: totalKwh,
    tx_hash: mintTxHash,
  })

  ok(`Mint exitoso`)
  ok(`Tx: ${mintTxHash}`)
  ok(`Explorer: https://stellar.expert/explorer/testnet/tx/${mintTxHash}`)
  ok(`Certificado ahora en status 'available' — listo para venta`)

  ;(global as any).__mintTxHash = mintTxHash
}

// ─── Paso 7: Compra — empresa retira certificado ───

async function paso7() {
  const totalKwh = (global as any).__totalKwh as number
  step(7, 7, "Compra de certificado — GreenCorp SA retira para reporte ESG")

  console.log(`  Comprador: GreenCorp SA`)
  console.log(`  Propósito: Reporte ESG / Carbono Neutral`)
  console.log(`  Wallet:    ${buyerKeypair.publicKey().slice(0, 12)}...`)
  console.log(`  ⏳ Quemando ${totalKwh.toLocaleString()} kWh on-chain...`)

  const burnTxHash = await burnOnChain(totalKwh)

  const { data: retirement, error: retErr } = await supabase
    .from("retirements")
    .insert({
      certificate_id: certificateId,
      buyer_address: buyerKeypair.publicKey(),
      buyer_name: "GreenCorp SA",
      buyer_purpose: "esg_reporting",
      kwh_retired: totalKwh,
      burn_tx_hash: burnTxHash,
    })
    .select()
    .single()

  if (retErr) fail(`Insert retirement: ${retErr.message}`)

  await supabase
    .from("certificates")
    .update({ status: "retired" })
    .eq("id", certificateId)

  ok(`Burn exitoso`)
  ok(`Tx: ${burnTxHash}`)
  ok(`Explorer: https://stellar.expert/explorer/testnet/tx/${burnTxHash}`)
  ok(`Retirement ID: ${retirement.id}`)
  ok(`Certificado retirado — GreenCorp SA puede reportar ${totalKwh.toLocaleString()} kWh renovables`)
  ok(`CO₂ compensado: ~${Math.round(totalKwh * 0.4)} kg`)

  ;(global as any).__burnTxHash = burnTxHash
}

// ─── Run ───

async function main() {
  console.log("═══════════════════════════════════════════════════════════════")
  console.log("  BeEnergy — Simulacro de compra de certificado")
  console.log("═══════════════════════════════════════════════════════════════")
  console.log()
  console.log("  Escenario:")
  console.log("  Cooperativa Solar Misiones → genera energía → registra")
  console.log("  GreenCorp SA → compra certificado → retira para ESG")
  console.log()
  console.log(`  Contrato: ${CONTRACT}`)
  console.log(`  Red:      Stellar Testnet`)

  const start = Date.now()

  try {
    await paso1()
    await paso2()
    await paso3()
    await paso4()
    await paso5()
    await paso6()
    await paso7()

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    const totalKwh = (global as any).__totalKwh as number
    const mintTx = (global as any).__mintTxHash as string
    const burnTx = (global as any).__burnTxHash as string

    console.log("\n═══════════════════════════════════════════════════════════════")
    console.log("  RESULTADO: Circuito de compra completado")
    console.log("═══════════════════════════════════════════════════════════════")
    console.log()
    console.log(`  Cooperativa:  Cooperativa Solar Misiones`)
    console.log(`  Prosumers:    3 (María García, Juan Rodríguez, Ana López)`)
    console.log(`  Período:      Febrero 2026 (28 días)`)
    console.log(`  Energía:      ${totalKwh.toLocaleString()} kWh solar`)
    console.log(`  CO₂ evitado:  ~${Math.round(totalKwh * 0.4)} kg`)
    console.log()
    console.log(`  Comprador:    GreenCorp SA`)
    console.log(`  Propósito:    Reporte ESG`)
    console.log()
    console.log(`  Mint tx:  https://stellar.expert/explorer/testnet/tx/${mintTx}`)
    console.log(`  Burn tx:  https://stellar.expert/explorer/testnet/tx/${burnTx}`)
    console.log()
    console.log(`  Tiempo: ${elapsed}s`)
    console.log("═══════════════════════════════════════════════════════════════\n")
  } catch (err) {
    console.error("\n❌ Error:", err instanceof Error ? err.message : err)
    process.exit(1)
  } finally {
    // Cleanup Supabase (las tx de Stellar quedan permanentes)
    if (certificateId) {
      await supabase.from("retirements").delete().eq("certificate_id", certificateId)
      await supabase.from("mint_log").delete().eq("certificate_id", certificateId)
      await supabase.from("certificates").delete().eq("id", certificateId)
    }
    for (const meterId of meterIds) {
      await supabase.from("readings").delete().eq("meter_id", meterId)
      await supabase.from("meters").delete().eq("id", meterId)
    }
    if (cooperativeId) {
      await supabase.from("prosumers").delete().eq("cooperative_id", cooperativeId)
      await supabase.from("cooperatives").delete().eq("id", cooperativeId)
    }
    console.log("  Datos de Supabase limpiados (tx de Stellar permanecen en testnet)")
  }
}

main()

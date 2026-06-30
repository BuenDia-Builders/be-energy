# BeEnergy

> **Renewable energy cooperatives deserve proof. BeEnergy puts it on-chain.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-be--energy--six.vercel.app-00537A?style=for-the-badge)](https://be-energy-six.vercel.app)
[![Network](https://img.shields.io/badge/Stellar-Testnet-FFD500?style=for-the-badge&logo=stellar)](https://stellar.org)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=for-the-badge)](LICENSE)

---

## 🏆 Recognition

| Award | Event |
|-------|-------|
| 🥇 **Featured Project** | [Stellar Buenos Aires Hackathon 2025](https://dorahacks.io/buidl/36793) |
| 🏅 **Innovation Certificate** | Stellar Jury — Buenos Aires 2025 |
| 🌍 **Selected Project** | [ClimateLaunchpad 2026](https://climatelaunchpad.org/) — powered by Climate-KIC & Chrysalis LEAP |

> *"Your idea has been selected to participate in ClimateLaunchpad 2026 — the world's largest green startup competition."*
> — Chrysalis LEAP × Climate-KIC, Cyprus Chapter

---

## The Problem

Renewable energy cooperatives generate clean energy every day — but **they can't prove it**.

- No standardized way to record generation
- No verifiable certificate that travels with the energy claim
- No access to ESG markets, carbon offsetting programs, or institutional buyers
- Manual, paper-based processes that nobody trusts

Meanwhile, companies and funds with ESG commitments are actively looking for verifiable renewable energy claims — and can't find them.

**The gap between cooperatives and buyers is a trust gap. BeEnergy closes it.**

---

## The Solution

BeEnergy is a cooperative management dashboard + on-chain certification infrastructure on **Stellar**.

Every kWh registered by a cooperative becomes a **proto-certificate**: a verifiable, on-chain claim tied to a real meter, a real cooperative, and a real time period.

```
Smart meter sends reading → POST /api/meters/readings
         ↓
BeEnergy validates & mints token on Stellar (1 token = 1 kWh)
         ↓
Certificate is assigned to cooperative members
         ↓
External buyer (company / ESG fund) purchases certificate
         ↓
Buyer retires certificate on-chain (verifiable burn)
         ↓
Permanent, auditable proof on Stellar blockchain
```

No intermediaries. No PDFs. No trust required — the chain is the proof.

---

## How It Works — Full Platform Flow

### For Cooperatives

```
1. Register cooperative on BeEnergy
2. Add smart meters (physical IoT devices)
3. Meters send generation readings automatically via API
4. BeEnergy mints proto-certificates on Stellar
5. Manage members, view generation stats, track certificates
```

### For Buyers

```
1. Browse available certificates by cooperative / technology / period
2. Purchase certificates (linked to specific on-chain tokens)
3. Retire certificate → recorded permanently on Stellar
4. Receive auditable proof of renewable energy support
```

### Authentication

BeEnergy supports two access methods — no setup required to try:

**Email + Password** (for admins, buyers, internal team)
```
/login → Supabase auth → JWT issued → Stellar wallet auto-assigned → /dashboard
```
> Try it: `demo@beenergy.coop` / `Demo2026!`

**Stellar Wallet** (for cooperatives with Freighter / xBull / Lobstr)
```
Connect wallet → Server issues challenge → User signs with private key
→ Signature verified on-chain → JWT issued → /dashboard
```

Both methods issue the same JWT and give full platform access. Wallet users can additionally sign on-chain transactions.

---

## Stellar Integration — What's Actually On-Chain

This is not a wrapper. Stellar is load-bearing infrastructure:

| What | How |
|------|-----|
| **Certificate issuance** | Mint SEP-41 tokens directly on Stellar Testnet |
| **Certificate retirement** | On-chain burn, permanently auditable |
| **Member allocation** | `energy_distribution` contract splits tokens by participation % |
| **Governance** | `community_governance` contract for cooperative proposals |
| **Wallet auth** | Challenge-response signature verification (no gas, no tx) |
| **Token standard** | SEP-41 (fungible) with OpenZeppelin Stellar Pausable + Upgradeable |

### Deployed Contracts — Stellar Testnet

| Contract | Address | Purpose |
|----------|---------|---------|
| `energy_token` | [`CCYOVOFD...MRPBA6`](https://stellar.expert/explorer/testnet/contract/CCYOVOFDJ5BVBSI6HADLWETTUF3BU423MEAWBSBWV2X5UVNKSJMRPBA6) | SEP-41 token — 1 token = 1 kWh certified |
| `energy_distribution` | [`CBTDPLFN...NX2UDZ`](https://stellar.expert/explorer/testnet/contract/CBTDPLFNFGWVOD4HXDKW4EH5L3D2YGOY5CWTFCJM5TEWFL4VQTNX2UDZ) | Distributes certificates to members |
| `community_governance` | [`CCH2EXXN...BJD6YI`](https://stellar.expert/explorer/testnet/contract/CCH2EXXNSDW2BAKBIPFAG6CCZS6LV4VJFUP2CZZCW5LEY4JOAXBJD6YI) | Cooperative on-chain governance |

Built with **OpenZeppelin Stellar Contracts v0.5.1** + **Soroban SDK 23.1.0** — 65 tests passing.

---

## Customer Discovery

We validated the problem directly with:

- **Energy cooperatives** in Argentina — confirmed the pain of not being able to sell renewable attributes
- **ESG compliance teams** — confirmed demand for verifiable, auditable certificates
- **Climate program coordinators** — confirmed interest in blockchain-based proof over PDFs

Key insight: the bottleneck isn't production — cooperatives generate plenty. The bottleneck is **verifiable proof**. BeEnergy solves exactly that.

---

## Live Demo

**Platform:** https://be-energy-six.vercel.app
**Network:** Stellar Testnet
**Demo login:** `demo@beenergy.coop` / `Demo2026!`

**[Watch Demo Video →](https://www.youtube.com/watch?v=c5avxNUI18Y)**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Stellar Testnet (Soroban smart contracts) |
| Smart Contracts | Rust + OpenZeppelin Stellar v0.5.1 |
| Token Standard | SEP-41 fungible token |
| Frontend | Next.js 16 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | Supabase + JWT + Stellar wallet signature |
| Wallet Support | Freighter, xBull, Lobstr (via Stellar Wallets Kit) |
| Backend | Next.js API Routes + Supabase |
| Deployment | Vercel |
| Monorepo | Turborepo + pnpm |

---

## Monorepo Structure

```
be-energy/
├── apps/
│   ├── contracts/           # Soroban smart contracts (Rust)
│   │   ├── energy_token/         # SEP-41 certificate token
│   │   ├── energy_distribution/  # Member allocation logic
│   │   └── community_governance/ # DAO-style proposals
│   └── web/                 # Next.js dashboard
│       ├── app/             # App Router pages
│       ├── components/      # UI components
│       └── lib/             # Auth, wallet, Stellar utils
├── packages/
│   └── stellar/             # Shared wallet & config utilities
└── tooling/
    └── issues/              # GitHub issue templates
```

---

## Quick Start

```bash
git clone https://github.com/BuenDia-Builders/be-energy.git
cd be-energy
pnpm install
pnpm dev
```

Frontend: `http://localhost:3000`

**Build & test contracts:**
```bash
cd apps/contracts
stellar contract build
cargo test
```

---

## Roadmap

| Level | What | Status |
|-------|------|--------|
| 1 — Internal registry | Token = verifiable production record | ✅ Live on Testnet |
| 2 — Verified certification | IoT oracles + independent meter validation | 🔄 Next |
| 3 — Recognized standard | Integration with I-REC, Energy Web, TIGR | 🔮 Future |

---

## Contributing

PRs welcome. Branch to `develop`, keep commits focused.

```bash
git checkout develop
git checkout -b feat/your-feature
pnpm install && pnpm dev
# Open PR to develop
```

---

## License

Apache-2.0 — See [LICENSE](LICENSE)

---

**Built on Stellar · BuenDia Builders 2026**

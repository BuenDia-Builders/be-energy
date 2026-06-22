# BeEnergy

**Renewable energy certification infrastructure on Stellar**

[![Deployed on Vercel](https://img.shields.io/badge/deployed-vercel-black)](https://be-energy-six.vercel.app)
[![Docs](https://img.shields.io/badge/docs-GitBook-blue)](https://marias-organization-50.gitbook.io/beenergy/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

BeEnergy is a cooperative management dashboard + on-chain certification infrastructure for renewable energy on Stellar. Cooperatives use the dashboard to manage members, meters, readings, and statistics — and BeEnergy tokenizes their production as proto-certificates sold to external buyers (companies, ESG funds, climate programs).

[Video](https://www.youtube.com/watch?v=c5avxNUI18Y)

---

## What it does

Two things:

1. **Cooperative management dashboard** — Web panel where cooperatives manage members, meters, generation statistics, and certificates.
2. **On-chain certification** — Tokenizes renewable production as proto-certificates on Stellar (1 token = 1 kWh), sold to external buyers.

```
Smart meter sends readings via API (POST /api/meters/readings)
        |
BeEnergy mints proto-certificates on-chain (1 token = 1 kWh)
        |
External buyer purchases certificates
        |
Buyer retires certificate (burn on-chain)
```

Each token is a **proto-certificate**: a verifiable on-chain claim that 1 kWh of renewable energy was generated. It is not a financial instrument, not electricity for consumption, and not designed for trading between members.

---

## Recognition

- **Featured Project** at [Stellar Buenos Aires Hackathon 2025](https://dorahacks.io/buidl/36793)
- **Innovation Certificate** awarded by Stellar jury

---

## Live Demo

**Frontend:** https://be-energy-six.vercel.app
**Network:** Stellar Testnet

---

## Smart Contracts (Soroban)

Deployed on Stellar Testnet:

| Contract | Address | Purpose |
|----------|---------|---------|
| `energy_token` | [`CCYOVOFD...MRPBA6`](https://stellar.expert/explorer/testnet/contract/CCYOVOFDJ5BVBSI6HADLWETTUF3BU423MEAWBSBWV2X5UVNKSJMRPBA6) | SEP-41 fungible token representing renewable generation certificates |
| `energy_distribution` | [`CBTDPLFN...NX2UDZ`](https://stellar.expert/explorer/testnet/contract/CBTDPLFNFGWVOD4HXDKW4EH5L3D2YGOY5CWTFCJM5TEWFL4VQTNX2UDZ) | Allocates certificates to cooperative members by participation |
| `community_governance` | [`CCH2EXXN...BJD6YI`](https://stellar.expert/explorer/testnet/contract/CCH2EXXNSDW2BAKBIPFAG6CCZS6LV4VJFUP2CZZCW5LEY4JOAXBJD6YI) | Cooperative governance (proposals) |

Built with **OpenZeppelin Stellar v0.5.1** (Pausable + Upgradeable) and **Soroban SDK 23.1.0**.

65 tests passing. See [docs/5-CONTRACTS.md](docs/5-CONTRACTS.md) for full reference.

---

## Monorepo Structure

```
be-energy/
├── apps/
│   ├── contracts/           # Soroban smart contracts (Rust)
│   │   ├── energy_token/
│   │   ├── energy_distribution/
│   │   └── community_governance/
│   └── web/                 # Next.js application
├── packages/
│   └── stellar/             # Shared Stellar utilities
└── tooling/
    └── issues/              # GitHub issue templates
```

Powered by **Turborepo** + **pnpm workspaces**.

---

## Quick Start

### Prerequisites

- **Node.js** v22+
- **pnpm** v10+ (`corepack enable`)
- **Rust** + Cargo (for contracts)

### Installation

```bash
git clone https://github.com/BuenDia-Builders/be-energy.git
cd be-energy
pnpm install
```

### Run Development Server

```bash
pnpm dev
```

Frontend: `http://localhost:3000`

### Build and Test Contracts

```bash
cd apps/contracts
stellar contract build
cargo test
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Stellar (Soroban smart contracts) |
| Smart Contracts | Rust + OpenZeppelin Stellar v0.5.1 |
| Frontend | Next.js 16 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Wallet | Freighter + Stellar Wallets Kit |
| Backend | Next.js API Routes + Supabase |
| Deployment | Vercel |
| Monorepo | Turborepo + pnpm |

---

## Contributing

1. Browse [open issues](https://github.com/BuenDia-Builders/be-energy/issues)
2. Comment to claim an issue
3. Fork, code, and submit a PR to `develop`

### Branch Structure

- `main` — Production (protected)
- `develop` — Active development

```bash
git clone https://github.com/YOUR-USERNAME/be-energy.git
cd be-energy
git checkout develop
git checkout -b feat/your-feature
pnpm install && pnpm dev
# Submit PR to develop branch
```

---

## Product Levels

| Level | What | Status |
|-------|------|--------|
| 1 — Internal registry | Token = production record for cooperatives | Current |
| 2 — Verifiable certification | Smart meters + oracles + independent verification | Next |
| 3 — Recognized standard | Integration with I-REC, Energy Web, TIGR | Future |

---

## License

Apache-2.0 — See [LICENSE](LICENSE) for details.

---

**Built on Stellar | BuenDia Builders 2026**

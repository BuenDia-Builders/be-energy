BeEnergy
Current status (pivot)
The product lane is undecided.
This repository contains experimental cooperative-management and Stellar Testnet code.
The token is not an I-REC.
Token minting or burning does not establish an ESG or renewable-energy certificate.
Do not add certificate claims to documentation, demos, or contributor changes.
A working P2P marketplace is not a current product promise.
Existing names such as energy_token are implementation identifiers, not product commitments.
Historical plans are not evidence of implemented or independently verified capabilities.
See the docs-vs-code audit for contradictions and setup limits.

Live Demo
Network
License

🏆 Recognition
Award	Event
🥇 Featured Project	Stellar Buenos Aires Hackathon 2025
🏅 Innovation Certificate	Stellar Jury — Buenos Aires 2025
🌍 Selected	ClimateLaunchpad 2026 — world's largest green startup competition, powered by Climate-KIC & Chrysalis LEAP
Authentication
BeEnergy contains email and wallet authentication flows.

Setup limitation: Authentication depends on Supabase configuration, database tables,
and JWT_SECRET; the checked-in .env.example is incomplete. The examples below
describe flows, not a zero-setup or full-access guarantee. See the audit.

Email + Password (for admins, buyers, internal team)

text

/login → Supabase auth → JWT issued → Stellar wallet auto-assigned → /dashboard
Stellar Wallet (for cooperatives with Freighter / xBull / Lobstr)

text

Connect wallet → Server issues challenge → User signs with private key
→ Signature verified by the server → JWT issued → /dashboard
Both methods issue application JWTs; authorization depends on resolved roles. Wallet users can additionally sign on-chain transactions.

Stellar Integration — What's Actually On-Chain
What	How
Token minting	Mint SEP-41 tokens directly on Stellar Testnet
Token burning	On-chain burn, permanently auditable
Member allocation	energy_distribution contract splits tokens by participation %
Governance	community_governance contract for cooperative proposals
Wallet auth	Challenge-response signature verification (no gas, no tx)
Token standard	SEP-41 (fungible) with OpenZeppelin Stellar Pausable + Upgradeable
Deployed Contracts — Stellar Testnet
Contract	Address	Purpose
energy_token	CCYOVOFD...MRPBA6	SEP-41 token — application token amounts use kWh
energy_distribution	CBTDPLFN...NX2UDZ	Distributes tokens to members
community_governance	CCH2EXXN...BJD6YI	Cooperative on-chain governance
Built with OpenZeppelin Stellar Contracts v0.5.1 + Soroban SDK 23.1.0.

Live Demo
Platform: https://be-energy-six.vercel.app
Network: Stellar Testnet

Hosted demo availability and credentials are not validated by this local audit.

Watch Demo Video →

Tech Stack
Layer	Technology
Blockchain	Stellar Testnet (Soroban smart contracts)
Smart Contracts	Rust + OpenZeppelin Stellar v0.5.1
Token Standard	SEP-41 fungible token
Frontend	Next.js 16 + React 19 + TypeScript
Styling	Tailwind CSS v4 + shadcn/ui
Auth	Supabase + JWT + Stellar wallet signature
Wallet Support	Freighter, xBull, Lobstr (via Stellar Wallets Kit)
Backend	Next.js API Routes + Supabase
Deployment	Vercel
Monorepo	Turborepo + pnpm
Monorepo Structure
text

be-energy/
├── apps/
│   ├── contracts/           # Soroban smart contracts (Rust)
│   │   ├── energy_token/         # SEP-41 token
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
Quick Start
Not a complete backend setup: Use Node 22 (.nvmrc) and pnpm 9.15.0
(package.json). These commands start the web server, not a configured backend.
.env.example supplies only Stellar settings; database,
authentication, and minting need additional configuration. Do not treat
scripts/setup-db.ts as a safe fresh install: it assumes legacy tables and drops
offers. Review the audit before using setup or simulation scripts.

Bash

git clone https://github.com/BuenDia-Builders/be-energy.git
cd be-energy
pnpm install
pnpm dev
Frontend: http://localhost:3000

Build & test contracts:

Requires the Stellar CLI, Rust 1.89.0 and wasm32v1-none. Factory tests embed
WASM artifacts, so build before testing. The checked-in Cargo lockfile is out of
sync; a locked build currently fails. See the audit for validation limits.

Bash

cd apps/contracts
stellar contract build
cargo test
Contributing
PRs welcome. Branch to develop, keep commits focused.

Bash

git checkout develop
git checkout -b feat/your-feature
pnpm install && pnpm dev
# Open PR to develop
License
Apache-2.0 is declared in the Cargo workspace metadata.
The repository does not contain a LICENSE file; see the Apache-2.0 license text.

Built on Stellar · BuenDia Builders 2026
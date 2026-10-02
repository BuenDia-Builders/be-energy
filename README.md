BeEnergy
Current status (pivot)
Product lane is undecided; no customer, market, or commercialization model is selected here.
The current code is a cooperative-management web app with Supabase-backed records and Soroban contracts configured for Stellar Testnet.
Meter submissions are stored as application readings; no independent physical-meter verification is implemented.
energy_token is a fungible SEP-41 token; it is not an I-REC or I-REC(E).
Do not present a BeEnergy token or database record as a recognized certificate, REC, or environmental-attribute instrument.
Token minting does not by itself prove generation, prevent double counting, or establish ESG/offset-reporting eligibility.
“Certificate,” “mint,” and “retirement” are existing code/database labels, not evidence of external certification, sale, or registry retirement.
No payment, buyer entitlement, or marketplace is established by the current implementation.
Keep certification, trading, and product claims out of the README unless separately evidenced and approved.
Cooperative management dashboard and Stellar Testnet contract experiments; product direction remains open.

Network
License

🏆 Recognition
Award	Event
🥇 Featured Project	Stellar Buenos Aires Hackathon 2025
🏅 Innovation Certificate (event award, not an energy certificate)	Stellar Jury — Buenos Aires 2025
🌍 Selected	ClimateLaunchpad 2026 — world's largest green startup competition, powered by Climate-KIC & Chrysalis LEAP
Current code
Earlier drafts framed BeEnergy around renewable-energy proof and access to buyers. That was a product hypothesis, not a current product definition.

The repository currently contains:

A cooperative-management dashboard with Supabase-backed records and API routes.
Manual and bulk meter-reading endpoints; submitted readings are application data, not independent verification of physical generation.
A synthetic smart-meter mock, not a physical meter adapter.
Certificate-named application screens and database/API workflows, plus Soroban mint/burn operations. These labels do not establish a recognized certificate or an external sale.
Rust Soroban contracts for a fungible SEP-41 token, member allocation, proposal creation, and cooperative deployment.
There is no implemented marketplace, payment flow, or registry-backed certificate issuance/retirement. See the docs-vs-code audit for evidence and unresolved discrepancies.

Authentication
The code includes Supabase email/password authentication and a Stellar-wallet challenge/signature path. Both depend on deployment configuration; the checked-in .env.example is not a complete local-auth setup. A demo credential shown by the UI does not guarantee that a hosted account is provisioned or available.

Stellar contract code
Contract	Current code surface	Boundary
energy_token	Fungible SEP-41 mint, burn, and transfer operations	No certificate ID, meter proof, or registry identifier is encoded in each token.
energy_distribution	Member allocation and cumulative generation operations	Does not independently verify physical readings.
community_governance	Initialization and proposal creation	No voting or proposal execution method is present.
cooperative_factory	Cooperative contract deployment	No current web-app caller is listed in the feature inventory.
The app reads contract addresses from environment variables in apps/web/lib/contracts-config.ts. Addresses in older README/docs conflict with apps/web/.env.example; reconcile with maintainers before using a deployment. No listed address is treated here as canonical.

External links
The project has previously linked to a hosted deployment and a demo video. Availability and demo-account configuration are external to this source snapshot and are not validated here.

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
│   │   ├── energy_token/         # Fungible SEP-41 token
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
Bash

git clone https://github.com/stpatrickghost/be-energy.git
cd be-energy
pnpm install
pnpm dev
Frontend: http://localhost:3000

For authentication and API use, configure apps/web/.env.local with deployment-specific Supabase URL/anon/service-role values and a JWT_SECRET. Mint/burn routes also require the appropriate testnet contract address and MINTER_SECRET_KEY. Do not commit secrets. apps/web/.env.example contains public Stellar settings only and is incomplete for auth/database/minting.

Build & test contracts:

Bash

cd apps/contracts
stellar contract build
cargo test
Roadmap status
No product roadmap is committed while the product lane is undecided. Older roadmap and ecosystem-integration ideas in docs/ are proposals/history, not delivered capabilities or approved commitments. See the audit table.

Contributing
Confirm the active branch flow with maintainers before opening a PR. This checkout's origin exposes main only, while .github/workflows/branch-policy.yml requires PRs to main to come from develop; the older git checkout develop instructions are not runnable from this published branch list.

License
Apache-2.0 — view the license text

Built on Stellar · BuenDia Builders 2026
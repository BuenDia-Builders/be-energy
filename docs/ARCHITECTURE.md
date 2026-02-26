# BeEnergy — Architecture Reference

> v0.2.0 · Drips Wave #2 · Stellar Testnet
> Last updated: 2026-02-26

---

## Table of Contents

1. [Overview](#overview)
2. [Monorepo Structure](#monorepo-structure)
3. [Soroban Smart Contracts](#soroban-smart-contracts)
   - [Energy Token (HDROP)](#1-energy-token-hdrop)
   - [Energy Distribution](#2-energy-distribution)
   - [Community Governance](#3-community-governance)
   - [Contract Interaction Flow](#contract-interaction-flow)
4. [External Dependencies](#external-dependencies)
   - [Stellar SDK](#stellar-sdk)
   - [Stellar Wallets Kit](#stellar-wallets-kit)
   - [DeFindex SDK](#defindex-sdk-paltalabs)
   - [OpenZeppelin Stellar Contracts](#openzeppelin-stellar-contracts)
   - [Soroban SDK](#soroban-sdk)
   - [UI Dependencies](#ui-dependencies)
5. [API Routes & Integrations](#api-routes--integrations)
6. [Client Hooks](#client-hooks)
7. [Shared Package: @be-energy/stellar](#shared-package-be-energystellar)
8. [State Management](#state-management)
9. [Environment Variables](#environment-variables)
10. [Deployment](#deployment)
11. [Data Flow Diagram](#data-flow-diagram)

---

## Overview

BeEnergy is a decentralized peer-to-peer solar energy marketplace built on the **Stellar network**. Community members ("Hive" participants) share solar panel installations. The platform:

- **Tracks** energy generation (kWh) via Soroban smart contracts
- **Mints** HDROP tokens proportionally to each member's ownership percentage
- **Enables** P2P energy trading on the Stellar DEX
- **Burns** tokens when energy is consumed
- **Provides** yield farming via DeFindex vaults (Paltalabs)
- **Supports** community governance through on-chain proposals

**Tech Stack:** Turborepo · pnpm · Next.js 16 · React 19 · Soroban (Rust) · Stellar Testnet

---

## Monorepo Structure

```
be-energy/
├── apps/
│   ├── web/                          # Next.js 16 frontend (@be-energy/web)
│   │   ├── app/                      # App Router pages & API routes
│   │   │   ├── dashboard/            # Balance & energy overview
│   │   │   ├── marketplace/          # P2P trading interface
│   │   │   ├── activity/             # Transaction history
│   │   │   ├── consumption/          # Energy consumption tracking
│   │   │   ├── profile/              # User profile
│   │   │   ├── admin/                # Admin panel
│   │   │   └── api/defindex/         # DeFindex API routes
│   │   ├── components/ui/            # 40+ shadcn/ui components
│   │   ├── hooks/                    # Contract & service hooks
│   │   ├── lib/                      # Contexts, config, utilities
│   │   └── styles/                   # Global CSS (Tailwind v4)
│   │
│   └── contracts/                    # Soroban smart contracts (Rust)
│       ├── energy_token/             # HDROP fungible token
│       ├── energy_distribution/      # Minting & distribution logic
│       └── community_governance/     # On-chain governance
│
├── packages/
│   └── stellar/                      # Shared wallet & config (@be-energy/stellar)
│       ├── src/wallet.ts             # Wallet connection logic
│       ├── src/stellar-config.ts     # Network endpoints
│       └── src/storage.ts            # Typed localStorage wrapper
│
├── tooling/
│   ├── issues/                       # GitHub issue templates
│   └── scripts/                      # Automation scripts
│
├── turbo.json                        # Turborepo task config
├── pnpm-workspace.yaml               # Workspace definitions
└── vercel.json                       # Vercel deployment config
```

**Workspace definitions** (`pnpm-workspace.yaml`): `apps/*`, `packages/*`, `tooling/*`

**Turborepo tasks** (`turbo.json`): `build` (outputs `.next/**`, `dist/**`), `dev`, `lint`

---

## Soroban Smart Contracts

All contracts live in `apps/contracts/`. They compile to WASM and deploy on Stellar Testnet.

**Shared Rust dependencies** (workspace-level):

| Crate | Version | Source |
|-------|---------|--------|
| `soroban-sdk` | 23.1.0 | crates.io |
| `stellar-access` | 0.5.1 | OpenZeppelin GitHub |
| `stellar-macros` | 0.5.1 | OpenZeppelin GitHub |
| `stellar-tokens` | 0.5.1 | OpenZeppelin GitHub |

**Build profile:** `opt-level = "z"`, LTO enabled, `panic = abort`, symbols stripped.
**Toolchain:** Rust 1.89.0, target `wasm32v1-none`.

---

### 1. Energy Token (HDROP)

**Location:** `apps/contracts/energy_token/src/lib.rs`
**Symbol:** `HDROP` (HoneyDrop) · **Decimals:** 7 · **Standard:** SEP-41

**Purpose:** Fungible token where 1 HDROP = 1 kWh of renewable solar energy. Tokens are minted when energy is generated and burned when consumed. Tradeable on Stellar DEX for P2P energy exchange.

**Public entry points:**

| Function | Access | Description |
|----------|--------|-------------|
| `__constructor(admin, distribution_contract, initial_supply)` | Init | Set admin, grant MINTER to distribution contract, optional initial supply |
| `mint_energy(to, amount, minter)` | MINTER role | Mint tokens when energy is generated |
| `burn_energy(from, amount)` | Token holder | Burn tokens when energy is consumed |
| `grant_minter(new_minter)` | Admin | Add new minter address |
| `revoke_minter(minter)` | Admin | Remove minter permissions |
| `is_minter(account)` | Public | Check if address has MINTER role |
| `admin()` | Public | Return admin address |
| Standard SEP-41 | Public | `transfer`, `balance`, `approve`, `allowance`, `transfer_from`, `total_supply`, `name`, `symbol`, `decimals` |

**Dependencies:** `soroban-sdk`, `stellar-access` (AccessControl), `stellar-tokens` (FungibleToken, FungibleBurnable), `stellar-macros`

**Tests:** 6 tests — initialization, minting, burning, P2P transfer, role grant/revoke, initial supply.

---

### 2. Energy Distribution

**Location:** `apps/contracts/energy_distribution/src/lib.rs` + `privacy.rs`

**Purpose:** Manages community member registration, tracks solar energy generation, and distributes freshly minted HDROP tokens to members proportionally based on ownership percentages. Includes a privacy layer for consumption tracking.

**Public entry points:**

| Function | Access | Description |
|----------|--------|-------------|
| `initialize(admin, token_contract, required_approvals)` | Init | Setup admin, link token contract, set multisig threshold |
| `add_members_multisig(approvers, members, percents)` | Multi-sig | Add members with N-of-M approval; percentages must sum to 100 |
| `record_generation(kwh_generated)` | Admin | Record generation, mint `(kwh × member_percent) / 100` to each member |
| `enable_privacy(env)` | Admin | Activate privacy mode |
| `record_private_consumption(user, commitment)` | Member | Store SHA256 commitment for private consumption |
| `verify_private_consumption(user, user_data)` | Public | Verify commitment matches stored hash |
| `generate_commitment_helper(...)` | Public | Helper to produce SHA256 commitment (test/off-chain) |
| `is_member(address)` | Public | Check membership |
| `get_member_percent(address)` | Public | Get ownership % |
| `get_total_generated()` | Public | Cumulative kWh generated |
| `get_member_list()` | Public | All member addresses |

**Cross-contract calls:** Invokes `EnergyToken.mint_energy()` during `record_generation`.

**Storage keys:** `Admin`, `TokenContract`, `RequiredApprovals`, `MembersInitialized`, `Member(Address)`, `MemberPercent(Address)`, `MemberList`, `TotalGenerated`, `PrivacyEnabled`, `UserCommitment(Address)`.

**Privacy module:** Current implementation uses SHA256 commitments as a placeholder for future ZK-SNARK integration (Circom + SnarkJS + Groth16).

**Tests:** 2 groups — initialization, multi-sig member addition (5 members, 3 approvers).

---

### 3. Community Governance

**Location:** `apps/contracts/community_governance/src/lib.rs`

**Purpose:** Lightweight governance system for community proposals and voting.

**Public entry points:**

| Function | Access | Description |
|----------|--------|-------------|
| `initialize(admin)` | Init | Set admin, reset proposal counter |
| `create_proposal(proposer, title)` | Authenticated | Create new proposal, return ID |
| `get_proposal_count()` | Public | Total proposals created |

**Data structure:**
```rust
Proposal { id: u32, title: String, proposer: Address, votes_for: u32, votes_against: u32 }
```

**Status:** Skeleton — proposal creation works but voting logic (`vote()`, quorum, finalization) is not yet implemented. No cross-contract dependencies. No tests.

**Dependencies:** `soroban-sdk` only (no OpenZeppelin).

---

### Contract Interaction Flow

```
                    ┌─────────────────────────┐
                    │   Energy Token (HDROP)   │
                    │   SEP-41 Fungible Token  │
                    └────────────▲────────────┘
                                 │
                                 │ mint_energy()
                                 │
                    ┌────────────┴────────────┐
                    │  Energy Distribution     │
                    │  Member mgmt + minting   │
                    │  Privacy commitments     │
                    └─────────────────────────┘

                    ┌─────────────────────────┐
                    │  Community Governance    │
                    │  Proposals (WIP)         │
                    └─────────────────────────┘
                    (standalone — not yet integrated)
```

---

## External Dependencies

### Stellar SDK

| | |
|---|---|
| **Package** | `@stellar/stellar-sdk` |
| **Versions** | 14.3.3 (apps/web) · 14.5.0 (packages/stellar) |
| **What** | Official Stellar JavaScript SDK for blockchain interactions |

**Why:** Core dependency for all Stellar operations — building transactions, calling Soroban contracts, querying Horizon for account data, and interacting with the Soroban RPC.

**How it's used:**

| Feature | SDK Functions | Files |
|---------|---------------|-------|
| Soroban RPC connection | `rpc.Server()` | `hooks/useEnergyToken.ts`, `hooks/useEnergyDistribution.ts` |
| Contract instantiation | `Contract()` | Same hooks |
| Transaction building | `TransactionBuilder()`, `BASE_FEE` | Same hooks |
| Value conversion | `nativeToScVal()`, `scValToNative()` | Same hooks |
| Simulation (read-only) | `server.simulateTransaction()` | Same hooks (for balance queries) |
| Transaction preparation | `server.prepareTransaction()` | Same hooks (for mutations) |
| Transaction submission | `server.sendTransaction()`, `server.getTransaction()` | Same hooks |
| XDR reconstruction | `TransactionBuilder.fromXDR()` | Same hooks (after wallet signing) |
| Horizon balance queries | `Horizon.Server()`, `accounts().accountId().call()` | `packages/stellar/src/wallet.ts` |

**Endpoints accessed:**
- **Soroban RPC:** `https://soroban-testnet.stellar.org`
- **Horizon API:** `https://horizon-testnet.stellar.org`

---

### Stellar Wallets Kit

| | |
|---|---|
| **Package** | `@creit.tech/stellar-wallets-kit` |
| **Version** | 1.9.5 |
| **What** | Multi-wallet abstraction layer for Stellar (Freighter, HotWallet, etc.) |

**Why:** Provides a unified interface for connecting to different Stellar wallets, signing transactions, and managing wallet state. Avoids coupling to a single wallet provider.

**How it's used:**

| Feature | Functions | Files |
|---------|-----------|-------|
| Kit initialization | `StellarWalletsKit()`, `sep43Modules()` | `packages/stellar/src/wallet.ts` |
| Wallet selection UI | `kit.openModal()` | `wallet.ts` |
| Get address | `kit.getAddress()` | `wallet.ts` |
| Network detection | `kit.getNetwork()` | `wallet.ts` |
| Transaction signing | `kit.signTransaction()` | `apps/web/lib/wallet-context.tsx` |
| Disconnect | `kit.disconnect()` | `wallet.ts` |

**Supports:** Freighter browser extension, HotWallet, and any SEP-43 compliant wallet.

---

### DeFindex SDK (Paltalabs)

| | |
|---|---|
| **Package** | `@defindex/sdk` |
| **Version** | 0.1.1 |
| **What** | SDK for DeFindex — yield farming and vault management protocol on Stellar |

**Why:** Enables HDROP token holders to deposit tokens into yield-generating vaults, earning passive returns. This adds a DeFi layer to the energy marketplace.

**How it's used:**

| Feature | Functions | Files |
|---------|-----------|-------|
| SDK initialization | `DefindexSDK({ apiKey, baseUrl, timeout })` | `apps/web/lib/defindex-service.ts` |
| Health check | `sdk.healthCheck()` | `defindex-service.ts` |
| Vault info | `sdk.getVaultInfo()`, `sdk.getVaultAPY()` | `defindex-service.ts` |
| User balance | `sdk.getVaultBalance()` | `defindex-service.ts` |
| Deposit | `sdk.depositToVault()` → returns unsigned XDR | `defindex-service.ts` |
| Withdraw | `sdk.withdrawFromVault()` → returns unsigned XDR | `defindex-service.ts` |
| Interest calc | `calculateInterest()`, `getUserYieldStats()` | `defindex-service.ts` |

**API endpoint:** `https://api.defindex.io` (configurable via `DEFINDEX_BASE_URL`)
**Auth:** API key via `DEFINDEX_API_KEY` env var (server-side only)

---

### OpenZeppelin Stellar Contracts

| | |
|---|---|
| **Source** | `github.com/OpenZeppelin/stellar-contracts` |
| **Tag** | v0.5.1 |
| **What** | Battle-tested smart contract libraries for Soroban |

**Why:** Provides audited, standard implementations for token standards and access control — avoiding custom security-critical code.

**How it's used:**

| Crate | Used In | Purpose |
|-------|---------|---------|
| `stellar-tokens` | `energy_token` | SEP-41 FungibleToken + FungibleBurnable traits |
| `stellar-access` | `energy_token`, `energy_distribution` | Role-based AccessControl (Admin, MINTER roles) |
| `stellar-macros` | `energy_token`, `energy_distribution` | Derive macros for contract boilerplate |

---

### Soroban SDK

| | |
|---|---|
| **Package** | `soroban-sdk` |
| **Version** | 23.1.0 |
| **What** | Official Rust SDK for writing Stellar Soroban smart contracts |

**Why:** Required runtime for all Soroban contracts. Provides types (`Address`, `Env`, `String`, `Vec`, `Map`, `BytesN`), storage APIs, cross-contract invocation (`env.invoke_contract`), authentication (`require_auth`), and the test framework.

**Used by:** All three contracts.

---

### UI Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.0.0 | App framework, server components, App Router |
| `react` / `react-dom` | 19.2.0 | UI rendering |
| `tailwindcss` | 4.2.0 | Utility-first CSS |
| `@radix-ui/*` (14 packages) | Various | Accessible UI primitives (dialog, dropdown, tabs, etc.) |
| `cmdk` | 1.1.1 | Command palette component |
| `recharts` | 2.15.3 | Data visualization charts |
| `react-hook-form` | 7.56.4 | Form state management |
| `zod` | 3.25.7 | Schema validation |
| `sonner` | 2.0.3 | Toast notifications |
| `embla-carousel-react` | 8.6.0 | Carousel component |
| `@vercel/analytics` | latest | Application metrics |
| `tailwindcss-animate` | 1.0.7 | CSS animation utilities |
| `class-variance-authority` | 0.7.1 | Variant-based component styling |
| `clsx` + `tailwind-merge` | Various | Conditional class merging |

---

## API Routes & Integrations

All API routes are Next.js Route Handlers under `apps/web/app/api/`.

### DeFindex Routes

| Route | Method | Parameters | Purpose |
|-------|--------|------------|---------|
| `/api/defindex/health` | GET | — | Check DeFindex API health |
| `/api/defindex/deposit` | POST | `{ vaultAddress, amount, userAddress, invest?, slippageBps? }` | Generate deposit transaction XDR |
| `/api/defindex/withdraw` | POST | `{ vaultAddress, amount, userAddress }` | Generate withdrawal transaction XDR |
| `/api/defindex/vault/[address]` | GET | Vault address in URL | Get vault info + current APY |
| `/api/defindex/stats/[vaultAddress]/[userAddress]` | GET | Both addresses in URL | Get user yield stats (balance, APY, interest) |

All routes wrap `defindex-service.ts` which uses `@defindex/sdk` server-side with the API key.

### External API Calls (Client-side)

| Target | Protocol | Purpose | Called From |
|--------|----------|---------|-------------|
| Soroban RPC Testnet | JSON-RPC | Contract calls (simulate, prepare, send) | `useEnergyToken`, `useEnergyDistribution` |
| Horizon Testnet | REST | Account balances, payment history | `packages/stellar/wallet.ts`, `useHorizonPayments` |

---

## Client Hooks

### `useEnergyToken`
**File:** `apps/web/hooks/useEnergyToken.ts`

Interacts with the HDROP token contract via Soroban RPC.

| Method | Type | Description |
|--------|------|-------------|
| `getBalance(userAddress?)` | Read | Query token balance (simulated call) |
| `transfer(to, amount)` | Write | P2P token transfer |
| `burnEnergy(amount)` | Write | Consume energy tokens |
| `mintEnergy(to, amount)` | Write | Mint tokens (MINTER only) |
| `checkIsMinter(accountAddress)` | Read | Check if address has minter role |

### `useEnergyDistribution`
**File:** `apps/web/hooks/useEnergyDistribution.ts`

Interacts with the distribution contract via Soroban RPC.

| Method | Type | Description |
|--------|------|-------------|
| `getMemberInfo(memberAddress?)` | Read | Get member ownership percentage |
| `getTotalGenerated()` | Read | Cumulative kWh generated |
| `getMemberList()` | Read | All community member addresses |
| `recordGeneration(kwhGenerated)` | Write | Record generation & trigger minting (admin) |

### `useHorizonPayments`
**File:** `apps/web/hooks/useHorizonPayments.ts`

Fetches transaction/payment history from Horizon API.

### `useDefindex`
**File:** `apps/web/hooks/useDefindex.ts`

Communicates with the Next.js API routes to manage vault operations.

| Method | Description |
|--------|-------------|
| `fetchStats(userAddress?)` | Get yield statistics |
| `fetchVaultInfo()` | Get vault details |
| `deposit(amount, userAddress?)` | Deposit to vault |
| `withdraw(amount, userAddress?)` | Withdraw from vault |
| `checkHealth()` | API health check |

---

## Shared Package: @be-energy/stellar

**Location:** `packages/stellar/` · **Export name:** `@be-energy/stellar`

Shared utilities consumed by `apps/web`.

### Modules

**`stellar-config.ts`** — Network configuration
- Reads `NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_STELLAR_RPC_URL`, `NEXT_PUBLIC_STELLAR_HORIZON_URL`
- Exports: `stellarNetwork`, `networkPassphrase`, `rpcUrl`, `horizonUrl`, `network`
- Helpers: `getHorizonHost(mode)`, `getRpcHost(mode)`

**`wallet.ts`** — Wallet management
- Singleton `StellarWalletsKit` instance (browser-only)
- `connectWallet()` — Opens wallet selection modal, persists choice to localStorage
- `disconnectWallet()` — Clears wallet state and storage
- `fetchBalances(address)` — Queries Horizon for all account balances
- `wallet()` — Returns the kit instance

**`storage.ts`** — Typed localStorage wrapper
- Schema: `walletId`, `walletAddress`, `walletNetwork`, `networkPassphrase`
- Methods: `getItem()`, `setItem()`, `removeItem()`, `clear()`

---

## State Management

The web app uses **React Context API** with three providers:

### WalletContext (`lib/wallet-context.tsx`)

Global wallet state polled every 2 seconds.

| Property | Type | Description |
|----------|------|-------------|
| `isConnected` | boolean | Wallet connection status |
| `address` | string | Full Stellar address |
| `shortAddress` | string | Truncated (6…4) |
| `balances` | MappedBalances | All asset balances from Horizon |
| `xlmBalance` | string | XLM balance extracted |
| `network` | string | Current network name |
| `kit` | StellarWalletsKit | Kit instance |
| `signTransaction` | function | Bound signing function |
| `userProfile` | object | User metadata (localStorage) |

### ThemeContext (`lib/theme-context.tsx`)
Dark/light mode with localStorage persistence.

### I18nContext (`lib/i18n-context.tsx`)
Internationalization — Spanish as primary language.

---

## Environment Variables

### Public (client-side)

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_STELLAR_NETWORK` | `TESTNET` | Network selection |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | `https://soroban-testnet.stellar.org` | Soroban RPC endpoint |
| `NEXT_PUBLIC_STELLAR_HORIZON_URL` | `https://horizon-testnet.stellar.org` | Horizon API endpoint |
| `NEXT_PUBLIC_ENERGY_TOKEN_CONTRACT` | — | HDROP token contract address |
| `NEXT_PUBLIC_ENERGY_DISTRIBUTION_CONTRACT` | — | Distribution contract address |
| `NEXT_PUBLIC_COMMUNITY_GOVERNANCE_CONTRACT` | — | Governance contract address |
| `NEXT_PUBLIC_ADMIN_ADDRESS` | — | Admin account |
| `NEXT_PUBLIC_DEFINDEX_VAULT_ADDRESS` | — | DeFindex vault address |

### Secret (server-side only)

| Variable | Default | Purpose |
|----------|---------|---------|
| `DEFINDEX_API_KEY` | — | DeFindex SDK authentication |
| `DEFINDEX_BASE_URL` | `https://api.defindex.io` | DeFindex API endpoint |

---

## Deployment

| | |
|---|---|
| **Platform** | Vercel |
| **Framework** | Next.js |
| **Build command** | `pnpm turbo build --filter=@be-energy/web` |
| **Output** | `apps/web/.next` |
| **Install** | `pnpm install` |
| **Deploy branch** | `main` |
| **Branch strategy** | `develop` → `staging` → `main` (PRs required for staging/main) |

Configured in `vercel.json` at repo root.

---

## Data Flow Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                        User Browser                               │
│                                                                   │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐  │
│  │  Dashboard    │   │  Marketplace │   │  Admin Panel         │  │
│  │  (balances,   │   │  (P2P trade) │   │  (record generation) │  │
│  │   activity)   │   │              │   │                      │  │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────┘  │
│         │                  │                       │              │
│         ▼                  ▼                       ▼              │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    React Context Layer                      │  │
│  │  WalletContext · ThemeContext · I18nContext                  │  │
│  └─────────────┬──────────────┬──────────────┬────────────────┘  │
│                │              │              │                    │
│                ▼              ▼              ▼                    │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐     │
│  │useEnergyToken│  │useEnergyDistri-│  │  useDefindex     │     │
│  │  Hook        │  │  bution Hook   │  │  Hook            │     │
│  └──────┬───────┘  └──────┬─────────┘  └────────┬─────────┘     │
└─────────┼─────────────────┼──────────────────────┼───────────────┘
          │                 │                      │
          ▼                 ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│  Soroban RPC     │  │  Soroban RPC     │  │  Next.js API Routes  │
│  (Testnet)       │  │  (Testnet)       │  │  /api/defindex/*     │
│                  │  │                  │  └──────────┬───────────┘
│  ┌────────────┐  │  │  ┌────────────┐  │             │
│  │Energy Token│  │  │  │Energy Dist.│  │             ▼
│  │  Contract  │◄─┼──┼──│  Contract  │  │  ┌──────────────────────┐
│  │  (HDROP)   │  │  │  │            │  │  │  DeFindex API        │
│  └────────────┘  │  │  └────────────┘  │  │  (api.defindex.io)   │
└──────────────────┘  └──────────────────┘  └──────────────────────┘

                    ┌──────────────────┐
                    │  Horizon API     │
                    │  (Testnet)       │◄── fetchBalances(), useHorizonPayments
                    └──────────────────┘

                    ┌──────────────────┐
                    │  Freighter /     │
                    │  Wallet Provider │◄── StellarWalletsKit (signing)
                    └──────────────────┘
```

### Transaction Flow (example: token transfer)

1. User calls `useEnergyToken().transfer(to, amount)`
2. Hook fetches account sequence via `server.getAccount(address)`
3. Builds Soroban transaction with `TransactionBuilder`
4. Simulates via `server.simulateTransaction()` (validates + estimates fees)
5. Prepares final XDR via `server.prepareTransaction()`
6. Signs via `kit.signTransaction()` → Freighter popup
7. Submits via `server.sendTransaction()`
8. Polls `server.getTransaction()` until status = `SUCCESS`

### Generation Recording Flow

1. Admin calls `useEnergyDistribution().recordGeneration(kwhGenerated)`
2. Distribution contract calculates each member's share: `kwh × percent / 100`
3. For each member, calls `EnergyToken.mint_energy(member, share)`
4. HDROP tokens appear in members' balances
5. `TotalGenerated` storage counter incremented

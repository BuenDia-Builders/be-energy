# BeEnergy — Existing features inventory

## How to read this

The UI column is verified with grep — real importers and `fetch` calls to each endpoint, not assumption. Where grep finds nothing anywhere in the repo, that's stated plainly rather than left ambiguous. Classification uses `keep | reinterpret | freeze | drop | unknown`. Every row is `unknown`: this document only maps what exists and records the evidence, and the decision on each item is left to the team (see "Needs a decision now").
This document doesn't remove anything — it maps what exists so the team can decide what to keep, reinterpret, freeze, or drop.

Code paths are relative to `apps/web/` except in the Contracts table, where they're relative to `apps/contracts/`. Docs references use each file's number prefix (`1-PLAN` = `docs/1-PLAN.md`, `2-HOW` = `docs/2-HOW-IT-WORKS.md`, `3-FLOW` = `docs/3-DATA-FLOW.md`, `4-ARCH` = `docs/4-ARCHITECTURE.md`, `5-CONTRACTS` = `docs/5-CONTRACTS.md`, `6-REFACTOR` = `docs/6-CONTRACTS-REFACTOR.md`, `8-TEST` = `docs/8-TESTING.md`).

## Auth & Wallet

| Feature | Code paths | UI | Contract | Docs | Classification | Notes |
|---|---|---|---|---|---|---|
| custodial wallet (DFNS) | `lib/dfns.ts`, `app/auth/callback/**`, `api/auth/email/verify` | — (no imports in UI) | — | — | unknown | Server-only, with `server_keypair` fallback |
| non-custodial wallet (kit) | `lib/wallet-context.tsx` | 13 pages + sidebars/header + 4 hooks + `auth-context` | — | 4-ARCH | unknown | The wallet used by all UI |
| challenge-verify session | `api/auth/*`, `lib/auth-context.tsx`, `lib/auth/roles.ts` | `layout` + 6 pages + sidebars + `login` | — | — | unknown | Session core |
| auth email send/verify | `api/auth/email/*` | — (no `fetch` in UI) | — | — | unknown | Absent `fetch` proves nothing: expected access is direct navigation from a mail link |

Evidence:

- DFNS and the kit coexist in different layers: DFNS is optional server-side (inert without its env vars) and the kit signs all UI. Docs don't mention DFNS (the "Modelo custodial" in 8-TESTING means `MINTER_SECRET_KEY`).
- `api/auth/email/*` only references itself; no `fetch` in `app/`, `hooks/`, or `components/` — but for a verification endpoint that is not evidence of disuse.

## Readings & Meters

| Feature | Code paths | UI | Contract | Docs | Classification | Notes |
|---|---|---|---|---|---|---|
| individual readings | `api/readings`, `useMyReadings`, `submit-reading-modal` | `consumption`, `dashboard`, `cooperative` | — | 1-PLAN, 3-FLOW, 4-ARCH | unknown | Live manual flow |
| bulk meter ingestion | `api/meters/readings`, `scripts/smart-meter-mock.ts` | — (only the mock calls it) | — | 1-PLAN, 3-FLOW, 4-ARCH, 8-TEST | unknown | Automatic per docs |
| meters CRUD | `api/meters`, `useMyMeters`, `add-meter-modal` | `cooperative`, `dashboard` | — | 4-ARCH, 8-TEST | unknown | — |
| members | `api/members`, `add-member-modal` | `cooperative/members` | — | 1-PLAN, 2-HOW | unknown | — |
| cooperatives CRUD | `api/cooperatives*`, 3 `useCooperative*` hooks, `register-cooperative-modal` | `dashboard`, `cooperative`, `members` | — | 1-PLAN, 4-ARCH | unknown | — |
| prosumers legacy | `api/prosumers` | — (only `simulate-testnet.ts` + tests) | — | 4-ARCH ("legacy") | unknown | Docs already mark it legacy |

Evidence:

- Bulk: only verified producer is the mock with a solar curve; no UI.
- Prosumers: labeled "Legacy proxy → members" in docs; no calls from UI.

## Contracts (Soroban)

| Feature | Code paths | UI | Contract | Docs | Classification | Notes |
|---|---|---|---|---|---|---|
| energy_token + hook | `contracts/energy_token`, `useEnergyToken` | `dashboard`, `cooperative`, `mint-token-panel` | `mint_energy`, `burn_energy`, `is_minter` | 1-PLAN, 5-CONTRACTS, 8-TEST | unknown | 1 token = 1 kWh |
| energy_distribution + hook | `contracts/energy_distribution`, `useEnergyDistribution` | `dashboard` | getters + `record_generation` | 1-PLAN, 5-CONTRACTS | unknown | Single UI consumer |
| community_governance | `contracts/community_governance` (88 lines) | — (zero refs in `apps/web`) | `initialize`, `create_proposal`, no `vote` | 1-PLAN ("votación WIP") | unknown | Skeleton with no vote or UI |
| cooperative_factory | `contracts/cooperative_factory` | — (zero refs repo-wide) | `deploy_cooperative` + tests | 1-PLAN F2, 6-REFACTOR | unknown | Proposed hook doesn't exist; `simulate-cooperatives.ts` writes to Supabase directly instead of calling it |
| Rust tests | `mod test` in all 4 `lib.rs` | — (`cargo test`) | all 4 | 8-TEST | unknown | — |
| web tests (vitest) | `__tests__` (13 api + 1 lib) | — (vitest) | — | 8-TEST | unknown | Gaps: defindex, admin/stats, coop [id], profile, email |

Evidence:

- Governance: 4 functions, no vote; in `apps/web` it only appears in `.env.example` and in a `contracts-config` key nobody reads.
- Factory: repo-wide grep for `cooperative_factory|CooperativeFactory|deploy_cooperative` hits only `apps/contracts/**` (source, test snapshots) and docs. No hits in `scripts/` or `tooling/`.

## Dashboard & Admin

| Feature | Code paths | UI | Contract | Docs | Classification | Notes |
|---|---|---|---|---|---|---|
| dashboard + cooperative | `app/dashboard/**`, 7 hooks | header/sidebar + 5 modals | token/distribution reads | 1-PLAN, 2-HOW | unknown | Most connected surface |
| admin stats + panel | `api/admin/stats`, `useAdminStats`, `mint-token-panel` | `/admin` and `/dashboard/admin` | — | — | unknown | Two overlapping panels |
| on-chain activity | `app/activity/**`, `useHorizonPayments`, `useEvents` | 3 `activity` pages | Horizon + Supabase | — | unknown | No Soroban |

Evidence:

- `/admin` (manual mint) and `/dashboard/admin` (stats) overlap in role; only one should remain.

## Certificates & Mint

| Feature | Code paths | UI | Contract | Docs | Classification | Notes |
|---|---|---|---|---|---|---|
| certificates | `api/certificates/**`, `useCertificates`, `useCertificateStats`, create/retire modals | `certificates`, `certificates/[id]`, `cooperative` | burn via `energy_token` | 1-PLAN, 2-HOW, 3-FLOW, 4-ARCH | unknown | Full cycle is live |
| mint | `api/mint`, `mint-token-panel` | `/admin`, `cooperative` | `mint_energy` | 8-TEST | unknown | Two paths: server + wallet |

## Other surfaces

| Feature | Code paths | UI | Contract | Docs | Classification | Notes |
|---|---|---|---|---|---|---|
| landing home/login | `app/page.tsx`, `app/login/page.tsx`, `language-selector` | wallet/profile modals | — | 2-HOW | unknown | Home uses inline patterns |
| unused `landing/*` | `components/landing/*` (5 files) | — (zero importers) | — | — | unknown | Verified orphans |
| SolarScene (v2/three.js) | `components/v2/SolarScene.tsx` (252 lines) | — (single hit: its own export) | — | — | unknown | Verified dead |
| dead shared UI | `balance-display`, `success-modal`, `theme-provider` wrapper | — (zero importers each) | — | — | unknown | Live theme = `lib/theme-context` |
| live shared UI | `i18n`, `dashboard-header`, `sidebar`, profile/wallet modals, badges/tooltips | 12+ pages | — | — | unknown | Shared infra |
| profile | `api/profile`, `app/profile/page.tsx`, `profile-setup-modal` | `profile`, home onboarding | — | — | unknown | — |
| defindex yield | `api/defindex/*` (5), `defindex-service.ts`, `useDefindex` | — (hook has no importers) | external SDK | README, 4-ARCH | unknown | Backend live, UI dead |
| shared support | `supabase`, `contracts-config`, `validation`, `errors`, `rate-limit`, `audit` | cross-cutting | — | — | unknown | — |

Evidence:

- SolarScene: grep returns a single hit, its own export (line 230); nothing imports it. Only file in `components/v2/`.
- DeFindex: the 5 routes are only called by `useDefindex`, and nothing imports the hook.
- `landing/*` (`BeeScene`, `AnimatedCounter`, …): definitions only; the home doesn't use them.

## Needs a decision now

Only cases with objective evidence of oddity. Evidence lives with each table; only the requested decision goes here.

| Item | Requested decision |
|---|---|
| DFNS | Still configured in prod? If not, freeze the custodial branch |
| email endpoints | Verify whether the mail-link flow is live (no `fetch` expected) |
| prosumers | Confirm removal (docs: legacy) |
| community_governance | Reinterpret with voting or freeze |
| cooperative_factory | Wire it to the frontend or freeze |
| two admin panels | Unify into one |
| defindex | Reconnect UI or remove |
| dead UI (SolarScene, `landing/*`, 3 shared) | Confirm removal |
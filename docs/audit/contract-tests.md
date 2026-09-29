# Soroban Contract Test Suite Audit & Gap Analysis

## Executive Summary
This document provides a comprehensive audit and gap analysis of the Soroban smart contract test suites (`energy_token`, `energy_distribution`, `community_governance`, and `cooperative_factory`) within the `be-energy` repository. It identifies tested behaviors, security/validation gaps (specifically around permissions, double-mint, replay attacks, negative/zero amounts, and auth mocking), fragile test patterns, and core system invariants that must be preserved during future refactoring or semantic renaming.

---

## 1. Audit Summary Matrix

| Contract | Covered Behaviors | Critical Gaps | Fragile / Duplicated Tests |
| :--- | :--- | :--- | :--- |
| **`energy_token`** | SEP-41 metadata & token ops (balance, total_supply, mint, burn, transfer), roles (`minter`, admin), cooperative ID bounds (<=64 chars), pausable & upgradeable checks. | **Double-mint / Replay Gap**: `mint_energy` is not idempotent (no nonce/tx hash check).<br>**Auth Mocking**: All mint/burn tests use `mock_all_auths()`; missing explicit non-mocked caller auth failure tests.<br>**Negative amounts**: `mint_energy` accepts `i128` without negative guard tests. | Tests rely heavily on `mock_all_auths()`. Allowance (`approve`, `transfer_from`) SEP-41 functions lack explicit unit tests. |
| **`energy_distribution`** | Multi-sig member management (`add_members_multisig`), percent sum validation (100%), storage reset on re-init, pausable, view functions. | **Double-mint / Replay Gap**: `record_generation` lacks idempotency/batch tracking (calling twice mints twice).<br>**Multisig Duplicate Approver Bypass**: `approvers` vector deduplication missing (same address passed N times bypasses required approvals threshold).<br>**Missing Unit Test**: No cross-contract mock test for successful `record_generation` token minting.<br>**Negative/Zero kWh**: `record_generation` has no input validation for <=0 kWh. | Snapshot directory contains orphaned snapshot file `test_record_generation_no_auth_panics.1.json` not linked to active test. |
| **`community_governance`** | Proposal creation (`create_proposal`), sequential u32 IDs, admin initialization, counter overflow protection, re-init prevention. | **Voting Functionality Completely Missing**: `votes_for`/`votes_against` fields exist in `Proposal`, but zero voting/execution functions exist.<br>**Permission Gap**: Any account can invoke `create_proposal` without membership or token threshold.<br>**Title length**: Unbounded `title` parameter length. | Tests use `mock_all_auths()` for proposal creation; auth checks not verified against raw signatures. |
| **`cooperative_factory`** | Atomic 3-contract deployment (`deploy_cooperative`), WASM hash governance, pre-computed minter contract address, member seeding (max 50, percent sum 100%), registry integration. | **Registry Failure Handling**: No rollback handling if registry registration panics.<br>**No Factory Upgrades**: Factory lacks upgradeability. | Tests depend on pre-compiled WASMs via `include_bytes!(...)` from target directory; fails if WASMs aren't built first. |

---

## 2. Detailed Contract Breakdown

### 2.1 Energy Token (`apps/contracts/energy_token`)

#### Behaviors Covered
- **SEP-41 Metadata & Base Operations**: Name, symbol, decimals (7), `total_supply`, `balance`, `transfer` (between users, self-transfer, balance conservation, overflow check).
- **Minting & Burning**:
  - `mint_energy` accumulates balance, handles multiple users, and handles small amounts (1 stroop = 0.0000001 kWh).
  - Initial supply minting to admin (0 vs non-zero).
  - `burn_energy` reduces balance and supply, supports partial and full burns, fails on burning more than balance or zero balance.
- **Access Control & Roles**:
  - Minter role granted to `distribution_contract` at construction.
  - `grant_minter` and `revoke_minter` by admin, checking admin auth without `mock_all_auths`.
  - Rejection of mint attempts by non-minters (`test_non_minter_cannot_mint`) and revoked minters.
- **Data Validation**: `cooperative_id` length restricted to <= 64 characters; panics on >64 characters.
- **Pausable & Upgradeable**: Emergency pause/unpause by admin; mint, burn, transfer fail while paused; non-admin upgrade panics.

#### Missing Gaps & Vulnerabilities
1. **Double-Mint / Replay Protection (GAP)**:
   - `mint_energy(e, to, amount, minter)` contains no transaction identifier, batch ID, or nonce. If called multiple times with identical parameters, tokens will be minted repeatedly.
2. **Unauthorized Mint / Auth Verification**:
   - `test_non_minter_cannot_mint` uses `mock_all_auths()` and verifies that non-minter role fails, but there are no tests verifying Soroban `require_auth` signature validation when an unauthorized third-party attempts to call `mint_energy` directly without the minter's signature.
3. **Negative Amount Validation**:
   - `mint_energy` accepts `amount: i128`. `test_mint_zero_amount` tests `amount = 0`, but negative amounts (`amount < 0`) are neither guarded in code nor tested.
4. **Allowance Functions**:
   - `approve` and `transfer_from` (part of `FungibleToken` trait) are exposed but lack unit tests.

#### Fragile & Duplicated Tests
- High dependence on `env.mock_all_auths()`, which satisfies `require_auth()` for all addresses globally.

---

### 2.2 Energy Distribution (`apps/contracts/energy_distribution`)

#### Behaviors Covered
- **Multisig Member Management**:
  - `add_members_multisig` enforces `approvers.len() >= required_approvals`, `approvers.len() <= 20`, `members.len() <= 50`, `members.len() == percents.len()`, and total percents sum = 100%.
  - Replaces existing members, cleans up persistent storage keys for removed members, updates `MemberList` and `MembersInitialized`.
- **Initialization & Views**:
  - State initialization checks (`are_members_initialized`), member lookup (`is_member`, `get_member_percent`), `get_total_generated`.
- **Pausable & Emergency Controls**:
  - `pause` / `unpause` restricted to admin; `add_members_multisig` and `record_generation` fail when paused.

#### Missing Gaps & Vulnerabilities
1. **Double-Mint / Replay Vulnerability in Generation Recording (GAP)**:
   - `record_generation(env, kwh_generated)` has no sequence number, reading ID, or deduplication key. Calling `record_generation(100)` multiple times mints tokens repeatedly for the same generation event.
2. **Multisig Duplicate Approver Vulnerability (GAP)**:
   - In `add_members_multisig`, `approvers` vector length is compared against `required_approvals`. However, the contract does **not** check for duplicate addresses in `approvers`. A single approver passing `[approver1, approver1, approver1]` satisfies `len >= 3` and passes `approver.require_auth()`.
3. **Missing Unit Test for Successful `record_generation`**:
   - `energy_distribution/src/lib.rs` has tests for `test_record_generation_without_members_fails` and `test_record_generation_fails_when_paused`, but **zero** unit tests for successful execution of `record_generation` with mock token client in its own test module.
4. **Zero & Negative Generation Amounts**:
   - `record_generation` does not validate `kwh_generated > 0`. `record_generation(0)` or negative `kwh_generated` is unhandled.
5. **Integer Division Truncation**:
   - `tokens_to_mint = (kwh_generated * percent) / 100`. Remainder is truncated without accounting for fractional stroops across members.

#### Fragile & Duplicated Tests
- Test snapshot directory contains `test_record_generation_no_auth_panics.1.json`, but no corresponding test exists in `lib.rs`.

---

### 2.3 Community Governance (`apps/contracts/community_governance`)

#### Behaviors Covered
- **Initialization**: Single initialization with admin address; re-initialization fails.
- **Proposal Creation**: `create_proposal` increments `ProposalCount`, stores `Proposal` struct in persistent storage with `votes_for = 0` and `votes_against = 0`.
- **ID Sequence**: Proposals receive strictly incremental IDs (1, 2, 3...); counter overflow handling (`u32::MAX`).

#### Missing Gaps & Vulnerabilities
1. **Voting & Execution Functionality Completely Missing**:
   - `Proposal` struct contains `votes_for` and `votes_against`, but there are **no** functions to cast votes (`vote`), query voting status, tally results, or execute passed proposals.
2. **Proposal Permission & Spam Prevention**:
   - Any address can invoke `create_proposal`. No membership check, token balance requirement, or proposal fee is enforced.
3. **Unbounded Proposal Title**:
   - `title: String` is stored without length bounds check, allowing storage exhaustion.
4. **Auth Enforcement**:
   - No tests verify auth failure when calling `create_proposal` or `initialize` without signatures (all tests use `mock_all_auths()`).

---

### 2.4 Cooperative Factory (`apps/contracts/cooperative_factory`)

#### Behaviors Covered
- **Atomic Deployment**:
  - `deploy_cooperative` deploys `energy_token`, `energy_distribution`, and `community_governance` in a single transaction.
  - Pre-computes distribution contract address (`deployed_address()`) to pass to `energy_token` constructor for minter role bootstrap.
- **WASM Governance**:
  - `set_wasm_hashes` restricted to factory admin; emits `wasm_updated` event; get/set view functions.
- **Member Seeding**:
  - Seeding initial members on deployment (allowed only if `required_approvals == 1`, max 50 members, checked `u32` addition prevents percent overflow wrapping).
- **Access Control & Safety Checks**:
  - Rejection of duplicate `cooperative_id` (salt collision failure).
  - Explicit admin authorization checks (`test_only_factory_admin_can_deploy`, `test_set_wasm_hashes_requires_admin`).

#### Missing Gaps & Vulnerabilities
1. **WASM Build Dependency**:
   - Test module imports WASM binaries via `include_bytes!(...)` from `../target/wasm32v1-none/release/`. If WASM contracts are not built prior to running `cargo test`, compilation of the test suite fails.
2. **Factory Non-Upgradeable**:
   - Unlike `energy_token` and `energy_distribution`, `cooperative_factory` does not implement `UpgradeableInternal`.

---

## 3. Core System Invariants (Must Preserve Before Semantic Rename)

Before performing any domain pivot, semantic renaming, or contract refactoring, the following system invariants **must be locked and preserved**:

1. **Minter Authorization Invariant**:
   - Only addresses explicitly granted the `minter` role on `EnergyToken` (by default, the connected `EnergyDistribution` contract) can invoke `mint_energy`.
2. **Member Ownership Percentage Invariant**:
   - Total member ownership percentages in `EnergyDistribution` must ALWAYS sum to exactly 100%.
3. **Atomic Bootstrap Invariant**:
   - `CooperativeFactory` must deploy `EnergyToken` with `EnergyDistribution` pre-authorized as minter without post-deploy permission mutation transactions.
4. **Pausability Emergency Invariant**:
   - When `pause()` is invoked by admin on `EnergyToken` or `EnergyDistribution`, ALL state-modifying operations (`mint`, `burn`, `transfer`, `add_members`, `record_generation`) MUST revert immediately.
5. **Deterministic Storage Isolation Invariant**:
   - Each cooperative contract deployed by `CooperativeFactory` has unique, deterministic contract addresses derived from `sha256(cooperative_id || salt_discriminator)`.

---

## 4. Acceptance Verification Checklist
- [x] **Double-mint / unauthorized mint called out as covered or gap**: Identified as a major GAP in both `energy_token` and `energy_distribution` (lack of idempotency/batch tracking).
- [x] **No feature tests for a new domain model**: No new features or new domain models were introduced; analysis-only document as requested.

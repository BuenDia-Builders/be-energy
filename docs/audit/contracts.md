# Soroban Contract Inventory

**Scope:** Snapshot of the four Rust contracts in `apps/contracts` after the product pivot. This documents current source behavior; it does not prescribe a contract migration or select a token product meaning. Contract tests live beside each implementation in `src/lib.rs`.

## Inventory

### `energy_token`

**Current representation:** The module describes a fungible SEP-41 token for solar energy, with one token intended to represent one kWh, seven decimal places, minting on generation, burning on consumption, and DEX/P2P compatibility ([module comments](../../apps/contracts/energy_token/src/lib.rs#L3)). The contract stores a cooperative ID, but no per-token generation period, meter reading, energy source, or certificate record ([state key](../../apps/contracts/energy_token/src/lib.rs#L21)).

**Who can call what:**

- Deployment supplies the admin, distribution contract, initial supply, token name and symbol, and cooperative ID. An initial supply greater than zero is minted to the admin ([constructor](../../apps/contracts/energy_token/src/lib.rs#L42)).
- `mint_energy` requires the supplied minter to hold the `minter` role and is unavailable while paused ([mint](../../apps/contracts/energy_token/src/lib.rs#L83)). The constructor grants that role to the configured distribution contract. The admin can grant or revoke minters ([role management](../../apps/contracts/energy_token/src/lib.rs#L100)).
- `burn_energy` burns from the specified account through `Base::burn`; it has no minter or admin role gate. The source account must authorize the underlying burn. It is unavailable while paused ([burn](../../apps/contracts/energy_token/src/lib.rs#L90)).
- SEP-41 reads are public. Transfers require the source account's authorization; delegated transfers require spender authorization and allowance. Approvals require owner authorization. Direct `burn` and delegated `burn_from` use the token library's authorization and allowance rules. Transfers and burns are pause-gated; approvals and reads are not ([SEP-41 and burnable implementations](../../apps/contracts/energy_token/src/lib.rs#L140)).
- Only the admin can grant/revoke minters, pause/unpause, and upgrade. `admin`, `is_minter`, and `get_cooperative_id` are public reads ([admin methods](../../apps/contracts/energy_token/src/lib.rs#L100), [pause controls](../../apps/contracts/energy_token/src/lib.rs#L207), [upgrade authorization](../../apps/contracts/energy_token/src/lib.rs#L231)).

**State stored:** Token metadata, supply, balances, and allowances are managed by `stellar_tokens::fungible::Base`; access roles/admin by `stellar_access`; pause and upgrade state by the utility implementations. The contract's own `DataKey` stores `CooperativeId` in instance storage ([constructor and key](../../apps/contracts/energy_token/src/lib.rs#L21)).

**Events:** The contract declares no event topic itself. Token operations delegate to `Base` and the access/pause/upgrade libraries; their emitted event details are dependency behavior, not asserted by this contract's tests. No local test asserts token event payloads.

**Tests that lock behavior:** Constructor metadata, decimals, cooperative ID and initial supply ([initialization](../../apps/contracts/energy_token/src/lib.rs#L268)); minter authorization and mint balances ([mint and role tests](../../apps/contracts/energy_token/src/lib.rs#L404), [non-minter rejection](../../apps/contracts/energy_token/src/lib.rs#L593)); burn and balance limits ([burn tests](../../apps/contracts/energy_token/src/lib.rs#L462)); transfer and supply preservation ([transfer tests](../../apps/contracts/energy_token/src/lib.rs#L517)); admin controls, pause behavior, and upgrade authorization ([access tests](../../apps/contracts/energy_token/src/lib.rs#L563), [pause tests](../../apps/contracts/energy_token/src/lib.rs#L709), [upgrade test](../../apps/contracts/energy_token/src/lib.rs#L822)). Tests use mocked authorization for most successful calls.

### `energy_distribution`

**Current representation:** A cooperative allocation ledger. It stores member addresses and percentage shares, accepts a generation amount from its admin, and calls the configured token contract to mint each member's proportional amount ([module comments](../../apps/contracts/energy_distribution/src/lib.rs#L3), [generation flow](../../apps/contracts/energy_distribution/src/lib.rs#L199)).

**Who can call what:**

- The constructor sets the admin, token contract, required approval count, uninitialized member state, and zero generated total ([constructor](../../apps/contracts/energy_distribution/src/lib.rs#L83)).
- `add_members_multisig` is pause-gated. Every address in `approvers` must authorize; the list must meet the configured count, with at most 20 approvers. The method does not separately require the caller to be admin or verify approvers against the existing member list. It replaces the member set, requires matching member/percentage lengths and percentages totaling 100, and limits the set to 50 members ([member update](../../apps/contracts/energy_distribution/src/lib.rs#L110)).
- `record_generation` is pause-gated and requires admin authorization. Members must be initialized. The method divides the supplied amount by each member's percentage, calls `mint_energy` for each member, then adds the supplied amount to `TotalGenerated` ([generation flow](../../apps/contracts/energy_distribution/src/lib.rs#L199)). The source does not reject zero or negative generation values or retain measurement evidence.
- The admin alone can pause/unpause and upgrade ([pause controls](../../apps/contracts/energy_distribution/src/lib.rs#L321), [upgrade authorization](../../apps/contracts/energy_distribution/src/lib.rs#L345)). All `get_*`, `is_member`, and initialization-status methods are public reads ([views](../../apps/contracts/energy_distribution/src/lib.rs#L269)).

**State stored:** Instance storage holds token address, required approvals, member initialization flag, member list, and cumulative generated amount. Persistent storage holds each member flag and percentage ([keys](../../apps/contracts/energy_distribution/src/lib.rs#L50)). Replacing members removes old member and percentage entries.

**Events:** No event is explicitly published by this contract. Successful generation calls the token contract repeatedly; any token events come from the token implementation, not a distribution-specific event.

**Tests that lock behavior:** Constructor defaults ([constructor test](../../apps/contracts/energy_distribution/src/lib.rs#L390)); quorum, size, percentage validation and replacement ([membership tests](../../apps/contracts/energy_distribution/src/lib.rs#L407), [replacement tests](../../apps/contracts/energy_distribution/src/lib.rs#L703)); generation rejected before member initialization and zero starting total ([generation tests](../../apps/contracts/energy_distribution/src/lib.rs#L550)); pause behavior ([pause tests](../../apps/contracts/energy_distribution/src/lib.rs#L606)). The in-contract tests do not assert successful cross-contract mint amounts or the total update after generation.

### `cooperative_factory`

**Current representation:** A deployment coordinator. It deploys the token, distribution, and governance contracts with deterministic cooperative-specific addresses, configures their links, optionally initializes members, and registers their addresses through an external CooperativeRegistry interface ([module overview](../../apps/contracts/cooperative_factory/src/lib.rs#L3), [deployment](../../apps/contracts/cooperative_factory/src/lib.rs#L237)).

**Who can call what:**

- The constructor records the factory admin and registry address ([constructor](../../apps/contracts/cooperative_factory/src/lib.rs#L171)).
- Only the factory admin can set the three approved WASM hashes or call `deploy_cooperative` ([hash update](../../apps/contracts/cooperative_factory/src/lib.rs#L188), [deployment authorization](../../apps/contracts/cooperative_factory/src/lib.rs#L237)). The cooperative admin passed to deployment must authorize governance initialization; if initial members are supplied, that admin also acts as the single approver. Initial members require `required_approvals == 1`.
- Public reads expose factory admin, registry, and configured hashes ([views](../../apps/contracts/cooperative_factory/src/lib.rs#L404)).

**State stored:** Instance storage holds registry address and the three approved WASM hashes. Deployed cooperative data is returned and registered externally; the factory stores no cooperative list of its own ([keys](../../apps/contracts/cooperative_factory/src/lib.rs#L70)).

**Events:** `set_wasm_hashes` publishes `wasm_updated` with the three hashes ([event](../../apps/contracts/cooperative_factory/src/lib.rs#L211)). Successful deployment publishes `coop_deployed` with the cooperative ID and three child addresses ([event](../../apps/contracts/cooperative_factory/src/lib.rs#L386)).

**Tests that lock behavior:** Distinct deployed addresses, registry wiring, token metadata, and distribution/token linkage ([deployment tests](../../apps/contracts/cooperative_factory/src/lib.rs#L571)); admin authorization and missing-WASM guards ([access and guard tests](../../apps/contracts/cooperative_factory/src/lib.rs#L707), [missing hashes](../../apps/contracts/cooperative_factory/src/lib.rs#L772)); initial-member and percentage validation ([initial-member tests](../../apps/contracts/cooperative_factory/src/lib.rs#L797), [member seeding](../../apps/contracts/cooperative_factory/src/lib.rs#L931)); event counts ([event tests](../../apps/contracts/cooperative_factory/src/lib.rs#L1022)). Event tests check counts, not topic data or payload contents.

### `community_governance`

**Current representation:** A minimal proposal counter and proposal store for community decisions. Proposals contain a title, proposer, and `votes_for`/`votes_against` counters ([proposal type](../../apps/contracts/community_governance/src/lib.rs#L21)).

**Who can call what:**

- `initialize` can run once and requires the supplied admin's authorization ([initialization](../../apps/contracts/community_governance/src/lib.rs#L44)).
- Any proposer can create a proposal by authorizing as `proposer`; no membership or admin check applies. The admin stored at initialization does not gate proposal creation or reads ([proposal creation](../../apps/contracts/community_governance/src/lib.rs#L58)).
- Proposal count and proposal reads are public ([views](../../apps/contracts/community_governance/src/lib.rs#L81)).

**State stored:** Instance storage holds admin and proposal count. Persistent storage holds each proposal under its sequential ID ([keys](../../apps/contracts/community_governance/src/lib.rs#L33)). Proposal vote counters initialize to zero. There are no vote, close, or outcome methods in this contract.

**Events:** No event is explicitly published by this contract.

**Tests that lock behavior:** One-time initialization ([initialization tests](../../apps/contracts/community_governance/src/lib.rs#L111)); sequential IDs and proposal fields ([proposal tests](../../apps/contracts/community_governance/src/lib.rs#L150)); missing proposal behavior and counter overflow ([edge tests](../../apps/contracts/community_governance/src/lib.rs#L215), [overflow test](../../apps/contracts/community_governance/src/lib.rs#L261)).

## Ambiguous Terms

Exact searches for these labels found no occurrence in the four Soroban source files. The references below point to the nearest current contract wording or operation, not an assertion that the labels are implemented:

| Term | Contract evidence and current-code distinction |
| --- | --- |
| `certificate` | No certificate field or method. The token is described as a fungible kWh token ([token module comments](../../apps/contracts/energy_token/src/lib.rs#L3)); it does not store certificate identity or provenance. |
| `retire` | No retirement method or retirement record. `burn_energy` is described as burning on consumption ([token method](../../apps/contracts/energy_token/src/lib.rs#L90)); it reduces token supply and records no retirement purpose or beneficiary. |
| `ESG` | No ESG field, method, or event in the contracts. The closest contract-level description is the kWh token and its DEX/P2P compatibility comment ([token module comments](../../apps/contracts/energy_token/src/lib.rs#L3)). |
| `marketplace` | No marketplace contract or marketplace method. The token comment mentions Stellar DEX/P2P compatibility ([token module comments](../../apps/contracts/energy_token/src/lib.rs#L3)); the contract inventory contains token transfers, not listing, price, or sale logic. |

## Does `energy_token` Still Make Sense If It Is Not a Certificate?

Current code supports a cooperative-scoped, transferable fungible balance. Distribution converts an admin-supplied generation amount into member balances; token holders can transfer or burn balances. Neither contract validates a meter reading or encodes environmental attributes, generation period, certificate identity, or retirement purpose ([distribution generation](../../apps/contracts/energy_distribution/src/lib.rs#L199), [token operations](../../apps/contracts/energy_token/src/lib.rs#L83)). This implementation fact does not decide what product concept should own those balances.

Options to evaluate, without selecting one:

- **Environmental certificate:** Could mean a claim about verified renewable generation. Current contracts lack evidence, attributes, serial identity, and a purpose-bound retirement record.
- **Claim:** Could represent an entitlement against a cooperative or energy pool. Current token balances are transferable, but no backing obligation or redemption terms are stored.
- **Accounting unit:** Closest to current behavior: a fungible balance is allocated from a reported generation amount and tracked in token supply. The code does not independently verify that amount.
- **Production receipt:** Could attest to a generation event. Current distribution stores only a cumulative total; it does not store an event-level receipt or measurement reference.
- **Should be removed:** Could apply if no post-pivot workflow needs on-chain balances. Distribution and factory currently depend on the token interface, so removal would also affect those integrations.

## Recommendation (Proposal, Not a Decision)

Keep the product meaning open. Decide among the five options only after defining what one unit represents, what evidence backs issuance, whether holders may transfer it, and what burn or retirement must prove. This audit makes no token-standard choice and recommends no contract migration.
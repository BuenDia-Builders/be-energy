#![no_std]

//! # Energy Token ($ENERGY)
//!
//! Token fungible SEP-41 para representar kWh de energía solar.
//! - 1 token = 1 kWh de energía
//! - Minteo: Solo por cuentas autorizadas (contratos de distribución)
//! - Quema: Cuando se consume energía
//! - Compatible con Stellar DEX para trading P2P

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String};
use stellar_access::access_control::{self as access_control, AccessControl};
use stellar_contract_utils::pausable::{self as pausable, Pausable};
use stellar_contract_utils::upgradeable::UpgradeableInternal;
use stellar_macros::{default_impl, only_role, when_not_paused, Upgradeable};
use stellar_tokens::fungible::{burnable::FungibleBurnable, Base, FungibleToken};

const TTL_THRESHOLD: u32 = 50_000;
const TTL_EXTEND_TO: u32 = 100_000;
const MAX_COOPERATIVE_ID_LEN: u32 = 64;

#[contracttype]
pub enum DataKey {
    CooperativeId,
}

#[derive(Upgradeable)]
#[contract]
pub struct EnergyToken;

#[contractimpl]
impl EnergyToken {
    /// Constructor del contrato
    ///
    /// # Argumentos
    /// * `admin` - Administrador del token
    /// * `distribution_contract` - Contrato que podrá mintear tokens
    /// * `initial_supply` - Supply inicial (normalmente 0 para energía)
    /// * `name` - Nombre del token (ej: "CoopSolar Buenos Aires")
    /// * `symbol` - Símbolo del token (ej: "CSBA")
    /// * `cooperative_id` - Identificador de la cooperativa
    pub fn __constructor(
        e: &Env,
        admin: Address,
        distribution_contract: Address,
        initial_supply: i128,
        name: String,
        symbol: String,
        cooperative_id: String,
    ) {
        // Validate cooperative_id length to prevent unbounded storage growth
        assert!(
            cooperative_id.len() <= MAX_COOPERATIVE_ID_LEN,
            "cooperative_id must be {} characters or less",
            MAX_COOPERATIVE_ID_LEN
        );

        // Configurar metadatos del token
        Base::set_metadata(e, 7, name, symbol);

        // Almacenar cooperative_id
        e.storage().instance().set(&DataKey::CooperativeId, &cooperative_id);

        // Configurar admin del sistema de control de acceso
        access_control::set_admin(e, &admin);

        // Otorgar rol de MINTER al contrato de distribución
        access_control::grant_role_no_auth(
            e,
            &admin,
            &distribution_contract,
            &symbol_short!("minter"),
        );

        // Mintear supply inicial al admin si es mayor que 0
        if initial_supply > 0 {
            Base::mint(e, &admin, initial_supply);
        }
    }

    /// Mintea tokens cuando se genera energía
    /// Solo puede ser llamado por cuentas con rol MINTER
    #[when_not_paused]
    #[only_role(minter, "minter")]
    pub fn mint_energy(e: &Env, to: Address, amount: i128, minter: Address) {
        e.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
        Base::mint(e, &to, amount);
    }

    /// Quema tokens cuando se consume energía
    #[when_not_paused]
    pub fn burn_energy(e: &Env, from: Address, amount: i128) {
        e.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
        Base::burn(e, &from, amount);
    }

    /// Otorga rol de minter a una nueva dirección
    /// Solo puede ser llamado por el admin
    #[when_not_paused]
    pub fn grant_minter(e: &Env, new_minter: Address) {
        let admin = access_control::get_admin(e).expect("admin not set");
        admin.require_auth();
        e.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
        access_control::grant_role_no_auth(e, &admin, &new_minter, &symbol_short!("minter"));
    }

    /// Revoca rol de minter de una dirección
    /// Solo puede ser llamado por el admin
    #[when_not_paused]
    pub fn revoke_minter(e: &Env, minter: Address) {
        let admin = access_control::get_admin(e).expect("admin not set");
        admin.require_auth();
        e.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
        access_control::revoke_role_no_auth(e, &admin, &minter, &symbol_short!("minter"));
    }

    /// Verifica si una dirección tiene rol de minter
    pub fn is_minter(e: &Env, account: Address) -> bool {
        access_control::has_role(e, &account, &symbol_short!("minter")).is_some()
    }

    /// Obtiene el admin actual
    pub fn admin(e: &Env) -> Address {
        access_control::get_admin(e).expect("admin not set")
    }

    /// Obtiene el ID de la cooperativa dueña de este token
    pub fn get_cooperative_id(e: &Env) -> String {
        e.storage()
            .instance()
            .get(&DataKey::CooperativeId)
            .expect("cooperative_id not set")
    }
}

// ============================================================================
// Implementaciones SEP-41 (expandidas para soportar #[when_not_paused])
// ============================================================================

#[contractimpl]
impl FungibleToken for EnergyToken {
    type ContractType = Base;

    fn total_supply(e: &Env) -> i128 {
        Self::ContractType::total_supply(e)
    }

    fn balance(e: &Env, account: Address) -> i128 {
        Self::ContractType::balance(e, &account)
    }

    fn allowance(e: &Env, owner: Address, spender: Address) -> i128 {
        Self::ContractType::allowance(e, &owner, &spender)
    }

    #[when_not_paused]
    fn transfer(e: &Env, from: Address, to: Address, amount: i128) {
        Self::ContractType::transfer(e, &from, &to, amount);
    }

    #[when_not_paused]
    fn transfer_from(e: &Env, spender: Address, from: Address, to: Address, amount: i128) {
        Self::ContractType::transfer_from(e, &spender, &from, &to, amount);
    }

    fn approve(e: &Env, owner: Address, spender: Address, amount: i128, live_until_ledger: u32) {
        Self::ContractType::approve(e, &owner, &spender, amount, live_until_ledger);
    }

    fn decimals(e: &Env) -> u32 {
        Self::ContractType::decimals(e)
    }

    fn name(e: &Env) -> String {
        Self::ContractType::name(e)
    }

    fn symbol(e: &Env) -> String {
        Self::ContractType::symbol(e)
    }
}

/// Implementa funciones de quema (expandidas para soportar #[when_not_paused])
#[contractimpl]
impl FungibleBurnable for EnergyToken {
    #[when_not_paused]
    fn burn(e: &Env, from: Address, amount: i128) {
        Base::burn(e, &from, amount);
    }

    #[when_not_paused]
    fn burn_from(e: &Env, spender: Address, from: Address, amount: i128) {
        Base::burn_from(e, &spender, &from, amount);
    }
}

/// Implementa sistema de control de acceso
#[default_impl]
#[contractimpl]
impl AccessControl for EnergyToken {}

// ============================================================================
// Pausable — freno de emergencia (solo admin)
// ============================================================================

#[contractimpl]
impl Pausable for EnergyToken {
    fn paused(e: &Env) -> bool {
        pausable::paused(e)
    }

    fn pause(e: &Env, caller: Address) {
        caller.require_auth();
        let admin = access_control::get_admin(e).expect("admin not set");
        assert!(caller == admin, "only admin can pause");
        pausable::pause(e);
    }

    fn unpause(e: &Env, caller: Address) {
        caller.require_auth();
        let admin = access_control::get_admin(e).expect("admin not set");
        assert!(caller == admin, "only admin can unpause");
        pausable::unpause(e);
    }
}

// ============================================================================
// Upgradeable — permite actualizar WASM sin redeployar (solo admin)
// ============================================================================

impl UpgradeableInternal for EnergyToken {
    fn _require_auth(e: &Env, operator: &Address) {
        operator.require_auth();
        let admin = access_control::get_admin(e).expect("admin not set");
        assert!(*operator == admin, "only admin can upgrade");
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, BytesN, Env};

    // Helper: creates a token contract with zero initial supply
    fn setup<'a>(env: &'a Env) -> (EnergyTokenClient<'a>, Address, Address) {
        let admin = Address::generate(env);
        let distribution = Address::generate(env);
        let name = String::from_str(env, "TestToken");
        let symbol = String::from_str(env, "TEST");
        let coop_id = String::from_str(env, "coop-001");
        let contract_id = env.register(
            EnergyToken,
            (&admin, &distribution, &0i128, &name, &symbol, &coop_id),
        );
        let client = EnergyTokenClient::new(env, &contract_id);
        (client, admin, distribution)
    }

    // ========================================================================
    // Constructor
    // ========================================================================

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, distribution) = setup(&env);

        assert_eq!(client.name(), String::from_str(&env, "TestToken"));
        assert_eq!(client.symbol(), String::from_str(&env, "TEST"));
        assert_eq!(client.decimals(), 7);
        assert_eq!(client.total_supply(), 0);
        assert_eq!(client.admin(), admin);
        assert!(client.is_minter(&distribution));
        assert_eq!(
            client.get_cooperative_id(),
            String::from_str(&env, "coop-001")
        );
    }

    #[test]
    fn test_initial_supply() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let distribution = Address::generate(&env);

        let name = String::from_str(&env, "TestToken");
        let symbol = String::from_str(&env, "TEST");
        let coop_id = String::from_str(&env, "coop-001");
        let contract_id = env.register(
            EnergyToken,
            (&admin, &distribution, &1000_0000000i128, &name, &symbol, &coop_id),
        );
        let client = EnergyTokenClient::new(&env, &contract_id);

        assert_eq!(client.balance(&admin), 1000_0000000);
        assert_eq!(client.total_supply(), 1000_0000000);
    }

    #[test]
    fn test_zero_initial_supply_no_mint() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, _) = setup(&env);

        assert_eq!(client.balance(&admin), 0);
        assert_eq!(client.total_supply(), 0);
    }

    #[test]
    fn test_cooperative_id() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let distribution = Address::generate(&env);
        let name = String::from_str(&env, "CoopSolar BA");
        let symbol = String::from_str(&env, "CSBA");
        let coop_id = String::from_str(&env, "coop-buenos-aires");

        let contract_id = env.register(
            EnergyToken,
            (&admin, &distribution, &0i128, &name, &symbol, &coop_id),
        );
        let client = EnergyTokenClient::new(&env, &contract_id);

        assert_eq!(client.name(), String::from_str(&env, "CoopSolar BA"));
        assert_eq!(client.symbol(), String::from_str(&env, "CSBA"));
        assert_eq!(
            client.get_cooperative_id(),
            String::from_str(&env, "coop-buenos-aires")
        );
    }

    #[test]
    fn test_cooperative_id_max_length() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let distribution = Address::generate(&env);
        let name = String::from_str(&env, "MaxLenCoop");
        let symbol = String::from_str(&env, "MLC");
        // Create a cooperative_id exactly at max length (64 chars)
        let coop_id = String::from_str(&env, "a".repeat(64).as_str());

        let contract_id = env.register(
            EnergyToken,
            (&admin, &distribution, &0i128, &name, &symbol, &coop_id),
        );
        let client = EnergyTokenClient::new(&env, &contract_id);

        assert_eq!(client.get_cooperative_id().len(), 64);
    }

    #[test]
    #[should_panic(expected = "cooperative_id must be 64 characters or less")]
    fn test_cooperative_id_exceeds_max_length() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let distribution = Address::generate(&env);
        let name = String::from_str(&env, "OverLenCoop");
        let symbol = String::from_str(&env, "OLC");
        // Create a cooperative_id that exceeds max length (65 chars)
        let coop_id = String::from_str(&env, "a".repeat(65).as_str());

        env.register(
            EnergyToken,
            (&admin, &distribution, &0i128, &name, &symbol, &coop_id),
        );
    }

    #[test]
    fn test_cooperative_id_various_valid_lengths() {
        let env = Env::default();
        env.mock_all_auths();

        // Test with various valid lengths
        for len in [1, 10, 32, 50, 64] {
            let admin = Address::generate(&env);
            let distribution = Address::generate(&env);
            let name = String::from_str(&env, "TestCoop");
            let symbol = String::from_str(&env, "TC");
            let coop_id = String::from_str(&env, "a".repeat(len).as_str());

            let contract_id = env.register(
                EnergyToken,
                (&admin, &distribution, &0i128, &name, &symbol, &coop_id),
            );
            let client = EnergyTokenClient::new(&env, &contract_id);

            assert_eq!(client.get_cooperative_id().len(), len);
        }
    }

    // ========================================================================
    // Minting
    // ========================================================================

    #[test]
    fn test_mint_energy() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, distribution) = setup(&env);
        let user = Address::generate(&env);

        client.mint_energy(&user, &100_0000000, &distribution);

        assert_eq!(client.balance(&user), 100_0000000);
        assert_eq!(client.total_supply(), 100_0000000);
    }

    #[test]
    fn test_mint_multiple_users() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, distribution) = setup(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);

        client.mint_energy(&user1, &60_0000000, &distribution);
        client.mint_energy(&user2, &40_0000000, &distribution);

        assert_eq!(client.balance(&user1), 60_0000000);
        assert_eq!(client.balance(&user2), 40_0000000);
        assert_eq!(client.total_supply(), 100_0000000);
    }

    #[test]
    fn test_mint_accumulates_balance() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, distribution) = setup(&env);
        let user = Address::generate(&env);

        client.mint_energy(&user, &50_0000000, &distribution);
        client.mint_energy(&user, &30_0000000, &distribution);

        assert_eq!(client.balance(&user), 80_0000000);
    }

    #[test]
    fn test_mint_small_amount() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, distribution) = setup(&env);
        let user = Address::generate(&env);

        // 0.0000001 kWh (1 stroop)
        client.mint_energy(&user, &1, &distribution);
        assert_eq!(client.balance(&user), 1);
    }

    // ========================================================================
    // Burning
    // ========================================================================

    #[test]
    fn test_burn_energy() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, distribution) = setup(&env);
        let user = Address::generate(&env);

        client.mint_energy(&user, &100_0000000, &distribution);
        client.burn_energy(&user, &30_0000000);

        assert_eq!(client.balance(&user), 70_0000000);
        assert_eq!(client.total_supply(), 70_0000000);
    }

    #[test]
    fn test_burn_entire_balance() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, distribution) = setup(&env);
        let user = Address::generate(&env);

        client.mint_energy(&user, &50_0000000, &distribution);
        client.burn_energy(&user, &50_0000000);

        assert_eq!(client.balance(&user), 0);
        assert_eq!(client.total_supply(), 0);
    }

    #[test]
    #[should_panic]
    fn test_burn_more_than_balance_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, distribution) = setup(&env);
        let user = Address::generate(&env);

        client.mint_energy(&user, &50_0000000, &distribution);
        client.burn_energy(&user, &51_0000000);
    }

    #[test]
    #[should_panic]
    fn test_burn_zero_balance_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, _) = setup(&env);
        let user = Address::generate(&env);

        client.burn_energy(&user, &1);
    }

    // ========================================================================
    // Transfers
    // ========================================================================

    #[test]
    fn test_transfer_between_users() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, distribution) = setup(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);

        client.mint_energy(&user1, &100_0000000, &distribution);
        client.transfer(&user1, &user2, &20_0000000);

        assert_eq!(client.balance(&user1), 80_0000000);
        assert_eq!(client.balance(&user2), 20_0000000);
    }

    #[test]
    fn test_transfer_preserves_total_supply() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, distribution) = setup(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);

        client.mint_energy(&user1, &100_0000000, &distribution);
        client.transfer(&user1, &user2, &40_0000000);

        assert_eq!(client.total_supply(), 100_0000000);
    }

    #[test]
    #[should_panic]
    fn test_transfer_more_than_balance_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, distribution) = setup(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);

        client.mint_energy(&user1, &50_0000000, &distribution);
        client.transfer(&user1, &user2, &51_0000000);
    }

    // ========================================================================
    // Access Control
    // ========================================================================

    #[test]
    fn test_grant_and_revoke_minter() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, _) = setup(&env);
        let new_minter = Address::generate(&env);

        client.grant_minter(&new_minter);
        assert!(client.is_minter(&new_minter));

        client.revoke_minter(&new_minter);
        assert!(!client.is_minter(&new_minter));
    }

    #[test]
    fn test_multiple_minters() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, distribution) = setup(&env);
        let minter2 = Address::generate(&env);
        let minter3 = Address::generate(&env);

        client.grant_minter(&minter2);
        client.grant_minter(&minter3);

        assert!(client.is_minter(&distribution));
        assert!(client.is_minter(&minter2));
        assert!(client.is_minter(&minter3));
    }

    #[test]
    fn test_non_minter_cannot_mint() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, _) = setup(&env);
        let user = Address::generate(&env);
        let not_minter = Address::generate(&env);

        // not_minter doesn't have MINTER role, should fail
        let result = client.try_mint_energy(&user, &100_0000000, &not_minter);
        assert!(result.is_err());
    }

    #[test]
    fn test_revoked_minter_cannot_mint() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, distribution) = setup(&env);
        let user = Address::generate(&env);

        client.revoke_minter(&distribution);
        assert!(!client.is_minter(&distribution));

        let result = client.try_mint_energy(&user, &100_0000000, &distribution);
        assert!(result.is_err());
    }

    #[test]
    fn test_is_minter_false_for_random_address() {
        let env = Env::default();
        let (client, _, _) = setup(&env);
        let random = Address::generate(&env);

        assert!(!client.is_minter(&random));
    }

    // ========================================================================
    // Edge Cases
    // ========================================================================

    #[test]
    fn test_balance_of_unknown_address_is_zero() {
        let env = Env::default();
        let (client, _, _) = setup(&env);
        let unknown = Address::generate(&env);

        assert_eq!(client.balance(&unknown), 0);
    }

    #[test]
    fn test_mint_then_burn_then_mint() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, distribution) = setup(&env);
        let user = Address::generate(&env);

        client.mint_energy(&user, &100_0000000, &distribution);
        client.burn_energy(&user, &100_0000000);
        client.mint_energy(&user, &50_0000000, &distribution);

        assert_eq!(client.balance(&user), 50_0000000);
        assert_eq!(client.total_supply(), 50_0000000);
    }

    #[test]
    fn test_mint_zero_amount() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, distribution) = setup(&env);
        let user = Address::generate(&env);

        client.mint_energy(&user, &0, &distribution);

        assert_eq!(client.balance(&user), 0);
        assert_eq!(client.total_supply(), 0);
    }

    #[test]
    fn test_transfer_to_self() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, distribution) = setup(&env);
        let user = Address::generate(&env);

        client.mint_energy(&user, &100_0000000, &distribution);
        client.transfer(&user, &user, &30_0000000);

        assert_eq!(client.balance(&user), 100_0000000);
        assert_eq!(client.total_supply(), 100_0000000);
    }

    #[test]
    #[should_panic]
    fn test_grant_minter_not_admin() {
        let env = Env::default();
        // No mock_all_auths — admin.require_auth() will fail
        let (client, _, _) = setup(&env);
        let new_minter = Address::generate(&env);

        client.grant_minter(&new_minter);
    }

    #[test]
    #[should_panic]
    fn test_revoke_minter_not_admin() {
        let env = Env::default();
        // No mock_all_auths — admin.require_auth() will fail
        let (client, _, distribution) = setup(&env);

        client.revoke_minter(&distribution);
    }

    // ========================================================================
    // Pausable
    // ========================================================================

    #[test]
    fn test_initial_state_not_paused() {
        let env = Env::default();
        let (client, _, _) = setup(&env);
        assert!(!client.paused());
    }

    #[test]
    fn test_admin_can_pause() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, _) = setup(&env);

        client.pause(&admin);
        assert!(client.paused());
    }

    #[test]
    fn test_admin_can_unpause() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, _) = setup(&env);

        client.pause(&admin);
        assert!(client.paused());

        client.unpause(&admin);
        assert!(!client.paused());
    }

    #[test]
    #[should_panic(expected = "only admin can pause")]
    fn test_non_admin_cannot_pause() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, _) = setup(&env);
        let non_admin = Address::generate(&env);

        client.pause(&non_admin);
    }

    #[test]
    #[should_panic(expected = "only admin can unpause")]
    fn test_non_admin_cannot_unpause() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, _) = setup(&env);

        client.pause(&admin);
        let non_admin = Address::generate(&env);
        client.unpause(&non_admin);
    }

    #[test]
    fn test_mint_fails_when_paused() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, distribution) = setup(&env);
        let user = Address::generate(&env);

        client.pause(&admin);
        let result = client.try_mint_energy(&user, &100_0000000, &distribution);
        assert!(result.is_err());
    }

    #[test]
    fn test_burn_fails_when_paused() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, distribution) = setup(&env);
        let user = Address::generate(&env);

        client.mint_energy(&user, &100_0000000, &distribution);
        client.pause(&admin);
        let result = client.try_burn_energy(&user, &50_0000000);
        assert!(result.is_err());
    }

    #[test]
    fn test_transfer_fails_when_paused() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, distribution) = setup(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);

        client.mint_energy(&user1, &100_0000000, &distribution);
        client.pause(&admin);
        let result = client.try_transfer(&user1, &user2, &50_0000000);
        assert!(result.is_err());
    }

    #[test]
    fn test_operations_resume_after_unpause() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, distribution) = setup(&env);
        let user = Address::generate(&env);

        // Pause and verify operations fail
        client.pause(&admin);
        assert!(client.try_mint_energy(&user, &100_0000000, &distribution).is_err());

        // Unpause and verify operations work
        client.unpause(&admin);
        client.mint_energy(&user, &100_0000000, &distribution);
        assert_eq!(client.balance(&user), 100_0000000);
    }

    // ========================================================================
    // Upgradeable
    // ========================================================================

    #[test]
    #[should_panic(expected = "only admin can upgrade")]
    fn test_upgrade_requires_admin() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, _) = setup(&env);
        let non_admin = Address::generate(&env);
        let fake_hash = BytesN::from_array(&env, &[0u8; 32]);

        client.upgrade(&fake_hash, &non_admin);
    }
}

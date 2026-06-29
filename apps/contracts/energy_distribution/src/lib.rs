#![no_std]

//! # Energy Distribution Contract
//!
//! Gestiona la distribución de créditos energéticos dentro de una cooperativa.
//! - Registro multi-firma de miembros y sus porcentajes de propiedad
//! - Distribución automática de tokens según generación de kWh
//! - Integración con token contract para minteo

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env, Vec};
use stellar_access::access_control::{self as access_control};
use stellar_contract_utils::pausable::{self as pausable, Pausable};
use stellar_contract_utils::upgradeable::UpgradeableInternal;
use stellar_macros::{when_not_paused, Upgradeable};

const INSTANCE_TTL_THRESHOLD: u32 = 50_000;
const INSTANCE_TTL_EXTEND_TO: u32 = 100_000;
const PERSISTENT_TTL_THRESHOLD: u32 = 50_000;
const PERSISTENT_TTL_EXTEND_TO: u32 = 200_000;
const MAX_MEMBERS: u32 = 50;
const MAX_APPROVERS: u32 = 20;

/// Errores del contrato de distribución de energía
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum DistributionError {
    /// No hay suficientes firmantes (se requieren más aprobaciones)
    NotEnoughApprovers = 1,
    /// La cantidad de miembros y porcentajes no coincide
    MemberPercentMismatch = 2,
    /// Los porcentajes no suman 100%
    PercentsMustSumTo100 = 3,
    /// Los miembros aún no han sido inicializados
    MembersNotInitialized = 4,
    /// Se superó el límite máximo de miembros por cooperativa
    TooManyMembers = 5,
    /// Se superó el límite máximo de aprobadores
    TooManyApprovers = 6,
}

#[contracttype]
#[derive(Clone)]
pub struct Member {
    pub address: Address,
    pub percent: u32,
}

#[contracttype]
pub enum DataKey {
    TokenContract,
    RequiredApprovals,
    MembersInitialized,
    Member(Address),
    MemberPercent(Address),
    MemberList,
    TotalGenerated,
}

#[derive(Upgradeable)]
#[contract]
pub struct EnergyDistribution;

// Interface del token contract (solo las funciones que necesitamos)
mod energy_token_interface {
    use soroban_sdk::{contractclient, Address, Env};

    #[contractclient(name = "EnergyTokenClient")]
    pub trait EnergyTokenTrait {
        /// Mintea tokens de energía a una dirección
        fn mint_energy(env: Env, to: Address, amount: i128, minter: Address);
    }
}

#[contractimpl]
impl EnergyDistribution {
    /// Constructor del contrato de distribución
    ///
    /// # Argumentos
    /// * `admin` - Administrador del contrato (la cooperativa)
    /// * `token_contract` - Dirección del contrato de token de energía
    /// * `required_approvals` - Número de firmas requeridas para agregar miembros
    pub fn __constructor(
        env: &Env,
        admin: Address,
        token_contract: Address,
        required_approvals: u32,
    ) {
        access_control::set_admin(env, &admin);
        env.storage()
            .instance()
            .set(&DataKey::TokenContract, &token_contract);
        env.storage()
            .instance()
            .set(&DataKey::RequiredApprovals, &required_approvals);
        env.storage()
            .instance()
            .set(&DataKey::MembersInitialized, &false);
        env.storage()
            .instance()
            .set(&DataKey::TotalGenerated, &0i128);

        env.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);
    }

    /// Agrega miembros con multi-firma
    #[when_not_paused]
    pub fn add_members_multisig(
        env: Env,
        approvers: Vec<Address>,
        members: Vec<Address>,
        percents: Vec<u32>,
    ) -> Result<(), DistributionError> {
        // Verificar que hay suficientes aprobadores
        let required: u32 = env
            .storage()
            .instance()
            .get(&DataKey::RequiredApprovals)
            .unwrap();

        if approvers.len() < required {
            return Err(DistributionError::NotEnoughApprovers);
        }

        if approvers.len() > MAX_APPROVERS {
            return Err(DistributionError::TooManyApprovers);
        }

        if members.len() > MAX_MEMBERS {
            return Err(DistributionError::TooManyMembers);
        }

        // Requerir autenticación de todos los aprobadores
        for approver in approvers.iter() {
            approver.require_auth();
        }

        // Verificar que members y percents tienen la misma longitud
        if members.len() != percents.len() {
            return Err(DistributionError::MemberPercentMismatch);
        }

        // Verificar que los porcentajes suman 100
        let total: u32 = percents.iter().sum();
        if total != 100 {
            return Err(DistributionError::PercentsMustSumTo100);
        }

        // Limpiar datos de miembros anteriores para evitar datos huérfanos
        if let Some(old_list) = env.storage().instance().get::<_, Vec<Address>>(&DataKey::MemberList) {
            for old_member in old_list.iter() {
                env.storage().persistent().remove(&DataKey::Member(old_member.clone()));
                env.storage().persistent().remove(&DataKey::MemberPercent(old_member.clone()));
            }
        }

        // Crear lista de miembros
        let mut member_list: Vec<Address> = Vec::new(&env);

        // Guardar miembros y sus porcentajes en persistent storage
        for i in 0..members.len() {
            let member = members.get(i).unwrap();
            let percent = percents.get(i).unwrap();

            let member_key = DataKey::Member(member.clone());
            let percent_key = DataKey::MemberPercent(member.clone());

            env.storage()
                .persistent()
                .set(&member_key, &true);
            env.storage()
                .persistent()
                .set(&percent_key, &percent);

            env.storage().persistent().extend_ttl(&member_key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND_TO);
            env.storage().persistent().extend_ttl(&percent_key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND_TO);

            member_list.push_back(member);
        }

        // Guardar lista de miembros (instance — shared config)
        env.storage()
            .instance()
            .set(&DataKey::MemberList, &member_list);

        env.storage()
            .instance()
            .set(&DataKey::MembersInitialized, &true);

        env.storage().instance().extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);

        Ok(())
    }

    /// Registra generación de energía y distribuye tokens
    #[when_not_paused]
    pub fn record_generation(env: Env, kwh_generated: i128) -> Result<(), DistributionError> {
        let admin = access_control::get_admin(&env).expect("admin not set");
        admin.require_auth();

        // Verificar que los miembros estén inicializados
        let initialized: bool = env
            .storage()
            .instance()
            .get(&DataKey::MembersInitialized)
            .unwrap_or(false);

        if !initialized {
            return Err(DistributionError::MembersNotInitialized);
        }

        // Obtener el contrato del token
        let token_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenContract)
            .unwrap();

        // Obtener lista de miembros
        let member_list: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::MemberList)
            .unwrap();

        // Crear cliente del token
        let token_client = energy_token_interface::EnergyTokenClient::new(&env, &token_contract);

        // Distribuir tokens a cada miembro según su porcentaje
        for i in 0..member_list.len() {
            let member = member_list.get(i).unwrap();
            let percent_key = DataKey::MemberPercent(member.clone());
            let percent: u32 = env
                .storage()
                .persistent()
                .get(&percent_key)
                .unwrap();

            env.storage().persistent().extend_ttl(&percent_key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND_TO);

            // Calcular tokens a mintear: (kwh_generated * percent) / 100
            let tokens_to_mint = (kwh_generated * percent as i128) / 100;

            // Mintear tokens al miembro
            token_client.mint_energy(&member, &tokens_to_mint, &env.current_contract_address());
        }

        // Actualizar total generado
        let current_total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalGenerated)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalGenerated, &(current_total + kwh_generated));

        env.storage().instance().extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);

        Ok(())
    }

    // ========================================================================
    // View Functions
    // ========================================================================

    pub fn is_member(env: Env, address: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Member(address))
            .unwrap_or(false)
    }

    pub fn get_member_percent(env: Env, address: Address) -> Option<u32> {
        env.storage()
            .persistent()
            .get(&DataKey::MemberPercent(address))
    }

    pub fn get_admin(env: Env) -> Option<Address> {
        access_control::get_admin(&env)
    }

    pub fn get_token_contract(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::TokenContract)
    }

    pub fn get_required_approvals(env: Env) -> Option<u32> {
        env.storage().instance().get(&DataKey::RequiredApprovals)
    }

    pub fn are_members_initialized(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::MembersInitialized)
            .unwrap_or(false)
    }

    pub fn get_total_generated(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalGenerated)
            .unwrap_or(0)
    }

    pub fn get_member_list(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::MemberList)
            .unwrap_or_else(|| Vec::new(&env))
    }
}

// ============================================================================
// Pausable — freno de emergencia (solo admin)
// ============================================================================

#[contractimpl]
impl Pausable for EnergyDistribution {
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

impl UpgradeableInternal for EnergyDistribution {
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
    use soroban_sdk::{testutils::Address as _, vec, Env};

    // Helper: register distribution contract with constructor
    fn setup<'a>(env: &'a Env) -> (EnergyDistributionClient<'a>, Address, Address) {
        let admin = Address::generate(env);
        let token_contract = Address::generate(env);
        let contract_id = env.register(
            EnergyDistribution,
            (&admin, &token_contract, &3u32),
        );
        let client = EnergyDistributionClient::new(env, &contract_id);
        (client, admin, token_contract)
    }

    // Helper: setup with members registered (2 members: 60%/40%)
    fn setup_with_members<'a>(env: &'a Env) -> (EnergyDistributionClient<'a>, Address, Address, Address, Address) {
        let (client, admin, token_contract) = setup(env);
        let member1 = Address::generate(env);
        let member2 = Address::generate(env);
        let approvers = vec![env, member1.clone(), member2.clone(), admin.clone()];
        let members = vec![env, member1.clone(), member2.clone()];
        let percents = vec![env, 60, 40];
        client.add_members_multisig(&approvers, &members, &percents);
        (client, admin, token_contract, member1, member2)
    }

    // ========================================================================
    // Constructor
    // ========================================================================

    #[test]
    fn test_constructor() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, token_contract) = setup(&env);

        assert_eq!(client.get_admin(), Some(admin));
        assert_eq!(client.get_token_contract(), Some(token_contract));
        assert_eq!(client.get_required_approvals(), Some(3));
        assert!(!client.are_members_initialized());
        assert_eq!(client.get_total_generated(), 0);
    }

    // ========================================================================
    // Add Members Multisig
    // ========================================================================

    #[test]
    fn test_add_members_multisig_success() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, _) = setup(&env);

        let m1 = Address::generate(&env);
        let m2 = Address::generate(&env);
        let m3 = Address::generate(&env);

        let approvers = vec![&env, m1.clone(), m2.clone(), admin.clone()];
        let members = vec![&env, m1.clone(), m2.clone(), m3.clone()];
        let percents = vec![&env, 50, 30, 20];

        let result = client.try_add_members_multisig(&approvers, &members, &percents);
        assert!(result.is_ok());

        assert!(client.is_member(&m1));
        assert!(client.is_member(&m2));
        assert!(client.is_member(&m3));
        assert_eq!(client.get_member_percent(&m1), Some(50));
        assert_eq!(client.get_member_percent(&m2), Some(30));
        assert_eq!(client.get_member_percent(&m3), Some(20));
        assert!(client.are_members_initialized());
        assert_eq!(client.get_member_list().len(), 3);
    }

    #[test]
    fn test_add_members_not_enough_approvers() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, _) = setup(&env); // requires 3 approvers

        let m1 = Address::generate(&env);
        let m2 = Address::generate(&env);

        // Only 2 approvers, need 3
        let approvers = vec![&env, m1.clone(), m2.clone()];
        let members = vec![&env, m1.clone(), m2.clone()];
        let percents = vec![&env, 60, 40];

        let result = client.try_add_members_multisig(&approvers, &members, &percents);
        assert_eq!(result, Err(Ok(DistributionError::NotEnoughApprovers)));
    }

    #[test]
    fn test_add_members_percent_mismatch() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, _) = setup(&env);

        let m1 = Address::generate(&env);
        let m2 = Address::generate(&env);

        let approvers = vec![&env, m1.clone(), m2.clone(), admin.clone()];
        let members = vec![&env, m1.clone(), m2.clone()];
        let percents = vec![&env, 60u32]; // 1 percent for 2 members

        let result = client.try_add_members_multisig(&approvers, &members, &percents);
        assert_eq!(result, Err(Ok(DistributionError::MemberPercentMismatch)));
    }

    #[test]
    fn test_add_members_too_many_approvers() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, _) = setup(&env);

        // 21 approvers exceeds MAX_APPROVERS (20)
        let mut approvers_vec = soroban_sdk::Vec::new(&env);
        for _ in 0..21u32 {
            approvers_vec.push_back(Address::generate(&env));
        }
        let m1 = Address::generate(&env);
        let members = vec![&env, m1.clone()];
        let percents = vec![&env, 100u32];

        let result = client.try_add_members_multisig(&approvers_vec, &members, &percents);
        assert_eq!(result, Err(Ok(DistributionError::TooManyApprovers)));
    }

    #[test]
    fn test_add_members_too_many_members() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, _) = setup(&env);

        // 51 members exceeds MAX_MEMBERS (50)
        let mut members_vec: soroban_sdk::Vec<Address> = soroban_sdk::Vec::new(&env);
        let mut percents_vec: soroban_sdk::Vec<u32> = soroban_sdk::Vec::new(&env);
        for _ in 0..51u32 {
            members_vec.push_back(Address::generate(&env));
            percents_vec.push_back(1u32);
        }
        // percents don't sum to 100, but TooManyMembers should fire first
        let a2 = Address::generate(&env);
        let a3 = Address::generate(&env);
        let approvers = vec![&env, a2.clone(), a3.clone(), admin.clone()];

        let result = client.try_add_members_multisig(&approvers, &members_vec, &percents_vec);
        assert_eq!(result, Err(Ok(DistributionError::TooManyMembers)));
    }

    #[test]
    fn test_add_members_percents_not_100() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, _) = setup(&env);

        let m1 = Address::generate(&env);
        let m2 = Address::generate(&env);

        let approvers = vec![&env, m1.clone(), m2.clone(), admin.clone()];
        let members = vec![&env, m1.clone(), m2.clone()];
        let percents = vec![&env, 60, 30]; // sums to 90, not 100

        let result = client.try_add_members_multisig(&approvers, &members, &percents);
        assert_eq!(result, Err(Ok(DistributionError::PercentsMustSumTo100)));
    }

    #[test]
    fn test_single_member_100_percent() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, _) = setup(&env);

        let m1 = Address::generate(&env);
        let a2 = Address::generate(&env);
        let a3 = Address::generate(&env);

        let approvers = vec![&env, m1.clone(), a2.clone(), a3.clone()];
        let members = vec![&env, m1.clone()];
        let percents = vec![&env, 100u32];

        let result = client.try_add_members_multisig(&approvers, &members, &percents);
        assert!(result.is_ok());
        assert_eq!(client.get_member_percent(&m1), Some(100));
    }

    // ========================================================================
    // Record Generation (cross-contract)
    // ========================================================================

    #[test]
    fn test_record_generation_without_members_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, _) = setup(&env);

        let result = client.try_record_generation(&100_0000000);
        assert_eq!(result, Err(Ok(DistributionError::MembersNotInitialized)));
    }

    #[test]
    fn test_total_generated_starts_at_zero() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, _) = setup(&env);

        assert_eq!(client.get_total_generated(), 0);
    }

    // ========================================================================
    // View Functions
    // ========================================================================

    #[test]
    fn test_is_member_false_for_non_member() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, _, _, _) = setup_with_members(&env);

        let outsider = Address::generate(&env);
        assert!(!client.is_member(&outsider));
    }

    #[test]
    fn test_get_member_percent_none_for_non_member() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, _, _, _) = setup_with_members(&env);

        let outsider = Address::generate(&env);
        assert_eq!(client.get_member_percent(&outsider), None);
    }

    #[test]
    fn test_member_list_empty_before_members_added() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, _) = setup(&env);

        assert_eq!(client.get_member_list().len(), 0);
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
    fn test_add_members_fails_when_paused() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, _) = setup(&env);

        client.pause(&admin);

        let m1 = Address::generate(&env);
        let m2 = Address::generate(&env);
        let approvers = vec![&env, m1.clone(), m2.clone(), admin.clone()];
        let members = vec![&env, m1.clone(), m2.clone()];
        let percents = vec![&env, 60, 40];

        let result = client.try_add_members_multisig(&approvers, &members, &percents);
        assert!(result.is_err());
    }

    #[test]
    fn test_record_generation_fails_when_paused() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, _) = setup(&env);

        client.pause(&admin);

        let result = client.try_record_generation(&100_0000000);
        assert!(result.is_err());
    }

    #[test]
    fn test_operations_resume_after_unpause() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, _) = setup(&env);

        // Pause and verify add_members fails
        client.pause(&admin);
        let m1 = Address::generate(&env);
        let m2 = Address::generate(&env);
        let approvers = vec![&env, m1.clone(), m2.clone(), admin.clone()];
        let members = vec![&env, m1.clone(), m2.clone()];
        let percents = vec![&env, 60, 40];
        assert!(client.try_add_members_multisig(&approvers, &members, &percents).is_err());

        // Unpause and verify operations work
        client.unpause(&admin);
        let result = client.try_add_members_multisig(&approvers, &members, &percents);
        assert!(result.is_ok());
        assert!(client.are_members_initialized());
    }

    // ========================================================================
    // Multisig Replacement (stale data cleanup)
    // ========================================================================

    #[test]
    fn test_add_members_multisig_full_replacement() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, _) = setup(&env);

        let a = Address::generate(&env);
        let b = Address::generate(&env);
        let c = Address::generate(&env);
        let d = Address::generate(&env);

        let approvers1 = vec![&env, a.clone(), b.clone(), admin.clone()];
        let members1 = vec![&env, a.clone(), b.clone()];
        let percents1 = vec![&env, 60, 40];
        client.add_members_multisig(&approvers1, &members1, &percents1);

        let approvers2 = vec![&env, c.clone(), d.clone(), admin.clone()];
        let members2 = vec![&env, c.clone(), d.clone()];
        let percents2 = vec![&env, 70, 30];
        client.add_members_multisig(&approvers2, &members2, &percents2);

        assert!(!client.is_member(&a));
        assert!(!client.is_member(&b));
        assert_eq!(client.get_member_percent(&a), None);
        assert_eq!(client.get_member_percent(&b), None);

        assert!(client.is_member(&c));
        assert!(client.is_member(&d));
        assert_eq!(client.get_member_percent(&c), Some(70));
        assert_eq!(client.get_member_percent(&d), Some(30));

        let list = client.get_member_list();
        assert_eq!(list.len(), 2);
        assert_eq!(list.get(0).unwrap(), c);
        assert_eq!(list.get(1).unwrap(), d);
    }

    #[test]
    fn test_add_members_multisig_partial_replacement() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin, _) = setup(&env);

        let a = Address::generate(&env);
        let b = Address::generate(&env);
        let c = Address::generate(&env);

        let approvers1 = vec![&env, a.clone(), b.clone(), admin.clone()];
        let members1 = vec![&env, a.clone(), b.clone()];
        let percents1 = vec![&env, 60, 40];
        client.add_members_multisig(&approvers1, &members1, &percents1);

        let approvers2 = vec![&env, a.clone(), c.clone(), admin.clone()];
        let members2 = vec![&env, a.clone(), c.clone()];
        let percents2 = vec![&env, 70, 30];
        client.add_members_multisig(&approvers2, &members2, &percents2);

        assert!(client.is_member(&a));
        assert_eq!(client.get_member_percent(&a), Some(70));

        assert!(!client.is_member(&b));
        assert_eq!(client.get_member_percent(&b), None);

        assert!(client.is_member(&c));
        assert_eq!(client.get_member_percent(&c), Some(30));

        let list = client.get_member_list();
        assert_eq!(list.len(), 2);
        assert_eq!(list.get(0).unwrap(), a);
        assert_eq!(list.get(1).unwrap(), c);
    }
}

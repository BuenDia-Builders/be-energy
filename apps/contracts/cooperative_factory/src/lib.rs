#![no_std]

//! # Cooperative Factory
//!
//! Despliega los tres contratos que forman una cooperativa (energy_token,
//! energy_distribution, community_governance) en una única transacción atómica
//! y los registra en el CooperativeRegistry (#169).
//!
//! ## Estrategia de bootstrap
//!
//! `energy_token` necesita la dirección del contrato de distribución en tiempo
//! de construcción para otorgarle el rol `minter`. `energy_distribution` necesita
//! la dirección del token. En lugar de un ciclo temporal de grant/revoke, la
//! factory utiliza `Deployer::deployed_address()` para pre-calcular la dirección
//! del contrato de distribución antes de desplegar el token, y la pasa
//! directamente a su constructor. La dirección determinística se deriva de la
//! propia dirección de la factory y un salt sha256 por cooperativa y por tipo de
//! contrato, garantizando que coincida con la dirección que retorna la posterior
//! llamada a `deploy_v2`.
//!
//! ## Gobernanza de hashes WASM
//!
//! Los hashes WASM aprobados se almacenan en instance storage a través de una
//! función `set_wasm_hashes` restringida al admin, en lugar de aceptarlos como
//! argumentos de `deploy_cooperative`. Esto impide que un admin malicioso de la
//! factory despliegue contratos de cooperativa que ejecuten WASM arbitrario.
//!
//! ## Flujo de instalación de WASM
//!
//! Antes de desplegar cualquier cooperativa en Stellar:
//!
//! ```text
//! stellar contract install --source <admin> --network testnet \
//!     --wasm target/wasm32v1-none/release/energy_token.wasm
//! # → <token_wasm_hash>
//!
//! stellar contract install --source <admin> --network testnet \
//!     --wasm target/wasm32v1-none/release/energy_distribution.wasm
//! # → <distribution_wasm_hash>
//!
//! stellar contract install --source <admin> --network testnet \
//!     --wasm target/wasm32v1-none/release/community_governance.wasm
//! # → <governance_wasm_hash>
//!
//! # Registrar los hashes en la factory (requiere auth del admin):
//! stellar contract invoke --id <factory_id> -- set_wasm_hashes \
//!     --token_wasm_hash <token_wasm_hash> \
//!     --distribution_wasm_hash <distribution_wasm_hash> \
//!     --governance_wasm_hash <governance_wasm_hash>
//! ```

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    Address, Bytes, BytesN, Env, String, Symbol, Vec,
};
use stellar_access::access_control;

// Constantes de TTL
const TTL_THRESHOLD: u32 = 50_000;
const TTL_EXTEND_TO: u32 = 100_000;
const MAX_INITIAL_MEMBERS: u32 = 50;

// Discriminadores de salt (un byte por tipo de contrato hijo)
const SALT_TOKEN: u8 = 0;
const SALT_DISTRIBUTION: u8 = 1;
const SALT_GOVERNANCE: u8 = 2;

// Claves de almacenamiento
#[contracttype]
pub enum DataKey {
    Registry,
    TokenWasm,
    DistributionWasm,
    GovernanceWasm,
}

// Tipos públicos
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Member {
    pub address: Address,
    pub percent: u32,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct CooperativeInfo {
    pub cooperative_id: String,
    pub token_contract: Address,
    pub distribution_contract: Address,
    pub governance_contract: Address,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum FactoryError {
    /// `set_wasm_hashes` no ha sido llamado todavía.
    WasmHashesNotSet = 1,
    /// Se proporcionaron `initial_members` pero `required_approvals > 1`.
    /// Para cooperativas multi-firmantes, agregar miembros post-despliegue
    /// mediante `energy_distribution::add_members_multisig`.
    InitialMembersRequireSingleApproval = 2,
    /// Los porcentajes de los miembros no suman 100.
    MemberPercentsMustSum100 = 3,
    /// `required_approvals` debe ser al menos 1; con 0 la distribución
    /// queda sin protección para agregar miembros.
    InvalidRequiredApprovals = 4,
    /// `initial_members` supera el máximo permitido (`MAX_INITIAL_MEMBERS`).
    /// Agregar los miembros restantes post-despliegue mediante
    /// `energy_distribution::add_members_multisig`.
    TooManyInitialMembers = 5,
}

// Interfaces de contratos externos

mod registry_interface {
    use soroban_sdk::{contractclient, Address, Env, String};

    /// Interfaz mínima para el contrato CooperativeRegistry pendiente (#169).
    /// La factory solo necesita llamar `register_cooperative` una vez por despliegue.
    #[contractclient(name = "CooperativeRegistryClient")]
    pub trait CooperativeRegistryTrait {
        fn register_cooperative(
            env: Env,
            cooperative_id: String,
            token_contract: Address,
            distribution_contract: Address,
            governance_contract: Address,
        );
    }
}

mod distribution_interface {
    use soroban_sdk::{contractclient, Address, Env, Vec};

    #[contractclient(name = "EnergyDistributionClient")]
    pub trait EnergyDistributionTrait {
        fn add_members_multisig(
            env: Env,
            approvers: Vec<Address>,
            members: Vec<Address>,
            percents: Vec<u32>,
        );
    }
}

mod governance_interface {
    use soroban_sdk::{contractclient, Address, Env};

    /// `community_governance` usa una función `initialize` explícita en lugar de
    /// `__constructor`, por lo que la factory la invoca como llamada cruzada
    /// inmediatamente después de desplegar el contrato de gobernanza.
    #[contractclient(name = "CommunityGovernanceClient")]
    pub trait CommunityGovernanceTrait {
        fn initialize(env: Env, admin: Address);
    }
}

#[contract]
pub struct CooperativeFactory;

#[contractimpl]
impl CooperativeFactory {
    /// Inicializa la factory.
    ///
    /// # Argumentos
    /// * `admin` - Única cuenta autorizada para llamar `set_wasm_hashes`
    ///             y `deploy_cooperative`.
    /// * `registry` - Dirección del CooperativeRegistry desplegado (#169).
    pub fn __constructor(env: &Env, admin: Address, registry: Address) {
        access_control::set_admin(env, &admin);
        env.storage().instance().set(&DataKey::Registry, &registry);
        env.storage()
            .instance()
            .extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
    }

    // ============================================================================
    // Configuración de admin
    // ============================================================================

    /// Almacena los hashes WASM aprobados para los tres contratos hijos.
    ///
    /// Los tres hashes deben corresponder a WASMs ya instalados en la red Stellar
    /// mediante `stellar contract install` (ver documentación del módulo).
    /// Solo el admin de la factory puede llamar esta función.
    pub fn set_wasm_hashes(
        env: Env,
        token_wasm_hash: BytesN<32>,
        distribution_wasm_hash: BytesN<32>,
        governance_wasm_hash: BytesN<32>,
    ) {
        let admin = access_control::get_admin(&env).expect("admin no configurado");
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::TokenWasm, &token_wasm_hash);
        env.storage()
            .instance()
            .set(&DataKey::DistributionWasm, &distribution_wasm_hash);
        env.storage()
            .instance()
            .set(&DataKey::GovernanceWasm, &governance_wasm_hash);

        env.storage()
            .instance()
            .extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);

        env.events().publish(
            (Symbol::new(&env, "wasm_updated"),),
            (token_wasm_hash, distribution_wasm_hash, governance_wasm_hash),
        );
    }

    // ============================================================================
    // Función de despliegue
    // ============================================================================

    /// Despliega los tres contratos de la cooperativa y los registra en el Registry.
    ///
    /// Solo el admin de la factory puede llamar esta función.
    ///
    /// # Argumentos
    /// * `cooperative_id` - Identificador único de la cooperativa; se usa para
    ///                      derivar las direcciones determinísticas de los contratos
    ///                      hijos y como clave en el registry.
    /// * `admin` - Admin de los contratos de la cooperativa recién creada.
    /// * `token_name` - Nombre SEP-41 del token de energía.
    /// * `token_symbol` - Símbolo SEP-41 del token de energía.
    /// * `initial_members` - Miembros iniciales opcionales para el contrato de
    ///                       distribución. Requiere `required_approvals == 1`; dejar
    ///                       vacío para cooperativas multi-firmantes y agregar miembros
    ///                       post-despliegue mediante `add_members_multisig`.
    /// * `required_approvals` - Quórum para la gestión de miembros en distribución.
    pub fn deploy_cooperative(
        env: Env,
        cooperative_id: String,
        admin: Address,
        token_name: String,
        token_symbol: String,
        initial_members: Vec<Member>,
        required_approvals: u32,
    ) -> Result<CooperativeInfo, FactoryError> {
        let factory_admin = access_control::get_admin(&env).expect("admin no configurado");
        factory_admin.require_auth();

        // Verificar que se requiere al menos un aprobador
        if required_approvals == 0 {
            return Err(FactoryError::InvalidRequiredApprovals);
        }

        // Los miembros iniciales solo se pueden sembrar con un único aprobador
        if !initial_members.is_empty() && required_approvals > 1 {
            return Err(FactoryError::InitialMembersRequireSingleApproval);
        }

        // Cargar hashes WASM aprobados — fallar rápido si aún no están configurados
        let token_wasm: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::TokenWasm)
            .ok_or(FactoryError::WasmHashesNotSet)?;
        let distribution_wasm: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::DistributionWasm)
            .ok_or(FactoryError::WasmHashesNotSet)?;
        let governance_wasm: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::GovernanceWasm)
            .ok_or(FactoryError::WasmHashesNotSet)?;

        // Calcular salts determinísticos a partir del cooperative_id
        //
        // sha256(cooperative_id_bytes || discriminator_byte) garantiza:
        //   - unicidad por cooperativa y por tipo de contrato
        //   - un cooperative_id duplicado genera el mismo salt → el deployer
        //     falla porque la dirección ya está tomada en la red
        let token_salt = Self::make_salt(&env, &cooperative_id, SALT_TOKEN);
        let distribution_salt = Self::make_salt(&env, &cooperative_id, SALT_DISTRIBUTION);
        let governance_salt = Self::make_salt(&env, &cooperative_id, SALT_GOVERNANCE);

        // Bootstrap: pre-calcular la dirección de distribución antes de desplegar el token
        //
        // `deployed_address()` es cómputo puro (no modifica estado del ledger) y
        // retorna la misma dirección que `deploy_v2` con el mismo deployer y salt.
        // Pasarla al constructor del token le otorga el rol minter desde el inicio,
        // sin necesidad de mutaciones de permisos post-despliegue.
        let dist_deployer = env
            .deployer()
            .with_current_contract(distribution_salt.clone());
        let distribution_addr = dist_deployer.deployed_address();

        // 1. Desplegar energy_token
        let token_addr = env
            .deployer()
            .with_current_contract(token_salt)
            .deploy_v2(
                token_wasm,
                (
                    &admin,
                    &distribution_addr, // dirección de minter pre-calculada
                    &0i128,             // supply inicial = 0
                    &token_name,
                    &token_symbol,
                    &cooperative_id,
                ),
            );

        // 2. Desplegar energy_distribution
        let dist_addr = dist_deployer.deploy_v2(
            distribution_wasm,
            (&admin, &token_addr, &required_approvals),
        );

        // 3. Desplegar community_governance
        //
        // community_governance no tiene `__constructor`; usa una función `initialize`
        // explícita que se llama de inmediato mediante invocación cruzada.
        let gov_addr = env
            .deployer()
            .with_current_contract(governance_salt)
            .deploy_v2(governance_wasm, ());

        let gov_client =
            governance_interface::CommunityGovernanceClient::new(&env, &gov_addr);
        gov_client.initialize(&admin);

        // 4. Sembrar miembros iniciales (opcional, solo con un único aprobador)
        //
        // Pasada única: construye los vectores de extracción y valida la suma de
        // porcentajes con aritmética chequeada para prevenir desbordamiento silencioso
        // en builds de producción WASM (donde el overflow no genera panic).
        if !initial_members.is_empty() {
            if initial_members.len() > MAX_INITIAL_MEMBERS {
                return Err(FactoryError::TooManyInitialMembers);
            }
            let mut members_vec: Vec<Address> = Vec::new(&env);
            let mut percents_vec: Vec<u32> = Vec::new(&env);
            let mut total: u32 = 0u32;

            for member in initial_members.iter() {
                members_vec.push_back(member.address.clone());
                percents_vec.push_back(member.percent);
                total = total
                    .checked_add(member.percent)
                    .ok_or(FactoryError::MemberPercentsMustSum100)?;
            }

            if total != 100 {
                return Err(FactoryError::MemberPercentsMustSum100);
            }

            // El admin de la cooperativa actúa como único aprobador. Esto es válido
            // porque su require_auth() en add_members_multisig queda satisfecho
            // por la firma que autorizó la llamada a deploy_cooperative.
            let approvers = soroban_sdk::vec![&env, admin.clone()];
            let dist_client =
                distribution_interface::EnergyDistributionClient::new(&env, &dist_addr);
            dist_client.add_members_multisig(&approvers, &members_vec, &percents_vec);
        }

        // 5. Registrar en el CooperativeRegistry (#169)
        let registry: Address = env
            .storage()
            .instance()
            .get(&DataKey::Registry)
            .expect("registry no configurado");

        let registry_client =
            registry_interface::CooperativeRegistryClient::new(&env, &registry);
        registry_client.register_cooperative(
            &cooperative_id,
            &token_addr,
            &dist_addr,
            &gov_addr,
        );

        env.storage()
            .instance()
            .extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);

        env.events().publish(
            (Symbol::new(&env, "coop_deployed"),),
            (cooperative_id.clone(), token_addr.clone(), dist_addr.clone(), gov_addr.clone()),
        );

        Ok(CooperativeInfo {
            cooperative_id,
            token_contract: token_addr,
            distribution_contract: dist_addr,
            governance_contract: gov_addr,
        })
    }

    // ============================================================================
    // Funciones de consulta
    // ============================================================================

    /// Retorna el admin actual de la factory.
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
        access_control::get_admin(&env).expect("admin no configurado")
    }

    /// Retorna la dirección del CooperativeRegistry configurado.
    pub fn get_registry(env: Env) -> Address {
        env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
        env.storage()
            .instance()
            .get(&DataKey::Registry)
            .expect("registry no configurado")
    }

    /// Retorna los tres hashes WASM aprobados, o `None` si `set_wasm_hashes`
    /// no ha sido llamado todavía.
    pub fn get_wasm_hashes(env: Env) -> Option<(BytesN<32>, BytesN<32>, BytesN<32>)> {
        env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
        let token: Option<BytesN<32>> = env.storage().instance().get(&DataKey::TokenWasm);
        let dist: Option<BytesN<32>> = env.storage().instance().get(&DataKey::DistributionWasm);
        let gov: Option<BytesN<32>> = env.storage().instance().get(&DataKey::GovernanceWasm);
        match (token, dist, gov) {
            (Some(t), Some(d), Some(g)) => Some((t, d, g)),
            _ => None,
        }
    }

    // Helper privado: calcula un salt de 32 bytes para un contrato hijo.
    //
    // sha256(cooperative_id_bytes || discriminador) garantiza que cada par
    // (cooperative_id, tipo_contrato) mapea a una dirección única, y que el
    // mismo cooperative_id no puede usarse dos veces (colisión de salt → panic).
    fn make_salt(env: &Env, cooperative_id: &String, discriminator: u8) -> BytesN<32> {
        // From<&String> for Bytes provisto por soroban-sdk retorna los bytes UTF-8
        // crudos del cooperative_id.
        let mut data: Bytes = cooperative_id.into();
        data.push_back(discriminator);
        env.crypto().sha256(&data).into()
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Events as _},
        vec, Env,
    };

    // WASMs de contratos hijos (compilados con `cargo build --release --target wasm32v1-none`)
    const TOKEN_WASM: &[u8] = include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../target/wasm32v1-none/release/energy_token.wasm"
    ));
    const DISTRIBUTION_WASM: &[u8] = include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../target/wasm32v1-none/release/energy_distribution.wasm"
    ));
    const GOVERNANCE_WASM: &[u8] = include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../target/wasm32v1-none/release/community_governance.wasm"
    ));

    // ========================================================================
    // Mock CooperativeRegistry (#169)
    //
    // Implementación mínima que almacena las tres direcciones indexadas por
    // cooperative_id para que los tests puedan verificar lo que registró la factory.
    // ========================================================================

    #[contracttype]
    enum RegistryKey {
        Cooperative(String),
    }

    #[derive(Clone)]
    #[contracttype]
    pub struct RegistryEntry {
        pub token: Address,
        pub distribution: Address,
        pub governance: Address,
    }

    #[contract]
    struct MockRegistry;

    #[contractimpl]
    impl MockRegistry {
        pub fn register_cooperative(
            env: Env,
            cooperative_id: String,
            token_contract: Address,
            distribution_contract: Address,
            governance_contract: Address,
        ) {
            let key = RegistryKey::Cooperative(cooperative_id);
            let entry = RegistryEntry {
                token: token_contract,
                distribution: distribution_contract,
                governance: governance_contract,
            };
            env.storage().instance().set(&key, &entry);
        }

        pub fn get_cooperative(env: Env, cooperative_id: String) -> Option<RegistryEntry> {
            env.storage()
                .instance()
                .get(&RegistryKey::Cooperative(cooperative_id))
        }
    }

    // ========================================================================
    // Helpers de test
    // ========================================================================

    struct TestEnv<'a> {
        factory_admin: Address,
        factory: CooperativeFactoryClient<'a>,
        registry: Address,
        token_hash: BytesN<32>,
        distribution_hash: BytesN<32>,
        governance_hash: BytesN<32>,
    }

    fn setup(env: &Env) -> TestEnv<'_> {
        // mock_all_auths_allowing_non_root_auth es necesario porque
        // governance.initialize(admin) llama admin.require_auth() desde una
        // sub-invocación (no desde el caller raíz).
        env.mock_all_auths_allowing_non_root_auth();

        let factory_admin = Address::generate(env);
        let registry = env.register(MockRegistry, ());

        let factory_id = env.register(
            CooperativeFactory,
            (&factory_admin, &registry),
        );
        let factory = CooperativeFactoryClient::new(env, &factory_id);

        let token_hash = env.deployer().upload_contract_wasm(TOKEN_WASM);
        let distribution_hash = env.deployer().upload_contract_wasm(DISTRIBUTION_WASM);
        let governance_hash = env.deployer().upload_contract_wasm(GOVERNANCE_WASM);

        factory.set_wasm_hashes(&token_hash, &distribution_hash, &governance_hash);

        TestEnv {
            factory_admin,
            factory,
            registry,
            token_hash,
            distribution_hash,
            governance_hash,
        }
    }

    fn coop_id(env: &Env) -> String {
        String::from_str(env, "coop-solar-ba")
    }

    // ========================================================================
    // Despliegue básico
    // ========================================================================

    #[test]
    fn test_deploy_returns_three_addresses() {
        let env = Env::default();
        let t = setup(&env);
        let id = coop_id(&env);

        let info = t
            .factory
            .deploy_cooperative(
                &id,
                &Address::generate(&env),
                &String::from_str(&env, "Solar BA Token"),
                &String::from_str(&env, "CSBA"),
                &vec![&env],
                &1u32,
            );

        assert_eq!(info.cooperative_id, id);
        // Las tres direcciones deben ser contratos distintos
        assert_ne!(info.token_contract, info.distribution_contract);
        assert_ne!(info.token_contract, info.governance_contract);
        assert_ne!(info.distribution_contract, info.governance_contract);
    }

    #[test]
    fn test_all_three_registered_in_registry() {
        let env = Env::default();
        let t = setup(&env);
        let id = coop_id(&env);
        let coop_admin = Address::generate(&env);

        let info = t
            .factory
            .deploy_cooperative(
                &id,
                &coop_admin,
                &String::from_str(&env, "Solar BA Token"),
                &String::from_str(&env, "CSBA"),
                &vec![&env],
                &1u32,
            );

        let registry_client = MockRegistryClient::new(&env, &t.registry);
        let entry = registry_client.get_cooperative(&id).unwrap();

        assert_eq!(entry.token, info.token_contract);
        assert_eq!(entry.distribution, info.distribution_contract);
        assert_eq!(entry.governance, info.governance_contract);
    }

    #[test]
    fn test_token_has_correct_metadata() {
        let env = Env::default();
        let t = setup(&env);
        let id = coop_id(&env);
        let coop_admin = Address::generate(&env);
        let token_name = String::from_str(&env, "Solar BA Token");
        let token_symbol = String::from_str(&env, "CSBA");

        let info = t
            .factory
            .deploy_cooperative(
                &id,
                &coop_admin,
                &token_name,
                &token_symbol,
                &vec![&env],
                &1u32,
            );

        let token = energy_token::EnergyTokenClient::new(&env, &info.token_contract);
        assert_eq!(token.get_cooperative_id(), id);
        assert_eq!(token.name(), token_name);
        assert_eq!(token.symbol(), token_symbol);
    }

    #[test]
    fn test_distribution_connected_to_token() {
        let env = Env::default();
        let t = setup(&env);
        let id = coop_id(&env);
        let coop_admin = Address::generate(&env);

        let info = t
            .factory
            .deploy_cooperative(
                &id,
                &coop_admin,
                &String::from_str(&env, "Solar BA Token"),
                &String::from_str(&env, "CSBA"),
                &vec![&env],
                &1u32,
            );

        let dist = energy_distribution::EnergyDistributionClient::new(
            &env,
            &info.distribution_contract,
        );
        assert_eq!(dist.get_token_contract(), Some(info.token_contract.clone()));
    }

    #[test]
    fn test_duplicate_cooperative_id_fails() {
        let env = Env::default();
        let t = setup(&env);
        let id = coop_id(&env);
        let coop_admin = Address::generate(&env);

        // Primer despliegue exitoso
        t.factory
            .deploy_cooperative(
                &id,
                &coop_admin,
                &String::from_str(&env, "Solar BA Token"),
                &String::from_str(&env, "CSBA"),
                &vec![&env],
                &1u32,
            );

        // El segundo despliegue con el mismo id debe fallar: la factory deriva el
        // mismo salt y el deployer falla porque la dirección ya está tomada.
        let result = t.factory.try_deploy_cooperative(
            &id,
            &coop_admin,
            &String::from_str(&env, "Solar BA Token"),
            &String::from_str(&env, "CSBA"),
            &vec![&env],
            &1u32,
        );
        assert!(result.is_err());
    }

    // ========================================================================
    // Control de acceso
    // ========================================================================

    #[test]
    fn test_only_factory_admin_can_deploy() {
        // Parte A: verificar que la auth del admin queda registrada en un despliegue exitoso.
        let env = Env::default();
        let t = setup(&env);

        t.factory.deploy_cooperative(
            &coop_id(&env),
            &Address::generate(&env),
            &String::from_str(&env, "Nombre"),
            &String::from_str(&env, "SYM"),
            &vec![&env],
            &1u32,
        );

        // mock_all_auths_allowing_non_root_auth registra toda auth requerida.
        // factory_admin debe aparecer como autorizante de deploy_cooperative.
        let recorded = env.auths();
        assert!(
            recorded.iter().any(|(addr, _)| addr == &t.factory_admin),
            "factory_admin debe autorizar deploy_cooperative"
        );

        // Parte B: sin mock de auth, deploy_cooperative debe fallar.
        // Todo se crea en env2 para evitar filtración de objetos entre entornos.
        let env2 = Env::default(); // sin mock_all_auths → require_auth se aplica
        let factory_admin2 = Address::generate(&env2);
        let registry2 = env2.register(MockRegistry, ());
        // register() en testutils omite la auth del constructor; solo las llamadas
        // en runtime están sujetas a verificación.
        let factory_id2 = env2.register(CooperativeFactory, (&factory_admin2, &registry2));
        let factory2 = CooperativeFactoryClient::new(&env2, &factory_id2);

        // try_ captura el panic de require_auth como Err.
        let result = factory2.try_deploy_cooperative(
            &coop_id(&env2),
            &Address::generate(&env2),
            &String::from_str(&env2, "Nombre"),
            &String::from_str(&env2, "SYM"),
            &vec![&env2],
            &1u32,
        );
        assert!(result.is_err(), "un no-admin no debe poder desplegar");
    }

    #[test]
    fn test_set_wasm_hashes_requires_admin() {
        let env = Env::default();
        // Sin mock de auth — require_auth se aplica en cada llamada.
        let factory_admin = Address::generate(&env);
        let registry = env.register(MockRegistry, ());
        // register() en testutils llama __constructor sin verificar auth.
        let factory_id = env.register(CooperativeFactory, (&factory_admin, &registry));
        let factory = CooperativeFactoryClient::new(&env, &factory_id);

        let dummy: BytesN<32> = BytesN::from_array(&env, &[0u8; 32]);
        // Sin firmante → require_auth dentro de set_wasm_hashes falla → Err.
        let result = factory.try_set_wasm_hashes(&dummy, &dummy, &dummy);
        assert!(result.is_err());
    }

    // ========================================================================
    // Validaciones y guards
    // ========================================================================

    #[test]
    fn test_deploy_fails_without_wasm_hashes() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();

        let factory_admin = Address::generate(&env);
        let registry = env.register(MockRegistry, ());
        let factory_id = env.register(
            CooperativeFactory,
            (&factory_admin, &registry),
        );
        let factory = CooperativeFactoryClient::new(&env, &factory_id);

        // Sin llamar a set_wasm_hashes
        let result = factory.try_deploy_cooperative(
            &coop_id(&env),
            &Address::generate(&env),
            &String::from_str(&env, "Nombre"),
            &String::from_str(&env, "SYM"),
            &vec![&env],
            &1u32,
        );
        assert_eq!(result, Err(Ok(FactoryError::WasmHashesNotSet)));
    }

    #[test]
    fn test_initial_members_rejected_for_multisig_quorum() {
        let env = Env::default();
        let t = setup(&env);
        let coop_admin = Address::generate(&env);

        let members = vec![
            &env,
            Member {
                address: Address::generate(&env),
                percent: 60,
            },
            Member {
                address: Address::generate(&env),
                percent: 40,
            },
        ];

        let result = t.factory.try_deploy_cooperative(
            &coop_id(&env),
            &coop_admin,
            &String::from_str(&env, "Nombre"),
            &String::from_str(&env, "SYM"),
            &members,
            &3u32, // required_approvals > 1 → debe fallar
        );
        assert_eq!(
            result,
            Err(Ok(FactoryError::InitialMembersRequireSingleApproval))
        );
    }

    #[test]
    fn test_initial_members_invalid_percentages_rejected() {
        let env = Env::default();
        let t = setup(&env);
        let coop_admin = Address::generate(&env);

        let members = vec![
            &env,
            Member {
                address: Address::generate(&env),
                percent: 60,
            },
            Member {
                address: Address::generate(&env),
                percent: 30,
            },
        ];

        let result = t.factory.try_deploy_cooperative(
            &coop_id(&env),
            &coop_admin,
            &String::from_str(&env, "Nombre"),
            &String::from_str(&env, "SYM"),
            &members,
            &1u32,
        );
        assert_eq!(
            result,
            Err(Ok(FactoryError::MemberPercentsMustSum100))
        );
    }

    #[test]
    fn test_percent_overflow_rejected() {
        let env = Env::default();
        let t = setup(&env);

        // Dos miembros cuyos porcentajes superan u32::MAX — sin checked_add
        // el valor envolvería y podría pasar el chequeo == 100 en release.
        let members = vec![
            &env,
            Member { address: Address::generate(&env), percent: u32::MAX / 2 + 1 },
            Member { address: Address::generate(&env), percent: u32::MAX / 2 + 1 },
        ];

        let result = t.factory.try_deploy_cooperative(
            &coop_id(&env),
            &Address::generate(&env),
            &String::from_str(&env, "Nombre"),
            &String::from_str(&env, "SYM"),
            &members,
            &1u32,
        );
        assert_eq!(result, Err(Ok(FactoryError::MemberPercentsMustSum100)));
    }

    #[test]
    fn test_zero_required_approvals_rejected() {
        let env = Env::default();
        let t = setup(&env);

        let result = t.factory.try_deploy_cooperative(
            &coop_id(&env),
            &Address::generate(&env),
            &String::from_str(&env, "Nombre"),
            &String::from_str(&env, "SYM"),
            &vec![&env],
            &0u32,
        );
        assert_eq!(result, Err(Ok(FactoryError::InvalidRequiredApprovals)));
    }

    #[test]
    fn test_too_many_initial_members_rejected() {
        let env = Env::default();
        let t = setup(&env);

        // Construir MAX_INITIAL_MEMBERS + 1 miembros (el guard de cantidad
        // se evalúa antes que la suma de porcentajes).
        let mut members = soroban_sdk::Vec::new(&env);
        for _ in 0..=MAX_INITIAL_MEMBERS {
            members.push_back(Member {
                address: Address::generate(&env),
                percent: 0,
            });
        }

        let result = t.factory.try_deploy_cooperative(
            &coop_id(&env),
            &Address::generate(&env),
            &String::from_str(&env, "Nombre"),
            &String::from_str(&env, "SYM"),
            &members,
            &1u32,
        );
        assert_eq!(result, Err(Ok(FactoryError::TooManyInitialMembers)));
    }

    // ========================================================================
    // Miembros iniciales
    // ========================================================================

    #[test]
    fn test_deploy_with_initial_members_seeds_distribution() {
        let env = Env::default();
        let t = setup(&env);
        let coop_admin = Address::generate(&env);
        let member1 = Address::generate(&env);
        let member2 = Address::generate(&env);

        let members = vec![
            &env,
            Member {
                address: member1.clone(),
                percent: 60,
            },
            Member {
                address: member2.clone(),
                percent: 40,
            },
        ];

        let info = t
            .factory
            .deploy_cooperative(
                &coop_id(&env),
                &coop_admin,
                &String::from_str(&env, "Solar BA Token"),
                &String::from_str(&env, "CSBA"),
                &members,
                &1u32,
            );

        let dist = energy_distribution::EnergyDistributionClient::new(
            &env,
            &info.distribution_contract,
        );
        assert!(dist.is_member(&member1));
        assert!(dist.is_member(&member2));
        assert_eq!(dist.get_member_percent(&member1), Some(60));
        assert_eq!(dist.get_member_percent(&member2), Some(40));
    }

    // ========================================================================
    // Funciones de consulta
    // ========================================================================

    #[test]
    fn test_view_functions() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();

        let factory_admin = Address::generate(&env);
        let registry = env.register(MockRegistry, ());
        let factory_id = env.register(
            CooperativeFactory,
            (&factory_admin, &registry),
        );
        let factory = CooperativeFactoryClient::new(&env, &factory_id);

        assert_eq!(factory.get_admin(), factory_admin);
        assert_eq!(factory.get_registry(), registry);
    }

    #[test]
    fn test_get_wasm_hashes() {
        let env = Env::default();
        let t = setup(&env);

        let (tok, dist, gov) = t.factory.get_wasm_hashes().unwrap();
        assert_eq!(tok, t.token_hash);
        assert_eq!(dist, t.distribution_hash);
        assert_eq!(gov, t.governance_hash);
    }

    #[test]
    fn test_get_wasm_hashes_returns_none_before_set() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();

        let factory_admin = Address::generate(&env);
        let registry = env.register(MockRegistry, ());
        let factory_id = env.register(CooperativeFactory, (&factory_admin, &registry));
        let factory = CooperativeFactoryClient::new(&env, &factory_id);

        // Sin llamar a set_wasm_hashes — debe retornar None, no panic.
        assert!(factory.get_wasm_hashes().is_none());
    }

    // ========================================================================
    // Eventos
    // ========================================================================

    #[test]
    fn test_set_wasm_hashes_emits_event() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();

        let factory_admin = Address::generate(&env);
        let registry = env.register(MockRegistry, ());
        let factory_id = env.register(CooperativeFactory, (&factory_admin, &registry));
        let factory = CooperativeFactoryClient::new(&env, &factory_id);

        let token_hash = env.deployer().upload_contract_wasm(TOKEN_WASM);
        let distribution_hash = env.deployer().upload_contract_wasm(DISTRIBUTION_WASM);
        let governance_hash = env.deployer().upload_contract_wasm(GOVERNANCE_WASM);

        factory.set_wasm_hashes(&token_hash, &distribution_hash, &governance_hash);

        assert_eq!(
            env.events().all().len(),
            1,
            "set_wasm_hashes debe emitir exactamente un evento wasm_updated"
        );
    }

    #[test]
    fn test_deploy_cooperative_emits_event() {
        let env = Env::default();
        let t = setup(&env);

        t.factory.deploy_cooperative(
            &coop_id(&env),
            &Address::generate(&env),
            &String::from_str(&env, "Solar BA Token"),
            &String::from_str(&env, "CSBA"),
            &vec![&env],
            &1u32,
        );

        // setup() llama set_wasm_hashes (1 evento) + deploy_cooperative (1 evento) = 2 en total.
        assert_eq!(env.events().all().len(), 2);
    }
}

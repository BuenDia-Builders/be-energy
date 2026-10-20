use super::*;
use soroban_sdk::{
    contract, contractimpl,
    testutils::{Address as _, MockAuth, MockAuthInvoke},
    IntoVal,
};

// ============================================================================
// Helpers
// ============================================================================

struct TestEnv<'a> {
    admin: Address,
    registry_id: Address,
    registry: CooperativeRegistryClient<'a>,
}

/// Registry recién desplegado, sin registrar configurado y sin auths mockeadas:
/// cada test decide qué firmas existen. `register` con constructor no exige auth.
fn deploy(env: &Env) -> TestEnv<'_> {
    let admin = Address::generate(env);
    let registry_id = env.register(CooperativeRegistry, (&admin,));
    let registry = CooperativeRegistryClient::new(env, &registry_id);
    TestEnv {
        admin,
        registry_id,
        registry,
    }
}

/// Configura `registrar` firmando como admin (solo esa llamada).
fn set_registrar_as_admin(env: &Env, t: &TestEnv, registrar: &Address) {
    env.mock_auths(&[MockAuth {
        address: &t.admin,
        invoke: &MockAuthInvoke {
            contract: &t.registry_id,
            fn_name: "set_registrar",
            args: (registrar.clone(),).into_val(env),
            sub_invokes: &[],
        },
    }]);
    t.registry.set_registrar(registrar);
}

fn id(env: &Env, s: &str) -> String {
    String::from_str(env, s)
}

fn addrs(env: &Env) -> (Address, Address, Address) {
    (
        Address::generate(env),
        Address::generate(env),
        Address::generate(env),
    )
}

/// Registra una cooperativa firmando como `registrar`.
fn register_as(
    env: &Env,
    t: &TestEnv,
    registrar: &Address,
    coop_id: &String,
    a: &(Address, Address, Address),
) {
    env.mock_auths(&[MockAuth {
        address: registrar,
        invoke: &MockAuthInvoke {
            contract: &t.registry_id,
            fn_name: "register_cooperative",
            args: (coop_id.clone(), a.0.clone(), a.1.clone(), a.2.clone()).into_val(env),
            sub_invokes: &[],
        },
    }]);
    t.registry.register_cooperative(coop_id, &a.0, &a.1, &a.2);
}

// ============================================================================
// Registro y consulta
// ============================================================================

#[test]
fn test_register_and_get_cooperative() {
    let env = Env::default();
    let t = deploy(&env);
    let registrar = Address::generate(&env);
    set_registrar_as_admin(&env, &t, &registrar);

    let coop = id(&env, "coop-solar-ba");
    let a = addrs(&env);
    register_as(&env, &t, &registrar, &coop, &a);

    let entry = t.registry.get_cooperative(&coop).unwrap();
    assert_eq!(entry.token, a.0);
    assert_eq!(entry.distribution, a.1);
    assert_eq!(entry.governance, a.2);
    assert_eq!(t.registry.get_cooperative_count(), 1);
}

#[test]
fn test_get_unknown_cooperative_returns_none() {
    let env = Env::default();
    let t = deploy(&env);

    assert_eq!(t.registry.get_cooperative(&id(&env, "no-existe")), None);
    assert_eq!(t.registry.get_cooperative_count(), 0);
}

#[test]
fn test_constructor_sets_admin_and_no_registrar() {
    let env = Env::default();
    let t = deploy(&env);

    assert_eq!(t.registry.get_admin(), t.admin);
    assert_eq!(t.registry.get_registrar(), None);
}

#[test]
fn test_register_emits_event() {
    use soroban_sdk::testutils::Events as _;

    let env = Env::default();
    let t = deploy(&env);
    let registrar = Address::generate(&env);
    set_registrar_as_admin(&env, &t, &registrar);

    register_as(&env, &t, &registrar, &id(&env, "coop-a"), &addrs(&env));

    assert!(
        !env.events().all().is_empty(),
        "register_cooperative debe emitir coop_registered"
    );
}

// ============================================================================
// Duplicados y validaciones
// ============================================================================

#[test]
fn test_duplicate_cooperative_id_is_rejected() {
    let env = Env::default();
    let t = deploy(&env);
    let registrar = Address::generate(&env);
    set_registrar_as_admin(&env, &t, &registrar);

    let coop = id(&env, "coop-solar-ba");
    let first = addrs(&env);
    register_as(&env, &t, &registrar, &coop, &first);

    // Segundo intento con el mismo id y otras direcciones.
    let second = addrs(&env);
    env.mock_auths(&[MockAuth {
        address: &registrar,
        invoke: &MockAuthInvoke {
            contract: &t.registry_id,
            fn_name: "register_cooperative",
            args: (
                coop.clone(),
                second.0.clone(),
                second.1.clone(),
                second.2.clone(),
            )
                .into_val(&env),
            sub_invokes: &[],
        },
    }]);
    let result = t
        .registry
        .try_register_cooperative(&coop, &second.0, &second.1, &second.2);
    assert_eq!(result, Err(Ok(RegistryError::AlreadyRegistered)));

    // La entrada original queda intacta y el contador no cambia.
    let entry = t.registry.get_cooperative(&coop).unwrap();
    assert_eq!(entry.token, first.0);
    assert_eq!(t.registry.get_cooperative_count(), 1);
}

#[test]
fn test_empty_cooperative_id_is_rejected() {
    let env = Env::default();
    let t = deploy(&env);
    let registrar = Address::generate(&env);
    set_registrar_as_admin(&env, &t, &registrar);

    let empty = id(&env, "");
    let a = addrs(&env);
    env.mock_auths(&[MockAuth {
        address: &registrar,
        invoke: &MockAuthInvoke {
            contract: &t.registry_id,
            fn_name: "register_cooperative",
            args: (empty.clone(), a.0.clone(), a.1.clone(), a.2.clone()).into_val(&env),
            sub_invokes: &[],
        },
    }]);
    let result = t
        .registry
        .try_register_cooperative(&empty, &a.0, &a.1, &a.2);
    assert_eq!(result, Err(Ok(RegistryError::EmptyCooperativeId)));
    assert_eq!(t.registry.get_cooperative_count(), 0);
}

// ============================================================================
// Control de acceso
// ============================================================================

#[test]
fn test_register_fails_when_registrar_not_set() {
    let env = Env::default();
    env.mock_all_auths();
    let t = deploy(&env);

    let a = addrs(&env);
    let result = t
        .registry
        .try_register_cooperative(&id(&env, "coop-a"), &a.0, &a.1, &a.2);
    assert_eq!(result, Err(Ok(RegistryError::RegistrarNotSet)));
}

#[test]
fn test_register_rejects_unauthorized_caller() {
    let env = Env::default();
    let t = deploy(&env);
    let registrar = Address::generate(&env);
    set_registrar_as_admin(&env, &t, &registrar);

    // Un atacante firma su propia llamada: el registry exige la firma del
    // registrar, no la de quien llama.
    let attacker = Address::generate(&env);
    let coop = id(&env, "coop-robada");
    let a = addrs(&env);
    env.mock_auths(&[MockAuth {
        address: &attacker,
        invoke: &MockAuthInvoke {
            contract: &t.registry_id,
            fn_name: "register_cooperative",
            args: (coop.clone(), a.0.clone(), a.1.clone(), a.2.clone()).into_val(&env),
            sub_invokes: &[],
        },
    }]);
    let result = t.registry.try_register_cooperative(&coop, &a.0, &a.1, &a.2);
    assert!(result.is_err(), "un no-registrar no debe poder registrar");

    assert_eq!(t.registry.get_cooperative(&coop), None);
    assert_eq!(t.registry.get_cooperative_count(), 0);
}

#[test]
fn test_register_rejects_call_without_any_auth() {
    let env = Env::default();
    let t = deploy(&env);
    let registrar = Address::generate(&env);
    set_registrar_as_admin(&env, &t, &registrar);

    // Sin ninguna firma mockeada.
    env.mock_auths(&[]);
    let a = addrs(&env);
    let result = t
        .registry
        .try_register_cooperative(&id(&env, "coop-a"), &a.0, &a.1, &a.2);
    assert!(result.is_err());
    assert_eq!(t.registry.get_cooperative_count(), 0);
}

#[test]
fn test_set_registrar_requires_admin() {
    let env = Env::default();
    let t = deploy(&env);

    let not_admin = Address::generate(&env);
    let registrar = Address::generate(&env);
    env.mock_auths(&[MockAuth {
        address: &not_admin,
        invoke: &MockAuthInvoke {
            contract: &t.registry_id,
            fn_name: "set_registrar",
            args: (registrar.clone(),).into_val(&env),
            sub_invokes: &[],
        },
    }]);
    assert!(t.registry.try_set_registrar(&registrar).is_err());
    assert_eq!(t.registry.get_registrar(), None);

    // Y sin ninguna firma tampoco.
    env.mock_auths(&[]);
    assert!(t.registry.try_set_registrar(&registrar).is_err());
    assert_eq!(t.registry.get_registrar(), None);
}

#[test]
fn test_remove_registrar_requires_admin() {
    let env = Env::default();
    let t = deploy(&env);
    let registrar = Address::generate(&env);
    set_registrar_as_admin(&env, &t, &registrar);

    let not_admin = Address::generate(&env);
    env.mock_auths(&[MockAuth {
        address: &not_admin,
        invoke: &MockAuthInvoke {
            contract: &t.registry_id,
            fn_name: "remove_registrar",
            args: ().into_val(&env),
            sub_invokes: &[],
        },
    }]);
    assert!(t.registry.try_remove_registrar().is_err());
    assert_eq!(t.registry.get_registrar(), Some(registrar));
}

#[test]
fn test_remove_registrar_blocks_registration() {
    let env = Env::default();
    let t = deploy(&env);
    let registrar = Address::generate(&env);
    set_registrar_as_admin(&env, &t, &registrar);
    register_as(&env, &t, &registrar, &id(&env, "coop-a"), &addrs(&env));

    env.mock_auths(&[MockAuth {
        address: &t.admin,
        invoke: &MockAuthInvoke {
            contract: &t.registry_id,
            fn_name: "remove_registrar",
            args: ().into_val(&env),
            sub_invokes: &[],
        },
    }]);
    t.registry.remove_registrar();
    assert_eq!(t.registry.get_registrar(), None);

    // Ya no se puede registrar, ni siquiera el ex-registrar firmando...
    env.mock_all_auths();
    let a = addrs(&env);
    let result = t
        .registry
        .try_register_cooperative(&id(&env, "coop-b"), &a.0, &a.1, &a.2);
    assert_eq!(result, Err(Ok(RegistryError::RegistrarNotSet)));

    // ...pero lo ya registrado sigue consultable.
    assert!(t.registry.get_cooperative(&id(&env, "coop-a")).is_some());
    assert_eq!(t.registry.get_cooperative_count(), 1);
}

#[test]
fn test_rotating_registrar_revokes_the_old_one() {
    let env = Env::default();
    let t = deploy(&env);
    let old = Address::generate(&env);
    let new = Address::generate(&env);
    set_registrar_as_admin(&env, &t, &old);
    set_registrar_as_admin(&env, &t, &new);
    assert_eq!(t.registry.get_registrar(), Some(new.clone()));

    // El registrar anterior ya no puede registrar.
    let coop = id(&env, "coop-a");
    let a = addrs(&env);
    env.mock_auths(&[MockAuth {
        address: &old,
        invoke: &MockAuthInvoke {
            contract: &t.registry_id,
            fn_name: "register_cooperative",
            args: (coop.clone(), a.0.clone(), a.1.clone(), a.2.clone()).into_val(&env),
            sub_invokes: &[],
        },
    }]);
    assert!(t
        .registry
        .try_register_cooperative(&coop, &a.0, &a.1, &a.2)
        .is_err());

    // El nuevo sí.
    register_as(&env, &t, &new, &coop, &a);
    assert!(t.registry.get_cooperative(&coop).is_some());
}

// ============================================================================
// Listado y paginación
// ============================================================================

fn register_many(env: &Env, t: &TestEnv, registrar: &Address, n: u32) -> Vec<String> {
    let mut ids: Vec<String> = Vec::new(env);
    env.mock_all_auths();
    for i in 0..n {
        let mut buf = [0u8; 16];
        let name = fmt_coop_name(i, &mut buf);
        let coop = String::from_str(env, name);
        let a = addrs(env);
        t.registry.register_cooperative(&coop, &a.0, &a.1, &a.2);
        ids.push_back(coop);
    }
    let _ = registrar;
    ids
}

/// "coop-<i>" sin `format!` (el crate es no_std).
fn fmt_coop_name(i: u32, buf: &mut [u8; 16]) -> &str {
    let prefix = b"coop-";
    buf[..prefix.len()].copy_from_slice(prefix);
    let mut digits = [0u8; 10];
    let mut n = i;
    let mut len = 0;
    loop {
        digits[len] = b'0' + (n % 10) as u8;
        len += 1;
        n /= 10;
        if n == 0 {
            break;
        }
    }
    let mut pos = prefix.len();
    for d in (0..len).rev() {
        buf[pos] = digits[d];
        pos += 1;
    }
    core::str::from_utf8(&buf[..pos]).unwrap()
}

#[test]
fn test_list_is_empty_when_nothing_registered() {
    let env = Env::default();
    let t = deploy(&env);
    assert_eq!(t.registry.list_cooperatives(&0, &10).len(), 0);
}

#[test]
fn test_list_pagination_walks_all_cooperatives_in_order() {
    let env = Env::default();
    let t = deploy(&env);
    let registrar = Address::generate(&env);
    set_registrar_as_admin(&env, &t, &registrar);
    let ids = register_many(&env, &t, &registrar, 5);
    assert_eq!(t.registry.get_cooperative_count(), 5);

    let page1 = t.registry.list_cooperatives(&0, &2);
    let page2 = t.registry.list_cooperatives(&2, &2);
    let page3 = t.registry.list_cooperatives(&4, &2);
    assert_eq!(page1.len(), 2);
    assert_eq!(page2.len(), 2);
    assert_eq!(page3.len(), 1);

    // Orden de registro y sin duplicados entre páginas.
    let mut seen: Vec<String> = Vec::new(&env);
    for page in [page1, page2, page3] {
        for item in page.iter() {
            seen.push_back(item.cooperative_id);
        }
    }
    assert_eq!(seen, ids);
}

#[test]
fn test_list_items_match_get_cooperative() {
    let env = Env::default();
    let t = deploy(&env);
    let registrar = Address::generate(&env);
    set_registrar_as_admin(&env, &t, &registrar);
    register_many(&env, &t, &registrar, 3);

    for item in t.registry.list_cooperatives(&0, &10).iter() {
        assert_eq!(
            t.registry.get_cooperative(&item.cooperative_id),
            Some(item.entry)
        );
    }
}

#[test]
fn test_list_edge_cases() {
    let env = Env::default();
    let t = deploy(&env);
    let registrar = Address::generate(&env);
    set_registrar_as_admin(&env, &t, &registrar);
    register_many(&env, &t, &registrar, 3);

    // limit mayor que lo que queda: devuelve el resto.
    assert_eq!(t.registry.list_cooperatives(&1, &100).len(), 2);
    // start == count y start > count: vacío.
    assert_eq!(t.registry.list_cooperatives(&3, &10).len(), 0);
    assert_eq!(t.registry.list_cooperatives(&99, &10).len(), 0);
    // limit 0: vacío.
    assert_eq!(t.registry.list_cooperatives(&0, &0).len(), 0);
    // start + limit desbordaría u32: no hace panic.
    assert_eq!(t.registry.list_cooperatives(&u32::MAX, &u32::MAX).len(), 0);
}

#[test]
fn test_list_page_size_is_capped() {
    let env = Env::default();
    let t = deploy(&env);
    let registrar = Address::generate(&env);
    set_registrar_as_admin(&env, &t, &registrar);
    register_many(&env, &t, &registrar, MAX_PAGE_SIZE + 5);

    let page = t.registry.list_cooperatives(&0, &u32::MAX);
    assert_eq!(page.len(), MAX_PAGE_SIZE);

    // El resto se obtiene avanzando `start`.
    let rest = t.registry.list_cooperatives(&MAX_PAGE_SIZE, &u32::MAX);
    assert_eq!(rest.len(), 5);
}

// ============================================================================
// Cableado contrato → registry (misma forma que cooperative_factory)
// ============================================================================

mod registry_interface {
    use soroban_sdk::{contractclient, Address, Env, String};

    /// Copia exacta de la interfaz que declara `cooperative_factory`.
    #[contractclient(name = "FactoryStyleRegistryClient")]
    #[allow(dead_code)]
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

/// Contrato que llama al registry igual que lo hace `cooperative_factory`:
/// sin parámetro `caller`, solo con su propia identidad como invocador.
#[contract]
struct FakeFactory;

#[contractimpl]
impl FakeFactory {
    pub fn deploy(
        env: Env,
        registry: Address,
        cooperative_id: String,
    ) -> (Address, Address, Address) {
        let token = Address::generate(&env);
        let dist = Address::generate(&env);
        let gov = Address::generate(&env);
        registry_interface::FactoryStyleRegistryClient::new(&env, &registry).register_cooperative(
            &cooperative_id,
            &token,
            &dist,
            &gov,
        );
        (token, dist, gov)
    }
}

#[test]
fn test_contract_registrar_can_register_without_signatures() {
    let env = Env::default();
    let t = deploy(&env);
    let factory_id = env.register(FakeFactory, ());
    let factory = FakeFactoryClient::new(&env, &factory_id);
    set_registrar_as_admin(&env, &t, &factory_id);

    // Sin ninguna auth mockeada: la autorización del contrato registrar es
    // implícita por ser el invocador directo.
    env.mock_auths(&[]);
    let coop = id(&env, "coop-via-factory");
    let (token, dist, gov) = factory.deploy(&t.registry_id, &coop);

    let entry = t.registry.get_cooperative(&coop).unwrap();
    assert_eq!(entry.token, token);
    assert_eq!(entry.distribution, dist);
    assert_eq!(entry.governance, gov);
}

#[test]
fn test_contract_that_is_not_registrar_cannot_register() {
    let env = Env::default();
    let t = deploy(&env);
    let approved_id = env.register(FakeFactory, ());
    let rogue_id = env.register(FakeFactory, ());
    let rogue = FakeFactoryClient::new(&env, &rogue_id);
    set_registrar_as_admin(&env, &t, &approved_id);

    env.mock_auths(&[]);
    let coop = id(&env, "coop-rogue");
    let result = rogue.try_deploy(&t.registry_id, &coop);
    assert!(
        result.is_err(),
        "un contrato no aprobado no debe poder registrar"
    );
    assert_eq!(t.registry.get_cooperative(&coop), None);
    assert_eq!(t.registry.get_cooperative_count(), 0);
}

#[test]
fn test_contract_registrar_cannot_overwrite_existing_id() {
    let env = Env::default();
    let t = deploy(&env);
    let factory_id = env.register(FakeFactory, ());
    let factory = FakeFactoryClient::new(&env, &factory_id);
    set_registrar_as_admin(&env, &t, &factory_id);

    env.mock_auths(&[]);
    let coop = id(&env, "coop-dup");
    let (token, _, _) = factory.deploy(&t.registry_id, &coop);
    assert!(factory.try_deploy(&t.registry_id, &coop).is_err());
    assert_eq!(t.registry.get_cooperative(&coop).unwrap().token, token);
}

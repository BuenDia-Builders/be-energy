#![no_std]

//! # Cooperative Registry
//!
//! Directorio on-chain de cooperativas. Guarda, por `cooperative_id`, las
//! direcciones de los tres contratos que forman una cooperativa
//! (`energy_token`, `energy_distribution`, `community_governance`).
//!
//! Implementa la interfaz que `cooperative_factory` ya consume
//! (`registry_interface::CooperativeRegistryTrait`, issue #169):
//!
//! ```text
//! register_cooperative(cooperative_id, token_contract, distribution_contract, governance_contract)
//! get_cooperative(cooperative_id) -> Option<RegistryEntry>
//! ```
//!
//! y agrega control de acceso y paginación (ver más abajo).
//!
//! ## Control de acceso
//!
//! `register_cooperative` **no** es de acceso libre. El admin del registry
//! designa un único *registrar* (normalmente la dirección de la
//! `cooperative_factory` desplegada) con `set_registrar`, y cada registro exige
//! la autorización de esa dirección.
//!
//! La interfaz de la factory no recibe un parámetro `caller`, así que Soroban
//! solo puede autenticar a una dirección conocida de antemano: por eso hay un
//! único registrar a la vez en lugar de una lista (con una lista habría que
//! exigir `require_auth` a todas, o a ninguna). Para migrar a una nueva factory,
//! el admin llama `set_registrar` con la nueva dirección (o `remove_registrar`
//! para pausar los registros). Cuando el registrar es un contrato, su
//! autorización es implícita al invocar al registry directamente.
//!
//! ## Orden de despliegue
//!
//! La factory necesita la dirección del registry en su constructor, así que el
//! registrar se configura después:
//!
//! ```text
//! 1. desplegar cooperative_registry(admin)
//! 2. desplegar cooperative_factory(admin, registry)
//! 3. registry.set_registrar(factory)          # requiere auth del admin
//! ```
//!
//! ## Almacenamiento
//!
//! Las cooperativas viven en storage *persistent* (una entrada por cooperativa
//! más un índice `posición -> cooperative_id`), no en instance storage, para que
//! el costo de cada invocación no crezca con el número de cooperativas.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env, String, Symbol, Vec,
};
use stellar_access::access_control;

// Constantes de TTL
const INSTANCE_TTL_THRESHOLD: u32 = 50_000;
const INSTANCE_TTL_EXTEND_TO: u32 = 100_000;
const PERSISTENT_TTL_THRESHOLD: u32 = 50_000;
const PERSISTENT_TTL_EXTEND_TO: u32 = 200_000;

/// Máximo de cooperativas que devuelve `list_cooperatives` por página.
pub const MAX_PAGE_SIZE: u32 = 50;

// Claves de almacenamiento
#[contracttype]
pub enum DataKey {
    /// Dirección autorizada a llamar `register_cooperative` (instance).
    Registrar,
    /// Cantidad de cooperativas registradas (instance).
    Count,
    /// Índice: posición -> cooperative_id (persistent).
    IdAt(u32),
    /// cooperative_id -> RegistryEntry (persistent).
    Cooperative(String),
}

/// Direcciones de los contratos de una cooperativa.
///
/// Mismos campos que el `MockRegistry` de los tests de `cooperative_factory`.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct RegistryEntry {
    pub token: Address,
    pub distribution: Address,
    pub governance: Address,
}

/// Elemento de `list_cooperatives`: la entrada junto con su identificador.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct CooperativeListing {
    pub cooperative_id: String,
    pub entry: RegistryEntry,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RegistryError {
    /// El admin todavía no configuró un registrar con `set_registrar`.
    RegistrarNotSet = 1,
    /// Ya existe una cooperativa registrada con ese `cooperative_id`.
    AlreadyRegistered = 2,
    /// El `cooperative_id` está vacío.
    EmptyCooperativeId = 3,
    /// El contador de cooperativas se desbordaría.
    CounterOverflow = 4,
}

#[contract]
pub struct CooperativeRegistry;

#[contractimpl]
impl CooperativeRegistry {
    /// Inicializa el registry.
    ///
    /// # Argumentos
    /// * `admin` - Única cuenta autorizada para llamar `set_registrar` y
    ///             `remove_registrar`.
    pub fn __constructor(env: &Env, admin: Address) {
        access_control::set_admin(env, &admin);
        env.storage().instance().set(&DataKey::Count, &0u32);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);
    }

    // ============================================================================
    // Configuración de admin
    // ============================================================================

    /// Designa la dirección autorizada a registrar cooperativas (normalmente la
    /// `cooperative_factory`). Reemplaza al registrar anterior, si había.
    ///
    /// Solo el admin del registry puede llamar esta función.
    pub fn set_registrar(env: Env, registrar: Address) {
        let admin = access_control::get_admin(&env).expect("admin no configurado");
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::Registrar, &registrar);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);

        env.events()
            .publish((Symbol::new(&env, "registrar_set"),), registrar);
    }

    /// Revoca al registrar actual: mientras no se configure otro, ningún
    /// registro es posible. Las cooperativas ya registradas no se ven afectadas.
    ///
    /// Solo el admin del registry puede llamar esta función.
    pub fn remove_registrar(env: Env) {
        let admin = access_control::get_admin(&env).expect("admin no configurado");
        admin.require_auth();

        env.storage().instance().remove(&DataKey::Registrar);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);

        env.events()
            .publish((Symbol::new(&env, "registrar_removed"),), ());
    }

    // ============================================================================
    // Registro
    // ============================================================================

    /// Registra una cooperativa. Interfaz consumida por `cooperative_factory`.
    ///
    /// Requiere la autorización del registrar configurado. Falla si el
    /// `cooperative_id` ya está registrado: las entradas son inmutables.
    pub fn register_cooperative(
        env: Env,
        cooperative_id: String,
        token_contract: Address,
        distribution_contract: Address,
        governance_contract: Address,
    ) -> Result<(), RegistryError> {
        let registrar: Address = env
            .storage()
            .instance()
            .get(&DataKey::Registrar)
            .ok_or(RegistryError::RegistrarNotSet)?;
        registrar.require_auth();

        if cooperative_id.is_empty() {
            return Err(RegistryError::EmptyCooperativeId);
        }

        let key = DataKey::Cooperative(cooperative_id.clone());
        if env.storage().persistent().has(&key) {
            return Err(RegistryError::AlreadyRegistered);
        }

        let count: u32 = env.storage().instance().get(&DataKey::Count).unwrap_or(0);
        let next_count = count.checked_add(1).ok_or(RegistryError::CounterOverflow)?;

        let entry = RegistryEntry {
            token: token_contract.clone(),
            distribution: distribution_contract.clone(),
            governance: governance_contract.clone(),
        };

        env.storage().persistent().set(&key, &entry);
        Self::extend_persistent(&env, &key);

        let index_key = DataKey::IdAt(count);
        env.storage().persistent().set(&index_key, &cooperative_id);
        Self::extend_persistent(&env, &index_key);

        env.storage().instance().set(&DataKey::Count, &next_count);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);

        env.events().publish(
            (Symbol::new(&env, "coop_registered"),),
            (
                cooperative_id,
                token_contract,
                distribution_contract,
                governance_contract,
            ),
        );

        Ok(())
    }

    // ============================================================================
    // Funciones de consulta
    // ============================================================================

    /// Retorna la entrada de una cooperativa, o `None` si no está registrada.
    pub fn get_cooperative(env: Env, cooperative_id: String) -> Option<RegistryEntry> {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);

        let key = DataKey::Cooperative(cooperative_id);
        let entry: Option<RegistryEntry> = env.storage().persistent().get(&key);
        if entry.is_some() {
            Self::extend_persistent(&env, &key);
        }
        entry
    }

    /// Cantidad total de cooperativas registradas.
    pub fn get_cooperative_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);
        env.storage().instance().get(&DataKey::Count).unwrap_or(0)
    }

    /// Lista cooperativas en orden de registro (la más antigua primero).
    ///
    /// # Argumentos
    /// * `start` - Posición (base 0) de la primera cooperativa a devolver.
    /// * `limit` - Máximo de elementos; se limita a `MAX_PAGE_SIZE`.
    ///
    /// Si `start` está fuera de rango o `limit` es 0 devuelve un vector vacío.
    /// Para paginar, avanzar `start` en `limit` hasta recibir menos de `limit`
    /// elementos (o hasta `start >= get_cooperative_count()`).
    pub fn list_cooperatives(env: Env, start: u32, limit: u32) -> Vec<CooperativeListing> {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);

        let count: u32 = env.storage().instance().get(&DataKey::Count).unwrap_or(0);
        let limit = limit.min(MAX_PAGE_SIZE);
        let end = start.saturating_add(limit).min(count);

        let mut page: Vec<CooperativeListing> = Vec::new(&env);
        let mut i = start;
        while i < end {
            let index_key = DataKey::IdAt(i);
            let cooperative_id: String = env
                .storage()
                .persistent()
                .get(&index_key)
                .expect("índice inconsistente");
            Self::extend_persistent(&env, &index_key);

            let key = DataKey::Cooperative(cooperative_id.clone());
            let entry: RegistryEntry = env
                .storage()
                .persistent()
                .get(&key)
                .expect("entrada inconsistente");
            Self::extend_persistent(&env, &key);

            page.push_back(CooperativeListing {
                cooperative_id,
                entry,
            });
            i += 1;
        }
        page
    }

    /// Retorna el admin del registry.
    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);
        access_control::get_admin(&env).expect("admin no configurado")
    }

    /// Retorna el registrar actual, o `None` si no hay ninguno configurado.
    pub fn get_registrar(env: Env) -> Option<Address> {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);
        env.storage().instance().get(&DataKey::Registrar)
    }

    // Helper privado: renueva el TTL de una entrada persistent.
    fn extend_persistent(env: &Env, key: &DataKey) {
        env.storage().persistent().extend_ttl(
            key,
            PERSISTENT_TTL_THRESHOLD,
            PERSISTENT_TTL_EXTEND_TO,
        );
    }
}

#[cfg(test)]
mod test;

# 5. Soroban Contracts Reference

> BeEnergy v0.3.0

## Contratos actuales

3 contratos en `apps/contracts/`, compilados a WASM, desplegados en Stellar Testnet.

| Contrato | Propósito | OZ Libraries | Tests |
|----------|-----------|-------------|-------|
| `energy_token` | Token SEP-41 (1 token = 1 kWh) + Pausable + Upgradeable | stellar-tokens, stellar-access, stellar-macros, stellar-contract-utils | 36 |
| `energy_distribution` | Distribución proporcional + registro de lecturas + Pausable + Upgradeable | stellar-access, stellar-macros, stellar-contract-utils | 18 |
| `community_governance` | Propuestas (skeleton, sin votación) | Ninguna | 11 |

**65 tests, todos pasando.** `cd apps/contracts && cargo test`

**Dependencias:** soroban-sdk 23.1.0, OpenZeppelin stellar-contracts v0.5.1, Rust 1.89.0, target wasm32v1-none.

Hay un 4º y un 5º contrato, `cooperative_factory` (22 tests más) y `cooperative_registry` (21 tests más), implementados pero no desplegados a Testnet ni integrados en el frontend — ver sección 4.

---

## 1. Energy Token

Token fungible SEP-41. Cada cooperativa tiene su propia instancia con nombre y símbolo propios. Incluye Pausable (freno de emergencia) y Upgradeable (actualización sin redeploy).

### Funciones

| Función | Auth | Guard | Descripción |
|---------|------|-------|-------------|
| `__constructor(admin, distribution_contract, name, symbol, cooperative_id)` | Deploy | — | Configura metadata, grants MINTER role a distribution_contract |
| `mint_energy(to, amount, minter)` | MINTER | `when_not_paused` | Mintea cuando la cooperativa valida una lectura |
| `burn_energy(from, amount)` | Holder | `when_not_paused` | Quema (retiro de certificado) |
| `grant_minter(new_minter)` | Admin | `when_not_paused` | Agrega minter |
| `revoke_minter(minter)` | Admin | `when_not_paused` | Revoca minter |
| `transfer(from, to, amount)` | SEP-41 | `when_not_paused` | Transferencia estándar |
| `transfer_from(spender, from, to, amount)` | SEP-41 | `when_not_paused` | Transferencia delegada |
| `burn(from, amount)` | SEP-41 | `when_not_paused` | Quema estándar |
| `burn_from(spender, from, amount)` | SEP-41 | `when_not_paused` | Quema delegada |
| `approve(owner, spender, amount, live_until_ledger)` | SEP-41 | — | Aprobación estándar |
| `total_supply()` | Público | — | Supply total |
| `balance(account)` | Público | — | Balance de cuenta |
| `allowance(owner, spender)` | Público | — | Allowance |
| `decimals()` | Público | — | Decimales (7) |
| `name()` | Público | — | Nombre del token |
| `symbol()` | Público | — | Símbolo del token |
| `is_minter(address)` | Público | — | Check rol minter |
| `admin()` | Público | — | Dirección del admin |
| `cooperative_id()` | Público | — | ID de la cooperativa |

### Pausable

| Función | Auth | Descripción |
|---------|------|-------------|
| `paused()` | Público | Retorna `true` si el contrato está pausado |
| `pause(caller)` | Admin | Pausa el contrato — bloquea operaciones state-changing |
| `unpause(caller)` | Admin | Despausa el contrato |

### Upgradeable

| Función | Auth | Descripción |
|---------|------|-------------|
| `upgrade(new_wasm_hash, operator)` | Admin | Actualiza el WASM del contrato |

---

## 2. Energy Distribution

Gestiona miembros de la cooperativa, valida lecturas y distribuye certificados proporcionalmente. Incluye Pausable y Upgradeable.

### Funciones

| Función | Auth | Guard | Descripción |
|---------|------|-------|-------------|
| `__constructor(admin, token_contract, cooperative_id, required_approvals)` | Deploy | — | Setup inicial |
| `add_members_multisig(approvers, members, percents)` | Multi-sig | `when_not_paused` | Registra miembros con % de participación |
| `record_generation(kwh_generated)` | Admin | `when_not_paused` | Valida lectura + mintea proporcional a cada miembro |
| `is_member(address)` | Público | — | Check membresía |
| `get_member_percent(address)` | Público | — | % de participación |
| `get_total_generated()` | Público | — | kWh totales generados |
| `get_admin()` | Público | — | Dirección del admin |

### Pausable

| Función | Auth | Descripción |
|---------|------|-------------|
| `paused()` | Público | Retorna `true` si el contrato está pausado |
| `pause(caller)` | Admin | Pausa el contrato |
| `unpause(caller)` | Admin | Despausa el contrato |

### Upgradeable

| Función | Auth | Descripción |
|---------|------|-------------|
| `upgrade(new_wasm_hash, operator)` | Admin | Actualiza el WASM del contrato |

---

## 3. Community Governance

Skeleton para gobernanza cooperativa. Solo crea propuestas, no tiene votación todavía.

| Función | Auth | Descripción |
|---------|------|-------------|
| `initialize(admin)` | Admin | Setup |
| `create_proposal(proposer, title)` | Autenticado | Crea propuesta |
| `get_proposal(id)` | Público | Lee propuesta |

**Cambios planificados:**
- Agregar `vote(proposal_id, voter, in_favor)`
- Agregar quorum y finalización
- Integrar con distribution (solo miembros votan)

---

## 4. Cooperative Factory

**Implementado y testeado (22 tests), pero no desplegado a Testnet ni integrado en el frontend.** No confundir con "futuro" — el código ya existe en `apps/contracts/cooperative_factory/src/lib.rs`.

Despliega `energy_token` + `energy_distribution` + `community_governance` de una cooperativa en una única transacción atómica, y los registra en el `CooperativeRegistry` (#169).

### Por qué existe

Desplegar los 3 contratos a mano por cooperativa es lento y propenso a error (hay que pasar la dirección de distribution al constructor del token para el rol minter, y viceversa). La factory resuelve esto con un bootstrap de direcciones determinísticas: calcula la dirección de `energy_distribution` *antes* de desplegarla (`deployer().deployed_address()`), y se la pasa directo al constructor del token — sin ciclos de grant/revoke de permisos después del deploy.

### Gobernanza de WASM

Los hashes WASM de los 3 contratos hijos no se reciben como argumento de `deploy_cooperative` — eso permitiría a un admin malicioso de la factory desplegar WASM arbitrario. En cambio, se fijan una sola vez vía `set_wasm_hashes(token_wasm, distribution_wasm, governance_wasm)`, restringido al admin de la factory.

### Funciones

| Función | Auth | Descripción |
|---------|------|-------------|
| `__constructor(admin, registry)` | Deploy | Guarda el admin y la dirección del `CooperativeRegistry` |
| `set_wasm_hashes(token_wasm, distribution_wasm, governance_wasm)` | Admin | Fija los 3 hashes WASM aprobados (una sola vez, antes del primer deploy) |
| `deploy_cooperative(cooperative_id, admin, token_name, token_symbol, initial_members, required_approvals)` | Admin | Despliega los 3 contratos, siembra miembros iniciales (opcional) y registra la cooperativa |
| `get_admin()` | Público | Admin de la factory |
| `get_registry()` | Público | Dirección del `CooperativeRegistry` configurado |
| `get_wasm_hashes()` | Público | Los 3 hashes WASM actuales |

### Reglas de `deploy_cooperative`

- `required_approvals` debe ser ≥ 1
- `initial_members` solo se puede sembrar si `required_approvals == 1` (cooperativas multi-firma agregan miembros después, vía `add_members_multisig`)
- Máximo 50 `initial_members` por deploy
- Los porcentajes de `initial_members` deben sumar exactamente 100 (con suma chequeada, sin overflow silencioso)
- Emite el evento `coop_deployed(cooperative_id, token_addr, dist_addr, gov_addr)`

### Tests con el registry real

Los tests históricos de la factory usan un `MockRegistry` interno (solo para tests). Además hay tests que despliegan el `cooperative_registry` real y verifican el flujo completo factory → registry: la cooperativa queda registrada con las tres direcciones, el listado las devuelve, y si la factory no fue designada como registrar el deploy completo se revierte. Estos tests, como el resto de los de la factory, requieren los WASM de los contratos hijos compilados antes (`cargo build --release --target wasm32v1-none`).

---

## 4.1 Cooperative Registry

**Implementado y testeado (21 tests), pero no desplegado a Testnet ni integrado en el frontend.** Código en `apps/contracts/cooperative_registry/src/lib.rs` (issue #169).

Directorio on-chain de cooperativas: guarda, por `cooperative_id`, las direcciones de token, distribución y gobernanza. Implementa la interfaz que `cooperative_factory` ya consume (`registry_interface::CooperativeRegistryTrait`), más listado paginado para un futuro directorio en el frontend.

### Funciones

| Función | Auth | Descripción |
|---------|------|-------------|
| `__constructor(admin)` | Deploy | Guarda el admin. Todavía no hay registrar. |
| `set_registrar(registrar)` | Admin | Designa la dirección autorizada a registrar (normalmente la factory). Reemplaza al anterior. |
| `remove_registrar()` | Admin | Revoca al registrar; sin registrar no se puede registrar nada. Lo ya registrado no se toca. |
| `register_cooperative(cooperative_id, token_contract, distribution_contract, governance_contract)` | Registrar | Registra una cooperativa. Falla si el id ya existe o está vacío. Emite `coop_registered`. |
| `get_cooperative(cooperative_id)` | Público | `Option<RegistryEntry>` |
| `get_cooperative_count()` | Público | Total de cooperativas registradas |
| `list_cooperatives(start, limit)` | Público | Página de `CooperativeListing { cooperative_id, entry }` en orden de registro. `limit` se limita a 50; `start` fuera de rango devuelve vacío. |
| `get_admin()` / `get_registrar()` | Público | Admin y registrar actuales (`get_registrar` devuelve `None` si no hay) |

```rust
pub struct RegistryEntry {
    pub token: Address,
    pub distribution: Address,
    pub governance: Address,
}
```

Mismos campos que el `MockRegistry` de la factory.

### Control de acceso

`register_cooperative` exige la autorización del **registrar** configurado por el admin. La interfaz de la factory no recibe un parámetro `caller`, así que Soroban solo puede autenticar a una dirección conocida de antemano: por eso hay **un único registrar a la vez**, no una lista. Para migrar a una nueva factory, el admin llama `set_registrar` con la nueva dirección. Cuando el registrar es un contrato (la factory), su autorización es implícita al invocar al registry directamente — no hace falta firma extra.

### Orden de despliegue

La factory necesita la dirección del registry en su constructor, así que el registrar se configura al final:

```text
1. desplegar cooperative_registry(admin)
2. desplegar cooperative_factory(admin, registry)
3. registry.set_registrar(factory)      # requiere auth del admin del registry
```

### Reglas

- Las entradas son inmutables: un `cooperative_id` ya registrado no se puede volver a registrar ni sobrescribir.
- Las cooperativas se guardan en storage *persistent* (una entrada + un índice por cooperativa), no en instance storage, para que el costo por invocación no crezca con el número de cooperativas. Cada lectura renueva el TTL de lo que lee.
- No hay metadata adicional (nombre, estado, etc.): queda para un issue futuro.

---

## 5. Tests

**65 tests, todos pasando.** `cd apps/contracts && cargo test`

| Contrato | Tests | Cobertura |
|----------|-------|-----------|
| energy_token | 36 | constructor, mint, burn, transfer, access control, pausable, upgradeable |
| energy_distribution | 18 | constructor, multisig, generation, views, pausable, upgradeable |
| community_governance | 11 | init, proposals, edge cases |

---

## 6. Testnet Deployments

| Contrato | Address |
|----------|---------|
| Token | [`CCYOVOFDJ5BVBSI6HADLWETTUF3BU423MEAWBSBWV2X5UVNKSJMRPBA6`](https://stellar.expert/explorer/testnet/contract/CCYOVOFDJ5BVBSI6HADLWETTUF3BU423MEAWBSBWV2X5UVNKSJMRPBA6) |
| Distribution | [`CBTDPLFNFGWVOD4HXDKW4EH5L3D2YGOY5CWTFCJM5TEWFL4VQTNX2UDZ`](https://stellar.expert/explorer/testnet/contract/CBTDPLFNFGWVOD4HXDKW4EH5L3D2YGOY5CWTFCJM5TEWFL4VQTNX2UDZ) |
| Governance | [`CCH2EXXNSDW2BAKBIPFAG6CCZS6LV4VJFUP2CZZCW5LEY4JOAXBJD6YI`](https://stellar.expert/explorer/testnet/contract/CCH2EXXNSDW2BAKBIPFAG6CCZS6LV4VJFUP2CZZCW5LEY4JOAXBJD6YI) |

Admin: `GCHCYTHV4JSIJNCN56EIEXZNTB6JUHYX25FTSYFOM4DDVGV7UXWOHLCW`

Constructor params:
- Token: `name="BeEnergy Piloto"`, `symbol="BEPIL"`, `cooperative_id="coop-piloto-001"`
- Distribution: `required_approvals=1`

---

## 7. Seguridad (OpenZeppelin)

Ambos contratos principales usan componentes auditados de OpenZeppelin Stellar v0.5.1:

| Componente | Qué hace |
|-----------|----------|
| **Pausable** | Freno de emergencia — admin puede pausar/despausar todas las operaciones state-changing |
| **Upgradeable** | Actualización de WASM sin redeploy — solo admin |
| **AccessControl** | Roles (admin, minter) con gestión segura |
| **`#[when_not_paused]`** | Guard macro que bloquea operaciones si el contrato está pausado |

Funciones protegidas por `when_not_paused`:
- `energy_token`: mint_energy, burn_energy, grant_minter, revoke_minter, transfer, transfer_from, burn, burn_from
- `energy_distribution`: add_members_multisig, record_generation

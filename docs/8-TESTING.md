# 8. Testing — BeEnergy

Última actualización: **2026-03-07**
Red: **Stellar Testnet**

---

## Unit Tests (API Routes)

45 tests en 10 archivos. Se ejecutan con Vitest.

```bash
cd apps/web && pnpm test
```

| Archivo | Tests | Qué valida |
|---------|-------|------------|
| `cooperatives.test.ts` | 4 | CRUD cooperativas, validación de campos |
| `members.test.ts` | 4 | CRUD miembros, deduplicación por address |
| `meters.test.ts` | 5 | CRUD medidores, filtros por cooperativa y status |
| `readings.test.ts` | 4 | Lectura individual, backward compat (kwh_injected → kwh_generated) |
| `meters-readings.test.ts` | 6 | Ingesta bulk desde medidor, validación meter activo |
| `mint.test.ts` | 6 | Mint por reading_id (legacy) y por certificate_id (nuevo) |
| `certificates.test.ts` | 3 | CRUD certificados, filtros |
| `certificates-retire.test.ts` | 5 | Retiro (burn on-chain), validación buyer_purpose |
| `certificates-stats.test.ts` | 2 | Estadísticas de certificación, CO2 evitado |
| `prosumers.test.ts` | 6 | Legacy proxy, backward compat |

---

## Integration Test — Circuito completo en Stellar Testnet

Test end-to-end que ejecuta el circuito real del producto contra Stellar Testnet.

```bash
npx tsx scripts/integration-test.ts
```

### Qué hace

| Test | Paso | Verificación |
|------|------|-------------|
| 1 | Crear 3 wallets Stellar + fondear con Friendbot | Balance 10,000 XLM |
| 2 | Crear cooperativa + agregar prosumer en Supabase | IDs válidos |
| 3 | Crear medidor + enviar 3 lecturas (38.5 kWh) | Insert OK |
| 4 | Crear certificado + **mint on-chain** (Soroban) | Tx confirmada, status → `available` |
| 5 | Retirar certificado + **burn on-chain** (Soroban) | Tx confirmada, status → `retired` |

### Última ejecución exitosa (2026-03-07)

5/5 tests passed en ~32s.

| Operación | Tx Hash | Explorer |
|-----------|---------|----------|
| **Mint** (38.5 kWh) | `6ec071c2...` | [Stellar Expert](https://stellar.expert/explorer/testnet/tx/6ec071c257f628ba8c544539c8401b47c1cd10bd54a8b4b8bb168fe4c5522070) |
| **Burn** (38.5 kWh) | `afd646aa...` | [Stellar Expert](https://stellar.expert/explorer/testnet/tx/afd646aab80f055d5fec4176772ae67825b63865e42c8aca5d290c5a04ae9218) |

Contrato: Energy Token [`CCYOVOFDJ5...`](https://stellar.expert/explorer/testnet/contract/CCYOVOFDJ5BVBSI6HADLWETTUF3BU423MEAWBSBWV2X5UVNKSJMRPBA6) (ver [5-CONTRACTS.md](5-CONTRACTS.md) para todos los contratos deployados)

### Modelo custodial

Los tokens se mintean a la address del minter (plataforma) y se queman desde la misma address al retirar. El buyer se registra en la tabla `retirements` de Supabase pero no necesita tener tokens on-chain. Esto permite que el server-side maneje todo el ciclo con una sola clave privada (MINTER_SECRET_KEY).

### Cleanup

El test limpia automáticamente los datos de Supabase al finalizar (retirements, mint_log, certificates, readings, meters, prosumers, cooperatives).

---

## Simulacro de compra — circuito de negocio completo

Simulación realista del flujo de compra de un certificado de energía renovable. Una cooperativa en Misiones genera energía, certifica, y una empresa compradora retira el certificado para su reporte ESG.

```bash
npx tsx scripts/simulate-purchase.ts
```

### Escenario

**Vendedor:** Cooperativa Solar Misiones (3 prosumers con paneles solares)
**Comprador:** GreenCorp SA (empresa que necesita certificados para reporte ESG)

### Flujo paso a paso

| Paso | Qué pasa | Quién actúa |
|------|----------|-------------|
| 1 | Crear wallets Stellar + fondear con Friendbot | Sistema |
| 2 | Registrar cooperativa + 3 prosumers (María, Juan, Ana) | Admin cooperativa |
| 3 | Instalar 3 medidores inteligentes (5 kW, 3.5 kW, 4.2 kW) | Admin cooperativa |
| 4 | 28 días de lecturas (curva solar, ~4700 lecturas, ~2100 kWh) | Medidores (automático) |
| 5 | Crear crédito de generación con el total del mes | Admin cooperativa |
| 6 | **Mint on-chain** — tokenizar el certificado en Stellar | Plataforma (minter) |
| 7 | **Compra/Retiro** — GreenCorp SA retira el certificado (burn) | Empresa compradora |

### Cómo funciona la "compra"

1. El certificado se crea con status `pending` a partir de las lecturas reales
2. Se mintean tokens en Stellar representando los kWh (`mint_energy` → status `available`)
3. La empresa compradora contacta a la cooperativa off-chain (contrato comercial, pago)
4. La plataforma ejecuta el retiro: quema los tokens on-chain (`burn_energy` → status `retired`)
5. Se crea un registro de retiro en la DB con los datos del comprador y el hash de la tx
6. La empresa puede usar el hash de la tx como prueba verificable de su compra

El pago es off-chain. Lo que queda on-chain es la prueba criptográfica de que esos kWh existieron (mint) y fueron retirados por un comprador específico (burn).

### Última ejecución (2026-03-07)

| Dato | Valor |
|------|-------|
| Cooperativa | Cooperativa Solar Misiones (Posadas) |
| Prosumers | 3 (María García, Juan Rodríguez, Ana López) |
| Medidores | 3 smart meters (5 + 3.5 + 4.2 kW) |
| Período | Febrero 2026 (28 días) |
| Lecturas | 4,704 (cada 15 min, 6:00–20:00) |
| Energía certificada | 2,102.1 kWh solar |
| CO₂ evitado | ~841 kg |
| Comprador | GreenCorp SA (ESG reporting) |
| Tiempo total | ~46s |

### Transacciones verificables en Stellar Explorer

| Operación | Tx | Explorer |
|-----------|-----|---------|
| **Mint** (2,102.1 kWh) | `09238d0f...` | [Stellar Expert](https://stellar.expert/explorer/testnet/tx/09238d0f647804fa896774524128dabcf9b226d1e310ad00830064a25dcc710a) |
| **Burn/Retiro** (2,102.1 kWh) | `aaaf99f7...` | [Stellar Expert](https://stellar.expert/explorer/testnet/tx/aaaf99f7ba60822d999de0b00d4ec0428f5849a588a80ce343722617ca270f0a) |

Contrato: Energy Token [`CCYOVOFDJ5...`](https://stellar.expert/explorer/testnet/contract/CCYOVOFDJ5BVBSI6HADLWETTUF3BU423MEAWBSBWV2X5UVNKSJMRPBA6)

### Modelo custodial

Los tokens se mintean a la address del minter (plataforma) y se queman desde la misma address al retirar. El buyer se registra en la tabla `retirements` pero no necesita tener tokens on-chain. Esto permite que el server-side maneje todo el ciclo con una sola clave privada (`MINTER_SECRET_KEY`).

---

## Smart Meter Mock

Simulador de medidores inteligentes para generar datos realistas.

```bash
# Generar 7 días de historial
COOPERATIVE_ID=<uuid> pnpm meter:mock:backfill

# Modo continuo (lectura cada 15 min)
COOPERATIVE_ID=<uuid> pnpm meter:mock
```

### Qué genera

- Curva solar gaussiana (pico a las 13:00, sigma ~3h)
- 0 kWh de noche
- Factor climático aleatorio 0.6–1.0
- Limitado por `capacity_kw` de cada medidor
- Envía a `POST /api/meters/readings` (bulk)

---

## Cómo correr los tests

### Unit tests

```bash
cd apps/web && pnpm test
```

### Contract tests (Soroban)

```bash
cd apps/contracts && cargo test
```

### Integration test (Stellar Testnet)

```bash
npx tsx scripts/integration-test.ts
```

### Simulacro de compra (Stellar Testnet)

```bash
npx tsx scripts/simulate-purchase.ts
```

Ambos requieren `apps/web/.env.local` con las variables de Stellar y Supabase configuradas.

### Setup DB (primera vez o migración)

```bash
npx tsx scripts/setup-db.ts
```

Requiere `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en `apps/web/.env.local`, y la función `exec_sql` creada en Supabase (ver script para detalle).

---

## Tablas en Supabase

| Tabla | Descripción |
|-------|-------------|
| `cooperatives` | Registro de cooperativas |
| `prosumers` | Miembros (legacy: prosumers, migrado con cooperative_id y role) |
| `meters` | Medidores/dispositivos por cooperativa |
| `readings` | Lecturas de generación (individual y bulk) |
| `certificates` | Créditos de generación renovable (tabla hoy modelada como "certificates"; ver `docs/audit/features.md`) |
| `retirements` | Retiros de certificados — flujo a reinterpretar, ya no hay comprador externo (Pivot #2) |
| `mint_log` | Log de transacciones on-chain (mint) |

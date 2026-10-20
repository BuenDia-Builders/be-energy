# 4. BeEnergy — Arquitectura

> v0.3.0 · Modelo cooperativo · Stellar Testnet
> Documento técnico (medidor → API → Soroban → dashboard) — no cambia con el Pivot #2 (ver `memory/product-research.md`). Lo que cambió es a quién se le asigna el crédito minteado (a los miembros, no a un comprador externo), no el pipeline de datos en sí.
>
> **Nota (audit DFNS):** ver sección "Auth & Wallet (custodial vs non-custodial)" más abajo para el estado de la ruta DFNS / `server_keypair`. Estado en prod: **no verificado** por un maintainer (ver esa sección).

---

## System Architecture

```
┌──────────────┐
│  Medidor     │  Hardware del usuario-generador
│  inteligente │  Registra kWh generados
└──────┬───────┘
       │ dato de lectura (kWh, timestamp, meter_id)
       │
       │ Testnet: simulador de medidor envía lecturas vía API
       │ Mainnet: medidor inteligente real envía automáticamente
       ▼
┌──────────────┐
│  Cooperativa │  Admin con acceso al dashboard
│  (admin)     │  Valida y gestiona la operación
└──────┬───────┘
       │ POST /api/readings  →  POST /api/mint
       ▼
┌──────────────────────────────────────────────────┐
│  Backend BeEnergy (Next.js API Routes)           │
│                                                  │
│  /api/cooperatives  → Supabase (gestión coops)   │
│  /api/members       → Supabase (miembros)        │
│  /api/meters        → Supabase (medidores)       │
│  /api/readings      → Supabase (INSERT lectura)  │
│  /api/meters/readings → Bulk ingestion           │
│  /api/mint          → Soroban (mint_energy)      │
│  /api/certificates  → Supabase (proto-certs)     │
│  /api/certificates/retire → Soroban (burn)       │
│  /api/certificates/stats  → Estadísticas         │
│                                                  │
│  Supabase: cooperativas, medidores, lecturas,    │
│            certificados, retiros, logs           │
│  Soroban RPC: transacciones on-chain             │
└──────────────────┬───────────────────────────────┘
                   │ simulateTransaction → sendTransaction
                   ▼
┌──────────────────────────────────────────────────┐
│  Stellar Network (Soroban)                       │
│                                                  │
│  energy_token         mint / burn / balance      │
│  energy_distribution  registro + distribución    │
│  community_governance propuestas                 │
│                                                  │
│  Inmutable. Auditable. ~0.00001 XLM por tx.      │
└──────────────────┬───────────────────────────────┘
                   │ balance, historial
                   ▼
┌──────────────────────────────────────────────────┐
│  Dashboard (Next.js + React)                     │
│                                                  │
│  Vista cooperativa: medidores, lecturas,         │
│    miembros, certificados, estadísticas          │
│  Vista miembro: generación, certificados,        │
│    historial                                     │
│                                                  │
│  Wallet: Freighter (SEP-43) para firmar txs      │
│  El usuario no necesita saber qué es blockchain  │
└──────────────────────────────────────────────────┘
```

---

## Integración con medidores

La infraestructura de medición remota ya existe en Argentina. BeEnergy no instala hardware — se conecta a lo que la cooperativa ya tiene o va a tener (plazo regulatorio: diciembre 2028).

### Fuentes de datos

```
Opción A: Inversor solar (API REST del fabricante)
┌──────────────┐     ┌─────────────────────────────┐
│  Inversor    │────▶│  API del fabricante          │
│  Fronius /   │     │                             │
│  Huawei /    │     │  Fronius: Solar API (JSON)   │
│  SMA         │     │  Huawei: OpenAPI             │
└──────────────┘     │  SMA: Sunny Portal API       │
                     │                             │
                     │  Dato: kWh generados,        │
                     │  kWh inyectados, potencia    │
                     │  Frecuencia: cada 1 min      │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                          POST /api/meters/readings

Opción B: Medidor bidireccional (vía sistema HES de la cooperativa)
┌──────────────┐     ┌─────────────────────────────┐
│  Medidor     │────▶│  HES / MDM cooperativa      │
│  bidireccional│     │                             │
│  (DLMS/COSEM)│     │  Protocolo: IEC 62056       │
│              │     │  Lectura cada 15 min         │
└──────────────┘     │  Energía activa/reactiva     │
                     │  Import + export (OBIS)      │
                     │                             │
                     │  Ej: DISCAR Mr.DiMS          │
                     │  (Justiniano Posse, Vicuña   │
                     │   Mackenna - Córdoba)         │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                          POST /api/meters/readings
```

### Qué cambia de Testnet a Mainnet

| Componente | Testnet (hoy) | Mainnet |
|------------|--------------|---------|
| Fuente de datos | Simulador de medidor (`smart-meter-mock.ts`) genera lecturas realistas vía API | Medidor real (HES/MDM) o inversor (Fronius/Huawei/SMA) envía datos reales |
| Endpoint | `POST /api/meters/readings` (bulk) | Mismo endpoint, múltiples fuentes |
| Validación | Admin revisa y aprueba | Auto-validación con reglas + revisión por excepción |
| Frecuencia | Cada 15 min (simulada) | Cada 15 min (medidor) o 1 min (inversor) |
| Red | Stellar Testnet | Stellar Mainnet |

> **No hay carga manual ni CSV.** Los datos siempre entran vía API, ya sea desde el simulador (testnet) o desde hardware real (mainnet).

No se necesita hardware nuevo. La cooperativa ya tiene medidores bidireccionales (obligatorios para generación distribuida) y muchas ya tienen lectura remota.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Blockchain | Stellar Testnet → Mainnet |
| Smart contracts | Soroban (Rust), soroban-sdk 23.1.0, OpenZeppelin v0.5.1 |
| Frontend | Next.js 16, React 19, Tailwind v4, shadcn/ui |
| Wallet | Stellar Wallets Kit (Freighter, SEP-43) |
| Backend | Next.js API Routes |
| Base de datos | Supabase (cooperativas, medidores, lecturas, certificados, retiros) |
| Deploy | Vercel (main branch) |

---

## Monorepo

```
be-energy/
├── apps/
│   ├── web/                          # Next.js 16 (@be-energy/web)
│   │   ├── app/
│   │   │   ├── dashboard/            # Dashboard cooperativa + miembro
│   │   │   ├── admin/                # Panel admin cooperativa
│   │   │   └── api/                  # API Routes
│   │   │       ├── cooperatives/     # Gestión cooperativas
│   │   │       ├── members/          # Gestión miembros
│   │   │       ├── meters/           # Medidores + bulk readings
│   │   │       ├── readings/         # Lecturas individuales
│   │   │       ├── mint/             # Mint on-chain
│   │   │       ├── certificates/     # Proto-certificados + retire + stats
│   │   │       └── defindex/         # DeFindex yield (intacto)
│   │   ├── components/ui/            # shadcn/ui
│   │   ├── hooks/                    # Contract hooks
│   │   ├── lib/                      # Contexts, config, supabase, types
│   │   └── __tests__/                # Vitest API tests
│   │
│   └── contracts/                    # Soroban (Rust)
│       ├── energy_token/             # Token SEP-41 por cooperativa
│       ├── energy_distribution/      # Distribución proporcional
│       └── community_governance/     # Propuestas (WIP)
│
├── packages/
│   └── stellar/                      # Shared wallet & config
│
├── scripts/
│   ├── setup-db.ts                   # Schema DB (migration-safe)
│   ├── smart-meter-mock.ts           # Simulador de medidores
│   └── simulate-testnet.ts           # Simulación testnet (legacy)
│
├── docs/                             # Documentación
└── vercel.json                       # Deploy config
```

---

## Contratos Soroban

```
┌─────────────────────────┐
│  Cooperative Factory     │  ← Fase 2
│  Despliega por coop     │
└────────────┬────────────┘
             │ deploy
             ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  Energy Token            │     │  Cooperative Registry    │  ← Fase 2
│  SEP-41 (1 token = 1kWh)│◄────│  Directorio de coops    │
└────────────▲────────────┘     └─────────────────────────┘
             │
             │ mint_energy()
             │
┌────────────┴────────────┐
│  Energy Distribution     │
│  Distribución + lecturas │
└─────────────────────────┘

┌─────────────────────────┐
│  Community Governance    │  ← Fase 3
│  Votación (WIP)          │
└─────────────────────────┘
```

**Detalle de contratos:** ver `docs/5-CONTRACTS.md`

---

## API Routes

| Route | Method | Descripción |
|-------|--------|-------------|
| `/api/cooperatives` | GET, POST | Listar/registrar cooperativas |
| `/api/members` | GET, POST | Listar/registrar miembros |
| `/api/meters` | GET, POST | Listar/registrar medidores |
| `/api/readings` | POST | Cargar lectura individual (legacy + nuevo) |
| `/api/meters/readings` | POST | Ingesta bulk desde medidor |
| `/api/mint` | POST | Mintear proto-certificado on-chain (lectura o certificado) |
| `/api/certificates` | GET, POST | Listar/crear certificados |
| `/api/certificates/[id]` | GET | Detalle con proveniencia + Stellar Expert link |
| `/api/certificates/retire` | POST | Retirar certificado (burn on-chain) |
| `/api/certificates/stats` | GET | Estadísticas de certificación |
| `/api/prosumers` | GET, POST | Legacy proxy → members |

---

## Client Hooks

| Hook | Contrato | Funciones |
|------|----------|-----------|
| `useEnergyToken` | energy_token | `getBalance`, `transfer`, `mintEnergy`, `burnEnergy`, `checkIsMinter` |
| `useEnergyDistribution` | energy_distribution | `getMemberInfo`, `getTotalGenerated`, `getMemberList`, `recordGeneration` |

---

## Shared Package: @be-energy/stellar

| Módulo | Qué hace |
|--------|----------|
| `stellar-config.ts` | Endpoints RPC/Horizon, network passphrase |
| `wallet.ts` | Conexión wallet (Freighter), balance queries |
| `storage.ts` | localStorage tipado para wallet state |

---

## Auth & Wallet (custodial vs non-custodial)

La UI usa exclusivamente la wallet **non-custodial** (Stellar Wallets Kit / Freighter, SEP-43) vía `lib/wallet-context.tsx`. Ningún componente de UI importa ni referencia DFNS.

Existe, sin embargo, un segundo camino **custodial** en el repo:

- `apps/web/lib/dfns.ts`
- `apps/web/app/auth/callback/**`
- `apps/web/app/api/auth/email/verify`

Este camino usa DFNS (con un fallback a `server_keypair`) y **no es invocado por ningún flujo de UI**. El audit (`docs/audit/features.md`, tabla "Auth & Wallet") lo dejó marcado como "unknown — still configured in prod?".

### Estado en producción

> **Pendiente de verificación por un maintainer.** El autor de este audit no tiene acceso al panel de Vercel para confirmar si las env vars de DFNS (`DFNS_*`) están seteadas en el environment de producción. Hasta que un maintainer lo confirme, el estado se considera **no verificado**.

**Respuesta al audit:** no se pudo verificar si DFNS está live en producción (sin acceso a Vercel env vars). No se asume ninguno de los dos estados. Ver "Trigger path" para las dos ramas posibles.

### Trigger path

- Si DFNS **no** está configurado en prod: este código está **dormant** (muerto en la práctica) y el camino efectivamente ejercitado es el fallback `server_keypair`. Los archivos llevan un comentario `DORMANT` en su cabecera indicándolo.
- Si DFNS **sí** está configurado en prod: como no hay UI que lo llame, debe existir un trigger no-UI (job, cron, integración externa, script). Ese trigger debe documentarse en esta sección una vez identificado por un maintainer.

**Búsqueda de trigger no-UI en el repo:** no se encontró ningún cron, job, script ni integración externa que invoque `lib/dfns.ts` ni las rutas `app/auth/callback/**` / `api/auth/email/verify`. Si DFNS está configurado en prod, el trigger es externo al repo y debe ser identificado por un maintainer.

**No eliminar ni deshabilitar este código en este issue.** La remoción (si corresponde) es un follow-up separado.

---

## Environment Variables

### Públicas (client-side)

| Variable | Propósito |
|----------|----------|
| `NEXT_PUBLIC_STELLAR_NETWORK` | TESTNET / PUBLIC |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | Soroban RPC endpoint |
| `NEXT_PUBLIC_STELLAR_HORIZON_URL` | Horizon API endpoint |
| `NEXT_PUBLIC_ENERGY_TOKEN_CONTRACT` | Address del token |
| `NEXT_PUBLIC_ENERGY_DISTRIBUTION_CONTRACT` | Address de distribución |

### Secretas (server-side)

| Variable | Propósito |
|----------|----------|
| `MINTER_SECRET_KEY` | Clave del minter para firmar mints server-side |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key |
| `DFNS_*` (custodial) | **Estado no verificado en prod.** Usado solo por `lib/dfns.ts` + `app/auth/callback/**` + `api/auth/email/verify`. Sin trigger desde la UI. Ver "Auth & Wallet" arriba. |

---

## Deploy

| | |
|---|---|
| **Plataforma** | Vercel |
| **Build** | `pnpm turbo build --filter=@be-energy/web` |
| **Output** | `apps/web/.next` |
| **Branch** | `main` |
| **Workflow** | `develop` → PR → `main` |

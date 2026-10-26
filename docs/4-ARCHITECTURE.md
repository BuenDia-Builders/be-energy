# 4. BeEnergy — Arquitectura

> v0.3.0 · Modelo cooperativo · Stellar Testnet
> Documento técnico (medidor → API → Soroban → dashboard) — no cambia con el Pivot #2 (ver `memory/product-research.md`). Lo que cambió es a quién se le asigna el crédito minteado (a los miembros, no a un comprador externo), no el pipeline de datos en sí.

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

## Email Authentication

**Static status: LIVE.** A caller sends `POST /api/auth/email/send` with an email; the route calls Supabase `signInWithOtp` with `shouldCreateUser: true` and sets `emailRedirectTo` to `{Origin}/auth/callback` (fallbacks: `NEXT_PUBLIC_APP_URL`, then `http://localhost:3000`). The repo contains no first-party caller, Supabase project config, or email template. Therefore, the actual email's first-hop URL is unknown: a `ConfirmationURL` template would first use Supabase's hosted verification endpoint, while a `TokenHash` template could link directly to the app. The deployed redirect allow-list is also unverified. The configured app destination is `/auth/callback`, not `/api/auth/email/verify`.

The callback accepts either a `code` (exchange for session) or `token_hash` plus `type` (verify OTP), creates the app session cookie, and redirects to `/dashboard`; invalid or missing parameters return to `/login` with an error. `/api/auth/email/verify` is a separate POST endpoint expecting `{email, token}` and is not the callback used by the email link. See `apps/web/app/api/auth/email/send/route.ts:22-27`, `apps/web/app/auth/callback/route.ts:9-42,98-99`, and `apps/web/app/api/auth/email/verify/route.ts:10-27,109`.

**Manual email test: NOT PERFORMED** (no real email access in this investigation). For a human-run test: (1) in a configured test deployment, submit a test email to `POST /api/auth/email/send` (this creates the user if needed); (2) inspect the received message's actual link and record its full URL; (3) click it; (4) record the final URL, visible result, session-cookie result, and whether the user reaches `/dashboard`.

Human results: link URL = `[FILL IN]`; final URL/result = `[FILL IN]`; session and dashboard result = `[FILL IN]`.

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

---

## Deploy

| | |
|---|---|
| **Plataforma** | Vercel |
| **Build** | `pnpm turbo build --filter=@be-energy/web` |
| **Output** | `apps/web/.next` |
| **Branch** | `main` |
| **Workflow** | `develop` → PR → `main` |

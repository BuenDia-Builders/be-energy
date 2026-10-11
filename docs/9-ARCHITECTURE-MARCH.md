# 9. BeEnergy — Arquitectura para el Equipo

> Actualización 16 de marzo 2026 — **Modelo de negocio superado por el Pivot #2 (octubre 2026), ver `memory/product-research.md`. El resto de este documento (arquitectura técnica) sigue siendo válido.**
> v0.4.0 · Stellar Testnet

---

## 1. Modelo de Negocio

```
┌─────────────────────────────────────────────────────────────┐
│                    BEENERGY — INGRESOS                      │
│                                                             │
│  ┌─────────────────────┐    ┌────────────────────────────┐  │
│  │  1. SaaS mensual    │    │  2. Fee de gestión al      │  │
│  │                     │    │     generador/cooperativa  │  │
│  │  Starter  $300-500  │    │                            │  │
│  │  Pro    $1000-1500  │    │  Por el servicio de        │  │
│  │  Enterprise Custom  │    │  asignación de créditos,   │  │
│  │                     │    │  facturación y liquidación │  │
│  │  Paga: cooperativa  │    │  (modelo Exa Energia)      │  │
│  └─────────────────────┘    └────────────────────────────┘  │
│                                                             │
│  Cooperativa recibe:                                        │
│  - Dashboard de gestión (SaaS)                              │
│  - Registro on-chain de créditos de generación compartida   │
│  - Reparto transparente y auditable entre sus miembros      │
└─────────────────────────────────────────────────────────────┘
```

Ninguna fuente de ingreso depende de vender certificados a un comprador externo (ESG, fondo climático, etc.) — ese modelo se descartó. Ver `docs/research/exa-energia.md`.

---

## 2. Qué construimos nosotras vs. qué ya existe

```
┌─────────────────────────────────────────────────────────────┐
│                  LO QUE CONSTRUIMOS NOSOTRAS                │
│                                                             │
│  ┌───────────────────┐  ┌───────────────────┐               │
│  │  Dashboard Web    │  │  API Backend      │               │
│  │  Next.js 16       │  │  Next.js Routes   │               │
│  │  React 19         │  │  13 endpoints     │               │
│  │  Tailwind v4      │  │                   │               │
│  │  shadcn/ui        │  │  Lógica de:       │               │
│  │                   │  │  - Cooperativas   │               │
│  │  Vistas:          │  │  - Miembros       │               │
│  │  - Miembro        │  │  - Medidores      │               │
│  │  - Admin coop     │  │  - Lecturas       │               │
│  │  - Super admin    │  │  - Certificados   │               │
│  │  - Landing        │  │  - Mint/Burn      │               │
│  └───────────────────┘  └───────────────────┘               │
│                                                             │
│  ┌───────────────────┐  ┌───────────────────┐               │
│  │  Smart Contracts  │  │  Simulador        │               │
│  │  Soroban (Rust)   │  │  Medidor          │               │
│  │                   │  │                   │               │
│  │  energy_token     │  │  smart-meter-mock │               │
│  │  energy_distrib.  │  │  Genera lecturas  │               │
│  │  governance (WIP) │  │  realistas vía    │               │
│  │                   │  │  API (testnet)    │               │
│  │  65 tests         │  │                   │               │
│  │  OZ v0.5.1        │  │                   │               │
│  └───────────────────┘  └───────────────────┘               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    LO QUE YA EXISTE                          │
│            (infraestructura que usamos, no creamos)          │
│                                                             │
│  ┌───────────────────┐  ┌───────────────────┐               │
│  │  Stellar Network  │  │  Supabase         │               │
│  │                   │  │                   │               │
│  │  Blockchain       │  │  Base de datos    │               │
│  │  Soroban VM       │  │  Auth             │               │
│  │  Horizon API      │  │  Storage          │               │
│  │  SEP-41 estándar  │  │                   │               │
│  │  ~$0.00001/tx     │  │  Tablas:          │               │
│  │  5 seg finality   │  │  cooperatives     │               │
│  └───────────────────┘  │  members          │               │
│                         │  meters           │               │
│  ┌───────────────────┐  │  readings         │               │
│  │  Vercel           │  │  certificates     │               │
│  │                   │  │  retirements      │               │
│  │  Deploy desde     │  └───────────────────┘               │
│  │  main branch      │                                      │
│  └───────────────────┘  ┌───────────────────┐               │
│                         │  Freighter Wallet  │               │
│  ┌───────────────────┐  │                   │               │
│  │  OpenZeppelin     │  │  Wallet del       │               │
│  │  Stellar v0.5.1   │  │  usuario para     │               │
│  │                   │  │  firmar txs       │               │
│  │  Librerías de     │  │  SEP-43           │               │
│  │  contratos        │  └───────────────────┘               │
│  └───────────────────┘                                      │
│                                                             │
│  ┌───────────────────┐                                      │
│  │  Medidores reales │  Hardware de la cooperativa          │
│  │  (mainnet)        │  Inversores Fronius/Huawei/SMA       │
│  │                   │  Medidores bidireccionales DLMS      │
│  │  Ya existen, no   │  Sistemas HES/MDM                   │
│  │  los instalamos   │                                      │
│  └───────────────────┘                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Usuarios del sistema

```
┌─────────────────────┐
│  ADMIN COOP         │  Administrador de la cooperativa
│                     │
│  Qué hace:          │
│  - Registra la cooperativa
│  - Alta de miembros y medidores
│  - Revisa y valida lecturas
│  - Mintea créditos de generación
│  - Ve estadísticas de generación
│  - Gestiona todo desde el dashboard
│                     │
│  Vista: /dashboard/cooperative
└─────────────────────┘

┌─────────────────────┐
│  MIEMBRO            │  Participante de la cooperativa
│                     │
│  Qué hace:          │  (prosumer, copropietario, o mixto)
│  - Ve su generación personal
│  - Ve sus certificados
│  - Ve historial de actividad
│  - Carga lecturas (si tiene medidor propio)
│  - Conecta wallet para recibir tokens
│                     │
│  Vista: /dashboard
└─────────────────────┘

┌─────────────────────┐
│  SUPER ADMIN        │  Nosotras (BeEnergy)
│                     │
│  Qué hace:          │
│  - Ve todas las cooperativas
│  - Estadísticas globales
│  - Pipeline de certificados
│  - Monitoreo del sistema
│                     │
│  Vista: /dashboard/admin
└─────────────────────┘
```

---

## 4. Flujo de usuario: Admin Cooperativa

```
    ┌──────────────┐
    │  Conectar    │
    │  Wallet      │
    │  (Freighter) │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  Crear       │
    │  perfil      │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  Registrar   │  POST /api/cooperatives
    │  cooperativa │  Nombre, tecnología, ubicación
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  Agregar     │  POST /api/members
    │  miembros    │  Address Stellar de cada miembro
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  Registrar   │  POST /api/meters
    │  medidores   │  Tipo, tecnología, capacidad kW
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────────────────────────┐
    │  Lecturas llegan                         │
    │                                          │
    │  Testnet: simulador envía cada 15 min    │
    │  Mainnet: medidor real envía por API     │
    │                                          │
    │  POST /api/meters/readings (bulk)        │
    │  POST /api/readings (individual)         │
    └──────┬───────────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │  Validar     │  Admin revisa lectura en dashboard
    │  lectura     │  Confirma que el dato es correcto
    └──────┬───────┘  SIN VALIDACIÓN = NO HAY CERTIFICADO
           │
           ▼
    ┌──────────────┐
    │  Crear       │  POST /api/certificates
    │  certificado │  Período, kWh, tecnología
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  Mint        │  POST /api/mint
    │  on-chain    │  energy_token.mint_energy()
    └──────┬───────┘  1 token = 1 kWh
           │
           ▼
    ┌──────────────┐
    │  Certificado │  Disponible para venta
    │  disponible  │  Visible en dashboard
    └──────────────┘
```

---

## 5. Flujo de usuario: Miembro

```
    ┌──────────────┐
    │  Conectar    │
    │  Wallet      │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  Dashboard   │  Ve su generación personal
    │  /dashboard  │  kWh generados, pendientes,
    │              │  verificados, certificados
    └──────┬───────┘
           │
           ├─────────────────────────┐
           ▼                         ▼
    ┌──────────────┐         ┌──────────────┐
    │  Mis         │         │  Mi          │
    │  medidores   │         │  actividad   │
    │              │         │              │
    │  Tipo, kW,   │         │  Transacciones│
    │  estado      │         │  recibidas/  │
    └──────────────┘         │  enviadas    │
                             └──────────────┘
           │
           ▼
    ┌──────────────┐
    │  Cargar      │  Si tiene medidor propio
    │  lectura     │  (opcional)
    └──────────────┘
```

---

## 6. Arquitectura técnica general

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                    │
│                                                                     │
│  Next.js 16 + React 19 + Tailwind v4 + shadcn/ui                   │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ │
│  │ Landing  │ │Dashboard │ │Dashboard │ │Dashboard │ │Certificates││
│  │ /        │ │/dashboard│ │/dashboard│ │/dashboard│ │/certificates││
│  │          │ │(miembro) │ │/cooperat.│ │/admin    │ │            ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └───────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────┐                        │
│  │  Hooks                                  │                        │
│  │  useEnergyToken   useEnergyDistribution │                        │
│  │  useMyMeters      useMyReadings         │                        │
│  │  useCertificateStats  useHorizonPayments│                        │
│  └─────────────────────────────────────────┘                        │
│                                                                     │
│  ┌─────────────────────────────────────────┐                        │
│  │  Contexts                               │                        │
│  │  WalletProvider  AuthProvider  I18nProv. │                        │
│  └─────────────────────────────────────────┘                        │
│                                                                     │
│  ┌─────────────────────────────────────────┐                        │
│  │  @be-energy/stellar (shared package)    │                        │
│  │  stellar-config  wallet  storage        │                        │
│  └─────────────────────────────────────────┘                        │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API (Next.js Routes)                           │
│                                                                     │
│  /api/cooperatives    /api/members      /api/meters                 │
│  /api/readings        /api/meters/readings (bulk)                   │
│  /api/certificates    /api/certificates/retire                      │
│  /api/certificates/stats   /api/mint    /api/prosumers              │
│                                                                     │
└──────────┬───────────────────────────────────┬──────────────────────┘
           │                                   │
           ▼                                   ▼
┌─────────────────────┐             ┌─────────────────────────────────┐
│     SUPABASE        │             │     STELLAR / SOROBAN           │
│                     │             │                                 │
│  cooperatives       │             │  energy_token (SEP-41)          │
│  members            │             │    mint / burn / transfer       │
│  meters             │             │    1 token = 1 kWh              │
│  readings           │             │    Pausable + Upgradeable       │
│  certificates       │             │                                 │
│  retirements        │             │  energy_distribution            │
│                     │             │    registro miembros             │
│  Datos operativos   │             │    distribución proporcional    │
│  + metadata         │             │    Pausable + Upgradeable       │
│                     │             │                                 │
│                     │             │  community_governance (WIP)     │
│                     │             │    propuestas (sin votación)    │
│                     │             │                                 │
│                     │             │  OZ v0.5.1 · soroban-sdk 23.1  │
│                     │             │  Rust 1.89.0 · wasm32v1-none   │
└─────────────────────┘             └─────────────────────────────────┘
```

---

## 7. Ciclo de vida del crédito de generación

```
  LECTURA         VALIDACIÓN       CERTIFICADO       MINT            ASIGNACIÓN      LIQUIDACIÓN
     │                │                │               │               │               │
     ▼                ▼                ▼               ▼               ▼               ▼

  Medidor         Admin coop       Se crea el       Token           Se reparte      Respalda la
  registra   →    revisa y    →    registro     →   minteado   →    a miembros  →   factura/
  kWh             aprueba          en Supabase      on-chain        (% participación) descuento
                                                    1 tok = 1kWh                     del miembro

  Estado DB:      status:          status:          tx_hash:        member_percent: billed_at:
  pending         verified         available        0x7a8b...       30%, 20%, ...   timestamp

  ────────────────────────────────────────────────────────────────────────────────────────
  SUPABASE (datos operativos)                       STELLAR (registro inmutable)
```

---

## 8. Monorepo — Estructura

```
be-energy/
├── apps/
│   ├── web/                          Next.js 16 (@be-energy/web)
│   │   ├── app/
│   │   │   ├── page.tsx              Landing
│   │   │   ├── dashboard/            Dashboard miembro
│   │   │   │   ├── cooperative/      Dashboard admin coop
│   │   │   │   └── admin/            Super admin (nosotras)
│   │   │   ├── certificates/         Gestión certificados
│   │   │   ├── activity/             Historial transacciones
│   │   │   ├── consumption/          Historial generación
│   │   │   ├── profile/              Perfil usuario
│   │   │   └── api/                  API Routes (13 endpoints)
│   │   ├── components/               UI components
│   │   ├── hooks/                    Contract + data hooks
│   │   └── lib/                      Contexts, config, types
│   │
│   └── contracts/                    Soroban (Rust)
│       ├── energy_token/             36 tests
│       ├── energy_distribution/      18 tests
│       └── community_governance/     11 tests
│
├── packages/
│   └── stellar/                      Shared wallet & config
│
├── scripts/
│   ├── smart-meter-mock.ts           Simulador medidores
│   └── setup-db.ts                   Schema DB
│
└── docs/                             Esta documentación
```

---

## 9. Stack completo

| Capa | Tecnología |
|------|-----------|
| Blockchain | Stellar Testnet (luego Mainnet) |
| Smart contracts | Soroban (Rust), soroban-sdk 23.1.0, OZ v0.5.1 |
| Frontend | Next.js 16, React 19, Tailwind v4, shadcn/ui |
| Wallet | Stellar Wallets Kit (Freighter, SEP-43) |
| Backend | Next.js API Routes |
| Base de datos | Supabase |
| Deploy | Vercel (main branch) |
| Monorepo | Turborepo + pnpm workspaces |
| i18n | Custom React Context (es/en) |

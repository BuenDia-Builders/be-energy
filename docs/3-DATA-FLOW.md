# 3. BeEnergy — Data Flow

> Cuando te pierdas con el producto, volvé acá.
>
> **Pivot #2 (octubre 2026):** se descartó el modelo de "comprador externo" y cualquier marketplace. Ver `memory/product-research.md`.

---

## El producto en una oración

**BeEnergy es un dashboard de gestión cooperativa + infraestructura on-chain que registra energía renovable generada y la asigna proporcionalmente entre los miembros de la cooperativa, eliminando el reparto manual y haciendo auditable la liquidación de cada uno.**

---

## El flujo completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   ☀️  COOPERATIVA GENERA energía renovable                          │
│                                                                     │
│   Paneles solares producen electricidad limpia.                     │
│   La producción se mide con medidores.                              │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   📊  MEDIDOR registra kWh generados                                │
│                                                                     │
│   El medidor inteligente envía lecturas automáticamente vía API:    │
│   - POST /api/meters/readings — bulk cada 15 min (automático)       │
│   - POST /api/readings — lectura individual (manual)                │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   ✅  COOPERATIVA VALIDA la lectura                                 │
│                                                                     │
│   El admin de la cooperativa revisa el dato en el dashboard         │
│   y confirma que es correcto.                                       │
│                                                                     │
│   Sin validación, no hay certificado. La cooperativa es la          │
│   autoridad sobre sus datos de generación.                          │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   🪙  SE MINTEA EL CRÉDITO DE GENERACIÓN on-chain                    │
│                                                                     │
│   1 token = 1 kWh de generación renovable verificada                │
│   El token es SEP-41 (estándar Stellar)                             │
│   Cada cooperativa tiene su propio token con nombre propio          │
│                                                                     │
│   Contrato: energy_distribution.record_generation(kwh_generated)    │
│   → mintea en energy_token, proporcional a cada miembro             │
│   Blockchain: Stellar / Soroban                                     │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   👥  SE ASIGNA A LOS MIEMBROS según su % de participación           │
│                                                                     │
│   No hay comprador externo en este flujo. El crédito se reparte     │
│   dentro de la cooperativa, entre quienes generan o copropietarizan │
│   el activo. Cada miembro ve su balance en el dashboard.            │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   🧾  SE REFLEJA EN LA FACTURACIÓN/LIQUIDACIÓN del miembro           │
│                                                                     │
│   El crédito asignado respalda el descuento o liquidación que       │
│   recibe cada miembro, de forma auditable.                          │
│                                                                     │
│   Todo queda registrado en blockchain = auditable por el propio     │
│   miembro. TX hash público en Stellar Explorer.                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ¿Quién es quién?

```
┌──────────────────────┐     ┌──────────────────────┐
│  COOPERATIVA         │     │  MIEMBROS            │
│  (nuestro cliente)   │────▶│  (participantes)     │
│                      │     │                      │
│  • Genera energía    │     │  • Generan energía   │
│  • Carga lecturas    │     │    (si son prosumers)│
│  • Valida datos      │     │  • Reciben créditos  │
│  • Ve analytics      │     │    proporcionales    │
│  • Gestiona miembros │     │  • Ven su generación │
│  • Paga fee a        │     │  • Dashboard propio  │
│    BeEnergy por el   │     │  • Ven su liquidación│
│    servicio          │     │    respaldada on-chain│
└──────────┬───────────┘     └──────────────────────┘
           │
           │  usa
           ▼
┌──────────────────────────────────────────────────────┐
│                                                      │
│   BEENERGY (nosotros)                                │
│                                                      │
│   Infraestructura de certificación                   │
│                                                      │
│   ┌────────────┐  ┌────────────┐  ┌───────────────┐ │
│   │  Dashboard  │  │  API       │  │  Contratos    │ │
│   │  Next.js    │  │  Routes    │  │  Soroban      │ │
│   └──────┬─────┘  └──────┬─────┘  └───────┬───────┘ │
│          │               │                 │         │
│          └───────────────┼─────────────────┘         │
│                          │                           │
└──────────────────────────┼───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                                                      │
│   STELLAR NETWORK                                    │
│                                                      │
│   • Token SEP-41 por cooperativa                     │
│   • Smart contracts Soroban                          │
│   • Registro inmutable y auditable                   │
│   • Fees: ~0.00001 XLM por transacción               │
│                                                      │
│   La blockchain es infraestructura invisible.         │
│   El miembro ve su balance y su liquidación.         │
│   Solo está ahí para que todo sea verificable.       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Ciclo de vida del token

```
MINT                          ASIGNACIÓN                    LIQUIDACIÓN
  │                             │                             │
  ▼                             ▼                             ▼
Cooperativa genera         El contrato de              El crédito asignado
kWh renovables →           distribución reparte         respalda la
se mintean créditos        proporcionalmente a           liquidación/
on-chain                   cada miembro según            descuento en la
                           su % de participación         factura del miembro
```

---

## Cuando me pierda, recuerdo esto

1. **El token es un crédito de generación** — registro verificable de generación renovable asignada a un miembro, no un certificado vendible a terceros.
2. **1 token = 1 kWh generado.** Siempre. Sin excepción.
3. **No hay comprador externo.** El crédito se reparte entre los miembros de la cooperativa, no se vende a una empresa ESG ni a un fondo climático.
4. **No es P2P entre miembros** — los miembros no intercambian tokens entre ellos; la asignación la hace el contrato de distribución según participación.
5. **No es un marketplace.** Se descartó junto con el modelo de comprador externo (Pivot #2).
6. **Miembros = participantes de la cooperativa.** Tres modelos posibles (prosumers, copropietarios, mixto).
7. **Blockchain es invisible.** Está para trazabilidad y auditoría, no para que nadie la vea.
8. **Crédito de generación ≠ REC formal.** No es el objetivo de corto plazo convertirlo en uno.
9. **Cooperativa valida SIEMPRE.** Sin validación de la cooperativa, no hay mint. La cooperativa es la autoridad sobre sus datos.

---
## Estados del crédito de generación

Un crédito pasa por estos estados:
```
GENERADO          VALIDADO           MINTEADO          ASIGNADO           LIQUIDADO
   │                 │                  │                   │                │
   ▼                 ▼                  ▼                   ▼                ▼
Medidor          Cooperativa        Blockchain         Se reparte       Respalda la
registra  →      valida     →      emite token  →     a miembros  →    liquidación/
kWh              lectura            on-chain           (% participación) factura

Estado DB:       is_validated:      tx_hash:          member_percent:  billed_at:
pending          true               0x7a8b...         30%, 20%, ...    timestamp
```


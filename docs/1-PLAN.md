# 1. BeEnergy — Plan de Producto

## ¿Qué es?

> **Pivot #2 (octubre 2026):** se descartó el modelo de "proto-certificado vendido a un comprador externo (ESG)" y cualquier marketplace. Ver `memory/product-research.md` para el detalle completo.

Software de gestión de créditos de generación compartida para cooperativas eléctricas argentinas, con registro on-chain (Stellar) como capa de trazabilidad interna — no como producto vendible a terceros. Una cooperativa registra su generación, y el sistema asigna los créditos entre sus miembros/consumidores asociados según su % de participación. Referencia de modelo: Exa Energia (Brasil) — ver `docs/research/exa-energia.md`.

## ¿Cómo gana plata BeEnergy?

Dos fuentes de ingresos, ninguna depende de vender certificados a un tercero externo:

1. **Suscripción SaaS** — por el dashboard de gestión cooperativa
2. **Fee de gestión a la cooperativa/generador** — por el servicio de asignación de créditos, facturación y liquidación (modelo Exa: fee al generador, no al consumidor final)

| Plan | Precio orientativo | Incluye |
|------|-------------------|---------|
| Starter | $300-500 USD/mes | Hasta 50 miembros, dashboard básico, 1 admin |
| Pro | $1,000-1,500 USD/mes | Hasta 500 miembros, analytics, múltiples admins |
| Enterprise | Custom | Ilimitado, API, integración medidores, soporte dedicado |

---

## Fase 1 — 1 cooperativa piloto

**Objetivo:** Una cooperativa real gestiona su generación con BeEnergy en Testnet. Créditos de generación registrados y asignados a miembros on-chain.

**Contratos Soroban:**
- `energy_token` — SEP-41 parametrizable (nombre, símbolo, cooperative_id). 1 token = 1 kWh. Pausable + Upgradeable
- `energy_distribution` — Distribución proporcional por miembro, multisig. Pausable + Upgradeable
- `community_governance` — Propuestas (skeleton, votación WIP)

**API:**
- `POST /api/cooperatives` — Registrar cooperativa
- `POST /api/members` — Registrar miembro de cooperativa
- `POST /api/meters` — Registrar medidor
- `POST /api/readings` — Cargar lectura individual
- `POST /api/meters/readings` — Ingesta bulk desde medidor
- `POST /api/mint` — Validar lectura o certificado → mintear on-chain
- `POST /api/certificates` — Crear proto-certificado
- `POST /api/certificates/retire` — Retirar certificado (burn on-chain)
- `GET /api/certificates/stats` — Estadísticas de certificación

**Dashboard:**
- Vista cooperativa (admin): medidores, lecturas, miembros, certificados, estadísticas
- Vista miembro: generación personal, certificados, historial
- Login con wallet Stellar

**Ingesta de datos (Fase 1):**
El medidor inteligente envía lecturas automáticamente vía API (`POST /api/meters/readings`). Se incluye un smart meter mock que simula datos realistas con curva solar.

**Flujo:**
```
Medidor inteligente registra kWh → Envía datos vía API → Se valida →
Se mintea el crédito de generación on-chain → Se asigna proporcionalmente
a los miembros según su % de participación → Se refleja en su facturación/liquidación
```

---

## Fase 2 — Medidores inteligentes + multi-cooperativa

**Objetivo:** Múltiples cooperativas operan independientemente con BeEnergy. Cada cooperativa gestiona sus propios miembros y certificados (intra-cooperativa). Ingesta automática de medidores.

**Contratos nuevos:**
- `cooperative_factory` — Despliega token + distribution + governance en 1 tx
- `cooperative_registry` — Directorio de cooperativas y sus contratos

**Cambios:**
- Ingesta automática: medidores inteligentes envían datos vía API (smart meter mock disponible)
- Auto-validación con reglas + revisión por excepción
- Onboarding de cooperativa via dashboard
- Selector de cooperativa en el frontend

---

## Fase 3 — Governance + analytics

**Contratos:**
- `community_governance` completo: `vote()`, quorum, finalización

**Frontend:**
- Propuestas y votación
- Analytics: generación por período, ranking, proyecciones
- Reportes exportables, alertas

---

## Fase 4 — Inter-cooperativa

> Requiere evolución regulatoria + consulta legal previa.

**Contrato nuevo:**
- `cooperative_swap` — Burn token A → mint token B, tasa bilateral

**Requisitos:**
- Dictamen legal favorable
- Al menos 2 cooperativas activas
- Acuerdo bilateral firmado

---

## Marco legal

- **Fase 1-3:** Legal bajo Ley 27.424 (intra-cooperativa). El token es un proto-certificado operativo, no un activo especulativo
- **Fase 4:** Requiere consulta legal (Decreto 450/25 abre camino)
- **PSAV:** No aplica en Fase 1-3

---

**Timeline estimado:**
Si regulador aprueba: +2-3 meses desarrollo
Si requiere autorización formal: +6-12 meses

---

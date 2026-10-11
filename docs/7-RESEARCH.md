# 7. BeEnergy — Investigación

Respaldo regulatorio y técnico de las decisiones de producto.

---

## Regulación Argentina

### Ley 27.424 — Generación Distribuida (2017)

Argentina usa **Net Billing** (Balance Neto de Facturación):
- Precio de inyección = precio mayorista MEM (PEE + PET) — igual en todo el país
- Precio de consumo = precio mayorista + VAD — varía por cooperativa
- 1 kWh inyectado vale menos que 1 kWh consumido en pesos

**Art. 12f:** Habilita transferencia de créditos entre usuarios del **mismo distribuidor**. No permite cross-distribuidor. La reglamentación está incompleta.

**Resolución 608/2023:** Introdujo "usuario-generador comunitario virtual".

**Resolución 235/2024:** Subió el límite de 2 MW a 12 MW. Creó categorías UGpe (≤3kW), UGme (3-300kW), UGma (300kW-12MW).

**Resolución 287/2025:** Prohibió cargos adicionales por estudios técnicos, peajes, respaldo.

**Decreto 450/25 (julio 2025):** Desregulación del mercado eléctrico, transición 24 meses. Podría habilitar cross-distribuidor a futuro.

### Diferencias por provincia

| Provincia | Marco | Estado |
|-----------|-------|--------|
| Córdoba | Adhesión plena + GDCV (Res. 15/2024) | Líder: 1,341 usuarios, 32.7 MW |
| Buenos Aires | Adhesión parcial + ley propia, GDC activa (Res. 17/2026) | 853 usuarios, 20.5 MW |
| Misiones | Ley propia XVI N°118, adhesión supletoria | Fuerte en biomasa |
| Santa Fe | Feed-in Tariff | Modelo diferente al nacional |
| Mendoza | Adhesión + mercado provincial a término | La más avanzada regulatoriamente |
| Santa Cruz, Formosa, Sgo. del Estero | Sin regulación | Sin marco legal |

### PSAV (CNV)

Proveedor de Servicios de Activos Virtuales. Aplica si custodiás activos de terceros, facilitás trading, o emitís tokens comerciables.

**BeEnergy Fase 1-3:** No aplica. El token es un crédito de generación operativo de la cooperativa, no un activo especulativo.

**Fase 4 (inter-cooperativa):** Requiere consulta legal previa.

---

## Competencia

### Xcapit / EPEC / Mundo Maipú (Córdoba)

Primer sistema de autoconsumo virtual comunitario en Argentina.

| | Xcapit/EPEC | BeEnergy |
|---|---|---|
| Blockchain | Polygon (Solidity) | Stellar (Soroban) |
| Tokens | 3: PUG (participación), ERI (energía), sustentabilidad (→REC) | 1 por cooperativa (simple) |
| Alcance | Solo EPEC Córdoba | Cualquier cooperativa |
| Foco | Proyecto de inversión comunitario | Gestión operativa de la cooperativa |
| Cliente | Inversores del parque solar | La cooperativa como institución |
| Socios | UTN Villa María, Globant | — |

### Estadísticas nacionales (septiembre 2025)

- 3,306 proyectos conectados
- 97.65 MW instalados (creció 92% en 2024)
- ~500 distribuidoras en Argentina (entre empresas y cooperativas)

---

## Decisiones técnicas y por qué

### 1 token por cooperativa (multi-contrato), NO multi-token

- SEP-41 es el estándar nativo de Stellar. Wallets y explorers lo soportan
- Cada cooperativa es una entidad jurídica independiente → aislamiento natural
- Si una cooperativa tiene problema, no afecta a las demás
- Factory pattern en Soroban funciona bien

### 1 token = 1 kWh (unidad física)

- Invariable. No depende de tarifa ni de provincia
- La diferencia de valor monetario entre cooperativas se resuelve en facturación, no en el token
- El precio de inyección es el mismo en todo el país (precio MEM)
- La diferencia está en el VAD (consumo), no en la inyección

### Flujo lectura → validación → mint (NO mint automático)

Basado en el patrón forward→certificate de B2E2 (EnBW, Alemania), simplificado:
- HOW-IT-WORKS dice: "la cooperativa valida y se emite el crédito de generación"
- Sin validación de la cooperativa, no hay certificado
- 3 estados: reading → mint → burn (no 5 como B2E2)

### Swap bilateral para inter-cooperativa (NO DEX)

- Tasa ~1:1 (mismo precio MEM base)
- Requiere aprobación de ambos admins
- Sin orderbook, sin AMM, sin mercado abierto
- Legal solo cuando la regulación lo permita

---

## Proyectos internacionales investigados

| Proyecto | País | Blockchain | Modelo | Qué tomamos |
|----------|------|-----------|--------|-------------|
| B2E2 (EnBW) | Alemania | Ethereum PoA | ERC-1155, forwards/certificates, Balance Authority | Patrón lectura→validación→crédito de generación |
| Power Ledger | Australia | Solana | Dual token (POWR + Sparkz) | Nada (overkill) |
| NRGCoin | Bélgica | Ethereum | 1 token = 1 kWh fijo | Concepto de paridad física invariable |
| Energy Web | Global | EW Chain | Certificados con metadata | Nada directo |
| Grid Singularity | EU | Substrate | Mercado jerárquico | Nada (muy complejo) |
| FEDECOM | EU | EW Chain | Federación de comunidades | Concepto de inter-comunidad bilateral |
| Green Energy Tracker | Académico | Ethereum | ERC-20, burn=compensar | Patrón burn para aplicar crédito |

---

## Fuentes

- [Ley 27.424 — Texto completo](https://servicios.infoleg.gob.ar/infolegInternet/anexos/305000-309999/305179/texact.htm)
- [Resolución 235/2024](https://www.boletinoficial.gob.ar/detalleAviso/primera/313240/20240903)
- [Resolución 287/2025](https://www.boletinoficial.gob.ar/detalleAviso/primera/327866/20250704)
- [Decreto 450/25 — Desregulación](https://econojournal.com.ar/2025/07/desregulacion-del-mercado-electricode-24-meses/)
- [Mundo Maipú — Tokenización energía comunitaria](https://portalsolar.com.ar/actualidad/nacionales/tokenizacion-de-energia-comunitaria-el-nuevo-modelo-impulsado-por-mundo-maipu/)
- [UTN Villa María — Acuerdo con EPEC](https://utn.edu.ar/es/articulos-slider-principal/la-utn-a-traves-de-facultad-regional-villa-maria-tokenizaran-la-energia-renovable)
- [Xcapit — EPEC Energy Tokenization](https://www.xcapit.com/en/case-studies/epec-energy-tokenization)
- [Argentina — Generación Distribuida](https://www.argentina.gob.ar/economia/energia/generacion-distribuida)
- [B2E2 — Blockchain Based Energy Ecosystem](https://github.com/B2E2/b2e2_contracts)
- [Buenos Aires — Resolución GDC 17/2026](https://www.energiaestrategica.com/buenos-aires-activa-el-mercado-de-generacion-distribuida-comunitaria-con-la-entrada-en-vigencia-de-nuevo-reglamento/)

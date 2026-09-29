# Modelo de Dominio: Generación Distribuida en Argentina

> Documento de referencia para contributors y código futuro.
> No elige P0–P4. No implementa contratos, APIs ni UI. No propone blockchain como solución.

---

## 0. Advertencia crítica

Un token de BeEnergy **no es** un I-REC, **no es** un certificado ESG, y **no constituye** una declaración de Scope 2.

En Argentina, **IRAM** es el único organismo autorizado para emitir certificados I-TRACK (E) / I-REC, y cada certificado representa 1 MWh de atributos ambientales [IRAM I-TRACK page]. El registro global es operado por Evident.

El **medidor bidireccional instalado por el Distribuidor** es el único instrumento de medición comercial bajo Ley 27.424 [Res. 314/2018, Anexo]. Las lecturas del inversor / SCADA son datos operativos y no tienen efecto comercial en la liquidación del balance neto.

Cualquier afirmación en sentido contrario — incluyendo las que hoy aparecen en `docs/2-HOW-IT-WORKS.md` y `docs/3-DATA-FLOW.md` — debe tratarse como deuda conceptual a corregir.

---

## 1. Glosario (ES ↔ EN)

| Término ES | English label | Definición breve |
|---|---|---|
| Usuario-Generador (UG) | User-Generator | Usuario de la red de distribución que genera renovables para autoconsumo e inyecta excedentes [Ley 27.424, Art. 2] |
| Usuario-Generador Individual | Individual User-Generator | Un único usuario con un equipo de generación [Res. 287/2025] |
| Usuario-Generador Comunitario | Community User-Generator | Dos o más usuarios, mismo distribuidor, administración conjunta de un equipo [Res. 287/2025] |
| Usuario-Generador Comunitario Virtual | Virtual Community User-Generator | Como el comunitario, pero con medición en tiempo real que permite balance virtual [Res. 287/2025] |
| Balance Neto de Facturación | Net billing | El valor a pagar es la diferencia entre energía demandada e inyectada, antes de impuestos [Res. 314/2018, Anexo] |
| Medidor bidireccional | Bidirectional meter | Instrumento comercial que mide demanda e inyección por separado [Ley 27.424, Art. 12] |
| Certificado de Crédito Fiscal (CCF) | Fiscal Credit Certificate | Beneficio promocional de $120.000/kW hasta $8.500.000; no transferible [Ley 27.424, Art. 8] |
| I-REC / I-TRACK (E) | International Renewable Energy Certificate | Certificado de 1 MWh de atributos ambientales, emitido por IRAM [IRAM I-TRACK page] |
| Cuotaparte | Share / Quota | Porcentaje de participación de cada usuario en un esquema comunitario [Res. 314/2018, definición incorporada por Res. 608/2023] |
| Distribuidora | Distribution company | Empresa o cooperativa responsable de la red y de la liquidación del balance neto [Ley 27.424, Art. 12] |
| Ente Regulador Jurisdiccional | Provincial regulator | Autoridad provincial que fiscaliza la distribuidora [Ley 27.424, Art. 16] |
| SCADA del inversor | Inverter SCADA | Sistema de monitoreo operativo del inversor, sin efecto comercial |
| Generación bruta | Gross generation | Total generado por el equipo antes de autoconsumo |
| Generación neta | Net surplus | `max(kwh_generated − kwh_self_consumed, 0)` |

---

## 2. Roles y entidades

Para cada entidad se responden tres preguntas:
1. **¿Quién produce el dato?**
2. **¿Quién puede validarlo?**
3. **¿Tiene efecto comercial o es solo operativo?**

---

### 2.1 Usuario-Generador Individual

**Fuente:** Res. 287/2025, Art. 1, Cap. 2(a)(1) [Res. 287/2025].

| Aspecto | Detalle |
|---|---|
| Producción del dato | Usuario / instalador provee datos técnicos (Formulario 2A); el medidor bidireccional produce datos de demanda e inyección |
| Validación | Distribuidora valida la instalación técnica y el medidor; Ente Regulador Jurisdiccional fiscaliza |
| Efecto | **Comercial** — la inyección genera crédito monetario en la factura; el autoconsumo se valoriza a tarifa de demanda |

---

### 2.2 Usuario-Generador Comunitario

**Fuente:** Res. 287/2025, Art. 1, Cap. 2(a)(2) [Res. 287/2025].

| Aspecto | Detalle |
|---|---|
| Producción del dato | Grupo de 2+ usuarios declara porcentaje de participación ante la distribuidora; distribuidora determina factibilidad de conexión. Si el equipo no está vinculado a un punto de suministro, la distribuidora determina la factibilidad del nuevo punto |
| Validación | Distribuidora valida factibilidad y porcentajes; cambios de composición requieren aviso con 30 días de antelación |
| Efecto | **Comercial** — los créditos por inyección se distribuyen según porcentaje declarado |

---

### 2.3 Usuario-Generador Comunitario Virtual

**Fuente:** Res. 287/2025, Art. 1, Cap. 2(a)(3) [Res. 287/2025].

| Aspecto | Detalle |
|---|---|
| Producción del dato | **Medición en tiempo real** de demanda e inyección total del grupo |
| Validación | Distribuidora, sobre medidores con capacidad de telemedición |
| Efecto | **Comercial** — permite distinguir inyección de autoconsumo y valorizar cada componente por separado (autoconsumo, demanda, inyección) |

**Nota del repositorio:** el contrato `energy_distribution` no implementa medición en tiempo real ni distingue las tres valorizaciones que la resolución exige para esta categoría. Ver `docs/5-CONTRACTS.md`.

---

### 2.4 Cooperativa como Distribuidora

**Fuente:** Ley 27.424, Arts. 12 y 14 [Ley 27.424]; Res. 314/2018 [Res. 314/2018].

| Aspecto | Detalle |
|---|---|
| Producción del dato | La cooperativa-distribuidora genera datos de facturación y medición; debe reflejar en factura el volumen demandado, el inyectado y los precios de cada uno |
| Validación | Ente Regulador Jurisdiccional (provincial); AFIP para aspectos fiscales [AFIP RG 5746/2025] |
| Efecto | **Comercial** — la cooperativa es responsable de la liquidación del balance neto |

---

### 2.5 Parque comunitario con cuotapartes

**Fuente:** Res. 314/2018, definición de "Contrato de Generación Eléctrica bajo Modalidad Distribuida Comunitaria" incorporada por Res. 608/2023 [Res. 608/2023].

| Aspecto | Detalle |
|---|---|
| Producción del dato | Cada participante declara su cuotaparte; el operador del parque registra generación |
| Validación | Distribuidora, al determinar factibilidad de conexión si el equipo no está vinculado a ningún punto de suministro |
| Efecto | **Comercial** — las cuotapartes determinan la distribución de créditos |

---

### 2.6 Planta de generación de propiedad cooperativa

**Fuente:** No explícitamente regulada como categoría propia en las fuentes consultadas. **Marcado como `(inferido)`.**

| Aspecto | Detalle |
|---|---|
| Producción del dato | La cooperativa como propietaria de la planta registra su generación |
| Validación | Depende de si la planta inyecta como Usuario-Generador bajo Ley 27.424 o bajo otro régimen (MEM, MATER) |
| Efecto | **Comercial**, pero el marco exacto requiere análisis adicional — ver §4 Open Questions |

---

### 2.7 Instalador / SCADA del inversor

**Fuente:** Res. 314/2018, Procedimiento de conexión (Formulario 2A) [Res. 314/2018]; ENRE [ENRE].

| Aspecto | Detalle |
|---|---|
| Producción del dato | Instalador calificado completa Formulario 2A con datos técnicos; el inversor / SCADA produce curva de generación |
| Validación | Distribuidora valida Formulario 2A; el SCADA **no** es validado como instrumento comercial |
| Efecto | **Solo operativo** — los datos de SCADA no entran en la liquidación del balance neto |

**Nota crítica:** para usuarios con potencia > 10 kW, el generador debe poner a disposición del Distribuidor la curva de carga de generación (telemedición o claves de acceso web), pero esto es para fines estadísticos y cálculo del VAD, no para liquidación comercial [Res. 314/2018, Anexo].

---

### 2.8 Medidor del Distribuidor (bidireccional)

**Fuente:** Ley 27.424, Art. 12 [Ley 27.424]; Res. 314/2018 [Res. 314/2018].

| Aspecto | Detalle |
|---|---|
| Producción del dato | La distribuidora instala y lee el medidor bidireccional |
| Validación | Distribuidora; Ente Regulador puede fiscalizar |
| Efecto | **Comercial** — es el **único instrumento** que determina la liquidación del balance neto |

---

### 2.9 Factura / crédito

**Fuente:** Ley 27.424, Art. 12 [Ley 27.424]; AFIP RG 5746/2025 [AFIP RG 5746/2025].

| Aspecto | Detalle |
|---|---|
| Producción del dato | La distribuidora genera la factura reflejando volumen demandado, volumen inyectado, precios por kWh y balance neto |
| Validación | El usuario puede disputar; el Ente Regulador revisa |
| Efecto | **Comercial** — si hay saldo positivo, configura crédito imputable a facturas siguientes; el usuario puede solicitar la retribución del saldo en un plazo no superior a 6 meses [Res. 314/2018, Anexo] |

---

### 2.10 I-REC / IRAM / Registrante / Comprador

**Fuente:** IRAM I-TRACK page [IRAM I-TRACK page]; informe de mercado [IRAM I-TRACK page].

| Aspecto | Detalle |
|---|---|
| Producción del dato | El generador registra la planta ante IRAM; IRAM valida y habilita en el registro de Evident; IRAM valida generación y emite certificados |
| Validación | IRAM como único organismo autorizado; Evident Services mantiene el registro global |
| Efecto | **Comercial, pero sistema separado de Ley 27.424.** Cada I-REC = 1 MWh de atributos ambientales. Para usar los atributos, el certificado debe ser cancelado / retirado del registro |

**Nota crítica:** los I-REC no se pueden transferir o revender después de cancelados; quedan asociados a un reclamo específico para un período de consumo determinado [IRAM I-TRACK page].

---

## 3. Distinciones críticas

### 3.1 Medición comercial vs lectura operativa del inversor

El **medidor bidireccional del Distribuidor** es el instrumento comercial bajo Ley 27.424 [Res. 314/2018, Anexo]. El inversor / SCADA produce datos operativos que pueden usarse para monitoreo y — para > 10 kW — para fines estadísticos y cálculo del VAD, pero **no para la liquidación del balance neto**.

El repositorio hoy no distingue estos dos conceptos. Ver `apps/web/app/api/readings/route.ts` y `apps/web/app/api/meters/readings/route.ts`.

### 3.2 Ley 27.424 (balance neto) vs I-REC (atributos ambientales)

Son **dos sistemas independientes**:

- **Ley 27.424:** balance neto de facturación. Crédito monetario por kWh inyectado, valorizado al precio que el distribuidor paga en el MEM [Res. 314/2018, Anexo].
- **I-REC:** certificado de atributos ambientales de 1 MWh, emitido por IRAM, registrado en Evident, cancelable para reclamos de Scope 2 [IRAM I-TRACK page].

Un Usuario-Generador bajo Ley 27.424 **no obtiene I-REC automáticamente**. Debe registrar su planta ante IRAM y seguir el proceso de emisión / cancelación.

---

## 4. Open questions

1. ¿Puede una cooperativa que actúa como distribuidora y posee su propia planta de generación acogerse simultáneamente al balance neto como Usuario-Generador y al mercado de I-REC? Las fuentes no lo aclaran explícitamente.

2. ¿Cuál es el estándar técnico exacto de "medición en tiempo real" que Res. 287/2025 exige para UG Comunitario Virtual? La resolución solo dice "medidores cuyas características tecnológicas así lo permitan" [Res. 287/2025], sin especificar protocolo ni frecuencia.

3. ¿Cómo se resuelve la titularidad de atributos ambientales cuando un Usuario-Generador bajo Ley 27.424 también registra su planta para I-REC? ¿Hay riesgo de doble conteo entre el crédito monetario del balance neto y el certificado ambiental?

4. El repositorio modela "certificates" en `apps/web/app/api/certificates/`. ¿Esos endpoints deben reinterpretarse como créditos internos de BeEnergy, o deben eliminarse en favor de una integración separada con el registro de IRAM?

5. ¿El admin de una cooperativa debe ser un prosumidor registrado? La pregunta queda abierta en `docs/next-steps/analisis-flujo-cooperativa-vs-erd.md`; el modelo legal de UG Comunitario sugiere que sí, porque los participantes son usuarios del mismo distribuidor [Res. 287/2025].

6. ¿Los tokens hoy minteados desde `kwh_generated` (ver `research/net-vs-gross-generation.md`) deben re-interpretarse a la luz de las tres categorías legales de UG? Las categorías no son equivalentes: Individual, Comunitario y Comunitario Virtual tienen distinta base de cálculo.

---


## 5. Fuentes

- **Ley 27.424 (2017)** — Régimen de Fomento a la Generación Distribuida de Energía Renovable Integrada a la Red Eléctrica Pública. https://www.argentina.gob.ar/normativa/nacional/ley-27424-271217
- **Decreto 986/2018** — Reglamentación de la Ley 27.424. https://www.argentina.gob.ar/normativa/nacional/decreto-986-2018-315667
- **Resolución 314/2018** — Normas de implementación de la Ley 27.424. https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-314-2018-315671
- **Resolución 287/2025** — Sustituye el Capítulo 2 de la Res. 314/2018 (categorías de Usuario-Generador). https://www.boletinoficial.gob.ar/
- **Resolución 608/2023** — Incorpora la definición de "Contrato de Generación Eléctrica bajo Modalidad Distribuida Comunitaria". https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-608-2023-390682
- **AFIP RG 5746/2025** — Detalle de facturación para inyección de energía. https://www.afip.gob.ar/
- **IRAM I-TRACK (E) / I-REC** — Página oficial de IRAM. https://www.iram.org.ar/servicio/itrack-irec/
- **ENRE** — Ente Nacional Regulador de la Electricidad. https://www.argentina.gob.ar/enre
- **Documentos internos citados:** `docs/2-HOW-IT-WORKS.md`, `docs/3-DATA-FLOW.md`, `docs/5-CONTRACTS.md`, `docs/next-steps/analisis-flujo-cooperativa-vs-erd.md`, `research/net-vs-gross-generation.md`.



## 6. Nota final para revisores

Este documento reemplaza conceptualmente el vocabulario de "proto-certificado", "comprador externo" y "token = atributo ambiental" usado en `docs/2-HOW-IT-WORKS.md`. Bajo el marco argentino, un token de BeEnergy es una unidad de contabilidad interna de la plataforma. El atributo ambiental transferible en Argentina se emite a través de IRAM y se registra en Evident.

Si un feature futuro necesita hacer una declaración ambiental, debe ir por IRAM — no por el contrato `energy_token`.

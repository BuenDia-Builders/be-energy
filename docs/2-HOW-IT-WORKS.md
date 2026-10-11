# 2. BeEnergy

> **Pivot #2 (octubre 2026):** se descartó el modelo de "comprador externo compra el certificado" y cualquier marketplace. Ver `memory/product-research.md`.

BeEnergy es un dashboard de gestión cooperativa + infraestructura on-chain de asignación de créditos de generación compartida. Ofrece a las cooperativas un panel para administrar su operación (miembros, medidores, lecturas, estadísticas) y registra la producción renovable on-chain en Stellar para repartir los créditos entre sus miembros de forma transparente — sin venderlos a un tercero externo.

## El problema

La generación distribuida crece en Argentina (Ley 27.424, Res. 608/2023, GDC provincial — ver `docs/7-RESEARCH.md`). Cooperativas y comunidades instalan paneles solares y generan energía renovable de forma compartida entre varios miembros. Pero repartir esa generación entre los miembros es, hoy, un problema operativo:

**Hoy:**

- El reparto de créditos de generación entre miembros se hace manualmente, en planillas, con margen de error.
- No hay un registro verificable y transparente de cuánto generó cada miembro ni cuánto le corresponde.
- La facturación/liquidación de los créditos es lenta y poco auditable para los propios miembros.
- La cooperativa no tiene una herramienta digital para esto — el modelo brasileño (Exa Energia, Nex Energy) sí la tiene, Argentina todavía no.

## ¿Qué hace BeEnergy?

BeEnergy ofrece dos cosas a las cooperativas:

1. **Dashboard de gestión** — Panel web para administrar la cooperativa: registrar miembros, medidores, ver lecturas y estadísticas de generación, gestionar la asignación de créditos.
2. **Registro on-chain** — Registra la producción renovable en Stellar (1 token = 1 kWh generado) y la asigna proporcionalmente a los miembros según su % de participación. El token es un registro interno de trazabilidad, no un producto que se vende a un tercero.

| Sin BeEnergy | Con BeEnergy |
|---|---|
| Reparto manual en planillas | Dashboard web centralizado |
| Generación sin registro verificable | Créditos on-chain auditables por cada miembro |
| Reparto opaco entre miembros | Asignación proporcional transparente, por % de participación |
| Facturación lenta y manual | Liquidación respaldada por el historial on-chain |
| Sin trazabilidad para los propios miembros | Historial completo e inmutable en Stellar |

## ¿Cómo funciona?

### 1. La cooperativa genera energía

La cooperativa o comunidad solar genera energía renovable. La producción se mide con medidores.

**Testnet (hoy):**
- Simulador de medidor (`smart-meter-mock.ts`) genera lecturas realistas vía API
- No hay carga manual ni CSV — los datos siempre entran vía API

**Mainnet:**
- Integración directa con sistemas de medición (HES/MDM)
- Integración con inversores solares (Fronius, Huawei, SMA)
- Ingesta automática continua

### 2. Se registra el crédito de generación

Contra el dato de producción validado, el sistema emite tokens:

- **1 token = 1 kWh** de generación renovable registrada por la cooperativa.
- El token es un **crédito de generación**: un registro verificable on-chain de que esa energía fue generada, y de a quién le corresponde.
- Cada cooperativa tiene su propio token con nombre y símbolo propios.

### 3. Se asigna a los miembros según su participación

El contrato de distribución reparte el crédito proporcionalmente entre los miembros asociados, según su `% de participación` configurado.

- No hay comprador externo en este flujo: el crédito se queda dentro de la cooperativa, repartido entre quienes generan o copropietarizan el activo.
- Cada miembro puede verificar on-chain cuánto le correspondió y cuándo.

### 4. Se refleja en la facturación/liquidación

El crédito asignado respalda la liquidación o descuento que recibe cada miembro en su factura, de forma auditable — en vez de un cálculo manual que nadie puede verificar.

## ¿Qué es un crédito de generación?

Un crédito de generación es un **registro verificable on-chain de que 1 kWh de energía renovable fue generado y asignado a un miembro específico**. No es un certificado ambiental vendible a terceros — es la unidad interna de reparto entre los miembros de la cooperativa.

**¿Qué es hoy?**
- Registro inmutable de generación renovable
- Verificable por cualquier miembro en Stellar
- Base de la liquidación/facturación interna de la cooperativa

**¿Qué NO es?**
- No es un REC formal, ni un certificado ESG (le falta metadata estandarizada, verificación independiente, integración con registro reconocido — ver `docs/domain-model.md`)
- No es energía física para consumir
- No es un instrumento financiero ni especulativo
- No es un producto que se vende a un comprador externo

**Camino posible a largo plazo (no es el foco actual):**
Integrarse a un estándar reconocido (I-REC, Energy Web, TIGR) sigue siendo una opción de Nivel 3 a futuro, pero no es lo que se está construyendo ni vendiendo hoy — el foco actual es la gestión interna de créditos entre miembros.

## ¿Quiénes participan?

### Cooperativa (nuestro cliente)
La cooperativa genera energía renovable y usa BeEnergy para gestionar y repartir esa producción entre sus miembros. Administra el sistema, valida datos, gestiona miembros.

### Miembros de la cooperativa
Los miembros son participantes de la cooperativa energética. Según cada cooperativa pueden ser:
- **Prosumers**: instalan paneles, generan energía, reciben créditos por su producción.
- **Copropietarios de activos compartidos**: la cooperativa instala un parque solar, los miembros son copropietarios y el reparto es por participación.
- **Modelo mixto**: combinación de ambos.

No se asume un modelo único — el sistema es flexible. No hay un rol de "comprador externo" en este modelo.

## ¿Por qué blockchain?

El registro de certificados se implementa sobre Stellar:

| Web2 (base de datos tradicional) | BeEnergy (Stellar blockchain) |
|---|---|
| Registro puede alterarse | Inmutable (nadie puede cambiar historial) |
| Solo BeEnergy puede auditar | Auditable públicamente por cualquiera |
| Requiere confiar en empresa | Verificable sin confianza (trustless) |
| Si BeEnergy cierra, datos se pierden | Historial persiste on-chain independientemente |
| Fees de intermediarios | Fees ~$0.00001 XLM por tx |
| Proceso lento (días/semanas) | Settlement instantáneo (5 segundos) |

**Ventajas técnicas Stellar:**
- **Trazabilidad**: cada mint, transferencia y retiro es verificable on-chain.
- **Inmutabilidad**: el historial no puede alterarse.
- **Transparencia**: cualquier tercero puede auditar sin depender de BeEnergy.
- **Fees bajos**: ~0.00001 XLM por transacción en Stellar.
- **Interoperabilidad**: token SEP-41, estándar de Stellar, compatible con el ecosistema.
- **Finalidad rápida**: 5 segundos por transacción

La blockchain es infraestructura invisible para el usuario final. Solo está para que todo sea verificable y auditable.

## Niveles del producto

### Nivel 1 — Registro y reparto interno (actual)
**¿Qué es?**
- Token = registro de producción renovable, repartido entre miembros según participación.
- Crédito de generación con trazabilidad on-chain.

### Nivel 2 — Verificación independiente
**¿Qué se agrega?**
- Medidores inteligentes con ingesta automática
- Oráculos para validación externa
- Metadata estandarizada (fecha, ubicación, tecnología)

### Nivel 3 — Estándar reconocido (opción a largo plazo, no el foco actual)
**Qué se agregaría, si se decide ir por ese camino:**
- Integración con I-REC, Energy Web, TIGR.
- Acceso al mercado global de RECs.

## Modelo de negocio

BeEnergy genera ingresos de dos fuentes, ninguna depende de vender certificados a un tercero externo:

1. **Suscripción SaaS** — por el dashboard de gestión cooperativa (planes Starter, Pro, Enterprise).
2. **Fee de gestión a la cooperativa/generador** — por el servicio de asignación de créditos, facturación y liquidación (modelo Exa Energia — ver `docs/research/exa-energia.md`).

## Lo que BeEnergy no es

- No es un mercado P2P de energía entre miembros.
- No es un marketplace de certificados vendidos a compradores externos (ESG, fondos climáticos, etc.) — eso se descartó en el Pivot #2.
- No es un activo cripto ni un instrumento de inversión.
- No reemplaza a la cooperativa — le da infraestructura para gestionar y repartir su generación internamente.
- No instala paneles, no maneja la red, no pone medidores.
- No es un REC formal — y hoy no es un objetivo de corto plazo serlo.

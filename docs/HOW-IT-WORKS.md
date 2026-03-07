# BeEnergy 

Es una infraestructura blockchain para que cooperativas eléctricas digitalicen, rastreen y gestionen créditos de energía solar distribuida con trazabilidad total.

## El problema

En Argentina, cooperativas eléctricas gestionan créditos solares con planillas Excel y procesos manuales. Miles de hogares instalaron paneles solares bajo la Ley 27.424, pero:

- El usuario-generador no tiene visibilidad directa de cuánto genera
- El dato existe en el medidor pero nunca llega de forma accesible
- La cooperativa concilia manualmente mes a mes sin registro auditable
- El crédito queda inmovilizado en el sistema de facturación
- No puede reasignarse aunque la ley lo contemple (Art. 12f desde 2017)

La ley permite transferir créditos entre socios del mismo distribuidor hace 8 años. Lo que falta es la herramienta operativa para ejecutarlo sin procesos manuales, con trazabilidad completa y sin depender de registros internos cerrados.

BeEnergy digitaliza esa conciliación y le da a la cooperativa un sistema auditable para gestionar créditos energéticos.

**Hoy:**

- El usuario no tiene visibilidad directa de cuánto genera.
- El dato existe en el medidor, pero rara vez se presenta de forma accesible.
- La conciliación suele depender de procesos manuales o sistemas poco integrados.
- Sin registro trazable, sin visibilidad en tiempo real.
- El crédito queda inmovilizado dentro del sistema de facturación.
- No puede reasignarse fácilmente entre usuarios aunque la normativa contemple esa posibilidad.

## Qué hace BeEnergy

BeEnergy digitaliza la gestión de créditos energéticos dentro de una cooperativa.

En otras palabras, BeEnergy funciona como el sistema operativo que registra y concilia la energía distribuida dentro de la cooperativa.

En términos prácticos, BeEnergy registra la generación distribuida, emite créditos energéticos validados por la cooperativa y concilia esos créditos con el sistema de facturación.

La cooperativa administra el sistema, valida los datos y define las reglas de operación. Los usuarios participan dentro de ese marco.

| Sin BeEnergy | Con BeEnergy |
|---|---|
| Conciliación manual por planilla | Registro automático y auditable |
| El usuario no ve cuánto genera | Dashboard con historial de generación y créditos |
| El crédito queda inmovilizado | Reasignación de créditos gestionada por la cooperativa (Art. 12f) |
| Opacidad en la distribución del excedente | Trazabilidad completa por usuario y por cooperativa |

## Cómo funciona

### 1. El dato llega

La cooperativa ya releva o administra la información de medición dentro del esquema actual de generación distribuida.

- En el piloto lo carga manualmente o por CSV — sin hardware nuevo y con una implementación inicial simple.
- En Fase 2, se integra con la infraestructura de medición existente y el dato llega automáticamente.

### 2. La cooperativa valida y se emite el crédito

Contra el dato validado, el sistema emite créditos energéticos digitales:

- **1 crédito = 1 kWh** de inyección validado por la cooperativa según la medición registrada.
- El crédito mantiene una equivalencia fija con la energía validada.
- No está diseñado como activo especulativo ni como instrumento de mercado abierto.

### 3. El usuario ve, la cooperativa opera

Desde su dashboard, el usuario puede visualizar su generación y su saldo de créditos energéticos.

La cooperativa administra la asignación y reasignación de créditos dentro del sistema según sus reglas operativas y el marco regulatorio vigente.

### 4. Se aplica en factura

El usuario receptor aplica sus créditos al consumo facturado.

La cooperativa los reconoce y los descuenta según sus reglas operativas. Todo queda registrado y es auditable.

## Por qué esto le sirve a la cooperativa

BeEnergy no reemplaza a la cooperativa. Le da una herramienta operativa para:

- Digitalizar la conciliación de créditos energéticos dentro de la red de usuarios de la cooperativa.
- Reducir procesos manuales de cálculo y aplicación en factura.
- Tener trazabilidad completa por usuario, por período y por volumen.
- Ofrecer visibilidad al usuario-generador sin cambiar la operativa existente.
- Administrar la reasignación de créditos dentro de la red de la cooperativa, conforme a la Ley 27.424.

Este tipo de enfoque ya tiene antecedentes institucionales en Argentina. En Córdoba, UTN, EPEC y Mundo Maipú trabajan en un sistema donde la energía inyectada genera tokens aplicables a facturas dentro de un esquema comunitario. BeEnergy lleva esa lógica al contexto cooperativo con una capa operativa y trazable.

## Por qué blockchain

El registro de créditos se implementa sobre Stellar, lo que permite asegurar trazabilidad e inmutabilidad del historial sin depender de un registro interno cerrado.

El historial de emisiones, transferencias y aplicaciones puede ser auditado sin depender de que BeEnergy opere como intermediario central.

La blockchain funciona como capa de registro y auditoría. El producto visible para la cooperativa es el dashboard; Stellar queda por debajo, asegurando trazabilidad e inmutabilidad.

## Fases del producto

**Fase 1 — Core (hoy)**
Dashboard cooperativo + ledger de créditos. Emisión, visualización, reasignación de créditos gestionada por la cooperativa, conciliación con factura.

**Fase 2 — Integración automática**
Conexión con la infraestructura de medición existente. El dato de inyección llega sin intervención manual.

**Fase 3 — Inteligencia operativa**
Predicción de generación, optimización de la reasignación de créditos, alertas de anomalías.

## Modelo de negocio

Suscripción SaaS para cooperativas.

La cooperativa paga por eficiencia operativa: menos trabajo manual, más trazabilidad, herramienta para cumplir con la normativa de generación distribuida.

Los números exactos dependen de la cantidad de usuarios, el volumen de generación y el perfil de cada cooperativa. El piloto validará estos supuestos.

## Lo que BeEnergy no es

- No es un mercado abierto de energía.
- No es un activo cripto ni un instrumento de inversión.
- No reemplaza a la cooperativa — la potencia operativamente.
- No instala paneles, no maneja la red, no pone medidores.

## Audiencia
Cliente principal: LA COOPERATIVA ELÉCTRICA

Perfil:
- Argentina tiene 343+ cooperativas eléctricas distribuidas (CADER)
- Gestionan créditos solares con planillas Excel o sistemas legacy
- Tienen el problema operativo HOY (conciliación manual, falta de trazabilidad)
- Tienen autoridad legal para validar medición y habilitar reasignaciones

¿Qué gana la cooperativa con BeEnergy?
✅ Digitalizar conciliación de créditos energéticos (menos trabajo manual)
✅ Trazabilidad completa por usuario, período y volumen (auditable)
✅ Ofrecer visibilidad al usuario-generador sin cambiar operativa existente
✅ Administrar reasignación de créditos según Ley 27.424 (cumplimiento normativo)
✅ Dashboard operativo para gestionar todo desde un panel único

Usuario final (indirecto):
- Usuario-generador: Ve cuánto genera, cuánto tiene en créditos, cómo se aplican
- Usuario-consumidor: Puede recibir créditos reasignados por la cooperativa

Pero el que PAGA y OPERA el sistema es la cooperativa.

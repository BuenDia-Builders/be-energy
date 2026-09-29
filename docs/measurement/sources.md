# Fuentes de medición: la misma energía, distintas lecturas

El mismo kWh puede aparecer en varios sistemas al mismo tiempo. Que dos fuentes difieran no significa que alguna esté "mal": miden cosas distintas, en momentos distintos, con propósitos distintos.

Este documento describe cada fuente, qué mide exactamente, para qué sirve y para qué **no** sirve.

---

## Tabla de fuentes

| Fuente | Qué mide | Autoridad | Frecuencia | Uso típico | No válido para |
|---|---|---|---|---|---|
| **Inversor solar** (Fronius, Huawei, SMA, etc.) | Energía CC→CA convertida en el punto del inversor. Incluye pérdidas antes del medidor de red. | Ninguna. Es un dato de monitoreo del equipo. | Cada 5–15 min vía API del fabricante | Diagnóstico del equipo, eficiencia del string, detección de fallas | Medición oficial, facturación, emisión de certificados |
| **Portal del fabricante** (SolarEdge, Fronius Solar.web, etc.) | Mismos datos del inversor, almacenados en la nube del fabricante. Puede incluir correcciones y consolidaciones del fabricante. | Ninguna. La custodia es del fabricante. | Variable; consolida lecturas del equipo | Historial del equipo, soporte técnico, comparación de performance | Medición oficial, disputas comerciales, certificación |
| **SCADA / sistema de control** | Energía y potencia en el punto de medición configurado en el SCADA (puede ser en barra, en salida de inversor, en tablero general, etc.). Depende de dónde se coloquen los sensores. | Interna a la instalación. Puede ser la fuente primaria si no hay otro medidor. | Tiempo real o cada 1–5 min | Monitoreo operativo, alarmas, despacho | Facturación con la distribuidora, liquidación CAMMESA, certificados (sin respaldo de medidor habilitado) |
| **CSV exportado** (desde portal, SCADA o medidor) | Snapshot del dato original al momento de exportar. No se actualiza si la fuente original se corrige. | Ninguna por sí sola. Hereda la autoridad del sistema origen. | Bajo demanda (exportación puntual) | Auditoría interna, respaldo, carga en otras herramientas, debug | Medición oficial (el CSV es evidencia, no la fuente canónica) |
| **Medidor bidireccional** (en el punto de conexión a la red) | Energía activa inyectada a la red y consumida de la red, en el punto de frontera con la distribuidora. Es el medidor de referencia contractual de la instalación. | Alta. Es el medidor habilitado y sellado por la distribuidora. | Cada 15 min (telemetría) o lectura mensual | Base de la facturación, créditos de excedente, referencia para certificados | Medición interna de consumo detrás del medidor (autoconsumo no pasa por aquí) |
| **Sistema de facturación de la distribuidora** | Energía neta facturada: inyección menos consumo, ajustada por los parámetros tarifarios del período. Puede incluir redondeos, correcciones de factor de potencia y períodos de facturación no calendario. | Alta para la relación contractual con la distribuidora. | Mensual (ciclo de facturación) | Pago de la boleta, control de créditos de excedente, planificación financiera | Verificar producción bruta, emisión de certificados de generación, datos CAMMESA |
| **Liquidación CAMMESA** (aplica a generadores del MEM) | Energía inyectada al sistema medida en el punto de medición del MEM, auditada por CAMMESA. Puede diferir del medidor de distribuidora porque usa otro punto de medición y otro período. | Máxima para el Mercado Eléctrico Mayorista. Fuente legal para contratos de abastecimiento. | Mensual (liquidación) con revisiones trimestrales | Cobro de contratos de energía, cumplimiento de contratos MATER/FODER, auditoría pública | Cooperativas no conectadas al MEM (aplica solo a generadores de cierta escala); no reemplaza al medidor de distribuidora para facturación local |
| **Factura / boleta** | Reflejo comercial de la liquidación de la distribuidora: monto a pagar, kWh netos, impuestos, ajustes tarifarios. No es un dato de medición primario. | Contractual y legal para el pago, pero no para auditoría técnica. | Mensual | Pago, contabilidad, reclamos comerciales | Verificar generación real, análisis de performance, emisión de certificados |

---

## Por qué dos sistemas pueden mostrar valores distintos — y ambos ser correctos

La divergencia entre fuentes es esperable y tiene causas bien definidas:

### 1. Punto de medición diferente
El inversor mide en la salida del equipo. El medidor bidireccional mide en el punto de conexión a la red. Entre ambos puntos existen pérdidas: cableado, transformadores, tableros. Un sistema puede mostrar 100 kWh y el otro 96 kWh porque están midiendo en puntos físicamente distintos.

### 2. Ventana temporal diferente
Un portal de fabricante puede acumular del día 1 al 31. La distribuidora puede facturar del día 8 al día 7 del mes siguiente. El mismo período produce totales distintos porque las ventanas no coinciden.

### 3. Convención de conteo diferente
El medidor bidireccional puede reportar solo inyección neta (inyectado menos consumido). El SCADA puede reportar generación bruta. La factura puede aplicar redondeos o deducciones tarifarias. Ninguno miente: definen "kWh" de manera diferente según su propósito.

### 4. Resolución temporal y consolidación
Un SCADA a 1 minuto y un portal que promedia a 15 minutos producen totales distintos cuando hay variabilidad en la curva de generación. Los algoritmos de consolidación (promedio, suma de intervalos, interpolación) amplifican o reducen esa diferencia.

### 5. Correcciones retroactivas
La distribuidora y CAMMESA pueden corregir mediciones. Un CSV exportado ayer no refleja esa corrección. El mismo período aparece con dos valores según cuándo se exportó.

### 6. Estado del medidor
Un medidor bidireccional fuera de servicio, descalibrado o no habilitado hace que la distribuidora estime o use datos SCADA como provisorios. Durante ese período, todas las fuentes son aproximadas.

---

## Jerarquía para BeEnergy

A efectos de la emisión de proto-certificados, la jerarquía de fuentes es:

1. **Medidor bidireccional habilitado** → fuente preferida cuando está disponible y telemetrizado.
2. **SCADA con medición en punto de frontera** → aceptable como fuente provisional si el medidor no está disponible.
3. **Datos del inversor / portal del fabricante** → solo para diagnóstico. **No se usan como base de certificados.**
4. **CSV exportado** → evidencia de respaldo, no fuente canónica.

La cooperativa valida siempre el dato antes del mint. Sin validación, no hay certificado.

---

## Preguntas abiertas

- [ ] **¿Qué medidor tiene cada cooperativa?** Necesitamos saber si el medidor bidireccional tiene telemetría automática o requiere lectura manual mensual. Eso define la frecuencia máxima de certificación posible.
- [ ] **¿Cómo manejamos el período de indisponibilidad del medidor?** Si el medidor está fuera de servicio y la distribuidora estima, ¿la cooperativa puede certificar con dato SCADA provisional o queda suspendida la emisión?
- [ ] **¿Qué granularidad mínima necesita el certificado?** Si solo tenemos lectura mensual del medidor, los certificados serán mensuales. Si queremos certificados más frecuentes, necesitamos telemetría.
- [ ] **¿Las cooperativas target están en el MEM o solo en distribución?** CAMMESA aplica solo a generadores con acceso al mercado mayorista. Para cooperativas de distribución local, la fuente de verdad es el medidor de la distribuidora, no CAMMESA.
- [ ] **¿Cómo auditamos divergencias?** Cuando el dato del inversor y el del medidor difieran más de X%, ¿se bloquea el mint, se alerta, o se certifica el dato del medidor sin más?
- [ ] **Autoconsumo detrás del medidor.** El medidor bidireccional solo ve la inyección neta. La generación consumida en el predio no aparece ahí. Si el certificado cubre generación total (no solo inyección), necesitamos una fuente adicional para el autoconsumo.

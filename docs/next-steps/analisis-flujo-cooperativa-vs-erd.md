# BeEnergy — Análisis de Coherencia: Flujo Ingreso Cooperativa vs ERD
**Fecha:** Mayo 2026  
**Preparado por:** romina-iurchik  
**Para:** el equipo (Tech Lead)  
**Contexto:** Revisión del flujo de ingreso de una cooperativa contra el modelo relacional actual

---

## Objetivo

Verificar que cada paso del flujo de ingreso de una cooperativa tiene soporte correcto en el ERD. Los gaps identificados son decisiones de diseño que hay que tomar antes de avanzar con UX/UI.

---

## Flujo analizado

```
Conectar wallet → Setup perfil → Registrar cooperativa → 
Agregar miembros → Registrar medidores → Cargar lecturas
```

---

## Análisis paso a paso

### ✅ Paso 1 — Conectar wallet / Setup perfil
**Tabla:** `prosumers`  
**Campo clave:** `stellar_address` — tiene UNIQUE constraint  
**Estado:** OK. El modelo soporta correctamente la identidad del usuario.

---

### ⚠️ Paso 2 — Registrar cooperativa
**Tabla:** `cooperatives`  
**Endpoint:** `POST /api/cooperatives`  
**Campos:** `name`, `technology`, `admin_stellar_address`, `country`, `province`, `city`

**Gap identificado:**  
`admin_stellar_address` es texto libre sin FK a `prosumers.stellar_address`. El administrador de la cooperativa no está formalmente vinculado como prosumidor en el modelo — son dos registros independientes sin relación declarada.

**Pregunta para el equipo:**  
¿El admin de una cooperativa siempre tiene que ser un prosumidor registrado, o puede ser un usuario externo que solo administra?

**Impacto en UX/UI:**  
Si el admin no es un prosumidor, no aparece en la lista de miembros. Esto puede confundir al usuario que espera verse a sí mismo en su propia cooperativa.

---

### ⚠️ Paso 3 — Agregar miembros
**Tabla:** `prosumers`  
**Endpoint:** `POST /api/members`  
**Campo clave:** `cooperative_id` — una sola FK

**Gap identificado:**  
Un prosumidor solo puede pertenecer a **una** cooperativa. El modelo no soporta membresías múltiples. Si un usuario tiene paneles en dos cooperativas distintas, hoy no puede estar en ambas.

**Pregunta para el equipo:**  
¿Es un requisito que un prosumidor pueda pertenecer a más de una cooperativa? Si sí, necesitamos una tabla intermedia `cooperative_members` con la relación many-to-many.

**Propuesta si se necesita:**
```sql
CREATE TABLE cooperative_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperative_id uuid NOT NULL REFERENCES cooperatives(id),
  prosumer_id uuid NOT NULL REFERENCES prosumers(id),
  role text DEFAULT 'prosumer' CHECK (role = ANY (ARRAY['prosumer','copropietario','mixed'])),
  joined_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(cooperative_id, prosumer_id)
);
```

---

### ⚠️ Paso 4 — Registrar medidores
**Tabla:** `meters`  
**Endpoint:** `POST /api/meters`

**Gaps identificados:**

1. `member_stellar_address` es texto libre sin FK a `prosumers.stellar_address` — puede registrarse un medidor para una wallet que no existe en el sistema.

2. `serial_number` sin UNIQUE — ya documentado en el análisis del ERD. Riesgo de doble conteo.

**Impacto en UX/UI:**  
Si el campo de dirección Stellar acepta cualquier valor sin validación a nivel de DB, la UI puede mostrar medidores "huérfanos" sin dueño real.

---

### ⚠️ Paso 5 — Cargar lecturas
**Tabla:** `readings`  
**Endpoints:** `POST /api/readings`, `POST /api/meters/readings`

**Gap identificado:**  
`kwh_injected` es NOT NULL pero el flujo dice que lo importante es `kwh_generated`. Un medidor que solo registra generación (sin inyección a red) igual tiene que enviar un valor para `kwh_injected` aunque no lo tenga.

**Impacto en UX/UI:**  
El formulario de "Registrar Lectura" debería reflejar qué campos son realmente obligatorios. Hoy puede generar confusión porque el campo existe pero no siempre tiene datos reales.

---

## Resumen de gaps

| Paso | Gap | Tipo | Decisión requerida |
|---|---|---|---|
| Registrar cooperativa | `admin_stellar_address` sin FK | Diseño | ¿El admin es siempre un prosumidor? |
| Agregar miembros | Un prosumidor = una cooperativa | Diseño | ¿Membresías múltiples? |
| Registrar medidores | `member_stellar_address` sin FK | Integridad | Sí — agregar FK |
| Registrar medidores | `serial_number` sin UNIQUE | Integridad | Sí — agregar UNIQUE |
| Cargar lecturas | `kwh_injected` NOT NULL | Lógica | Sí — hacer nullable |

---

## Decisiones que necesito de el equipo

1. **¿El admin de una cooperativa tiene que ser un prosumidor registrado?**  
   Si sí → agregar FK `cooperatives.admin_stellar_address → prosumers.stellar_address`  
   Si no → documentar que son entidades separadas

2. **¿Un prosumidor puede pertenecer a más de una cooperativa?**  
   Si sí → necesitamos tabla `cooperative_members` (many-to-many)  
   Si no → el modelo actual es correcto, solo documentarlo

Estas dos decisiones afectan directamente el diseño de las pantallas de UX/UI — por eso necesito resolverlas antes de avanzar con los wireframes.

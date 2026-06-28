# BeEnergy — Mejoras al Modelo Relacional
**Fecha:** Mayo 2026  
**Preparado por:** romina-iurchik  
**Para:** el equipo (Tech Lead)  
**Contexto:** Análisis del schema actual vs flujos documentados en `/docs`

---

## Resumen ejecutivo

Revisando el schema de Supabase contra los flujos de usuario documentados encontré **3 problemas críticos de integridad de datos**, **4 issues de performance y trazabilidad**, y **3 mejoras para soportar el flujo del comprador ESG** que hoy no tiene tabla propia.

---

## 🔴 Críticos — afectan integridad de datos

### 1. `serial_number` sin UNIQUE en `meters`
Sin este constraint, dos medidores pueden tener el mismo número de serie — doble conteo garantizado. Es el mismo riesgo de double counting que documentamos en el PR #149 pero a nivel de hardware.

```sql
ALTER TABLE meters 
ADD CONSTRAINT meters_serial_number_unique UNIQUE (serial_number);
```

---

### 2. `certificates.status` incluye valor `'sold'` que no existe en el flujo
El check constraint permite `'sold'` pero en el código y los flujos documentados el ciclo de vida es `pending → available → retired`. El estado `'sold'` nunca se usa y puede generar inconsistencias si alguien lo setea accidentalmente.

```sql
ALTER TABLE certificates DROP CONSTRAINT certificates_status_check;
ALTER TABLE certificates ADD CONSTRAINT certificates_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'available'::text, 'retired'::text]));
```

---

### 3. `readings.kwh_injected` es NOT NULL pero `kwh_generated` tiene DEFAULT 0
El flujo real dice que lo importante es `kwh_generated` (lo que produce el panel). Pero `kwh_injected` (lo que se inyecta a la red) es NOT NULL — si un medidor registra solo generación sin inyectar a la red, igual tiene que mandar un valor aunque sea 0.

**Propuesta:** Hacer `kwh_injected` nullable y documentar cuál campo es el canónico para certificación.

```sql
ALTER TABLE readings ALTER COLUMN kwh_injected DROP NOT NULL;
```

---

## 🟡 Importantes — performance y trazabilidad

### 4. Faltan índices en las queries más frecuentes
Las queries más usadas en el dashboard son por `cooperative_id + status` y por `meter_id + reading_date`. Sin índices estas queries escanean toda la tabla — va a ser un problema cuando haya cooperativas reales con miles de lecturas.

```sql
CREATE INDEX idx_readings_cooperative_status 
  ON readings(cooperative_id, status);

CREATE INDEX idx_readings_meter_date 
  ON readings(meter_id, reading_date DESC);

CREATE INDEX idx_certificates_cooperative_status 
  ON certificates(cooperative_id, status);

CREATE INDEX idx_mint_log_certificate 
  ON mint_log(certificate_id);
```

---

### 5. `stellar_address` sin FK en `meters` y `events`
- `meters.member_stellar_address` es texto libre sin referencia a `prosumers.stellar_address`
- `events.stellar_address` es texto libre sin referencia a nada

Esto significa que puede haber lecturas de medidores asignados a wallets que no existen en la tabla de prosumers, y eventos huérfanos sin trazabilidad.

```sql
-- Primero limpiar datos huérfanos si los hay, luego:
ALTER TABLE meters 
ADD CONSTRAINT meters_member_stellar_address_fkey 
  FOREIGN KEY (member_stellar_address) REFERENCES prosumers(stellar_address);
```

---

### 6. `prosumers` sin campo `is_active`
No hay forma de desactivar un miembro sin borrarlo. Si un prosumidor sale de la cooperativa, hoy la única opción es eliminarlo — perdiendo el historial de lecturas y certificados asociados.

```sql
ALTER TABLE prosumers 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

CREATE INDEX idx_prosumers_cooperative_active 
  ON prosumers(cooperative_id, is_active);
```

---

### 7. `mint_log` sin constraint que asegure referencia válida
`mint_log` tiene `reading_id` y `certificate_id` pero ninguno es obligatorio. Debería haber al menos uno presente para que el registro tenga sentido.

```sql
ALTER TABLE mint_log 
ADD CONSTRAINT mint_log_requires_reading_or_cert 
  CHECK (reading_id IS NOT NULL OR certificate_id IS NOT NULL);
```

---

## 🟢 Mejoras — para soportar el flujo del comprador ESG

### 8. Falta tabla `companies` para compradores externos
El flujo del comprador ESG (el cliente que paga) no tiene tabla propia. Hoy `retirements.buyer_name` y `buyer_address` son texto libre — no hay trazabilidad real de quién compró qué.

Para el modelo B2B que queremos, necesitamos poder ver el historial de compras por empresa.

```sql
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stellar_address text UNIQUE,
  country_code text DEFAULT 'AR',
  tax_id text,
  contact_email text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE retirements 
ADD COLUMN company_id uuid REFERENCES companies(id);
```

---

### 9. `cooperatives.country` debería ser código ISO
Hoy `country DEFAULT 'AR'` es texto libre. Si queremos escalar a otros países conviene usar el estándar ISO 3166-1 alpha-2 (AR, CL, MX, etc.) con un check constraint.

```sql
ALTER TABLE cooperatives 
ADD CONSTRAINT cooperatives_country_format 
  CHECK (country ~ '^[A-Z]{2}$');
```

---

## Script de migración completo (para revisar antes de ejecutar)

```sql
-- ============================================
-- BeEnergy — Migration Wave #5
-- Revisar con el equipo antes de ejecutar en prod
-- ============================================

-- 1. UNIQUE serial_number en meters
ALTER TABLE meters 
ADD CONSTRAINT meters_serial_number_unique UNIQUE (serial_number);

-- 2. Limpiar status 'sold' de certificates
ALTER TABLE certificates DROP CONSTRAINT IF EXISTS certificates_status_check;
ALTER TABLE certificates ADD CONSTRAINT certificates_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'available'::text, 'retired'::text]));

-- 3. kwh_injected nullable
ALTER TABLE readings ALTER COLUMN kwh_injected DROP NOT NULL;

-- 4. Índices de performance
CREATE INDEX IF NOT EXISTS idx_readings_cooperative_status 
  ON readings(cooperative_id, status);
CREATE INDEX IF NOT EXISTS idx_readings_meter_date 
  ON readings(meter_id, reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_certificates_cooperative_status 
  ON certificates(cooperative_id, status);
CREATE INDEX IF NOT EXISTS idx_mint_log_certificate 
  ON mint_log(certificate_id);

-- 5. is_active en prosumers
ALTER TABLE prosumers 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_prosumers_cooperative_active 
  ON prosumers(cooperative_id, is_active);

-- 6. CHECK en mint_log
ALTER TABLE mint_log 
ADD CONSTRAINT mint_log_requires_reading_or_cert 
  CHECK (reading_id IS NOT NULL OR certificate_id IS NOT NULL);

-- 7. Tabla companies
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stellar_address text UNIQUE,
  country_code text DEFAULT 'AR',
  tax_id text,
  contact_email text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE retirements 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

-- 8. Country format check
ALTER TABLE cooperatives 
ADD CONSTRAINT IF NOT EXISTS cooperatives_country_format 
  CHECK (country ~ '^[A-Z]{2}$');
```

---

## Priorización sugerida

| # | Cambio | Impacto | Riesgo de migración |
|---|---|---|---|
| 1 | UNIQUE serial_number | 🔴 Crítico | Bajo — puede fallar si hay duplicados existentes |
| 2 | Limpiar status 'sold' | 🔴 Crítico | Bajo — verificar que no haya rows con 'sold' |
| 3 | kwh_injected nullable | 🔴 Crítico | Bajo |
| 4 | Índices de performance | 🟡 Alto | Ninguno — solo agregan |
| 5 | is_active en prosumers | 🟡 Alto | Bajo |
| 6 | CHECK mint_log | 🟡 Alto | Medio — puede fallar si hay rows sin reading_id ni certificate_id |
| 7 | Tabla companies | 🟢 Medio | Ninguno — tabla nueva |
| 8 | Country format check | 🟢 Medio | Medio — verificar datos existentes |

---

## Notas importantes antes de ejecutar

1. **Verificar duplicados** en `meters.serial_number` antes del constraint UNIQUE:
```sql
SELECT serial_number, COUNT(*) 
FROM meters 
WHERE serial_number IS NOT NULL 
GROUP BY serial_number 
HAVING COUNT(*) > 1;
```

2. **Verificar status 'sold'** antes de limpiar el constraint:
```sql
SELECT COUNT(*) FROM certificates WHERE status = 'sold';
```

3. **Verificar mint_log** antes del CHECK:
```sql
SELECT COUNT(*) FROM mint_log 
WHERE reading_id IS NULL AND certificate_id IS NULL;
```

4. **Verificar country format** antes del CHECK:
```sql
SELECT DISTINCT country FROM cooperatives;
```

---

## Verificaciones realizadas — Mayo 2026 ✅

Antes de ejecutar la migración se corrieron las siguientes verificaciones en Supabase SQL Editor. Todos los resultados son seguros para proceder.

| # | Verificación | Resultado | Estado |
|---|---|---|---|
| 1 | Duplicados en serial_number | Sin filas | ✅ OK |
| 2 | Certificados con status 'sold' | 0 | ✅ OK |
| 3 | mint_log sin referencias | 0 | ✅ OK |
| 4 | Valores de country | Solo 'AR' | ✅ OK |

**La migración puede ejecutarse sin riesgo. Proceder con el script de migración completo.**

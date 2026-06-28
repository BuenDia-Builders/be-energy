import { z } from "zod"

// Stellar address: starts with G, 56 chars total
const stellarAddress = z.string().regex(/^G[A-Z2-7]{55}$/, "Invalid Stellar address")

const uuid = z.string().uuid()

// Auth
export const challengeSchema = z.object({
  stellar_address: stellarAddress,
})

export const verifySchema = z.object({
  stellar_address: stellarAddress,
  challenge: z.string().regex(/^[0-9a-f]{64}$/, "Invalid challenge format"),
  signature: z.string().min(1, "Signature required"),
})

// Cooperatives
export const createCooperativeSchema = z.object({
  name: z.string().min(1).max(200),
  technology: z.enum(["solar", "wind", "hydro", "mixed"]),
  admin_stellar_address: stellarAddress,
  country: z.string().max(100).nullish(),
  province: z.string().max(100).nullish(),
  city: z.string().max(100).nullish(),
})

// Members
export const createMemberSchema = z.object({
  stellar_address: stellarAddress,
  cooperative_id: uuid,
  name: z.string().max(200).nullish(),
  panel_capacity_kw: z.number().positive().nullish(),
  role: z.enum(["prosumer", "copropietario", "mixed"]).default("prosumer"),
})

// Legacy prosumer (members/route.ts)
export const createProsumerSchema = z.object({
  stellar_address: stellarAddress,
  name: z.string().max(200).nullish(),
  panel_capacity_kw: z.number().positive().nullish(),
  cooperative_id: uuid.nullish(),
  role: z.enum(["prosumer", "copropietario", "mixed"]).default("prosumer"),
})

// Meters
export const createMeterSchema = z.object({
  cooperative_id: uuid,
  member_stellar_address: stellarAddress,
  device_type: z.enum(["inverter", "bidirectional_meter", "smart_meter"]),
  technology: z.enum(["solar", "wind", "hydro", "biomass"]),
  capacity_kw: z.number().positive(),
  manufacturer: z.string().max(200).nullish(),
  model: z.string().max(200).nullish(),
  serial_number: z.string().max(200).nullish(),
  location_lat: z.number().min(-90).max(90).nullish(),
  location_lng: z.number().min(-180).max(180).nullish(),
  installed_at: z.string().nullish(),
})

// Readings
export const createReadingSchema = z.object({
  stellar_address: stellarAddress.optional(),
  meter_id: uuid.optional(),
  kwh_injected: z.number().positive().lt(1000).optional(),
  kwh_generated: z.number().positive().lt(1000).optional(),
  kwh_consumed: z.number().min(0).optional(),
  kwh_self_consumed: z.number().min(0).optional(),
  reading_date: z.string().optional(),
  reading_timestamp: z.string().optional(),
  power_watts: z.number().min(0).optional(),
  interval_minutes: z.number().int().positive().default(15),
  cooperative_id: uuid.optional(),
}).refine(
  (d) => d.stellar_address || d.meter_id,
  { message: "stellar_address or meter_id required" }
).refine(
  (d) => d.kwh_generated != null || d.kwh_injected != null,
  { message: "kwh_injected or kwh_generated required" }
).refine(
  (d) => d.reading_date || d.reading_timestamp,
  { message: "reading_date or reading_timestamp required" }
).superRefine((d, ctx) => {
  if (d.kwh_injected == null && d.kwh_generated != null && (d.kwh_self_consumed ?? d.kwh_consumed) == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "kwh_self_consumed required when kwh_injected is missing",
    })
  }
})

// Batch meter readings
const singleMeterReading = z.object({
  kwh_injected: z.number().positive().lt(1000).optional(),
  kwh_generated: z.number().positive().lt(1000).optional(),
  reading_timestamp: z.string().optional(),
  reading_date: z.string().optional(),
  power_watts: z.number().min(0).optional(),
  interval_minutes: z.number().int().positive().optional(),
  kwh_self_consumed: z.number().min(0).optional(),
}).superRefine((d, ctx) => {
  if (d.kwh_injected == null && d.kwh_generated == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "kwh_injected or kwh_generated required",
    })
  }

  if (d.kwh_injected == null && d.kwh_generated != null && d.kwh_self_consumed == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "kwh_self_consumed required when kwh_injected is missing",
    })
  }
})

export const bulkMeterReadingsSchema = z.object({
  meter_id: uuid,
  readings: z.array(singleMeterReading).min(1).max(1000),
})

// Certificates
export const createCertificateSchema = z.object({
  cooperative_id: uuid,
  generation_period_start: z.string(),
  generation_period_end: z.string(),
  total_kwh: z.number().positive(),
  technology: z.string().min(1),
  location: z.string().max(200).nullish(),
}).refine(
  (d) => d.generation_period_start <= d.generation_period_end,
  { message: "generation_period_start must be before or equal to generation_period_end" }
)

// Mint
export const mintSchema = z.object({
  reading_id: uuid.optional(),
  certificate_id: uuid.optional(),
}).refine(
  (d) => d.reading_id || d.certificate_id,
  { message: "reading_id or certificate_id required" }
)

// Update reading
export const updateReadingSchema = z.object({
  reading_id: uuid,
  status: z.enum(["pending", "verified", "rejected"]),
})

// Retire
export const retireSchema = z.object({
  certificate_id: uuid,
  buyer_address: stellarAddress,
  buyer_name: z.string().max(200).nullish(),
  buyer_purpose: z.enum([
    "esg_reporting",
    "carbon_offset",
    "voluntary_commitment",
    "regulatory_compliance",
    "other",
  ]),
})

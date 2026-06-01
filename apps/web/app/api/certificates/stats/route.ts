import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { safeDbError } from "@/lib/errors/safe-error"

// CO2 avoided factor for Argentina (kg CO2 per kWh)
const CO2_FACTOR_AR = 0.4

// GET: public (transparency)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const buyerAddress = searchParams.get("buyer_address")

  const { data: allCerts, error: certsError } = await supabase
    .from("certificates")
    .select("id, total_kwh, technology, cooperative_id, status, cooperatives(name)")

  if (certsError) return safeDbError(certsError)

  let retirementsQuery = supabase
    .from("retirements")
    .select("certificate_id, kwh_retired, buyer_address, buyer_purpose")

  if (buyerAddress) {
    retirementsQuery = retirementsQuery.eq("buyer_address", buyerAddress)
  }

  const { data: retirements, error: retError } = await retirementsQuery

  if (retError) return safeDbError(retError)

  const retiredCertIds = new Set((retirements ?? []).map((r) => r.certificate_id))

  const totalKwhCertified = (allCerts ?? []).reduce((s, c) => s + c.total_kwh, 0)
  const totalKwhRetired = (retirements ?? []).reduce((s, r) => s + r.kwh_retired, 0)

  const certificatesAvailable = (allCerts ?? []).filter((c) => c.status === "available").length
  const certificatesPending = (allCerts ?? []).filter((c) => c.status === "pending").length
  const certificatesRetired = (allCerts ?? []).filter(
    (c) => c.status === "retired" || retiredCertIds.has(c.id)
  ).length

  const byTechnology: Record<string, { certified_kwh: number; retired_kwh: number }> = {}
  for (const cert of allCerts ?? []) {
    if (!byTechnology[cert.technology]) {
      byTechnology[cert.technology] = { certified_kwh: 0, retired_kwh: 0 }
    }
    byTechnology[cert.technology].certified_kwh += cert.total_kwh
  }
  for (const ret of retirements ?? []) {
    const cert = (allCerts ?? []).find((c) => c.id === ret.certificate_id)
    if (cert && byTechnology[cert.technology]) {
      byTechnology[cert.technology].retired_kwh += ret.kwh_retired
    }
  }

  const byCooperative: Record<string, { name: string; certified_kwh: number; retired_kwh: number }> = {}
  for (const cert of allCerts ?? []) {
    const coopId = cert.cooperative_id
    if (!byCooperative[coopId]) {
      const coopData = cert.cooperatives as { name: string } | null
      byCooperative[coopId] = {
        name: coopData?.name ?? coopId,
        certified_kwh: 0,
        retired_kwh: 0,
      }
    }
    byCooperative[coopId].certified_kwh += cert.total_kwh
  }
  for (const ret of retirements ?? []) {
    const cert = (allCerts ?? []).find((c) => c.id === ret.certificate_id)
    if (cert && byCooperative[cert.cooperative_id]) {
      byCooperative[cert.cooperative_id].retired_kwh += ret.kwh_retired
    }
  }

  return NextResponse.json({
    total_kwh_certified: Math.round(totalKwhCertified * 100) / 100,
    total_kwh_retired: Math.round(totalKwhRetired * 100) / 100,
    co2_avoided_kg: Math.round(totalKwhRetired * CO2_FACTOR_AR * 100) / 100,
    certificates_available: certificatesAvailable,
    certificates_pending: certificatesPending,
    certificates_retired: certificatesRetired,
    by_technology: byTechnology,
    by_cooperative: byCooperative,
  })
}

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireSuperAdmin, isSession } from "@/lib/auth/middleware"
import { safeCatchError } from "@/lib/errors/safe-error"

export async function GET() {
  try {
    const session = await requireSuperAdmin()
    if (!isSession(session)) return session

    // All cooperatives with stats
    const { data: cooperatives } = await supabase
      .from("cooperatives")
      .select("*")
      .order("created_at", { ascending: false })

    // All prosumers — full rows needed for per-cooperative grouping; count kept for global total
    const { data: prosumers, count: memberCount } = await supabase
      .from("prosumers")
      .select("id, cooperative_id", { count: "exact" })

    // All certificates
    const { data: certificates } = await supabase
      .from("certificates")
      .select("id, cooperative_id, total_kwh, status, mint_tx_hash, created_at, technology")
      .order("created_at", { ascending: false })

    const certs = certificates ?? []
    const coops = cooperatives ?? []

    // Per-cooperative stats
    const coopStats = coops.map((coop) => {
      const coopCerts = certs.filter((c) => c.cooperative_id === coop.id)
      return {
        ...coop,
        member_count: (prosumers ?? []).filter((p) => p.cooperative_id === coop.id).length,
        certificates_count: coopCerts.length,
        total_kwh: coopCerts.reduce((sum, c) => sum + (c.total_kwh || 0), 0),
        pending: coopCerts.filter((c) => c.status === "pending").length,
        available: coopCerts.filter((c) => c.status === "available").length,
        retired: coopCerts.filter((c) => c.status === "retired").length,
      }
    })

    // Global totals
    const totals = {
      cooperatives: coops.length,
      members: memberCount ?? 0,
      total_kwh_certified: certs.reduce((sum, c) => sum + (c.total_kwh || 0), 0),
      certificates_total: certs.length,
      certificates_pending: certs.filter((c) => c.status === "pending").length,
      certificates_available: certs.filter((c) => c.status === "available").length,
      certificates_retired: certs.filter((c) => c.status === "retired").length,
    }

    // Recent mints (last 10)
    const recent_mints = certs
      .filter((c) => c.mint_tx_hash)
      .slice(0, 10)

    // Recent retirements (last 10)
    const recent_retirements = certs
      .filter((c) => c.status === "retired")
      .slice(0, 10)

    return NextResponse.json({
      totals,
      cooperatives: coopStats,
      recent_mints,
      recent_retirements,
    })
  } catch (err) {
    return safeCatchError(err)
  }
}

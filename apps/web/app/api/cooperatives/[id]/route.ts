import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireMember, isSession } from "@/lib/auth/middleware"
import { safeDbError, safeCatchError } from "@/lib/errors/safe-error"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
    ) {
      try {
        const { id } = await params
        const session = await requireMember(id)
        if (!isSession(session)) return session

        // Cooperative data
        const { data: cooperative, error: coopError } = await supabase
          .from("cooperatives")
          .select("*")
          .eq("id", id)
          .single()

        if (coopError || !cooperative) {
          return NextResponse.json({ error: "Cooperative not found" }, { status: 404 })
        }

        // Members (prosumers)
        const { data: members } = await supabase
          .from("prosumers")
          .select("id, name, stellar_address, cooperative_id, created_at")
          .eq("cooperative_id", id)
          .order("created_at", { ascending: false })

        // Certificates
        const { data: certificates } = await supabase
          .from("certificates")
          .select("*")
          .eq("cooperative_id", id)
          .order("created_at", { ascending: false })

        // Meters
        const { data: meters } = await supabase
          .from("meters")
          .select("*")
          .eq("cooperative_id", id)
          .order("created_at", { ascending: false })

        // Readings — generación real total
    const { data: readings } = await supabase
      .from("readings")
      .select("kwh_generated")
      .eq("cooperative_id", id)

    const rds = readings ?? []

    // Aggregate stats
    const certs = certificates ?? []
    const mems = members ?? []
    const mtrs = meters ?? []

    const stats = {
      member_count: mems.length,
      meter_count: mtrs.length,
      total_capacity_kw: mtrs.reduce((sum, m) => sum + (m.capacity_kw || 0), 0),
      total_generation_kwh: rds.reduce((sum, r) => sum + (r.kwh_generated || 0), 0),
      total_certified_kwh: certs.reduce((sum, c) => sum + (c.total_kwh || 0), 0),
      certificates_pending: certs.filter((c) => c.status === "pending").length,
      certificates_available: certs.filter((c) => c.status === "available").length,
      certificates_retired: certs.filter((c) => c.status === "retired").length,
    }

    return NextResponse.json({
      cooperative,
      members: mems,
      certificates: certs,
      meters: mtrs,
      stats,
    })
  } catch (err) {
    return safeCatchError(err)
  }
}

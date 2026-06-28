import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAuth, isSession } from "@/lib/auth/middleware"
import { validateBody } from "@/lib/validation/validate"
import { bulkMeterReadingsSchema } from "@/lib/validation/schemas"
import { safeDbError, safeCatchError } from "@/lib/errors/safe-error"

function getNetInjectedKwh(kwhGenerated: number, kwhSelfConsumed: number) {
  return Math.max(0, kwhGenerated - kwhSelfConsumed)
}

// POST: authenticated — admin or owner of the meter
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (!isSession(session)) return session

    const body = await req.json()
    const v = validateBody(bulkMeterReadingsSchema, body)
    if (!v.success) return v.response

    const { meter_id, readings } = v.data

    // Validate meter exists and is active
    const { data: meter, error: meterError } = await supabase
      .from("meters")
      .select("id, cooperative_id, status")
      .eq("id", meter_id)
      .single()

    if (meterError || !meter) {
      return NextResponse.json({ error: "Meter not found" }, { status: 404 })
    }

    if (meter.status !== "active") {
      return NextResponse.json(
        { error: `Meter status is '${meter.status}', expected 'active'` },
        { status: 400 }
      )
    }

    // Authorization: must be member of the meter's cooperative
    if (!session.cooperative_ids.includes(meter.cooperative_id)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const rows = readings.map((r) => {
      const kwhGenerated = r.kwh_generated ?? r.kwh_injected!
      const kwhInjected = r.kwh_injected ?? getNetInjectedKwh(kwhGenerated, r.kwh_self_consumed ?? 0)

      return {
        meter_id,
        cooperative_id: meter.cooperative_id,
        kwh_generated: kwhGenerated,
        kwh_injected: kwhInjected,
        kwh_self_consumed: r.kwh_self_consumed ?? null,
        power_watts: r.power_watts ?? null,
        interval_minutes: r.interval_minutes ?? 15,
        reading_timestamp: r.reading_timestamp ?? null,
        reading_date: r.reading_date ?? null,
        source: "meter",
        status: "pending",
      }
    })

    const { data, error: insertError } = await supabase
      .from("readings")
      .insert(rows)
      .select()

    if (insertError) return safeDbError(insertError)

    return NextResponse.json(
      { inserted: data?.length ?? 0, readings: data },
      { status: 201 }
    )
  } catch (err) {
    return safeCatchError(err)
  }
}

import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAuth, isSession } from "@/lib/auth/middleware"
import { validateBody } from "@/lib/validation/validate"
import { createCooperativeSchema } from "@/lib/validation/schemas"
import { safeDbError, safeCatchError } from "@/lib/errors/safe-error"

// GET: public (transparency)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const technology = searchParams.get("technology")

  let query = supabase
    .from("cooperatives")
    .select("*")
    .order("created_at", { ascending: false })

  if (status) query = query.eq("status", status)
  if (technology) query = query.eq("technology", technology)

  const { data, error } = await query

  if (error) return safeDbError(error)

  return NextResponse.json(data)
}

// POST: authenticated — wallet owner registers as admin
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (!isSession(session)) return session

    const body = await req.json()
    const v = validateBody(createCooperativeSchema, body)
    if (!v.success) return v.response

    // The authenticated user must be the admin
    if (v.data.admin_stellar_address !== session.sub) {
      return NextResponse.json(
        { error: "admin_stellar_address must match your wallet" },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from("cooperatives")
      .insert({
        name: v.data.name,
        technology: v.data.technology,
        admin_stellar_address: v.data.admin_stellar_address,
        country: v.data.country ?? null,
        province: v.data.province ?? null,
        city: v.data.city ?? null,
      })
      .select()
      .single()

    if (error) return safeDbError(error)

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return safeCatchError(err)
  }
}

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const ADDR = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
const COOP_ID = "00000000-0000-0000-0000-000000000001"

const { mockSingle, mockOrder, mockIn, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockIn = vi.fn(() => ({ data: [], error: null }))
  const mockOrder = vi.fn(() => ({ data: [], error: null, in: mockIn }))
  const mockEq: ReturnType<typeof vi.fn> = vi.fn(() => ({ single: mockSingle, order: mockOrder, eq: mockEq, in: mockIn }))
  const mockSelect = vi.fn(() => ({ single: mockSingle }))
  const mockInsert = vi.fn(() => ({ select: mockSelect }))
  const mockFrom = vi.fn(() => ({
    select: vi.fn(() => ({ order: mockOrder, eq: mockEq })),
    insert: mockInsert,
  }))
  return { mockSingle, mockOrder, mockIn, mockFrom }
})

vi.mock("@/lib/supabase", () => ({
  supabase: { from: mockFrom },
}))

vi.mock("@/lib/auth/middleware", () => ({
  requireAuth: vi.fn(async () => ({
    sub: ADDR,
    cooperative_ids: [COOP_ID],
    admin_cooperative_ids: [COOP_ID],
  })),
  requireAdmin: vi.fn(async () => ({
    sub: ADDR,
    cooperative_ids: [COOP_ID],
    admin_cooperative_ids: [COOP_ID],
  })),
  isSession: vi.fn(() => true),
}))

import { GET, POST } from "@/app/api/meters/route"

function makeGet(params = "") {
  return new NextRequest(`http://localhost/api/meters${params}`)
}

function makePost(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/meters", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

describe("GET /api/meters", () => {
  beforeEach(() => vi.clearAllMocks())

  it("lista medidores scoped a cooperativa", async () => {
    const fakeMeters = [{ id: "1", device_type: "inverter" }]
    mockIn.mockReturnValueOnce({ data: fakeMeters, error: null })

    const res = await GET(makeGet())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
  })
})

describe("POST /api/meters", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rechaza sin campos requeridos → 400", async () => {
    const res = await POST(makePost({ cooperative_id: COOP_ID }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Validation failed/)
  })

  it("rechaza device_type inválido → 400", async () => {
    const res = await POST(
      makePost({
        cooperative_id: COOP_ID,
        member_stellar_address: ADDR,
        device_type: "toaster",
        technology: "solar",
        capacity_kw: 5,
      })
    )
    expect(res.status).toBe(400)
  })

  it("rechaza technology inválida → 400", async () => {
    const res = await POST(
      makePost({
        cooperative_id: COOP_ID,
        member_stellar_address: ADDR,
        device_type: "inverter",
        technology: "nuclear",
        capacity_kw: 5,
      })
    )
    expect(res.status).toBe(400)
  })

  it("crea medidor válido → 201", async () => {
    const fakeMeter = {
      id: "meter-1",
      cooperative_id: COOP_ID,
      device_type: "inverter",
      technology: "solar",
      capacity_kw: 5,
    }
    mockSingle.mockResolvedValueOnce({ data: { id: "prosumer-id" }, error: null })
    mockSingle.mockResolvedValueOnce({ data: fakeMeter, error: null })

    const res = await POST(
      makePost({
        cooperative_id: COOP_ID,
        member_stellar_address: ADDR,
        device_type: "inverter",
        technology: "solar",
        capacity_kw: 5,
      })
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.device_type).toBe("inverter")
  })
})

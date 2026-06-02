import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const ADDR = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
const COOP_ID = "00000000-0000-0000-0000-000000000001"

const { mockSingle, mockOrder, mockFrom, mockLimit } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockLimit = vi.fn(() => ({ data: [] as unknown[], error: null }))
  const mockOrder = vi.fn(() => ({ data: [], error: null, single: mockSingle, order: mockOrder, eq: mockEq, gte: mockEq, lte: mockEq, limit: mockLimit }))
  const mockEq: ReturnType<typeof vi.fn> = vi.fn(() => ({
    order: mockOrder,
    eq: mockEq,
    gte: vi.fn(() => ({
      lte: vi.fn(() => ({
        limit: mockLimit,
        data: [],
        error: null
      })),
      order: mockOrder,
      eq: mockEq
    })),
    lte: vi.fn(() => ({ data: [], error: null })),
  }))
  const mockSelect = vi.fn(() => ({ single: mockSingle, eq: mockEq, order: mockOrder }))
  const mockInsert = vi.fn(() => ({ select: mockSelect }))
  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
  }))
  return { mockSingle, mockOrder, mockFrom, mockLimit }
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

import { GET, POST } from "@/app/api/certificates/route"

function makeGet(params = "") {
  return new NextRequest(`http://localhost/api/certificates${params}`)
}

function makePost(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/certificates", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

describe("GET /api/certificates", () => {
  beforeEach(() => vi.clearAllMocks())

  it("lista certificados", async () => {
    const fakeCerts = [{ id: "1", total_kwh: 100, status: "available" }]
    mockOrder.mockReturnValueOnce({ data: fakeCerts, error: null })

    const res = await GET(makeGet())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
  })
})

describe("POST /api/certificates", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rechaza sin campos requeridos → 400", async () => {
    const res = await POST(makePost({ cooperative_id: COOP_ID }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Validation failed/)
  })

  it("rechaza fecha de inicio posterior a fecha de fin → 400", async () => {
    const res = await POST(
      makePost({
        cooperative_id: COOP_ID,
        generation_period_start: "2028-03-09",
        generation_period_end: "2026-03-19",
        total_kwh: 150,
        technology: "solar",
      })
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Validation failed/)
  })

  it("rechaza si no hay lecturas verificadas → 400", async () => {
    mockLimit.mockResolvedValueOnce({ data: [], error: null })

    const res = await POST(
      makePost({
        cooperative_id: COOP_ID,
        generation_period_start: "2025-01-01",
        generation_period_end: "2025-01-31",
        total_kwh: 150,
        technology: "solar",
      })
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/No verified readings for this period/)
  })

  it("acepta fechas iguales (mismo día) → 201", async () => {
    const fakeCert = { id: "cert-2", cooperative_id: COOP_ID, total_kwh: 50, technology: "solar", status: "pending" }
    mockLimit.mockResolvedValueOnce({ data: [{ id: "reading-1" }], error: null })
    mockSingle.mockResolvedValueOnce({ data: fakeCert, error: null })

    const res = await POST(
      makePost({
        cooperative_id: COOP_ID,
        generation_period_start: "2025-06-15",
        generation_period_end: "2025-06-15",
        total_kwh: 50,
        technology: "solar",
      })
    )
    expect(res.status).toBe(201)
  })

  it("crea certificado válido con lecturas verificadas → 201", async () => {
    const fakeCert = {
      id: "cert-1",
      cooperative_id: COOP_ID,
      total_kwh: 150,
      technology: "solar",
      status: "pending",
    }
    mockLimit.mockResolvedValueOnce({ data: [{ id: "reading-1" }], error: null })
    mockSingle.mockResolvedValueOnce({ data: fakeCert, error: null })

    const res = await POST(
      makePost({
        cooperative_id: COOP_ID,
        generation_period_start: "2025-01-01",
        generation_period_end: "2025-01-31",
        total_kwh: 150,
        technology: "solar",
      })
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.total_kwh).toBe(150)
    expect(json.status).toBe("pending")
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const ADDR = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
const COOP_ID = "00000000-0000-0000-0000-000000000001"
const METER_ID = "00000000-0000-0000-0000-000000000004"

const { mockSingle, mockSelect, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockSelect = vi.fn(() => ({ data: [], error: null }))
  const mockInsert = vi.fn(() => ({ select: mockSelect }))
  const mockFrom = vi.fn(() => ({
    select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSingle })) })),
    insert: mockInsert,
  }))
  return { mockSingle, mockSelect, mockFrom }
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
  isSession: vi.fn(() => true),
}))

import { POST } from "@/app/api/meters/readings/route"

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/meters/readings", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

describe("POST /api/meters/readings (bulk)", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rechaza sin meter_id → 400", async () => {
    const res = await POST(makeRequest({ readings: [{ kwh_injected: 1 }] }))
    expect(res.status).toBe(400)
  })

  it("rechaza sin readings array → 400", async () => {
    const res = await POST(makeRequest({ meter_id: METER_ID }))
    expect(res.status).toBe(400)
  })

  it("rechaza readings vacío → 400", async () => {
    const res = await POST(makeRequest({ meter_id: METER_ID, readings: [] }))
    expect(res.status).toBe(400)
  })

  it("rechaza meter inexistente → 404", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: "not found" } })

    const res = await POST(
      makeRequest({
        meter_id: METER_ID,
        readings: [{ kwh_injected: 1, reading_timestamp: "2025-01-01T12:00:00Z" }],
      })
    )
    expect(res.status).toBe(404)
  })

  it("rechaza meter inactivo → 400", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: METER_ID, cooperative_id: COOP_ID, status: "maintenance" },
      error: null,
    })

    const res = await POST(
      makeRequest({
        meter_id: METER_ID,
        readings: [{ kwh_injected: 1, reading_timestamp: "2025-01-01T12:00:00Z" }],
      })
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/maintenance/)
  })

  it("inserta readings en batch → 201", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: METER_ID, cooperative_id: COOP_ID, status: "active" },
      error: null,
    })
    const inserted = [
      { id: "r1", kwh_generated: 1.5 },
      { id: "r2", kwh_generated: 2.0 },
    ]
    mockSelect.mockReturnValueOnce({ data: inserted, error: null })

    const res = await POST(
      makeRequest({
        meter_id: METER_ID,
        readings: [
          { kwh_injected: 1.5, reading_timestamp: "2025-01-01T12:00:00Z" },
          { kwh_injected: 2.0, reading_timestamp: "2025-01-01T12:15:00Z" },
        ],
      })
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.inserted).toBe(2)
  })
})

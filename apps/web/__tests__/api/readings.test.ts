import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const ADDR = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
const COOP_ID = "00000000-0000-0000-0000-000000000001"
const METER_ID = "00000000-0000-0000-0000-000000000004"

const { mockSingle, mockEq, mockFrom, mockUpdate } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockSelect = vi.fn(() => ({ single: mockSingle, eq: mockEq }))
  const mockEq: ReturnType<typeof vi.fn> = vi.fn(() => ({ single: mockSingle, eq: mockEq, select: mockSelect }))
  const mockInsert = vi.fn(() => ({ select: mockSelect }))
  const mockUpdate = vi.fn(() => ({ eq: mockEq, select: mockSelect }))
  const mockFrom = vi.fn(() => ({
    select: vi.fn(() => ({ eq: mockEq })),
    insert: mockInsert,
    update: mockUpdate,
  }))
  return { mockSingle, mockEq, mockFrom, mockUpdate }
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

import { POST, PATCH } from "@/app/api/readings/route"

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/readings", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

describe("POST /api/readings", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rechaza lectura sin stellar_address ni meter_id → 400", async () => {
    const res = await POST(makeRequest({ kwh_injected: 5, reading_date: "2025-01-01" }))
    expect(res.status).toBe(400)
  })

  it("rechaza lectura con kwh_injected <= 0 → 400", async () => {
    const res = await POST(
      makeRequest({ stellar_address: ADDR, kwh_injected: 0, reading_date: "2025-01-01" })
    )
    expect(res.status).toBe(400)
  })

  it("rechaza lectura con kwh_injected >= 1000 → 400", async () => {
    const res = await POST(
      makeRequest({ stellar_address: ADDR, kwh_injected: 1000, reading_date: "2025-01-01" })
    )
    expect(res.status).toBe(400)
  })

  it("rechaza lectura con kwh_generated sin kwh_self_consumed ni kwh_injected → 400", async () => {
    const res = await POST(
      makeRequest({ stellar_address: ADDR, kwh_generated: 5, reading_date: "2025-01-01" })
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.details).toContain("kwh_self_consumed required when kwh_injected is missing")
  })

  it("rechaza lectura de prosumidor que no existe → 404", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: "not found" } })

    const res = await POST(
      makeRequest({ stellar_address: ADDR, kwh_injected: 5, reading_date: "2025-01-01" })
    )
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toMatch(/Prosumer not found/)
  })

  it("rechaza lectura duplicada → 409", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "uuid-1", cooperative_id: COOP_ID }, error: null })
    mockSingle.mockResolvedValueOnce({ data: { id: "existing-reading" }, error: null })

    const res = await POST(
      makeRequest({ stellar_address: ADDR, kwh_injected: 5, reading_date: "2025-01-01" })
    )
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toMatch(/already exists/)
  })

  it("crea lectura válida → 201 con status pending", async () => {
    const fakeReading = {
      id: "reading-1",
      prosumer_id: "uuid-1",
      kwh_generated: 5,
      reading_date: "2025-01-01",
      status: "pending",
    }
    mockSingle.mockResolvedValueOnce({ data: { id: "uuid-1", cooperative_id: COOP_ID }, error: null })
    mockSingle.mockResolvedValueOnce({ data: null, error: null })
    mockSingle.mockResolvedValueOnce({ data: fakeReading, error: null })

    const res = await POST(
      makeRequest({ stellar_address: ADDR, kwh_injected: 5, reading_date: "2025-01-01" })
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.status).toBe("pending")
    expect(json.id).toBe("reading-1")
  })
})

function makePatchRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/readings", {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

describe("PATCH /api/readings", () => {
  beforeEach(() => vi.clearAllMocks())

  const READING_ID = "00000000-0000-0000-0000-000000000010"

  it("rechaza sin reading_id → 400", async () => {
    const res = await PATCH(makePatchRequest({ status: "verified" }))
    expect(res.status).toBe(400)
  })

  it("rechaza con status inválido → 400", async () => {
    const res = await PATCH(makePatchRequest({ reading_id: READING_ID, status: "invalid" }))
    expect(res.status).toBe(400)
  })

  it("rechaza si reading no existe → 404", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null })

    const res = await PATCH(makePatchRequest({ reading_id: READING_ID, status: "verified" }))
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toMatch(/Reading not found/)
  })

  it("actualiza status a verified → 200", async () => {
    const updatedReading = {
      id: READING_ID,
      cooperative_id: COOP_ID,
      status: "verified",
      kwh_generated: 5,
    }
    mockSingle.mockResolvedValueOnce({ data: { cooperative_id: COOP_ID }, error: null })
    mockSingle.mockResolvedValueOnce({ data: updatedReading, error: null })

    const res = await PATCH(makePatchRequest({ reading_id: READING_ID, status: "verified" }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe("verified")
    expect(json.id).toBe(READING_ID)
  })

  it("actualiza status a rejected → 200", async () => {
    const updatedReading = {
      id: READING_ID,
      cooperative_id: COOP_ID,
      status: "rejected",
      kwh_generated: 5,
    }
    mockSingle.mockResolvedValueOnce({ data: { cooperative_id: COOP_ID }, error: null })
    mockSingle.mockResolvedValueOnce({ data: updatedReading, error: null })

    const res = await PATCH(makePatchRequest({ reading_id: READING_ID, status: "rejected" }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe("rejected")
  })
})

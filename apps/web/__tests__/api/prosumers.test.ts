import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const ADDR = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
const OTHER_ADDR = "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"
const COOP_ID = "00000000-0000-0000-0000-000000000001"
const OTHER_COOP_ID = "00000000-0000-0000-0000-000000000002"

const { mockSingle, mockOrder, mockIn, mockFrom, mockRequireAuth, mockRequireAdmin } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockIn = vi.fn(() => ({ data: [], error: null }))
  const mockOrder = vi.fn(() => ({ data: [], error: null, in: mockIn }))
  const mockSelect = vi.fn(() => ({ single: mockSingle }))
  const mockInsert = vi.fn(() => ({ select: mockSelect }))
  const mockEq = vi.fn(() => ({ single: mockSingle }))
  const mockNot = vi.fn(() => ({ data: [], error: null }))
  const mockFrom = vi.fn(() => ({
    select: vi.fn((cols?: string) => {
      if (cols === "*") return { order: mockOrder, not: mockNot }
      return { eq: mockEq }
    }),
    insert: mockInsert,
  }))
  const mockRequireAuth = vi.fn()
  const mockRequireAdmin = vi.fn()
  return { mockSingle, mockOrder, mockIn, mockFrom, mockRequireAuth, mockRequireAdmin }
})

vi.mock("@/lib/supabase", () => ({
  supabase: { from: mockFrom },
}))

vi.mock("@/lib/auth/middleware", () => ({
  requireAuth: (...args: any[]) => mockRequireAuth(...args),
  requireAdmin: (...args: any[]) => mockRequireAdmin(...args),
  isSession: vi.fn((val: any) => val && typeof val === "object" && "sub" in val),
}))

import { POST, GET } from "@/app/api/prosumers/route"

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/prosumers", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

describe("POST /api/prosumers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({
      sub: ADDR,
      cooperative_ids: [COOP_ID],
      admin_cooperative_ids: [COOP_ID],
    })
  })

  it("rechaza sin campos requeridos → 400", async () => {
    const res = await POST(makePostRequest({ name: "Test" }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Validation failed/)
  })

  it("rechaza si panel_capacity_kw es negativo → 400", async () => {
    const res = await POST(
      makePostRequest({
        stellar_address: ADDR,
        cooperative_id: COOP_ID,
        name: "Solar Prosumer",
        panel_capacity_kw: -5.0,
      })
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Validation failed/)
  })

  it("rechaza si el llamador no es administrador de la cooperativa → 403", async () => {
    mockRequireAdmin.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Forbidden: Not an admin for this cooperative" }), {
        status: 403,
      })
    )

    const res = await POST(
      makePostRequest({
        stellar_address: ADDR,
        cooperative_id: OTHER_COOP_ID,
        name: "Test",
        panel_capacity_kw: 4.0,
      })
    )
    expect(res.status).toBe(403)
  })

  it("rechaza si la sesión no está autenticada → 401", async () => {
    mockRequireAdmin.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    )

    const res = await POST(
      makePostRequest({
        stellar_address: ADDR,
        cooperative_id: COOP_ID,
        name: "Test",
        panel_capacity_kw: 4.0,
      })
    )
    expect(res.status).toBe(401)
  })

  it("crea prosumidor válido → 201", async () => {
    const fakeProsumer = {
      id: "uuid-1",
      stellar_address: ADDR,
      cooperative_id: COOP_ID,
      name: "Test Prosumer",
      panel_capacity_kw: 3.5,
      battery_capacity_kwh: 5.0,
    }
    mockSingle.mockResolvedValueOnce({ data: fakeProsumer, error: null })

    const res = await POST(
      makePostRequest({
        stellar_address: ADDR,
        cooperative_id: COOP_ID,
        name: "Test Prosumer",
        panel_capacity_kw: 3.5,
        battery_capacity_kwh: 5.0,
      })
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.stellar_address).toBe(ADDR)
    expect(json.name).toBe("Test Prosumer")
  })

  it("maneja error de base de datos de Supabase en inserción → 500", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "Database connection failed", code: "500" },
    })

    const res = await POST(
      makePostRequest({
        stellar_address: ADDR,
        cooperative_id: COOP_ID,
        name: "Test",
        panel_capacity_kw: 3.5,
      })
    )
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })
})

describe("GET /api/prosumers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue({
      sub: ADDR,
      cooperative_ids: [COOP_ID],
      admin_cooperative_ids: [COOP_ID],
    })
  })

  it("lista prosumidores scoped a cooperativa autorizada → 200", async () => {
    const fakeProsumers = [
      { id: "1", stellar_address: ADDR, name: "Prosumer A", panel_capacity_kw: 4.0 },
      { id: "2", stellar_address: OTHER_ADDR, name: "Prosumer B", panel_capacity_kw: 6.2 },
    ]
    mockIn.mockReturnValueOnce({ data: fakeProsumers, error: null })

    const res = await GET(new NextRequest("http://localhost/api/prosumers"))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(2)
    expect(json[0].name).toBe("Prosumer A")
  })

  it("rechaza si el usuario no tiene cooperativas asociadas → 403", async () => {
    mockRequireAuth.mockResolvedValueOnce({
      sub: ADDR,
      cooperative_ids: [],
      admin_cooperative_ids: [],
    })

    const res = await GET(new NextRequest("http://localhost/api/prosumers"))
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toMatch(/No associated cooperatives/)
  })

  it("rechaza si falta la cookie de sesión de autenticación → 401", async () => {
    mockRequireAuth.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    )

    const res = await GET(new NextRequest("http://localhost/api/prosumers"))
    expect(res.status).toBe(401)
  })

  it("retorna lista vacía si la cooperativa no tiene prosumidores → 200", async () => {
    mockIn.mockReturnValueOnce({ data: [], error: null })

    const res = await GET(new NextRequest("http://localhost/api/prosumers"))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual([])
  })

  it("maneja fallo de consulta en Supabase al listar prosumidores → 500", async () => {
    mockIn.mockReturnValueOnce({
      data: null,
      error: { message: "Internal DB Timeout", code: "PGRST000" },
    })

    const res = await GET(new NextRequest("http://localhost/api/prosumers"))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })
})

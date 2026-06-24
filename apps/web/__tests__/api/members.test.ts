import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const ADDR = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
const COOP_ID = "00000000-0000-0000-0000-000000000001"

const { mockSingle, mockOrder, mockIn, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockIn = vi.fn(() => ({ data: [], error: null }))
  const mockOrder = vi.fn(() => ({ data: [], error: null, in: mockIn }))
  const mockEq: ReturnType<typeof vi.fn> = vi.fn(() => ({ order: mockOrder, eq: mockEq, single: mockSingle }))
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

import { GET, POST } from "@/app/api/members/route"
import { requireAuth } from "@/lib/auth/middleware"

function makeGet(params = "") {
  return new NextRequest(`http://localhost/api/members${params}`)
}

function makePost(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/members", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

describe("GET /api/members", () => {
  beforeEach(() => vi.clearAllMocks())

  it("lista miembros scoped a cooperativa", async () => {
    const fakeMembers = [{ id: "1", stellar_address: ADDR }]
    mockIn.mockReturnValueOnce({ data: fakeMembers, error: null })

    const res = await GET(makeGet())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
  })
})

describe("POST /api/members", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rechaza sin campos requeridos → 400", async () => {
    const res = await POST(makePost({ name: "Test" }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Validation failed/)
  })

  it("crea miembro válido → 201", async () => {
    const fakeMember = { id: "uuid-1", stellar_address: ADDR, cooperative_id: COOP_ID }
    mockSingle.mockResolvedValueOnce({ data: fakeMember, error: null })

    const res = await POST(
      makePost({ stellar_address: ADDR })
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.stellar_address).toBe(ADDR)
  })
})

// ── New test cases for Issue #178 ──────────────────────────────────────────

describe("GET /api/members — 403 boundary", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rechaza cooperative_id fuera del scope del caller → 403", async () => {
    // Override: session has no cooperative memberships
    vi.mocked(requireAuth).mockImplementationOnce(async () => ({
      sub: ADDR,
      cooperative_ids: [],
      admin_cooperative_ids: [],
      is_super_admin: false,
      iat: 0,
      exp: 9_999_999_999,
    }))

    const res = await GET(makeGet(`?cooperative_id=${COOP_ID}`))
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe("Access denied")
  })
})

describe("POST /api/members — 400 validation vectors", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rechaza dirección Stellar inválida (no empieza con G) → 400", async () => {
    const res = await POST(
      makePost({ stellar_address: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" })
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Validation failed/)
  })

  it("crea miembro y verifica shape completa del response → 201", async () => {
    const fakeMember = {
      id: "uuid-2",
      stellar_address: ADDR,
      cooperative_id: COOP_ID,
      name: "Alice",
      panel_capacity_kw: 5,
      role: "prosumer",
      created_at: new Date().toISOString(),
    }
    mockSingle.mockResolvedValueOnce({ data: fakeMember, error: null })

    const res = await POST(
      makePost({ stellar_address: ADDR, name: "Alice", panel_capacity_kw: 5, cooperative_id: COOP_ID })
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toMatchObject({
      id: "uuid-2",
      stellar_address: ADDR,
      cooperative_id: COOP_ID,
      name: "Alice",
      role: "prosumer",
    })
  })
})

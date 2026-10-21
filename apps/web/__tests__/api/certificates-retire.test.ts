import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"

const ADDR = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
const COOP_ID = "00000000-0000-0000-0000-000000000001"
const CERT_ID = "00000000-0000-0000-0000-000000000002"
const OTHER_COOP = "00000000-0000-0000-0000-000000000099"

const { mockSingle, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockEq: ReturnType<typeof vi.fn> = vi.fn(() => ({ single: mockSingle, eq: mockEq }))
  const mockUpdate = vi.fn(() => ({ eq: mockEq }))
  const mockSelect = vi.fn(() => ({ single: mockSingle }))
  const mockInsert = vi.fn(() => ({ select: mockSelect }))
  const mockFrom = vi.fn(() => ({
    select: vi.fn(() => ({ eq: mockEq })),
    update: mockUpdate,
    insert: mockInsert,
  }))
  return { mockSingle, mockFrom }
})

vi.mock("@/lib/supabase", () => ({
  supabase: { from: mockFrom },
}))

vi.mock("@/lib/auth/middleware", () => ({
  requireAdmin: vi.fn(async () => ({
    sub: ADDR,
    cooperative_ids: [COOP_ID],
    admin_cooperative_ids: [COOP_ID],
  })),
  isSession: vi.fn((result: unknown) => {
    return typeof result === "object" && result !== null && "sub" in result
  }),
}))

vi.mock("@stellar/stellar-sdk", () => ({
  rpc: { Server: vi.fn() },
  Keypair: { fromSecret: vi.fn() },
  Contract: vi.fn(),
  TransactionBuilder: vi.fn(),
  nativeToScVal: vi.fn(),
}))

vi.mock("@/lib/contracts-config", () => ({
  CONTRACTS: { ENERGY_TOKEN: "CFAKECONTRACT" },
  STELLAR_CONFIG: { RPC_URL: "https://fake-rpc.stellar.org" },
  NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
}))

import { POST } from "@/app/api/certificates/retire/route"
import { requireAdmin, isSession } from "@/lib/auth/middleware"

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/certificates/retire", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

describe("POST /api/certificates/retire", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    vi.mocked(requireAdmin).mockResolvedValue({
      sub: ADDR,
      cooperative_ids: [COOP_ID],
      admin_cooperative_ids: [COOP_ID],
    } as never)
    vi.mocked(isSession).mockImplementation(
      (r) => typeof r === "object" && r !== null && "sub" in r
    )
  })

  it("rejects missing certificate_id → 400", async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it("rejects invalid buyer_purpose → 400", async () => {
    const res = await POST(
      makeRequest({
        certificate_id: CERT_ID,
        buyer_purpose: "fun",
      })
    )
    expect(res.status).toBe(400)
  })

  it("rejects missing certificate → 404", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: "not found" } })

    const res = await POST(
      makeRequest({
        certificate_id: CERT_ID,
        buyer_purpose: "billing_settlement",
      })
    )
    expect(res.status).toBe(404)
  })

  it("rejects non-admin of cooperative → 403", async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: CERT_ID,
        status: "available",
        total_kwh: 100,
        cooperative_id: OTHER_COOP,
      },
      error: null,
    })
    vi.mocked(requireAdmin).mockResolvedValueOnce(
      NextResponse.json({ error: "Admin access required" }, { status: 403 }) as never
    )
    vi.mocked(isSession).mockReturnValueOnce(false)

    const res = await POST(
      makeRequest({
        certificate_id: CERT_ID,
        buyer_purpose: "billing_settlement",
      })
    )
    expect(res.status).toBe(403)
  })

  it("rejects status != available → 400", async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: CERT_ID,
        status: "pending",
        total_kwh: 100,
        cooperative_id: COOP_ID,
      },
      error: null,
    })

    const res = await POST(
      makeRequest({
        certificate_id: CERT_ID,
        buyer_purpose: "billing_settlement",
      })
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/pending/)
  })

  it("rejects without MINTER_SECRET_KEY → 500", async () => {
    delete process.env.MINTER_SECRET_KEY

    mockSingle.mockResolvedValueOnce({
      data: {
        id: CERT_ID,
        status: "available",
        total_kwh: 100,
        cooperative_id: COOP_ID,
      },
      error: null,
    })

    const res = await POST(
      makeRequest({
        certificate_id: CERT_ID,
        buyer_purpose: "billing_settlement",
      })
    )
    expect(res.status).toBe(500)
  })
})
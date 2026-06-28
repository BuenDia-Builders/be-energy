import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const COOP_ID = "00000000-0000-0000-0000-000000000001"
const CERT_ID = "11111111-1111-1111-1111-111111111111"
const BAD_ID = "00000000-0000-0000-0000-000000000000"
const TX_HASH = "abc123deadbeef"
const BURN_TX = "burn9999999999"

function buildCert(overrides: Record<string, unknown> = {}) {
  return {
    id: CERT_ID,
    cooperative_id: COOP_ID,
    generation_period_start: "2025-01-01T00:00:00Z",
    generation_period_end: "2025-01-31T23:59:59Z",
    total_kwh: 500,
    technology: "solar",
    location: "Buenos Aires",
    status: "available",
    mint_tx_hash: TX_HASH,
    token_amount: 500,
    created_at: "2025-02-01T00:00:00Z",
    cooperatives: {
      name: "Cooperativa Solar",
      technology: "solar",
      location: "Buenos Aires",
      admin_stellar_address: "GCOOP1234",
    },
    ...overrides,
  }
}

function buildRetirement(overrides: Record<string, unknown> = {}) {
  return {
    id: "ret-1",
    certificate_id: CERT_ID,
    buyer_address: "GBUYER123456789",
    buyer_name: "EcoCorp S.A.",
    buyer_purpose: "esg_reporting",
    kwh_retired: 500,
    burn_tx_hash: BURN_TX,
    retired_at: "2025-03-01T00:00:00Z",
    ...overrides,
  }
}

const { mockFrom, mockSingle } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockEq = vi.fn(() => ({ single: mockSingle }))
  const mockSelect = vi.fn(() => ({ eq: mockEq }))
  const mockFrom = vi.fn(() => ({ select: mockSelect }))
  return { mockFrom, mockSingle }
})

vi.mock("@/lib/supabase", () => ({
  supabase: { from: mockFrom },
}))

vi.mock("@/lib/contracts-config", () => ({
  STELLAR_CONFIG: { NETWORK: "TESTNET" },
}))

import { GET } from "@/app/api/certificates/[id]/route"

function makeGet(id: string) {
  return new NextRequest(`http://localhost/api/certificates/${id}`)
}

describe("GET /api/certificates/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns full certificate data with cooperative for valid ID", async () => {
    const cert = buildCert()
    mockSingle.mockResolvedValueOnce({ data: cert, error: null })
    mockSingle.mockResolvedValueOnce({ data: null, error: null })

    const res = await GET(makeGet(CERT_ID), {
      params: Promise.resolve({ id: CERT_ID }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe(CERT_ID)
    expect(json.total_kwh).toBe(500)
    expect(json.status).toBe("available")
    expect(json.cooperatives.name).toBe("Cooperativa Solar")
    expect(json.stellar_expert_link).toBe(
      `https://stellar.expert/explorer/testnet/tx/${TX_HASH}`
    )
    expect(json.retirement).toBeNull()
  })

  it("returns 404 for non-existent certificate ID", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null })

    const res = await GET(makeGet(BAD_ID), {
      params: Promise.resolve({ id: BAD_ID }),
    })
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe("Certificate not found")
  })

  it("returns 404 when supabase returns error", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error", code: "PGRST116" },
    })

    const res = await GET(makeGet(CERT_ID), {
      params: Promise.resolve({ id: CERT_ID }),
    })
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe("Certificate not found")
  })

  it("includes retirement data when certificate is retired", async () => {
    const cert = buildCert({ status: "retired" })
    const retirement = buildRetirement({ buyer_name: "EcoCorp S.A.", buyer_purpose: "esg_reporting", burn_tx_hash: BURN_TX })

    mockSingle.mockResolvedValueOnce({ data: cert, error: null })
    mockSingle.mockResolvedValueOnce({ data: retirement, error: null })

    const res = await GET(makeGet(CERT_ID), {
      params: Promise.resolve({ id: CERT_ID }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.retirement).not.toBeNull()
    expect(json.retirement.buyer_name).toBe("EcoCorp S.A.")
    expect(json.retirement.buyer_purpose).toBe("esg_reporting")
    expect(json.retirement.burn_tx_hash).toBe(BURN_TX)
  })

  it("does not include retirement data for pending certificate", async () => {
    const cert = buildCert({ status: "pending", mint_tx_hash: null })

    mockSingle.mockResolvedValueOnce({ data: cert, error: null })
    mockSingle.mockResolvedValueOnce({ data: null, error: null })

    const res = await GET(makeGet(CERT_ID), {
      params: Promise.resolve({ id: CERT_ID }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.retirement).toBeNull()
  })
})

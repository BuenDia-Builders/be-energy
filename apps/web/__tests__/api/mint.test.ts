import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const ADDR = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
const COOP_ID = "00000000-0000-0000-0000-000000000001"
const READING_ID = "00000000-0000-0000-0000-000000000003"
const CERT_ID = "00000000-0000-0000-0000-000000000002"

const {
  mockSingle,
  mockFrom,
  mockGetAccount,
  mockPrepareTransaction,
  mockSendTransaction,
  mockGetTransaction,
  mockNativeToScVal,
  mockPublicKey,
} = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockEq: ReturnType<typeof vi.fn> = vi.fn(() => ({ single: mockSingle, eq: mockEq }))
  const mockUpdate = vi.fn(() => ({ eq: mockEq }))
  const mockInsert = vi.fn(() => ({ error: null }))
  const mockFrom = vi.fn(() => ({
    select: vi.fn(() => ({ eq: mockEq })),
    update: mockUpdate,
    insert: mockInsert,
  }))

  const mockGetAccount = vi.fn()
  const mockPrepareTransaction = vi.fn()
  const mockSendTransaction = vi.fn()
  const mockGetTransaction = vi.fn()
  const mockNativeToScVal = vi.fn((value) => value)
  const mockPublicKey = vi.fn(() => ADDR)

  return {
    mockSingle,
    mockFrom,
    mockGetAccount,
    mockPrepareTransaction,
    mockSendTransaction,
    mockGetTransaction,
    mockNativeToScVal,
    mockPublicKey,
  }
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

vi.mock("@stellar/stellar-sdk", () => ({
  rpc: {
    Server: vi.fn(function MockServer() {
      return {
        getAccount: mockGetAccount,
        prepareTransaction: mockPrepareTransaction,
        sendTransaction: mockSendTransaction,
        getTransaction: mockGetTransaction,
      }
    }),
  },
  Keypair: {
    fromSecret: vi.fn(() => ({
      publicKey: mockPublicKey,
    })),
  },
  Contract: vi.fn(function MockContract() {
    return {
      call: vi.fn(() => ({ op: "mint_energy" })),
    }
  }),
  TransactionBuilder: vi.fn(function MockTransactionBuilder() {
    return {
      addOperation: vi.fn().mockReturnThis(),
      build: vi.fn(() => ({ sign: vi.fn() })),
    }
  }),
  nativeToScVal: mockNativeToScVal,
  BASE_FEE: "100",
}))

vi.mock("@/lib/contracts-config", () => ({
  CONTRACTS: { ENERGY_TOKEN: "CFAKECONTRACT" },
  STELLAR_CONFIG: { RPC_URL: "https://fake-rpc.stellar.org" },
  NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
}))

import { POST } from "@/app/api/mint/route"

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/mint", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

describe("POST /api/mint", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    mockGetAccount.mockResolvedValue({ id: "account" })
    mockPrepareTransaction.mockResolvedValue({ sign: vi.fn() })
    mockSendTransaction.mockResolvedValue({ status: "PENDING", hash: "tx-hash-123" })
    mockGetTransaction.mockResolvedValue({ status: "SUCCESS" })
  })

  it("rechaza sin reading_id ni certificate_id → 400", async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it("rechaza si reading no existe → 404", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: "not found" } })
    process.env.MINTER_SECRET_KEY = "SFAKE"

    const res = await POST(makeRequest({ reading_id: READING_ID }))
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toMatch(/Reading not found/)
  })

  it("rechaza si la lectura ya fue minted → 400", async () => {
    process.env.MINTER_SECRET_KEY = "SFAKE"

    mockSingle.mockResolvedValueOnce({
      data: {
        id: READING_ID,
        status: "minted",
        kwh_generated: 5,
        prosumers: { stellar_address: ADDR },
      },
      error: null,
    })

    const res = await POST(makeRequest({ reading_id: READING_ID }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/minted/)
  })

  it("rechaza si MINTER_SECRET_KEY no está configurada → 500", async () => {
    delete process.env.MINTER_SECRET_KEY

    const res = await POST(makeRequest({ reading_id: READING_ID }))
    expect(res.status).toBe(500)
  })

  it("rechaza certificate con status != pending → 400", async () => {
    process.env.MINTER_SECRET_KEY = "SFAKE"

    mockSingle.mockResolvedValueOnce({
      data: {
        id: CERT_ID,
        cooperative_id: COOP_ID,
        status: "available",
        total_kwh: 100,
        cooperatives: { admin_stellar_address: ADDR, token_contract_address: null },
      },
      error: null,
    })

    const res = await POST(makeRequest({ certificate_id: CERT_ID }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/available/)
  })

  it("minta exactamente kwh_injected cuando está disponible", async () => {
    process.env.MINTER_SECRET_KEY = "SFAKE"

    mockSingle.mockResolvedValueOnce({
      data: {
        id: READING_ID,
        cooperative_id: COOP_ID,
        status: "pending",
        kwh_injected: 4.25,
        kwh_generated: 7,
        kwh_self_consumed: 2,
        prosumers: { stellar_address: ADDR },
      },
      error: null,
    })

    const res = await POST(makeRequest({ reading_id: READING_ID }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.amount_hdrop).toBe(4.25)
    expect(mockNativeToScVal).toHaveBeenCalledWith(BigInt(42500000), { type: "i128" })
  })

  it("minta generated - self_consumed cuando no hay kwh_injected", async () => {
    process.env.MINTER_SECRET_KEY = "SFAKE"

    mockSingle.mockResolvedValueOnce({
      data: {
        id: READING_ID,
        cooperative_id: COOP_ID,
        status: "pending",
        kwh_injected: null,
        kwh_generated: 8,
        kwh_self_consumed: 3,
        prosumers: { stellar_address: ADDR },
      },
      error: null,
    })

    const res = await POST(makeRequest({ reading_id: READING_ID }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.amount_hdrop).toBe(5)
    expect(mockNativeToScVal).toHaveBeenCalledWith(BigInt(50000000), { type: "i128" })
  })

  it("rechaza generated sin self_consumed cuando falta kwh_injected", async () => {
    process.env.MINTER_SECRET_KEY = "SFAKE"

    mockSingle.mockResolvedValueOnce({
      data: {
        id: READING_ID,
        cooperative_id: COOP_ID,
        status: "pending",
        kwh_injected: null,
        kwh_generated: 8,
        kwh_self_consumed: null,
        prosumers: { stellar_address: ADDR },
      },
      error: null,
    })

    const res = await POST(makeRequest({ reading_id: READING_ID }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/kwh_self_consumed/)
  })

  it("rechaza cuando faltan kwh_injected y kwh_generated", async () => {
    process.env.MINTER_SECRET_KEY = "SFAKE"

    mockSingle.mockResolvedValueOnce({
      data: {
        id: READING_ID,
        cooperative_id: COOP_ID,
        status: "pending",
        kwh_injected: null,
        kwh_generated: null,
        kwh_self_consumed: 1,
        prosumers: { stellar_address: ADDR },
      },
      error: null,
    })

    const res = await POST(makeRequest({ reading_id: READING_ID }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/missing both kwh_injected and kwh_generated/)
  })

  it("nunca mintea un valor negativo", async () => {
    process.env.MINTER_SECRET_KEY = "SFAKE"

    mockSingle.mockResolvedValueOnce({
      data: {
        id: READING_ID,
        cooperative_id: COOP_ID,
        status: "pending",
        kwh_injected: null,
        kwh_generated: 3,
        kwh_self_consumed: 5,
        prosumers: { stellar_address: ADDR },
      },
      error: null,
    })

    const res = await POST(makeRequest({ reading_id: READING_ID }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.amount_hdrop).toBe(0)
    expect(mockNativeToScVal).toHaveBeenCalledWith(BigInt(0), { type: "i128" })
  })
})

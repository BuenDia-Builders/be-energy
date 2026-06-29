import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const ADDR = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

const { mockRpc, mockCheckRateLimit } = vi.hoisted(() => {
  const mockRpc = vi.fn();
  const mockCheckRateLimit = vi.fn(async () => null);
  return { mockRpc, mockCheckRateLimit };
});

const { mockFrom, mockSingle } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockEq: ReturnType<typeof vi.fn> = vi.fn(() => ({
    single: mockSingle,
    eq: mockEq,
  }));
  const mockDelete = vi.fn(() => ({ lt: vi.fn(() => ({})) }));
  const mockInsert = vi.fn(() => ({ error: null }));
  const mockFrom = vi.fn(() => ({
    delete: mockDelete,
    insert: mockInsert,
    select: vi.fn(() => ({ eq: mockEq })),
  }));
  return { mockFrom, mockSingle };
});

vi.mock("@/lib/supabase", () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}));

vi.mock("@/lib/auth/stellar-verify", () => ({
  isValidStellarAddress: vi.fn(() => true),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

import { POST } from "@/app/api/auth/challenge/route";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/auth/challenge", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/challenge", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when stellar_address is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 429 with Retry-After when IP rate limit is exceeded", async () => {
    const { NextResponse } = await import("next/server");
    mockCheckRateLimit.mockResolvedValueOnce(
      NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": "60" },
        },
      ),
    );

    const res = await POST(makeRequest({ stellar_address: ADDR }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
  });

  it("returns 200 for a single request under the limit (no false positives)", async () => {
    mockCheckRateLimit.mockResolvedValueOnce(null);
    mockFrom.mockReturnValueOnce({
      delete: vi.fn(() => ({ lt: vi.fn(() => ({})) })),
    });
    mockFrom.mockReturnValueOnce({ insert: vi.fn(() => ({ error: null })) });

    const res = await POST(makeRequest({ stellar_address: ADDR }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("challenge");
  });
});

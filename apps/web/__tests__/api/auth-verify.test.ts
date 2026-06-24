import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const ADDR = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const CHALLENGE = "abc123";
const SIG = "sig";

const { mockCheckRateLimit } = vi.hoisted(() => {
  const mockCheckRateLimit = vi.fn(async () => null);
  return { mockCheckRateLimit };
});

const { mockFrom, mockSingle } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockEq: ReturnType<typeof vi.fn> = vi.fn(() => ({
    single: mockSingle,
    eq: mockEq,
  }));
  const mockDelete = vi.fn(() => ({ eq: vi.fn(() => ({})) }));
  const mockFrom = vi.fn(() => ({
    select: vi.fn(() => ({ eq: mockEq })),
    delete: mockDelete,
  }));
  return { mockFrom, mockSingle };
});

vi.mock("@/lib/supabase", () => ({
  supabase: { from: mockFrom },
}));

vi.mock("@/lib/auth/stellar-verify", () => ({
  isValidStellarAddress: vi.fn(() => true),
  verifySignature: vi.fn(() => true),
}));

vi.mock("@/lib/auth/roles", () => ({
  resolveRoles: vi.fn(async () => ({
    cooperative_ids: [],
    admin_cooperative_ids: [],
  })),
}));

vi.mock("@/lib/auth/jwt", () => ({
  signJWT: vi.fn(async () => "token"),
}));

vi.mock("@/lib/auth/session", () => ({
  setSessionCookie: vi.fn((res) => res),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

import { POST } from "@/app/api/auth/verify/route";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/auth/verify", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const validBody = {
  stellar_address: ADDR,
  challenge: CHALLENGE,
  signature: SIG,
};

describe("POST /api/auth/verify", () => {
  beforeEach(() => vi.clearAllMocks());

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

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
  });

  it("returns 429 with Retry-After when per-wallet rate limit is exceeded", async () => {
    const { NextResponse } = await import("next/server");
    // IP check passes, wallet check fails
    mockCheckRateLimit.mockResolvedValueOnce(null).mockResolvedValueOnce(
      NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": "60" },
        },
      ),
    );

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
  });

  it("returns 200 for a single request under the limit (no false positives)", async () => {
    mockCheckRateLimit.mockResolvedValue(null);
    mockSingle.mockResolvedValueOnce({
      data: {
        id: "id-1",
        stellar_address: ADDR,
        challenge: CHALLENGE,
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
      error: null,
    });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
  });

  it("returns 400 when required fields are missing", async () => {
    mockCheckRateLimit.mockResolvedValue(null);
    const res = await POST(makeRequest({ stellar_address: ADDR }));
    expect(res.status).toBe(400);
  });
});

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { supabase } from "@/lib/supabase";
import { isValidStellarAddress } from "@/lib/auth/stellar-verify";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimitResponse = await checkRateLimit(ip, "auth/challenge");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const { stellar_address } = body;

    if (!stellar_address || !isValidStellarAddress(stellar_address)) {
      return NextResponse.json(
        { error: "Valid stellar_address required" },
        { status: 400 },
      );
    }

    // Generate random challenge
    const challenge = randomBytes(32).toString("hex");
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min TTL

    // Clean expired challenges first
    await supabase
      .from("auth_challenges")
      .delete()
      .lt("expires_at", new Date().toISOString());

    // Store challenge
    const { error } = await supabase.from("auth_challenges").insert({
      stellar_address,
      challenge,
      expires_at,
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to create challenge" },
        { status: 500 },
      );
    }

    return NextResponse.json({ challenge });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

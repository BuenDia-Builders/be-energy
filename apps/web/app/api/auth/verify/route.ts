import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  isValidStellarAddress,
  verifySignature,
} from "@/lib/auth/stellar-verify";
import { resolveRoles } from "@/lib/auth/roles";
import { signJWT } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const ipLimit = await checkRateLimit(ip, "auth/verify");
  if (ipLimit) return ipLimit;

  try {
    const body = await req.json();
    const { stellar_address, challenge, signature } = body;

    if (!stellar_address || !challenge || !signature) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: stellar_address, challenge, signature",
        },
        { status: 400 },
      );
    }

    if (!isValidStellarAddress(stellar_address)) {
      return NextResponse.json(
        { error: "Invalid stellar_address" },
        { status: 400 },
      );
    }

    // Per-wallet rate limit (5 attempts per minute per address)
    const walletLimit = await checkRateLimit(stellar_address, "auth/verify");
    if (walletLimit) return walletLimit;

    // Lookup challenge
    const { data: stored, error: lookupError } = await supabase
      .from("auth_challenges")
      .select("*")
      .eq("challenge", challenge)
      .eq("stellar_address", stellar_address)
      .single();

    if (lookupError || !stored) {
      return NextResponse.json(
        { error: "Invalid or expired challenge" },
        { status: 401 },
      );
    }

    // Check expiry
    if (new Date(stored.expires_at) < new Date()) {
      await supabase.from("auth_challenges").delete().eq("id", stored.id);
      return NextResponse.json({ error: "Challenge expired" }, { status: 401 });
    }

    // Verify signature
    if (!verifySignature(stellar_address, challenge, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Delete used challenge
    await supabase.from("auth_challenges").delete().eq("id", stored.id);

    // Resolve roles
    const roles = await resolveRoles(stellar_address);

    // Check super admin
    const superAdminAddresses = (process.env.SUPER_ADMIN_ADDRESSES || "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    const is_super_admin = superAdminAddresses.includes(stellar_address);

    // Sign JWT
    const token = await signJWT({
      sub: stellar_address,
      cooperative_ids: roles.cooperative_ids,
      admin_cooperative_ids: roles.admin_cooperative_ids,
      is_super_admin,
    });

    // Set cookie and return session info
    const response = NextResponse.json({
      stellar_address,
      cooperative_ids: roles.cooperative_ids,
      admin_cooperative_ids: roles.admin_cooperative_ids,
      is_super_admin,
    });

    return setSessionCookie(response, token);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

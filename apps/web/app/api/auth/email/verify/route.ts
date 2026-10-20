/**
 * AUDIT NOTE (2024) — WALLET PROVISION PATH — STATUS: DORMANT / UNVERIFIED
 *
 * Email OTP verification endpoint. On first login it provisions a Stellar wallet
 * via one of two paths:
 *   1. DFNS custodial wallet — only when isDfnsConfigured() returns true.
 *   2. server_keypair fallback — random Keypair funded via Friendbot (testnet).
 *      This is the path exercised when DFNS env vars are absent.
 *
 * Audit findings:
 *  - No UI code imports or references DFNS directly; the non-custodial Stellar
 *    Wallets Kit is used everywhere else in the UI.
 *  - Whether DFNS env vars are set in Vercel production could NOT be verified from
 *    the repository. Treat this path as "dormant / unverified" until a
 *    maintainer confirms the production environment.
 *  - Do NOT delete or disable the DFNS branch here — removal is a separate follow-up
 *    issue contingent on that confirmation.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Keypair } from "@stellar/stellar-sdk"
import { supabase } from "@/lib/supabase"
import { signJWT } from "@/lib/auth/jwt"
import { setSessionCookie } from "@/lib/auth/session"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { isDfnsConfigured, getOrCreateStellarWallet } from "@/lib/dfns"

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const limit = await checkRateLimit(ip, "auth/email/verify")
  if (limit) return limit

  try {
    const { email, token } = await req.json()
    if (!email || !token) {
      return NextResponse.json({ error: "Email y código requeridos" }, { status: 400 })
    }

    // Verify OTP with Supabase Auth
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: authData, error: authError } = await authClient.auth.verifyOtp({
      email,
      token,
      type: "email",
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Ãdigo incorrecto o expirado" }, { status: 401 })
    }

    const userId = authData.user.id

    // Check if user already has a Stellar wallet
    const { data: existingUser } = await supabase
      .from("users")
      .select("stellar_address, dfns_wallet_id, name, avatar_url")
      .eq("email", email)
      .single()

    let stellarAddress: string
    let dfnsWalletId: string | null = null
    let isNewUser = false

    if (existingUser?.stellar_address) {
      // Returning user
      stellarAddress = existingUser.stellar_address
      dfnsWalletId = existingUser.dfns_wallet_id ?? null
    } else {
      isNewUser = true

      if (isDfnsConfigured()) {
        // DFNS custodial path — dormant / unverified in prod (see file header).
        // Does not run unless DFNS_AUTH_TOKEN, DFNS_PRIVATE_KEY, DFNS_CRED_ID are all set.
        const wallet = await getOrCreateStellarWallet(userId)
        stellarAddress = wallet.stellarAddress
        dfnsWalletId = wallet.walletId
      } else {
        // Fallback: server-side keypair (testnet demo) — the path exercised
        // when DFNS env vars are absent.
        const kp = Keypair.random()
        stellarAddress = kp.publicKey()

        // Fund on testnet via Friendbot
        await fetch(
          `https://friendbot.stellar.org?addr=${encodeURIComponent(stellarAddress)}`
        ).catch(() => null)
      }

      // Store in Supabase
      await supabase.from("users").upsert({
        email,
        stellar_address: stellarAddress,
        dfns_wallet_id: dfnsWalletId,
        auth_provider: dfnsWalletId ? "dfns" : "server_keypair",
      })
    }

    // Resolve roles (same logic as Freighter auth)
    const superAdmins = (process.env.SUPER_ADMIN_ADDRESSES ?? "").split(",")
    const isSuperAdmin = superAdmins.includes(stellarAddress)

    const { data: cooperativeAdmin } = await supabase
      .from("cooperative_members")
      .select("cooperative_id")
      .eq("stellar_address", stellarAddress)
      .eq("role", "admin")

    const adminCooperativeIds = (cooperativeAdmin ?? []).map((r: { cooperative_id: string }) => r.cooperative_id)

    const payload = {
      sub: stellarAddress,
      cooperative_ids: adminCooperativeIds,
      admin_cooperative_ids: adminCooperativeIds,
      is_super_admin: isSuperAdmin,
    }

    const token_jwt = await signJWT(payload)
    const response = NextResponse.json({
      ok: true,
      stellar_address: stellarAddress,
      is_new_user: isNewUser,
      auth_method: dfnsWalletId ? "dfns" : "server_keypair",
    })

    setSessionCookie(response, token_jwt)
    return response
  } catch (err) {
    console.error("Email verify error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

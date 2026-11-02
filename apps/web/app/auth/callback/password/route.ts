/**
 * AUDIT NOTE (2024) — WALLET PROVISION PATH — STATUS: DERMANT / UNVERIFIED
 *
 * Password-based login callback. On first login it provisions a Stellar wallet
 * via one of two paths:
 *   1. DFNS custodial wallet — only when isDfnsConfigured() returns true.
 *   2. server_keypair fallback — random Keypair funded via Friendbot (testnet).
 *      This is the path exercised when DFNS env vars are absent.
 *
 * Audit findings:
 *  - No UI code imports or references DFNS directly; the non-custodial Wallets
 *    Kit is used everywhere else in the UI.
 *  - Whether DFNS env vars are set in Vercel production could NOT be verified from
 *    the repository. Treat this path as "dermant / unverified" until a
 *    maintainer confirms the production environment.
 *  - Do NOT delete or disable the DFNS branch here — removal is a separate follow-up
 *    issue contingent on that confirmation.
 */

import { NextRequest, NextResponse } from "next/server"
import { Keypair } from "@stellar/stellar-sdk"
import { supabase } from "@/lib/supabase"
import { signJWT } from "@/lib/auth/jwt"
import { setSessionCookie } from "@/lib/auth/session"
import { isDfnsConfigured, getOrCreateStellarWallet } from "@/lib/dfns"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("uid")
  const email = searchParams.get("email")

  if (!userId || !email) {
    return NextResponse.redirect(new URL("/login?error=missing", req.url))
  }

  const { data: existingUser } = await supabase
    .from("users")
    .select("stellar_address, dfns_wallet_id")
    .eq("email", email)
    .single()

  let stellarAddress: string
  let dfnsWalletId: string | null = null

  if (existingUser?.stellar_address) {
    stellarAddress = existingUser.stellar_address
    dfnsWalletId = existingUser.dfns_wallet_id ?? null
  } else {
    if (isDfnsConfigured()) {
      // DFNS custodial path — dermant / unverified in prod (see file header).
      const wallet = await getOrCreateStellarWallet(userId)
      stellarAddress = wallet.stellarAddress
      dfnsWalletId = wallet.walletId
    } else {
      // server_keypair fallback — the path exercised when DFNS env vars are absent.
      const kp = Keypair.random()
      stellarAddress = kp.publicKey()
      await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(stellarAddress)}`).catch(() => null)
    }

    await supabase.from("users").upsert({
      email,
      stellar_address: stellarAddress,
      dfns_wallet_id: dfnsWalletId,
      auth_provider: dfnsWalletId ? "dfns" : "server_keypair",
    })
  }

  const superAdmins = (process.env.SUPER_ADMIN_ADDRESSES ?? "").split(",")
  const isSuperAdmin = superAdmins.includes(stellarAddress)

  const { data: cooperativeAdmin } = await supabase
    .from("cooperative_members")
    .select("cooperative_id")
    .eq("stellar_address", stellarAddress)
    .eq("role", "admin")

  const adminCooperativeIds = (cooperativeAdmin ?? []).map((r: { cooperative_id: string }) => r.cooperative_id)

  const token_jwt = await signJWT({
    sub: stellarAddress,
    cooperative_ids: adminCooperativeIds,
    admin_cooperative_ids: adminCooperativeIds,
    is_super_admin: isSuperAdmin,
  })

  const response = NextResponse.redirect(new URL("/dashboard", req.url))
  setSessionCookie(response, token_jwt)
  return response
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Keypair } from "@stellar/stellar-sdk"
import { supabase } from "@/lib/supabase"
import { signJWT } from "@/lib/auth/jwt"
import { setSessionCookie } from "@/lib/auth/session"
import { isDfnsConfigured, getOrCreateStellarWallet } from "@/lib/dfns"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let email: string | undefined
  let userId: string | undefined

  if (code) {
    const { data, error } = await authClient.auth.exchangeCodeForSession(code)
    if (error || !data.user) {
      return NextResponse.redirect(new URL("/login?error=invalid_link", req.url))
    }
    email = data.user.email
    userId = data.user.id
  } else if (token_hash && type) {
    const { data, error } = await authClient.auth.verifyOtp({ token_hash, type: type as "email" })
    if (error || !data.user) {
      return NextResponse.redirect(new URL("/login?error=invalid_link", req.url))
    }
    email = data.user.email
    userId = data.user.id
  } else {
    return NextResponse.redirect(new URL("/login?error=missing_params", req.url))
  }

  if (!email || !userId) {
    return NextResponse.redirect(new URL("/login?error=no_user", req.url))
  }

  // Check if user already has a Stellar wallet
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
      const wallet = await getOrCreateStellarWallet(userId)
      stellarAddress = wallet.stellarAddress
      dfnsWalletId = wallet.walletId
    } else {
      const kp = Keypair.random()
      stellarAddress = kp.publicKey()
      await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(stellarAddress)}`
      ).catch(() => null)
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

  const payload = {
    sub: stellarAddress,
    cooperative_ids: adminCooperativeIds,
    admin_cooperative_ids: adminCooperativeIds,
    is_super_admin: isSuperAdmin,
  }

  const token_jwt = await signJWT(payload)
  const response = NextResponse.redirect(new URL("/dashboard", req.url))
  setSessionCookie(response, token_jwt)
  return response
}

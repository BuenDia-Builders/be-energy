import { DfnsApiClient } from "@dfns/sdk"
import { AsymmetricKeySigner } from "@dfns/sdk-keysigner"

/**
 * AUDIT NOTE (2024) — DFNS CUSTODIAL WALLET PATH — STATUS: DERMANT / UNVERIFIED
 *
 * This module implements a custodial Stellar wallet via DFNS. It is only exercised
 * when DFNS_AUTH_TOKEN, DFNS_PRIVATE_KEY and DFNS_CRED_ID are all set (the three
 * auth routes check isDfnsConfigured() before calling into this module).
 *
 * Audit findings (see docs/audit/features.md – "Auth & Wallet" table):
 *  - No UI code imports or references DFNS directly. The non-custodial Stellar
 *    Wallets Kit (lib/wallet-context.tsx) is used everywhere else in the UI.
 *  - The only code paths that can reach this module are the three auth routes:
 *      * app/auth/callback/route.ts
 *      * app/auth/callback/password/route.ts
 *      * app/api/auth/email/verify/route.ts
 *  - Whether DFNS env vars are actually set in the Vercel production environment
 *    could NOT be verified from the repository. This file is therefore marked
 *    as "dermant / unverified" rather than confirmed unused.
 *  - When DFNS is NOT configured, the auth routes fall back to a server-side
 *    random keypair (auth_provider = "server_keypair"), funded via Friendbot on
 *    testnet. That fallback is the path exercised when DFNS env vars are absent.
 *
 * Do NOT delete or disable this code here — removal is a separate follow-up
 * issue contingent on confirming production configuration with a maintainer.
 */

const DFNS_AUTH_TOKEN = process.env.DFNS_AUTH_TOKEN
const DFNS_PRIVATE_KEY = process.env.DFNS_PRIVATE_KEY
const DFNS_CRED_ID = process.env.DFNS_CRED_ID
const DFNS_BASE_URL = process.env.DFNS_BASE_URL ?? "https://api.dfns.io"

export function isDfnsConfigured() {
  return !!(DFNS_AUTH_TOKEN && DFNS_PRIVATE_KEY && DFNS_CRED_ID)
}

export function getDfnsClient() {
  if (!isDfnsConfigured()) throw new Error("DFNS not configured")

  const signer = new AsymmetricKeySigner({
    credId: DFNS_CRED_ID!,
    privateKey: DFNS_PRIVATE_KEY!,
  })

  return new DfnsApiClient({
    authToken: DFNS_AUTH_TOKEN!,
    baseUrl: DFNS_BASE_URL,
    signer,
  })
}

export async function getOrCreateStellarWallet(userId: string): Promise<{
  walletId: string
  stellarAddress: string
}> {
  const dfns = getDfnsClient()

  const network =
    process.env.STELLAR_NETWORK === "mainnet"
      ? "Stellar"
      : "StellarTestnet"

  const wallet = await dfns.wallets.createWallet({
    body: { network, externalId: userId },
  })

  return {
    walletId: wallet.id,
    stellarAddress: wallet.address!,
  }
}

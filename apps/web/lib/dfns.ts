import { DfnsApiClient } from "@dfns/sdk"
import { AsymmetricKeySigner } from "@dfns/sdk-keysigner"

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

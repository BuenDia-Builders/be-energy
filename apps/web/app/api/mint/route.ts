import { NextRequest, NextResponse } from "next/server"
import * as StellarSdk from "@stellar/stellar-sdk"
import { supabase } from "@/lib/supabase"
import { CONTRACTS, STELLAR_CONFIG, NETWORK_PASSPHRASE } from "@/lib/contracts-config"
import { requireAuth, isSession } from "@/lib/auth/middleware"
import { validateBody } from "@/lib/validation/validate"
import { mintSchema } from "@/lib/validation/schemas"
import { safeCatchError } from "@/lib/errors/safe-error"

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    console.warn(`[MINT] ${label} failed, retrying in 2s...`, err instanceof Error ? err.message : err)
    await new Promise((r) => setTimeout(r, 2000))
    return fn()
  }
}

async function markFailed(readingId: string, reason: string) {
  await supabase
    .from("readings")
    .update({ status: "failed" })
    .eq("id", readingId)
  return NextResponse.json({ error: reason }, { status: 500 })
}

function getMintableKwh(reading: {
  kwh_injected?: number | null
  kwh_generated?: number | null
  kwh_self_consumed?: number | null
}) {
  if (reading.kwh_injected != null) {
    return reading.kwh_injected
  }

  if (reading.kwh_generated == null) {
    throw new Error("Reading is missing both kwh_injected and kwh_generated")
  }

  if (reading.kwh_self_consumed == null) {
    throw new Error("Reading requires kwh_self_consumed when kwh_injected is unavailable")
  }

  return Math.max(0, reading.kwh_generated - reading.kwh_self_consumed)
}

async function mintOnChain(
  toAddress: string,
  amountKwh: number,
  minterSecret: string,
  contractAddress: string,
  onSubmitted?: (hash: string) => Promise<void>
) {
  const amountInStroops = BigInt(Math.round(amountKwh * 1e7))
  const server = new StellarSdk.rpc.Server(STELLAR_CONFIG.RPC_URL)
  const minterKeypair = StellarSdk.Keypair.fromSecret(minterSecret)
  const minterPublic = minterKeypair.publicKey()
  const minterAccount = await withRetry(() => server.getAccount(minterPublic), "getAccount")
  const contract = new StellarSdk.Contract(contractAddress)
  const maxTime = Math.floor(Date.now() / 1000) + 300

  const transaction = new StellarSdk.TransactionBuilder(minterAccount, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
    timebounds: { minTime: 0, maxTime },
  })
    .addOperation(
      contract.call(
        "mint_energy",
        StellarSdk.nativeToScVal(toAddress, { type: "address" }),
        StellarSdk.nativeToScVal(amountInStroops, { type: "i128" }),
        StellarSdk.nativeToScVal(minterPublic, { type: "address" })
      )
    )
    .build()

  const preparedTx = await withRetry(() => server.prepareTransaction(transaction), "prepareTransaction")
  preparedTx.sign(minterKeypair)

  const sendResult = await withRetry(() => server.sendTransaction(preparedTx), "sendTransaction")

  if (sendResult.status === "ERROR") {
    throw new Error("Transaction failed to submit")
  }

  // Record the submitted hash before waiting for confirmation — if the poll below
  // times out on a slow testnet, the caller can still tell this hash was sent
  // instead of silently allowing a duplicate mint on retry.
  if (onSubmitted) {
    await onSubmitted(sendResult.hash)
  }

  const MAX_POLL_ATTEMPTS = 90
  let attempts = 0
  let txResponse = await server.getTransaction(sendResult.hash)
  while (txResponse.status === "NOT_FOUND") {
    if (++attempts >= MAX_POLL_ATTEMPTS) {
      throw new Error(
        `Transaction confirmation timeout — tx ${sendResult.hash} was submitted but not yet confirmed. ` +
          `Check https://stellar.expert/explorer/testnet/tx/${sendResult.hash} before retrying.`
      )
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
    txResponse = await server.getTransaction(sendResult.hash)
  }

  if (txResponse.status !== "SUCCESS") {
    throw new Error(`Transaction failed with status: ${txResponse.status}`)
  }

  return sendResult.hash
}

// POST: admin — mints tokens for certificate (or legacy reading)
export async function POST(req: NextRequest) {
  let readingId: string | undefined

  try {
    const session = await requireAuth()
    if (!isSession(session)) return session

    const body = await req.json()
    const v = validateBody(mintSchema, body)
    if (!v.success) return v.response

    readingId = v.data.reading_id
    const certificateId = v.data.certificate_id

    const minterSecret = process.env.MINTER_SECRET_KEY
    if (!minterSecret) {
      console.error("[MINT] MINTER_SECRET_KEY not configured")
      return NextResponse.json({ error: "Server configuration error: missing minter key" }, { status: 500 })
    }

    const contractAddress = CONTRACTS.ENERGY_TOKEN
    if (!contractAddress) {
      console.error("[MINT] ENERGY_TOKEN contract not configured")
      return NextResponse.json({ error: "Server configuration error: missing contract" }, { status: 500 })
    }

    // --- Certificate flow ---
    if (certificateId) {
      const { data: cert, error: certError } = await supabase
        .from("certificates")
        .select("*, cooperatives(admin_stellar_address, token_contract_address)")
        .eq("id", certificateId)
        .single()

      if (certError || !cert) {
        return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
      }

      // Must be admin of the certificate's cooperative
      if (!session.admin_cooperative_ids.includes(cert.cooperative_id)) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 })
      }

      if (cert.status !== "pending") {
        return NextResponse.json(
          { error: `Certificate status is '${cert.status}', expected 'pending'` },
          { status: 400 }
        )
      }

      if (cert.mint_tx_hash) {
        return NextResponse.json(
          {
            error:
              `This certificate already has a submitted mint transaction (${cert.mint_tx_hash}) ` +
              `that never confirmed as available. Check it on Stellar Expert before minting again — ` +
              `retrying may mint duplicate tokens.`,
          },
          { status: 409 }
        )
      }

      const coop = cert.cooperatives as {
        admin_stellar_address: string
        token_contract_address: string | null
      }
      // Custodial model: tokens go to minter (platform holds them)
      const mintTo = StellarSdk.Keypair.fromSecret(minterSecret).publicKey()
      const tokenContract = coop.token_contract_address || contractAddress

      const txHash = await mintOnChain(
        mintTo,
        cert.total_kwh,
        minterSecret,
        tokenContract,
        async (submittedHash) => {
          await supabase
            .from("certificates")
            .update({ mint_tx_hash: submittedHash })
            .eq("id", certificateId)
        }
      )

      await supabase
        .from("certificates")
        .update({
          status: "available",
          mint_tx_hash: txHash,
          token_amount: cert.total_kwh,
        })
        .eq("id", certificateId)

      await supabase.from("mint_log").insert({
        certificate_id: certificateId,
        prosumer_address: mintTo,
        amount_hdrop: cert.total_kwh,
        tx_hash: txHash,
      })

      await supabase.from("events").insert({
        type: "mint",
        amount: cert.total_kwh,
        tx_hash: txHash,
        cooperative_id: cert.cooperative_id,
        stellar_address: mintTo,
      })

      return NextResponse.json({
        success: true,
        tx_hash: txHash,
        certificate_id: certificateId,
        amount_kwh: cert.total_kwh,
        mint_to: mintTo,
      })
    }

    // --- Legacy reading flow ---
    const { data: reading, error: readingError } = await supabase
      .from("readings")
      .select("*, prosumers(stellar_address)")
      .eq("id", readingId!)
      .single()

    if (readingError || !reading) {
      return NextResponse.json({ error: "Reading not found" }, { status: 404 })
    }

    if (reading.status !== "pending") {
      return NextResponse.json(
        { error: `Reading status is '${reading.status}', expected 'pending'` },
        { status: 400 }
      )
    }

    const prosumerAddress = reading.prosumers.stellar_address
    let kwhAmount: number

    try {
      kwhAmount = getMintableKwh(reading)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid reading energy data"
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const txHash = await mintOnChain(prosumerAddress, kwhAmount, minterSecret, contractAddress)

    await supabase
      .from("readings")
      .update({ status: "minted", tx_hash: txHash })
      .eq("id", readingId!)

    await supabase.from("mint_log").insert({
      reading_id: readingId,
      prosumer_address: prosumerAddress,
      amount_hdrop: kwhAmount,
      tx_hash: txHash,
    })

    await supabase.from("events").insert({
      type: "mint",
      amount: kwhAmount,
      tx_hash: txHash,
      cooperative_id: reading.cooperative_id,
      stellar_address: prosumerAddress,
    })

    return NextResponse.json({
      success: true,
      tx_hash: txHash,
      amount_hdrop: kwhAmount,
      prosumer_address: prosumerAddress,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[MINT ERROR]", message, error instanceof Error ? error.stack : error)
    if (readingId) {
      return markFailed(readingId, message)
    }
    // Expose error details for debugging
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import * as StellarSdk from "@stellar/stellar-sdk"
import { supabase } from "@/lib/supabase"
import { CONTRACTS, STELLAR_CONFIG, NETWORK_PASSPHRASE } from "@/lib/contracts-config"
import { requireAuth, isSession } from "@/lib/auth/middleware"
import { validateBody } from "@/lib/validation/validate"
import { retireSchema } from "@/lib/validation/schemas"
import { safeDbError, safeCatchError } from "@/lib/errors/safe-error"

// POST: authenticated — buyer retires certificate
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (!isSession(session)) return session

    const body = await req.json()
    const v = validateBody(retireSchema, body)
    if (!v.success) return v.response

    const { certificate_id, buyer_address, buyer_name, buyer_purpose } = v.data

    // Fetch certificate
    const { data: cert, error: certError } = await supabase
      .from("certificates")
      .select("*")
      .eq("id", certificate_id)
      .single()

    if (certError || !cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    if (cert.status !== "available") {
      return NextResponse.json(
        { error: `Certificate status is '${cert.status}', expected 'available'` },
        { status: 400 }
      )
    }

    const minterSecret = process.env.MINTER_SECRET_KEY
    if (!minterSecret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const contractAddress = CONTRACTS.ENERGY_TOKEN
    if (!contractAddress) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Burn on-chain
    const amountInStroops = BigInt(Math.round(cert.total_kwh * 1e7))
    const server = new StellarSdk.rpc.Server(STELLAR_CONFIG.RPC_URL)
    const minterKeypair = StellarSdk.Keypair.fromSecret(minterSecret)
    const minterPublic = minterKeypair.publicKey()
    const minterAccount = await server.getAccount(minterPublic)
    const contract = new StellarSdk.Contract(contractAddress)
    const maxTime = Math.floor(Date.now() / 1000) + 300
    
    const transaction = new StellarSdk.TransactionBuilder(minterAccount, {
      fee: "100000",
      networkPassphrase: NETWORK_PASSPHRASE,
      timebounds: { minTime: 0, maxTime },
    })
      .addOperation(
        contract.call(
          "burn_energy",
          StellarSdk.nativeToScVal(minterPublic, { type: "address" }),
          StellarSdk.nativeToScVal(amountInStroops, { type: "i128" })
        )
      )
      .build()

    const preparedTx = await server.prepareTransaction(transaction)
    preparedTx.sign(minterKeypair)

    const sendResult = await server.sendTransaction(preparedTx)

    if (sendResult.status === "ERROR") {
      return NextResponse.json({ error: "Burn transaction failed" }, { status: 500 })
    }

    let txResponse = await server.getTransaction(sendResult.hash)
    while (txResponse.status === "NOT_FOUND") {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      txResponse = await server.getTransaction(sendResult.hash)
    }

    if (txResponse.status !== "SUCCESS") {
      return NextResponse.json({ error: "Burn transaction failed" }, { status: 500 })
    }

    const burnTxHash = sendResult.hash

    const { data: retirement, error: retireError } = await supabase
      .from("retirements")
      .insert({
        certificate_id,
        buyer_address,
        buyer_name: buyer_name ?? null,
        buyer_purpose,
        kwh_retired: cert.total_kwh,
        burn_tx_hash: burnTxHash,
      })
      .select()
      .single()

    if (retireError) return safeDbError(retireError)

    await supabase
      .from("certificates")
      .update({ status: "retired" })
      .eq("id", certificate_id)

    await supabase.from("events").insert({
      type: "burn",
      amount: cert.total_kwh,
      tx_hash: burnTxHash,
      cooperative_id: cert.cooperative_id,
      stellar_address: buyer_address,
    })

    return NextResponse.json({
      success: true,
      retirement,
      burn_tx_hash: burnTxHash,
    })
  } catch (err) {
    return safeCatchError(err)
  }
}

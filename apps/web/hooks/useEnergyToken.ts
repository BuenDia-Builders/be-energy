"use client"

import { useCallback, useState } from "react"
import { useWallet } from "@/lib/wallet-context"
import { CONTRACTS, STELLAR_CONFIG, NETWORK_PASSPHRASE } from "@/lib/contracts-config"
import * as StellarSdk from "@stellar/stellar-sdk"

export function useEnergyToken() {
  const { address, kit } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Get balance of $ENERGY tokens for the current user
   */
  const getBalance = useCallback(async (userAddress?: string): Promise<string> => {
    try {
      setIsLoading(true)
      setError(null)

      const targetAddress = userAddress || address
      if (!targetAddress) {
        throw new Error("No wallet connected")
      }

      if (!CONTRACTS.ENERGY_TOKEN) {
        throw new Error("Energy token contract not configured")
      }

      const server = new StellarSdk.rpc.Server(STELLAR_CONFIG.RPC_URL)

      // Build the contract call to get balance
      const contract = new StellarSdk.Contract(CONTRACTS.ENERGY_TOKEN)
      let account
      try {
        account = await server.getAccount(targetAddress)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)


        if (msg.toLowerCase().includes("account not found")) {
          return "0.00"
        }

        throw err
      }

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call("balance", StellarSdk.nativeToScVal(targetAddress, { type: "address" }))
        )
        .setTimeout(30)
        .build()

      const simulatedResult = await server.simulateTransaction(transaction)

      if (StellarSdk.rpc.Api.isSimulationSuccess(simulatedResult)) {
        // SDK puede exponer result.retval o (RPC) results[0].xdr
        const sim = simulatedResult as { result?: { retval?: unknown }; results?: Array<{ xdr?: string }> }
        let retval = sim.result?.retval
        if (retval === undefined && Array.isArray(sim.results)?.[0]?.xdr) {
          try {
            retval = StellarSdk.xdr.ScVal.fromXDR(sim.results[0].xdr, "base64")
          } catch {
            // ignorar si el fallback falla
          }
        }
        if (retval === undefined) {
          console.error("Balance simulation: no retval in response", simulatedResult)
          throw new Error("Formato de respuesta del contrato no reconocido")
        }
        const balance = StellarSdk.scValToNative(retval)
        // Convert from 7 decimals to readable format
        return (Number(balance) / 10000000).toFixed(2)
      }

      // Incluir el error real de la simulación para diagnosticar
      const errPayload = (simulatedResult as { error?: string; message?: string })?.error ?? (simulatedResult as { error?: string; message?: string })?.message
      const errMsg = typeof errPayload === "string" ? errPayload : JSON.stringify(simulatedResult).slice(0, 200)
      throw new Error(errMsg ? `Balance: ${errMsg}` : "Failed to get balance")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      console.error("Error getting balance:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [address])

  /**
   * Transfer $ENERGY tokens to another address
   */
  const transfer = async (to: string, amount: number): Promise<string> => {
    try {
      setIsLoading(true)
      setError(null)

      if (!address || !kit) {
        throw new Error("No wallet connected")
      }

      if (!CONTRACTS.ENERGY_TOKEN) {
        throw new Error("Energy token contract not configured")
      }

      // Convert amount to contract format (7 decimals)
      const amountInStroops = Math.floor(amount * 10000000)

      const server = new StellarSdk.rpc.Server(STELLAR_CONFIG.RPC_URL)
      const contract = new StellarSdk.Contract(CONTRACTS.ENERGY_TOKEN)
      const account = await server.getAccount(address)

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: "100000", // Higher fee for contract invocation
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            "transfer",
            StellarSdk.nativeToScVal(address, { type: "address" }),
            StellarSdk.nativeToScVal(to, { type: "address" }),
            StellarSdk.nativeToScVal(amountInStroops, { type: "i128" })
          )
        )
        .setTimeout(30)
        .build()

      // Prepare and sign transaction
      const preparedTx = await server.prepareTransaction(transaction)
      const { signedTxXdr } = await kit.signTransaction(preparedTx.toXDR())
      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedTxXdr,
        NETWORK_PASSPHRASE
      )

      // Submit transaction
      const result = await server.sendTransaction(signedTransaction as StellarSdk.Transaction)

      if (result.status === "PENDING") {
        // Poll for transaction result
        let getResponse = await server.getTransaction(result.hash)

        while (getResponse.status === "NOT_FOUND") {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          getResponse = await server.getTransaction(result.hash)
        }

        if (getResponse.status === "SUCCESS") {
          return result.hash
        }
      }

      throw new Error("Transaction failed")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      console.error("Error transferring tokens:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Check if an address holds the on-chain `minter` role.
   * Read-only simulation — no signature or fee required.
   */
  const checkIsMinter = async (accountAddress: string): Promise<boolean> => {
    try {
      if (!CONTRACTS.ENERGY_TOKEN) {
        throw new Error("Energy token contract not configured")
      }

      const sourceAddress = accountAddress || address
      if (!sourceAddress) {
        throw new Error("No address provided to check")
      }

      const server = new StellarSdk.rpc.Server(STELLAR_CONFIG.RPC_URL)
      const contract = new StellarSdk.Contract(CONTRACTS.ENERGY_TOKEN)
      const account = await server.getAccount(sourceAddress)

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            "is_minter",
            StellarSdk.nativeToScVal(accountAddress, { type: "address" })
          )
        )
        .setTimeout(30)
        .build()

      const simulatedResult = await server.simulateTransaction(transaction)

      if (StellarSdk.rpc.Api.isSimulationSuccess(simulatedResult)) {
        return StellarSdk.scValToNative(simulatedResult.result!.retval) as boolean
      }

      return false
    } catch (err) {
      console.error("Error checking minter role:", err)
      return false
    }
  }

  /**
   * Mint HDROP tokens to a recipient (minter role required).
   * Calls `mint_energy(to, amount, minter)` on the energy token contract.
   * The connected wallet is used as the `minter` argument and must sign.
   */
  const mintEnergy = async (to: string, amount: number): Promise<string> => {
    try {
      setIsLoading(true)
      setError(null)

      if (!address || !kit) {
        throw new Error("No wallet connected")
      }

      if (!CONTRACTS.ENERGY_TOKEN) {
        throw new Error("Energy token contract not configured")
      }

      // BigInt prevents floating-point precision loss before i128 encoding.
      // e.g. 1.3 kWh → Math.round(1.3 * 1e7) = 13000000 → BigInt(13000000)
      const amountInStroops = BigInt(Math.round(amount * 1e7))

      const server = new StellarSdk.rpc.Server(STELLAR_CONFIG.RPC_URL)
      const contract = new StellarSdk.Contract(CONTRACTS.ENERGY_TOKEN)
      const account = await server.getAccount(address)

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            "mint_energy",
            StellarSdk.nativeToScVal(to, { type: "address" }),
            StellarSdk.nativeToScVal(amountInStroops, { type: "i128" }),
            StellarSdk.nativeToScVal(address, { type: "address" }) // minter = connected wallet
          )
        )
        .setTimeout(30)
        .build()

      const preparedTx = await server.prepareTransaction(transaction)
      const { signedTxXdr } = await kit.signTransaction(preparedTx.toXDR())
      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedTxXdr,
        NETWORK_PASSPHRASE
      )

      const result = await server.sendTransaction(signedTransaction as StellarSdk.Transaction)

      if (result.status === "PENDING") {
        let getResponse = await server.getTransaction(result.hash)

        while (getResponse.status === "NOT_FOUND") {
          await new Promise(resolve => setTimeout(resolve, 1000))
          getResponse = await server.getTransaction(result.hash)
        }

        if (getResponse.status === "SUCCESS") {
          return result.hash
        }
      }

      throw new Error("Transaction failed")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      console.error("Error minting tokens:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Burn $ENERGY tokens (when consuming energy)
   */
  const burnEnergy = async (amount: number): Promise<string> => {
    try {
      setIsLoading(true)
      setError(null)

      if (!address || !kit) {
        throw new Error("No wallet connected")
      }

      if (!CONTRACTS.ENERGY_TOKEN) {
        throw new Error("Energy token contract not configured")
      }

      const amountInStroops = Math.floor(amount * 10000000)

      const server = new StellarSdk.rpc.Server(STELLAR_CONFIG.RPC_URL)
      const contract = new StellarSdk.Contract(CONTRACTS.ENERGY_TOKEN)
      const account = await server.getAccount(address)

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            "burn_energy",
            StellarSdk.nativeToScVal(address, { type: "address" }),
            StellarSdk.nativeToScVal(amountInStroops, { type: "i128" })
          )
        )
        .setTimeout(30)
        .build()

      const preparedTx = await server.prepareTransaction(transaction)
      const { signedTxXdr } = await kit.signTransaction(preparedTx.toXDR())
      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedTxXdr,
        NETWORK_PASSPHRASE
      )

      const result = await server.sendTransaction(signedTransaction as StellarSdk.Transaction)

      if (result.status === "PENDING") {
        let getResponse = await server.getTransaction(result.hash)

        while (getResponse.status === "NOT_FOUND") {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          getResponse = await server.getTransaction(result.hash)
        }

        if (getResponse.status === "SUCCESS") {
          return result.hash
        }
      }

      throw new Error("Transaction failed")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      console.error("Error burning tokens:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    getBalance,
    transfer,
    burnEnergy,
    checkIsMinter,
    mintEnergy,
    isLoading,
    error,
  }
}
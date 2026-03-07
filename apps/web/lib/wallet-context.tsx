"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import type { Horizon } from "@stellar/stellar-sdk"
import { storage } from "@be-energy/stellar"
import type { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit"
import {
  connectWallet as stellarConnect,
  disconnectWallet as stellarDisconnect,
  fetchBalances,
  wallet,
  type MappedBalances,
} from "@be-energy/stellar"

interface UserProfile {
  name: string
  avatar: string | null
}

interface WalletContextType {
  isConnected: boolean
  address: string | null
  shortAddress: string | null
  userProfile: UserProfile | null
  balances: MappedBalances
  xlmBalance: string | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  setUserProfile: (profile: UserProfile) => void
  updateBalances: () => Promise<void>
  isFreighterInstalled: boolean
  isPending: boolean
  network: string | null
  kit: StellarWalletsKit | null
  signTransaction: ((...args: any[]) => any) | null
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

const POLL_INTERVAL = 2000

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [shortAddress, setShortAddress] = useState<string | null>(null)
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null)
  const [isFreighterInstalled, setIsFreighterInstalled] = useState(false)
  const [balances, setBalances] = useState<MappedBalances>({})
  const [isPending, setIsPending] = useState(true)
  const [network, setNetwork] = useState<string | null>(null)
  const popupLock = useRef(false)
  const kit = typeof window !== "undefined" ? wallet() : null

  const updateBalances = useCallback(async () => {
    if (!address) {
      setBalances({})
      return
    }

    const newBalances = await fetchBalances(address)
    setBalances(newBalances)
  }, [address])

  const xlmBalance = balances["xlm"]?.balance ?? null

  const nullify = () => {
    setAddress(null)
    setShortAddress(null)
    setIsConnected(false)
    setNetwork(null)
    setBalances({})
    storage.setItem("walletId", "")
    storage.setItem("walletAddress", "")
    storage.setItem("walletNetwork", "")
    storage.setItem("networkPassphrase", "")
  }

  const updateCurrentWalletState = async () => {
    const walletId = storage.getItem("walletId")
    const walletAddr = storage.getItem("walletAddress")
    const walletNetwork = storage.getItem("walletNetwork")

    if (!address && walletAddr) {
      setAddress(walletAddr)
      setShortAddress(`${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)}`)
      setIsConnected(true)
      setNetwork(walletNetwork)
    }

    if (!walletId) {
      if (isConnected) nullify()
    } else {
      if (popupLock.current) return

      try {
        popupLock.current = true
        kit?.setWallet(walletId)

        if (walletId !== "freighter" && walletAddr) return

        if (!kit) return

        const [a, n] = await Promise.all([
          kit.getAddress(),
          kit.getNetwork(),
        ])

        if (!a.address) {
          storage.setItem("walletId", "")
        }

        if (a.address !== address) {
          storage.setItem("walletAddress", a.address)
          setAddress(a.address)
          setShortAddress(`${a.address.slice(0, 6)}...${a.address.slice(-4)}`)
          setIsConnected(true)
          setNetwork(n.network)
        }
      } catch (e) {
        nullify()
        // Skip log for harmless "no wallet" empty object; log real errors (Error has no enumerable keys)
        if (e instanceof Error) {
          console.error("Wallet state error:", e.message || e)
        } else if (e != null && (typeof e !== "object" || Object.keys(e as object).length > 0)) {
          console.error("Wallet state error:", e)
        }
      } finally {
        popupLock.current = false
      }
    }
  }

  useEffect(() => {
    const checkFreighter = () => {
      const installed = typeof window !== "undefined" && "freighter" in window
      setIsFreighterInstalled(installed)
    }
    checkFreighter()

    const savedProfile = localStorage.getItem("userProfile")
    if (savedProfile) {
      try {
        setUserProfileState(JSON.parse(savedProfile))
      } catch (e) {
        console.error("Error loading saved profile:", e)
        localStorage.removeItem("userProfile")
      }
    }
  }, [])

  useEffect(() => {
    void updateBalances()
  }, [updateBalances])

  useEffect(() => {
    let timer: NodeJS.Timeout
    let isMounted = true

    const pollWalletState = async () => {
      if (!isMounted) return

      await updateCurrentWalletState()

      if (isMounted) {
        timer = setTimeout(() => void pollWalletState(), POLL_INTERVAL)
      }
    }

    const init = async () => {
      await updateCurrentWalletState()
      setIsPending(false)
      if (isMounted) {
        timer = setTimeout(() => void pollWalletState(), POLL_INTERVAL)
      }
    }

    void init()

    return () => {
      isMounted = false
      if (timer) clearTimeout(timer)
    }
  }, [])

  const connectWallet = async () => {
    try {
      await stellarConnect()
      // The wallet state will be updated by the polling mechanism
    } catch (error) {
      console.error("Error connecting wallet:", error)
      throw error
    }
  }

  const disconnectWallet = async () => {
    try {
      await stellarDisconnect()
      nullify()
      setUserProfileState(null)
      localStorage.removeItem("userProfile")
    } catch (error) {
      console.error("Error disconnecting wallet:", error)
    }
  }

  const setUserProfile = (profile: UserProfile) => {
    setUserProfileState(profile)
    localStorage.setItem("userProfile", JSON.stringify(profile))
  }

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        shortAddress,
        userProfile,
        balances,
        xlmBalance,
        connectWallet,
        disconnectWallet,
        setUserProfile,
        updateBalances,
        isFreighterInstalled,
        isPending,
        network,
        kit,
        signTransaction: kit ? kit.signTransaction.bind(kit) : null,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

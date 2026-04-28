"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useWallet } from "@/lib/wallet-context"

interface AuthSession {
  stellar_address: string
  cooperative_ids: string[]
  admin_cooperative_ids: string[]
  is_super_admin: boolean
}

interface AuthContextType {
  session: AuthSession | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (walletAddress?: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected, kit, disconnectWallet } = useWallet()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check existing session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me")
        if (res.status === 401) {
          setSession(null)
          return
        }
        if (res.ok) {
          const data = await res.json()
          setSession(data)
        } else {
          console.error("Unexpected /api/auth/me error:", res.status)
          setSession(null)
        }
      } catch (err) {
        console.error("Network error fetching /api/auth/me:", err)
        setSession(null)
      } finally {
        setIsLoading(false)
      }
    }
    checkSession()
  }, [])

  // Auto-logout if address changes to a different wallet
  useEffect(() => {
    if (!isLoading && session && address && address !== session.stellar_address) {
      setSession(null)
      fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    }
  }, [address, session, isLoading])

  const login = useCallback(async (walletAddress?: string) => {
    const addr = walletAddress || address
    if (!addr || !kit) {
      throw new Error("Wallet not connected")
    }

    // 1. Get challenge
    const challengeRes = await fetch("/api/auth/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stellar_address: addr }),
    })

    if (!challengeRes.ok) {
      const err = await challengeRes.json()
      throw new Error(err.error || "Failed to get challenge")
    }

    const { challenge } = await challengeRes.json()

    // 2. Sign with wallet — kit.signMessage() takes a string and returns { signedMessage: string (base64) }
    let signature: string
    try {
      const result = await kit.signMessage(challenge, { address: addr })
      signature = result.signedMessage
    } catch (signErr) {
      throw new Error("Failed to sign message with wallet")
    }

    // 3. Verify
    const verifyRes = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stellar_address: addr,
        challenge,
        signature,
      }),
    })

    if (!verifyRes.ok) {
      const err = await verifyRes.json()
      throw new Error(err.error || "Authentication failed")
    }

    const sessionData = await verifyRes.json()
    setSession(sessionData)
  }, [address, kit])

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setSession(data)
      }
    } catch {
      // silent fail
    }
  }, [])

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    setSession(null)
    disconnectWallet()
  }, [disconnectWallet])

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        isAuthenticated: session !== null,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

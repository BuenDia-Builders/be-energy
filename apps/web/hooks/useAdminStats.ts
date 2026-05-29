"use client"

import { useState, useEffect, useCallback } from "react"

export interface AdminStats {
  totals: {
    cooperatives: number
    members: number
    total_kwh_certified: number
    certificates_total: number
    certificates_pending: number
    certificates_available: number
    certificates_retired: number
  }
  cooperatives: Array<{
    id: string
    name: string
    technology: string
    location: string | null
    province: string | null
    status: string
    admin_stellar_address: string
    created_at: string
    member_count: number
    certificates_count: number
    total_kwh: number
    pending: number
    available: number
    retired: number
  }>
  recent_mints: Array<{
    id: string
    total_kwh: number
    technology: string
    mint_tx_hash: string
    created_at: string
  }>
  recent_retirements: Array<{
    id: string
    total_kwh: number
    technology: string
    status: string
    created_at: string
  }>
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/admin/stats")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to fetch admin stats")
      setStats(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  return { stats, loading, error, refetch: fetch_ }
}

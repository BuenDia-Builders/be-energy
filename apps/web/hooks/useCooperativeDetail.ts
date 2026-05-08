"use client"

import { useState, useEffect, useCallback } from "react"

interface CooperativeDetail {
  cooperative: Record<string, unknown>
  members: Array<{
    id: string
    name: string | null
    stellar_address: string
    cooperative_id: string
    created_at: string
  }>
  certificates: Array<{
    id: string
    cooperative_id: string
    total_kwh: number
    status: "pending" | "available" | "retired"
    technology: string
    mint_tx_hash: string | null
    generation_period_start: string
    generation_period_end: string
    created_at: string
  }>
  meters: Array<{
    id: string
    cooperative_id: string
    device_type: string
    technology: string
    capacity_kw: number
    member_stellar_address: string | null
    status: string
    created_at: string
  }>
  stats: {
    member_count: number
    meter_count: number
    total_capacity_kw: number
    total_generation_kwh: number
    total_certified_kwh: number
    certificates_pending: number
    certificates_available: number
    certificates_retired: number
  }
}

export function useCooperativeDetail(coopId: string | null) {
  const [data, setData] = useState<CooperativeDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    if (!coopId) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/cooperatives/${coopId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to fetch cooperative")
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [coopId])

  useEffect(() => { fetch_() }, [fetch_])

  return { data, loading, error, refetch: fetch_ }
}

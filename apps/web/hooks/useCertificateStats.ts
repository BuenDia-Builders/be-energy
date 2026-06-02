"use client"

import { useState, useEffect, useCallback } from "react"

export interface CertificateStats {
  total_kwh_certified: number
  total_kwh_retired: number
  co2_avoided_kg: number
  certificates_available: number
  certificates_pending: number
  certificates_retired: number
  by_technology: Record<string, { certified_kwh: number; retired_kwh: number }>
  by_cooperative: Record<string, { name: string; certified_kwh: number; retired_kwh: number }>
}

export function useCertificateStats() {
  const [stats, setStats] = useState<CertificateStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/certificates/stats")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch certificate stats")
      }

      setStats(data)
    } catch (err) {
      console.error("Error fetching certificate stats:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}

"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n-context"
import { useCooperativeDetail } from "@/hooks/useCooperativeDetail"
import { useCooperativeReadings } from "@/hooks/useCooperativeReadings"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Users, Zap, Award, Gauge, Building2, ShieldAlert, ChevronDown,
  ArrowRight, Leaf, Activity, Circle, ExternalLink, Plus, BarChart3, AlertCircle,
} from "lucide-react"
import { CreateCertificateModal } from "@/components/modals/create-certificate-modal"
import { AddMeterModal } from "@/components/modals/add-meter-modal"
import { SubmitReadingModal } from "@/components/modals/submit-reading-modal"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { InfoTooltip } from "@/components/shared/info-tooltip"
import { useEnergyToken } from "@/hooks/useEnergyToken"

type Period = "week" | "month" | "year"

export default function CooperativeAdminPage() {
  const { isConnected, isPending: walletPending } = useWallet()
  const { session, isLoading: authLoading } = useAuth()
  const { t } = useI18n()
  const router = useRouter()

  const adminCoopIds = session?.admin_cooperative_ids ?? []
  const [selectedCoopId, setSelectedCoopId] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>("month")
  const [showCreateCert, setShowCreateCert] = useState(false)
  const [showAddMeter, setShowAddMeter] = useState(false)
  const [showSubmitReading, setShowSubmitReading] = useState(false)
  const [mintingCertId, setMintingCertId] = useState<string | null>(null)
  const [mintError, setMintError] = useState<string | null>(null)
  const { getBalance } = useEnergyToken()
  const [hdropBalance, setHdropBalance] = useState<string | null>(null)

  useEffect(() => {
    if (session?.admin_cooperative_ids.length) {
      const minterAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS
      if (minterAddress) {
        getBalance(minterAddress).then(setHdropBalance).catch(() => setHdropBalance("0.00"))
      }
    }
  }, [session])

  useEffect(() => {
    if (!walletPending && !authLoading && !isConnected) router.push("/")
  }, [isConnected, walletPending, authLoading, router])

  useEffect(() => {
    if (adminCoopIds.length > 0 && !selectedCoopId) setSelectedCoopId(adminCoopIds[0])
  }, [adminCoopIds, selectedCoopId])

  const { data, loading, refetch } = useCooperativeDetail(selectedCoopId)
  const { readings, loading: readingsLoading, refetch: refetchReadings } = useCooperativeReadings(selectedCoopId)

  const isAccessDenied = !authLoading && !walletPending && session && adminCoopIds.length === 0
  const isPageLoading = authLoading || walletPending || loading

  const stats = data?.stats
  const certificates = data?.certificates ?? []
  const meters = data?.meters ?? []
  const coopName = (data?.cooperative as Record<string, unknown>)?.name as string | undefined

  // Generation chart data — aggregate readings by date
  const chartData = useMemo(() => {
    if (!readings.length) return []

    const now = new Date()
    const cutoff = new Date()
    if (period === "week") cutoff.setDate(now.getDate() - 7)
    else if (period === "month") cutoff.setMonth(now.getMonth() - 1)
    else cutoff.setFullYear(now.getFullYear() - 1)

    const filtered = readings.filter((r) => {
      const d = new Date(r.reading_date || r.created_at)
      return d >= cutoff
    })

    const grouped: Record<string, number> = {}
    for (const r of filtered) {
      const dateStr = period === "year"
        ? new Date(r.reading_date || r.created_at).toLocaleDateString(undefined, { month: "short" })
        : new Date(r.reading_date || r.created_at).toLocaleDateString(undefined, { day: "2-digit", month: "short" })
      grouped[dateStr] = (grouped[dateStr] || 0) + r.kwh_generated
    }

    return Object.entries(grouped).map(([date, kwh]) => ({ date, kwh: Math.round(kwh) }))
  }, [readings, period])

  const totalPeriodKwh = chartData.reduce((sum, d) => sum + d.kwh, 0)

  // Meters health
  const metersOnline = meters.filter((m) => m.status === "active").length
  const metersTotal = meters.length

  // CO2 calculation (0.4 kg CO2 per kWh is standard grid factor)
  const co2Avoided = stats ? Math.round(stats.total_generation_kwh * 0.4) : 0
  const treesEquivalent = Math.round(co2Avoided / 21) // ~21 kg CO2 per tree per year

  const handleMint = async (certId: string) => {
    setMintingCertId(certId)
    setMintError(null)
    try {
      const res = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificate_id: certId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMintError(data.error || "Mint failed")
        return
      }
      refetch()
    } catch (err) {
      setMintError(err instanceof Error ? err.message : "Network error")
    } finally {
      setMintingCertId(null)
    }
  }

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-64">
        <DashboardHeader />

        <div className="p-4 md:p-6 space-y-6">
          {/* ── Header + Coop selector ── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{coopName || t("coopAdmin.title")}</h1>
                <p className="text-sm text-muted-foreground">{t("coopAdmin.title")}</p>
              </div>
            </div>
            {adminCoopIds.length > 1 && (
              <div className="relative">
                <select
                  value={selectedCoopId ?? ""}
                  onChange={(e) => setSelectedCoopId(e.target.value)}
                  className="appearance-none bg-card border border-border rounded-lg px-4 py-2 pr-8 text-sm"
                >
                  {adminCoopIds.map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Loading */}
          {isPageLoading && (
            <div className="flex items-center justify-center py-12">
              <Spinner className="size-8" />
            </div>
          )}

          {/* Access denied */}
          {isAccessDenied && (
            <Card>
              <CardContent className="p-12 text-center">
                <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">{t("coopAdmin.accessDenied")}</p>
              </CardContent>
            </Card>
          )}

          {!isPageLoading && !isAccessDenied && stats && (
            <>
              {/* ── 1. KPI Cards ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-energy-green">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Zap className="w-4 h-4 text-energy-green" />
                      <InfoTooltip text={t("coopAdmin.tooltip.totalGeneration")} />
                    </div>
                    <p className="text-2xl font-bold">{stats.total_generation_kwh.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{t("coopAdmin.totalGeneration")} (kWh)</p>
                    <div className="mt-2 pt-2 border-t border-border/50 flex justify-between text-xs">
                      <span className="text-energy-green">✅ {stats.total_certified_kwh.toLocaleString()} cert.</span>
                      <span className="text-solar-orange">⏳ {Math.max(0, (stats?.total_generation_kwh ?? 0) - (stats?.total_certified_kwh ?? 0)).toLocaleString()} pend.</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-solar-orange">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Gauge className="w-4 h-4 text-solar-orange" />
                      <InfoTooltip text={t("coopAdmin.tooltip.totalCapacity")} />
                    </div>
                    <p className="text-2xl font-bold">{stats.total_capacity_kw} <span className="text-sm font-normal text-muted-foreground">kW</span></p>
                    <p className="text-xs text-muted-foreground">{t("coopAdmin.totalCapacity")}</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-web3-purple">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Activity className="w-4 h-4 text-web3-purple" />
                      <InfoTooltip text={t("coopAdmin.tooltip.metersOnline")} />
                    </div>
                    <p className="text-2xl font-bold">
                      {metersOnline}<span className="text-sm font-normal text-muted-foreground">/{metersTotal}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{t("coopAdmin.metersOnline")}</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-4 h-4 text-primary" />
                      <InfoTooltip text={t("coopAdmin.tooltip.members")} />
                    </div>
                    <p className="text-2xl font-bold">{stats.member_count}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("coopAdmin.members")}
                      <button
                        onClick={() => router.push(`/dashboard/cooperative/members?coop=${selectedCoopId}`)}
                        className="ml-2 text-primary hover:underline"
                      >
                        {t("coopAdmin.viewMembers")} →
                      </button>
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* ── 2. Generation Chart ── */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="w-5 h-5 text-energy-green" />
                        {t("coopAdmin.generationChart")}
                        <InfoTooltip text={t("coopAdmin.tooltip.generationChart")} />
                      </CardTitle>
                      {chartData.length > 0 && (
                        <CardDescription className="mt-1">
                          <span className="text-xl font-bold text-foreground">{totalPeriodKwh.toLocaleString()}</span>{" "}
                          <span className="text-muted-foreground">kWh</span>
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1 bg-muted rounded-lg p-1">
                      {(["week", "month", "year"] as Period[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriod(p)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            period === p
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t(`coopAdmin.period.${p}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {readingsLoading && (
                    <div className="flex items-center justify-center py-12">
                      <Spinner className="size-5" />
                    </div>
                  )}
                  {!readingsLoading && chartData.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{t("coopAdmin.noGenerationData")}</p>
                    </div>
                  )}
                  {chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="kwhGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3DDC97" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3DDC97" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value) => [`${Number(value).toLocaleString()} kWh`, t("coopAdmin.generation")]}
                        />
                        <Area
                          type="monotone"
                          dataKey="kwh"
                          stroke="#3DDC97"
                          strokeWidth={2}
                          fill="url(#kwhGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* ── 3. Certificate Pipeline + Environmental Impact ── */}
              <div className="grid lg:grid-cols-3 gap-4">
                {/* Pipeline */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        {t("coopAdmin.pipeline")}
                        <InfoTooltip text={t("coopAdmin.tooltip.pipeline")} />
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={() => setShowCreateCert(true)} className="gap-1">
                        <Plus className="w-3.5 h-3.5" />
                        {t("createCert.title")}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Funnel */}
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div className="flex-1 text-center p-4 rounded-xl bg-solar-yellow/10 border border-solar-yellow/20">
                        <p className="text-3xl font-bold text-solar-yellow">{stats.certificates_pending}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("coopAdmin.pending")}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 text-center p-4 rounded-xl bg-energy-green/10 border border-energy-green/20">
                        <p className="text-3xl font-bold text-energy-green">{stats.certificates_available}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("coopAdmin.available")}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 text-center p-4 rounded-xl bg-solar-orange/10 border border-solar-orange/20">
                        <p className="text-3xl font-bold text-solar-orange">{stats.certificates_retired}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("coopAdmin.retired")}</p>
                      </div>
                    </div>

                    {/* Pending certificates with mint action */}
                    {certificates.filter((c) => c.status === "pending").length > 0 && (
                      <div className="space-y-2">
                        {certificates
                          .filter((c) => c.status === "pending")
                          .slice(0, 5)
                          .map((cert) => (
                            <div key={cert.id} className="flex items-center gap-3 p-3 rounded-lg bg-solar-yellow/5 border border-solar-yellow/10">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{cert.total_kwh.toLocaleString()} kWh</p>
                                <p className="text-xs text-muted-foreground">
                                  {cert.technology} · {new Date(cert.generation_period_start).toLocaleDateString()} – {new Date(cert.generation_period_end).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleMint(cert.id)}
                                disabled={mintingCertId !== null}
                                className="bg-solar-yellow text-foreground hover:bg-solar-yellow/90"
                              >
                                {mintingCertId === cert.id ? (
                                  <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                                    Minting...
                                  </span>
                                ) : (
                                  t("coopAdmin.mint")
                                )}
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}

                    {mintError && (
                      <div className="mt-3 border border-red-500/30 rounded-lg p-3 bg-red-500/10 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <p className="text-sm text-red-500">{mintError}</p>
                      </div>
                    )}

                    {/* Available certificates with Stellar Expert link */}
                    {certificates.filter((c) => c.status === "available").length > 0 && (
                      <div className="space-y-2 mt-2">
                        {certificates
                          .filter((c) => c.status === "available")
                          .slice(0, 5)
                          .map((cert) => (
                            <div key={cert.id} className="flex items-center gap-3 p-3 rounded-lg bg-energy-green/5 border border-energy-green/10">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{cert.total_kwh.toLocaleString()} kWh</p>
                                <p className="text-xs text-muted-foreground">
                                  {cert.technology} · {new Date(cert.generation_period_start).toLocaleDateString()} – {new Date(cert.generation_period_end).toLocaleDateString()}
                                </p>
                              </div>
                              <StatusBadge status="available" />
                              {cert.mint_tx_hash && (
                                <a
                                  href={`https://stellar.expert/explorer/testnet/tx/${cert.mint_tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-energy-green hover:text-energy-green/80"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                    {certificates.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">{t("coopAdmin.noCertificates")}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Environmental Impact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-energy-green" />
                      {t("coopAdmin.environmentalImpact")}
                      <InfoTooltip text={t("coopAdmin.tooltip.environmentalImpact")} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto rounded-full bg-energy-green/10 border-4 border-energy-green/20 flex items-center justify-center mb-3">
                        <Leaf className="w-8 h-8 text-energy-green" />
                      </div>
                      <p className="text-3xl font-bold text-energy-green">{co2Avoided.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">kg {t("coopAdmin.co2Avoided")}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold">{treesEquivalent.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">🌳 {t("coopAdmin.treesEquivalent")}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ── 4. Meter Fleet Health ── */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-solar-orange" />
                      {t("coopAdmin.metersHealth")}
                      <InfoTooltip text={t("coopAdmin.tooltip.metersHealth")} />
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => setShowAddMeter(true)} className="gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      {t("addMeter.title")}
                    </Button>
                  </div>
                  <CardDescription>
                    {metersOnline} {t("coopAdmin.online")} · {metersTotal - metersOnline} {t("coopAdmin.offline")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {meters.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gauge className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{t("coopAdmin.noMeters")}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-muted-foreground">
                            <th className="pb-3 font-medium">{t("common.status")}</th>
                            <th className="pb-3 font-medium">Tipo</th>
                            <th className="pb-3 font-medium">{t("common.technology")}</th>
                            <th className="pb-3 font-medium">{t("common.capacity")}</th>
                            <th className="pb-3 font-medium">{t("coopAdmin.lastReading")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {meters.map((m) => {
                            const isOnline = m.status === "active"
                            return (
                              <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                <td className="py-3">
                                  <div className="flex items-center gap-2">
                                    <Circle className={`w-2.5 h-2.5 fill-current ${isOnline ? "text-energy-green" : "text-destructive"}`} />
                                    <span className={`text-xs font-medium ${isOnline ? "text-energy-green" : "text-destructive"}`}>
                                      {isOnline ? t("coopAdmin.online") : t("coopAdmin.offline")}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3">{m.device_type}</td>
                                <td className="py-3">{m.technology}</td>
                                <td className="py-3 font-medium">{m.capacity_kw} kW</td>
                                <td className="py-3 text-muted-foreground text-xs">
                                  {new Date(m.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* ── card HDROP ── 
              {hdropBalance !== null && (
                <Card className="border-l-4 border-l-solar-yellow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-solar-yellow" />
                      <span className="text-sm font-medium">Balance HDROP</span>
                      <InfoTooltip text="Tokens de energía certificada disponibles en la plataforma (1 HDROP = 1 kWh)" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-solar-yellow">{hdropBalance}</p>
                      <p className="text-xs text-muted-foreground">HDROP</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              */}
              {/* ── 5. Activity Feed (recent readings) ── */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-web3-purple" />
                      {t("coopAdmin.activityFeed")}
                      <InfoTooltip text={t("coopAdmin.tooltip.activityFeed")} />
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => setShowSubmitReading(true)} className="gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      {t("submitReading.title")}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {readingsLoading && (
                    <div className="flex items-center justify-center py-8">
                      <Spinner className="size-5" />
                    </div>
                  )}
                  {!readingsLoading && readings.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{t("coopAdmin.noReadings")}</p>
                    </div>
                  )}
                  {readings.length > 0 && (
                    <div className="space-y-2">
                      {readings.slice(0, 8).map((r) => (
                        <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            r.status === "verified"
                              ? "bg-energy-green/10"
                              : "bg-solar-yellow/10"
                          }`}>
                            <Zap className={`w-4 h-4 ${
                              r.status === "verified" ? "text-energy-green" : "text-solar-yellow"
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {r.prosumers?.name || truncateAddress(r.prosumers?.stellar_address || "—")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {r.reading_date
                                ? new Date(r.reading_date).toLocaleDateString()
                                : new Date(r.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{r.kwh_generated} kWh</p>
                            <StatusBadge status={r.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      {selectedCoopId && (
        <>
          <CreateCertificateModal
            isOpen={showCreateCert}
            onClose={() => setShowCreateCert(false)}
            cooperativeId={selectedCoopId}
            onSuccess={refetch}
          />
          <AddMeterModal
            isOpen={showAddMeter}
            onClose={() => setShowAddMeter(false)}
            cooperativeId={selectedCoopId}
            onSuccess={refetch}
          />
          <SubmitReadingModal
            isOpen={showSubmitReading}
            onClose={() => setShowSubmitReading(false)}
            cooperativeId={selectedCoopId}
            meters={meters}
            onSuccess={() => { refetch(); refetchReadings() }}
          />
        </>
      )}
    </div>
  )
}

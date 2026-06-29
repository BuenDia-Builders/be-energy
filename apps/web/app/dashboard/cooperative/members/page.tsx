"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n-context"
import { useCooperativeDetail } from "@/hooks/useCooperativeDetail"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { AddMemberModal } from "@/components/modals/add-member-modal"
import { ShieldAlert, Users, Plus, ArrowLeft, Copy, Check } from "lucide-react"

interface MemberRow {
  id: string
  stellar_address: string
  name: string | null
  panel_capacity_kw: number | null
  role: string
  created_at: string
}

function MembersContent() {
  const { isConnected, isPending: walletPending } = useWallet()
  const { session, isLoading: authLoading } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()

  const adminCoopIds = session?.admin_cooperative_ids ?? []
  const coopIdFromUrl = searchParams.get("coop")
  const coopId = coopIdFromUrl ?? (adminCoopIds.length > 0 ? adminCoopIds[0] : null)

  const [members, setMembers] = useState<MemberRow[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null)

  const { data: coopData, loading: coopLoading } = useCooperativeDetail(coopId)

  const isAccessDenied =
    !authLoading &&
    !walletPending &&
    session !== null &&
    (adminCoopIds.length === 0 || (coopId !== null && !adminCoopIds.includes(coopId)))

  const isPageLoading = authLoading || walletPending || coopLoading

  useEffect(() => {
    if (!walletPending && !authLoading && !isConnected) router.push("/")
  }, [isConnected, walletPending, authLoading, router])

  const fetchMembers = useCallback(async () => {
    if (!coopId) return
    setMembersLoading(true)
    try {
      const res = await fetch(`/api/members?cooperative_id=${encodeURIComponent(coopId)}`)
      if (!res.ok) return
      const data = await res.json()
      setMembers(data)
    } finally {
      setMembersLoading(false)
    }
  }, [coopId])

  useEffect(() => {
    if (coopId && !isAccessDenied && !authLoading) fetchMembers()
  }, [coopId, isAccessDenied, authLoading, fetchMembers])

  const totalCapacityKw = coopData?.stats?.total_capacity_kw ?? 0

  // Division-by-zero guard: returns 0 when totalCapacityKw is 0 or undefined
  const memberSharePercent = (kw: number | null): number => {
    if (!kw || !totalCapacityKw || totalCapacityKw === 0) return 0
    return Math.min(100, (kw / totalCapacityKw) * 100)
  }

  const currentAllocated = members.reduce(
    (sum, m) => sum + memberSharePercent(m.panel_capacity_kw),
    0
  )

  const copyAddress = async (addr: string) => {
    await navigator.clipboard.writeText(addr)
    setCopiedAddr(addr)
    setTimeout(() => setCopiedAddr(null), 1500)
  }

  const coopName = (coopData?.cooperative as Record<string, unknown>)?.name as string | undefined

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-64">
        <DashboardHeader />
        <div className="p-4 md:p-6 space-y-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard/cooperative")}
                className="shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t("members.title")}</h1>
                {coopName && <p className="text-sm text-muted-foreground">{coopName}</p>}
              </div>
            </div>
            {!isAccessDenied && !isPageLoading && (
              <Button
                onClick={() => setShowAddMember(true)}
                className="gap-2 gradient-primary text-white"
              >
                <Plus className="w-4 h-4" />
                {t("members.addMember")}
              </Button>
            )}
          </div>

          {/* ── Loading ── */}
          {isPageLoading && (
            <div className="flex items-center justify-center py-12">
              <Spinner className="size-8" />
            </div>
          )}

          {/* ── Access denied ── */}
          {isAccessDenied && (
            <Card>
              <CardContent className="p-12 text-center">
                <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">{t("coopAdmin.accessDenied")}</p>
              </CardContent>
            </Card>
          )}

          {!isPageLoading && !isAccessDenied && (
            <>
              {/* ── Allocation bar ── */}
              {totalCapacityKw > 0 ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{t("members.allocationUsed")}</p>
                      <p className="text-sm font-mono text-muted-foreground">
                        {currentAllocated.toFixed(1)}% / 100%
                      </p>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          currentAllocated > 100 ? "bg-destructive" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(100, currentAllocated)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("members.allocationRemaining")}:{" "}
                      <span className="font-medium">
                        {Math.max(0, 100 - currentAllocated).toFixed(1)}%
                      </span>
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-xs text-muted-foreground px-1">
                  {t("members.capacityGuard")}
                </div>
              )}

              {/* ── Members table ── */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    {t("coopAdmin.members")}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({members.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {membersLoading && (
                    <div className="flex items-center justify-center py-8">
                      <Spinner className="size-5" />
                    </div>
                  )}
                  {!membersLoading && members.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{t("coopAdmin.noMembers")}</p>
                    </div>
                  )}
                  {members.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-muted-foreground">
                            <th className="pb-3 font-medium">{t("common.name")}</th>
                            <th className="pb-3 font-medium">{t("members.walletAddress")}</th>
                            <th className="pb-3 font-medium">{t("common.date")}</th>
                            <th className="pb-3 font-medium">{t("members.shareAllocation")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {members.map((m) => {
                            const share = memberSharePercent(m.panel_capacity_kw)
                            return (
                              <tr
                                key={m.id}
                                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                              >
                                <td className="py-3">
                                  <p className="font-medium">{m.name || "—"}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                                </td>
                                <td className="py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs">
                                      {m.stellar_address.slice(0, 6)}...{m.stellar_address.slice(-4)}
                                    </span>
                                    <button
                                      onClick={() => copyAddress(m.stellar_address)}
                                      className="text-muted-foreground hover:text-foreground transition-colors"
                                      title={t("common.copyAddress")}
                                    >
                                      {copiedAddr === m.stellar_address ? (
                                        <Check className="w-3.5 h-3.5 text-energy-green" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3 text-muted-foreground text-xs">
                                  {new Date(m.created_at).toLocaleDateString()}
                                </td>
                                <td className="py-3">
                                  {totalCapacityKw > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-primary rounded-full"
                                          style={{ width: `${share}%` }}
                                        />
                                      </div>
                                      <span className="text-xs tabular-nums">
                                        {share.toFixed(1)}%
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      {m.panel_capacity_kw != null
                                        ? `${m.panel_capacity_kw} kW`
                                        : "—"}
                                    </span>
                                  )}
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
            </>
          )}
        </div>
      </main>

      {coopId && (
        <AddMemberModal
          isOpen={showAddMember}
          onClose={() => setShowAddMember(false)}
          cooperativeId={coopId}
          totalCapacityKw={totalCapacityKw}
          currentAllocatedPercent={currentAllocated}
          onSuccess={fetchMembers}
        />
      )}
    </div>
  )
}

export default function MembersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Spinner className="size-8" />
        </div>
      }
    >
      <MembersContent />
    </Suspense>
  )
}

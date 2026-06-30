"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n-context"
import { useHorizonPayments } from "@/hooks/useHorizonPayments"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowUpRight, Loader2, AlertCircle } from "lucide-react"

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

export default function SalesPage() {
  const { isConnected, address } = useWallet()
  const { session, isLoading: authLoading } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const { payments, isLoading, error, refetch } = useHorizonPayments(address)

  useEffect(() => {
    if (!authLoading && !isConnected && !session) {
      router.push("/")
    }
  }, [isConnected, session, authLoading, router])

  if (!isConnected && !session) {
    return null
  }

  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

  const sales = payments.filter((p) => {
    const isOutgoing = p.from === address && p.to !== address
    const withinRange = new Date(p.created_at) >= twoMonthsAgo
    return isOutgoing && withinRange
  })

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="md:ml-64">
        <DashboardHeader />

        <div className="p-4 md:p-6">
          <Button onClick={() => router.push("/activity")} variant="ghost" className="mb-4 hover:bg-muted">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back")}
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <ArrowUpRight className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl md:text-2xl">{t("activity.sent")}</CardTitle>
                  <CardDescription>{t("activity.sentDescription")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t("activity.loading")}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-5 h-5" />
                    <span>{t("activity.errorFetching")}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={refetch}>
                    {t("activity.retry")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sales.length > 0 ? (
                    sales.map((payment) => {
                      const assetLabel =
                        payment.asset_type === "native"
                          ? "XLM"
                          : payment.asset_code ?? payment.asset_type

                      return (
                        <div
                          key={payment.id}
                          className="flex items-center gap-3 p-4 rounded-lg hover:bg-muted transition-colors border border-border"
                        >
                          <div className="flex-shrink-0">
                            <ArrowUpRight className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm md:text-base capitalize">
                              {payment.type.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              {formatDate(payment.created_at)} · {formatTime(payment.created_at)}
                            </p>
                          </div>
                          <div className="flex-shrink-0 font-semibold text-sm md:text-base text-primary">
                            -{payment.amount ?? payment.source_amount ?? "–"} {assetLabel}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">{t("activity.noSent")}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

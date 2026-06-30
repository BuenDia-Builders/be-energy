"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n-context"
import { useHorizonPayments } from "@/hooks/useHorizonPayments"
import { useEvents } from "@/hooks/useEvents"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Loader2, AlertCircle, ExternalLink, Flame, Coins } from "lucide-react"
import Link from "next/link"
import { STELLAR_CONFIG } from "@/lib/contracts-config"

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

type ActivityItem = {
  id: string
  type: "payment" | "mint" | "burn"
  created_at: string
  tx_hash?: string
  amount?: string
  asset?: string
  isIncoming?: boolean
  description?: string
}

export default function ActivityPage() {
  const { isConnected, address } = useWallet()
  const { session, isLoading: authLoading } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const { payments, isLoading: paymentsLoading, error: paymentsError, refetch: refetchPayments } = useHorizonPayments(address)
  const { events, isLoading: eventsLoading, error: eventsError, refetch: refetchEvents } = useEvents(address)

  const isLoading = paymentsLoading || eventsLoading
  const error = paymentsError || eventsError

  const refetch = () => {
    refetchPayments()
    refetchEvents()
  }

  const mergedActivity = useMemo(() => {
    const items: ActivityItem[] = []

    // Add Horizon payments
    payments.forEach((payment) => {
      const isIncoming = payment.to === address
      const assetLabel =
        payment.asset_type === "native"
          ? "XLM"
          : payment.asset_code ?? payment.asset_type

      items.push({
        id: payment.id,
        type: "payment",
        created_at: payment.created_at,
        tx_hash: payment.transaction_hash,
        amount: payment.amount ?? payment.source_amount,
        asset: assetLabel,
        isIncoming,
        description: payment.type.replace(/_/g, " "),
      })
    })

    // Add mint/burn events
    events.forEach((event) => {
      items.push({
        id: event.id,
        type: event.type,
        created_at: event.created_at,
        tx_hash: event.tx_hash,
        amount: event.amount.toString(),
        asset: "HDROP",
        description: event.type === "mint" ? "Token Mint" : "Token Burn",
      })
    })

    // Sort by date descending
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [payments, events, address])

  useEffect(() => {
    if (!authLoading && !isConnected && !session) {
      router.push("/")
    }
  }, [isConnected, session, authLoading, router])

  if (!isConnected && !session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="md:ml-64">
        <DashboardHeader />

        <div className="p-4 md:p-6 space-y-6">
          <Button onClick={() => router.push("/dashboard")} variant="ghost" className="mb-2 hover:bg-muted">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back")}
          </Button>

          {/* Navigation cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Link href="/activity/purchases">
              <Card className="hover:bg-muted/50 transition-all cursor-pointer h-full group border-2 hover:border-primary">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-success/10 group-hover:bg-success/20 transition-colors">
                      <ArrowDownLeft className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{t("activity.received")}</CardTitle>
                      <CardDescription>{t("activity.receivedDescription")}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t("activity.lastTwoMonths")}</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/activity/sales">
              <Card className="hover:bg-muted/50 transition-all cursor-pointer h-full group border-2 hover:border-primary">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <ArrowUpRight className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{t("activity.sent")}</CardTitle>
                      <CardDescription>{t("activity.sentDescription")}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t("activity.lastTwoMonths")}</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent payments from Horizon */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t("activity.recentPayments")}</CardTitle>
              <CardDescription>{t("activity.recentPaymentsDescription")}</CardDescription>
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
              ) : mergedActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t("activity.noTransactions")}</div>
              ) : (
                <div className="space-y-3">
                  {mergedActivity.slice(0, 10).map((item) => {
                    const networkType = STELLAR_CONFIG.NETWORK === "testnet" ? "testnet" : "public"
                    const stellarExpertUrl = `https://stellar.expert/explorer/${networkType}/tx/${item.tx_hash}`

                    let icon = <ArrowUpRight className="w-5 h-5 text-primary" />
                    let color = "text-primary"
                    let prefix = ""

                    if (item.type === "mint") {
                      icon = <Coins className="w-5 h-5 text-success" />
                      color = "text-success"
                      prefix = "+"
                    } else if (item.type === "burn") {
                      icon = <Flame className="w-5 h-5 text-destructive" />
                      color = "text-destructive"
                      prefix = "-"
                    } else if (item.isIncoming) {
                      icon = <ArrowDownLeft className="w-5 h-5 text-success" />
                      color = "text-success"
                      prefix = "+"
                    } else {
                      prefix = "-"
                    }

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-4 rounded-lg hover:bg-muted transition-colors border border-border"
                      >
                        <div className="flex-shrink-0">{icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm md:text-base capitalize">
                              {item.description}
                            </p>
                            {item.tx_hash && (
                              <a
                                href={stellarExpertUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {formatDate(item.created_at)} · {formatTime(item.created_at)}
                          </p>
                        </div>
                        <div className={`flex-shrink-0 font-semibold text-sm md:text-base ${color}`}>
                          {prefix}
                          {item.amount ?? "–"} {item.asset}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

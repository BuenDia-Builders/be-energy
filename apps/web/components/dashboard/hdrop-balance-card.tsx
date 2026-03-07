"use client"

import { useI18n } from "@/lib/i18n-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coins, ArrowUpRight, ArrowDownLeft, TrendingUp, RefreshCw } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

export function HDROPBalanceCard({
  balance,
  isLoading,
  error,
  onRetry,
}: {
  balance?: number | null
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
}) {
  const { t } = useI18n()
  const displayBalance = balance ?? 0

  return (
    <Card className="border-0 bg-gradient-to-br from-web3-purple/20 via-web3-purple/10 to-transparent dark:from-web3-purple/30 dark:via-web3-purple/15 dark:to-card shadow-lg overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-web3-purple/10 rounded-full blur-3xl" />
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {t("kpi.hdrop_balance")}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-web3-purple/20 text-web3-purple font-medium">
                Stellar Network
              </span>
            </div>
          </div>
          <div className="rounded-2xl p-4 bg-web3-purple/20 dark:bg-web3-purple/30">
            <Coins className="h-6 w-6 text-web3-purple" />
          </div>
        </div>

        <div className="space-y-4">
          {error ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry} disabled={isLoading} className="gap-2">
                  <RefreshCw className="size-4" />
                  {t("common.retry")}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-card-foreground">
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner className="size-5" />
                        ...
                      </span>
                    ) : (
                      displayBalance.toLocaleString()
                    )}
                  </span>
                  <span className="text-lg font-semibold text-web3-purple">HDROP</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  ≈ ${(displayBalance * 0.15).toFixed(2)} USD
                </p>
              </div>

              <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-energy-green/10 w-fit">
                <TrendingUp className="h-4 w-4 text-energy-green" />
                <span className="text-sm font-medium text-energy-green">+24 HDROP</span>
                <span className="text-xs text-muted-foreground">{t("kpi.today")}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-web3-purple/30 hover:bg-web3-purple/10 text-card-foreground"
                >
                  <ArrowDownLeft className="h-4 w-4 mr-2 text-web3-purple" />
                  Receive
                </Button>
                <Button
                  size="sm"
                  className="bg-web3-purple hover:bg-web3-purple/90 text-white"
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

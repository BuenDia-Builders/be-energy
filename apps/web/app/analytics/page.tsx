"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { useI18n } from "@/lib/i18n-context"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from "lucide-react"

const activityData = [
  { type: "energy_sale", amount: "2.4 kWh", from: "You", to: "SolarKing_01", date: "2024-03-06 14:32", status: "completed" },
  { type: "token_transfer", amount: "45 HDROP", from: "EcoEnergy_Pro", to: "You", date: "2024-03-06 12:15", status: "completed" },
  { type: "energy_purchase", amount: "1.8 kWh", from: "GreenPower_MX", to: "You", date: "2024-03-06 10:48", status: "pending" },
  { type: "energy_sale", amount: "3.2 kWh", from: "You", to: "SunHarvest_22", date: "2024-03-05 18:22", status: "completed" },
  { type: "token_transfer", amount: "28 HDROP", from: "CleanWatts_CR", to: "You", date: "2024-03-05 15:05", status: "completed" },
  { type: "energy_sale", amount: "4.1 kWh", from: "You", to: "EcoEnergy_Pro", date: "2024-03-05 11:42", status: "completed" },
  { type: "energy_purchase", amount: "2.5 kWh", from: "SolarKing_01", to: "You", date: "2024-03-04 16:18", status: "completed" },
  { type: "token_transfer", amount: "62 HDROP", from: "GreenPower_MX", to: "You", date: "2024-03-04 09:55", status: "completed" },
]

const typeIcons: Record<string, typeof ArrowUpRight> = {
  energy_sale: ArrowUpRight,
  token_transfer: ArrowLeftRight,
  energy_purchase: ArrowDownRight,
}

const typeColors: Record<string, string> = {
  energy_sale: "text-eco-green bg-eco-green/10",
  token_transfer: "text-accent-purple bg-accent-purple/10",
  energy_purchase: "text-accent-orange bg-accent-orange/10",
}

export default function AnalyticsPage() {
  const { t } = useI18n()
  const { isConnected } = useWallet()
  const router = useRouter()

  useEffect(() => {
    if (!isConnected) router.push("/")
  }, [isConnected, router])

  if (!isConnected) return null

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col lg:pl-64">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          <h1 className="text-2xl font-bold text-foreground">{t("analytics.title")}</h1>

          <Card className="border-0 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{t("analytics.activity_timeline")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">{t("transactions.type")}</th>
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">{t("transactions.amount")}</th>
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">{t("analytics.from")}</th>
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">{t("analytics.to")}</th>
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">{t("transactions.date")}</th>
                      <th className="pb-3 text-right text-xs font-medium text-muted-foreground">{t("transactions.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityData.map((activity, idx) => {
                      const Icon = typeIcons[activity.type]
                      return (
                        <tr key={idx} className="border-b border-border last:border-0">
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", typeColors[activity.type])}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-medium text-card-foreground">{t(`transactions.${activity.type}`)}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span
                              className={cn(
                                "text-sm font-semibold",
                                activity.type === "energy_sale" ? "text-eco-green" : activity.type === "token_transfer" ? "text-accent-purple" : "text-accent-orange"
                              )}
                            >
                              {activity.amount}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-muted-foreground">{activity.from}</td>
                          <td className="py-4 text-sm text-muted-foreground">{activity.to}</td>
                          <td className="py-4 text-sm text-muted-foreground">{activity.date}</td>
                          <td className="py-4 text-right">
                            <Badge
                              className={cn(
                                "text-xs",
                                activity.status === "completed"
                                  ? "bg-eco-green/20 text-eco-green hover:bg-eco-green/30"
                                  : "bg-accent-orange/20 text-accent-orange hover:bg-accent-orange/30"
                              )}
                            >
                              {t(`transactions.${activity.status}`)}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

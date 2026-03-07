"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { useI18n } from "@/lib/i18n-context"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EnergyChart } from "@/components/dashboard/energy-chart"
import { AvailableEnergyChart } from "@/components/dashboard/available-energy-chart"
import { EnergyDistribution } from "@/components/dashboard/energy-distribution"
import { EfficiencyScore } from "@/components/dashboard/efficiency-score"
import { Zap, Flame, Battery, TrendingUp } from "lucide-react"

const energyStats = [
  { label: "kpi.energy_generated", value: "18.4 kWh", change: "+12%", icon: Zap, color: "text-solar-yellow", bgColor: "bg-solar-yellow/10" },
  { label: "kpi.energy_consumed", value: "12.1 kWh", change: "-5%", icon: Flame, color: "text-solar-orange", bgColor: "bg-solar-orange/10" },
  { label: "kpi.available_energy", value: "6.3 kWh", change: "+8%", icon: Battery, color: "text-energy-green", bgColor: "bg-energy-green/10" },
  { label: "kpi.monthly_savings", value: "$42.80", change: "+15%", icon: TrendingUp, color: "text-energy-green", bgColor: "bg-energy-green/10" },
]

export default function EnergyPage() {
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
          <h1 className="text-2xl font-bold text-foreground">{t("nav.energy")}</h1>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {energyStats.map((stat) => (
              <Card key={stat.label} className="border-0 bg-card shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{t(stat.label)}</p>
                      <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                      <span className="text-xs font-medium text-energy-green">
                        {stat.change} {t("kpi.today")}
                      </span>
                    </div>
                    <div className={`rounded-xl p-3 ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <EnergyChart />

          <div className="grid gap-6 lg:grid-cols-2">
            <AvailableEnergyChart />
            <EnergyDistribution />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="border-0 bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Energy Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-energy-green/10 p-4">
                    <p className="text-sm font-medium text-energy-green">Peak Production Hours</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your solar panels generate the most energy between 10 AM and 2 PM. Consider scheduling high-energy tasks during these hours.
                    </p>
                  </div>
                  <div className="rounded-lg bg-solar-yellow/10 p-4">
                    <p className="text-sm font-medium text-solar-yellow">Optimization Opportunity</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      You could sell an additional 2.1 kWh daily by adjusting your consumption patterns.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <EfficiencyScore score={87} />
          </div>
        </main>
      </div>
    </div>
  )
}

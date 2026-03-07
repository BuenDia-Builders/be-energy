"use client"

import { useCooperativeApp } from "./app-context"
import { CooperativeKPICards } from "./kpi-cards"
import { CooperativeProductionChart } from "./production-chart"
import { CooperativeGridDistributionChart } from "./secondary-charts"
import { CooperativeNetworkStatusCards } from "./network-status"

export function Overview() {
  const { t } = useCooperativeApp()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">{t("overview")}</h1>
        <p className="text-muted-foreground text-sm">
          Monitor your energy grid and cooperatives performance
        </p>
      </div>
      <CooperativeKPICards />
      <CooperativeProductionChart />
      <CooperativeNetworkStatusCards />
      <CooperativeGridDistributionChart />
    </div>
  )
}

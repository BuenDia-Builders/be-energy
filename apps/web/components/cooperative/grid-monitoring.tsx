"use client"

import { useState } from "react"
import { useCooperativeApp } from "./app-context"
import { CooperativeProductionChart } from "./production-chart"
import { CooperativeGridDistributionChart } from "./secondary-charts"

export function GridMonitoring() {
  const { t } = useCooperativeApp()
  const [timeRange, setTimeRange] = useState("24h")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">{t("gridMonitoring")}</h1>
        <p className="text-muted-foreground text-sm">
          Real-time energy generation and consumption analytics
        </p>
      </div>
      <div className="flex gap-2">
        {["24h", "7d", "30d"].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              timeRange === range
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {range === "24h" ? t("h24") : range === "7d" ? t("d7") : t("d30")}
          </button>
        ))}
      </div>
      <CooperativeProductionChart />
      <CooperativeGridDistributionChart />
    </div>
  )
}

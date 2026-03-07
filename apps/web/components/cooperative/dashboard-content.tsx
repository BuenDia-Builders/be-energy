"use client"

import { useEffect } from "react"
import { useCooperativeApp } from "./app-context"
import { Overview } from "./overview"
import { GridMonitoring } from "./grid-monitoring"
import { Prosumers } from "./prosumers"
import { SmartMeters } from "./smart-meters"
import { EnergyMarketplace } from "./energy-marketplace"
import { BillingSettlement } from "./billing-settlement"
import { SystemLogs } from "./system-logs"
import { Settings } from "./settings"

export function CooperativeDashboardContent() {
  const { theme } = useCooperativeApp()

  useEffect(() => {
    if (typeof document === "undefined") return
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  const { activeSection } = useCooperativeApp()

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        {activeSection === "overview" && <Overview />}
        {activeSection === "gridMonitoring" && <GridMonitoring />}
        {activeSection === "prosumers" && <Prosumers />}
        {activeSection === "smartMeters" && <SmartMeters />}
        {activeSection === "energyMarketplace" && <EnergyMarketplace />}
        {activeSection === "billing" && <BillingSettlement />}
        {activeSection === "systemLogs" && <SystemLogs />}
        {activeSection === "settings" && <Settings />}
      </div>
    </main>
  )
}

"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { useEnergyToken } from "@/hooks/useEnergyToken"
import { EnergyKPICards, SavingsCard } from "@/components/dashboard/kpi-cards"
import { HDROPBalanceCard } from "@/components/dashboard/hdrop-balance-card"
import { EnergyChart } from "@/components/dashboard/energy-chart"
import { AvailableEnergyChart } from "@/components/dashboard/available-energy-chart"
import { EnergyDistribution } from "@/components/dashboard/energy-distribution"
import { CommunityRanking } from "@/components/dashboard/community-ranking"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { EfficiencyScore } from "@/components/dashboard/efficiency-score"

export default function DashboardPage() {
  const { isConnected, address } = useWallet()
  const router = useRouter()
  const { getBalance, isLoading: isBalanceLoading, error: balanceError } = useEnergyToken()
  const [hdropBalance, setHdropBalance] = useState<number | null>(null)

  const loadBalance = useCallback(async () => {
    if (!address) return
    try {
      const value = await getBalance(address)
      setHdropBalance(Number.parseFloat(value))
    } catch (err) {
      console.error("Error loading balance", err)
      setHdropBalance(0)
    }
  }, [address, getBalance])

  useEffect(() => {
    if (isConnected && address) {
      loadBalance()
    } else {
      setHdropBalance(null)
    }
  }, [isConnected, address, loadBalance])

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  if (!isConnected) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col lg:pl-64">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {/* 1️⃣ KPI energía */}
          <section className="mb-6" aria-label="KPI energía">
            <EnergyKPICards />
          </section>

          {/* 2️⃣ Core chart: Production vs Consumption + HDROP Balance */}
          <section className="mb-6 grid gap-6 lg:grid-cols-4" aria-label="Core chart">
            <div className="lg:col-span-3">
              <EnergyChart />
            </div>
            <div className="lg:col-span-1">
              <HDROPBalanceCard
                balance={hdropBalance}
                isLoading={isBalanceLoading}
                error={balanceError ?? null}
                onRetry={loadBalance}
              />
            </div>
          </section>

          {/* 3️⃣ Energy insights */}
          <section className="mb-6 grid gap-6 lg:grid-cols-2" aria-label="Energy insights">
            <AvailableEnergyChart />
            <EnergyDistribution />
          </section>

          {/* 4️⃣ Impact */}
          <section className="mb-6 grid gap-6 lg:grid-cols-2" aria-label="Impact">
            <SavingsCard />
            <EfficiencyScore />
          </section>

          {/* 5️⃣ Community */}
          <section className="mb-6 grid gap-6 lg:grid-cols-2" aria-label="Community">
            <CommunityRanking />
            <RecentTransactions />
          </section>
        </main>
      </div>
    </div>
  )
}

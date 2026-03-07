"use client"

import { useCooperativeApp } from "./app-context"
import { TrendingUp, TrendingDown, Zap, Battery, DollarSign, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  titleKey: string
  value: string
  unit: string
  trend: number
  trendKey: string
  icon: React.ElementType
  accent: string
}

function KPICard({ titleKey, value, unit, trend, trendKey, icon: Icon, accent }: KPICardProps) {
  const { t } = useCooperativeApp()
  const isPositive = trend >= 0

  return (
    <div className="bg-card rounded-2xl p-5 border border-border flex flex-col gap-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}1A` }}
        >
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg",
            isPositive ? "bg-[#3DDC97]/10 text-[#3DDC97]" : "bg-[#FA9A4B]/10 text-[#FA9A4B]"
          )}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? "+" : ""}
          {trend}%
        </div>
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-medium mb-1">{t(titleKey)}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{t(trendKey)}</p>
      </div>
    </div>
  )
}

export function CooperativeKPICards() {
  const cards: KPICardProps[] = [
    {
      titleKey: "totalEnergyGenerated",
      value: "8,245",
      unit: "MWh",
      trend: 12,
      trendKey: "upTrend",
      icon: Sun,
      accent: "#FEC800",
    },
    {
      titleKey: "activeProsumers",
      value: "324",
      unit: "",
      trend: 8,
      trendKey: "upTrend",
      icon: Zap,
      accent: "#FA9A4B",
    },
    {
      titleKey: "connectedMeters",
      value: "2,847",
      unit: "",
      trend: 5,
      trendKey: "upTrend",
      icon: Battery,
      accent: "#3DDC97",
    },
    {
      titleKey: "networkHealth",
      value: "98.6",
      unit: "%",
      trend: 2,
      trendKey: "upTrend",
      icon: DollarSign,
      accent: "#C590FC",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <KPICard key={card.titleKey} {...card} />
      ))}
    </div>
  )
}

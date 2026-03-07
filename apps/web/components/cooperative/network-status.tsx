"use client"

import { useCooperativeApp } from "./app-context"
import { Wifi, WifiOff, Clock, Zap } from "lucide-react"

export function CooperativeNetworkStatusCards() {
  const { t } = useCooperativeApp()

  const statusCards = [
    {
      title: t("onlineMeters"),
      value: "245",
      icon: Wifi,
      color: "text-[#3DDC97]",
      bgColor: "bg-green-500/10",
    },
    {
      title: t("offlineMeters"),
      value: "12",
      icon: WifiOff,
      color: "text-[#FA9A4B]",
      bgColor: "bg-orange-500/10",
    },
    {
      title: t("pendingReadings"),
      value: "8",
      icon: Clock,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: t("iotGateway"),
      value: t("online"),
      icon: Zap,
      color: "text-[#3DDC97]",
      bgColor: "bg-green-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statusCards.map((card, idx) => {
        const Icon = card.icon
        return (
          <div key={idx} className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              </div>
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

"use client"

import { useI18n } from "@/lib/i18n-context"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, Flame, Battery, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

const energyKpiData = [
  {
    key: "energy_generated",
    value: "18.4",
    unit: "kWh",
    change: "+12%",
    positive: true,
    icon: Zap,
    bgColor: "bg-solar-yellow/10",
    textColor: "text-solar-yellow",
  },
  {
    key: "energy_consumed",
    value: "12.1",
    unit: "kWh",
    change: "-5%",
    positive: true,
    icon: Flame,
    bgColor: "bg-solar-orange/10",
    textColor: "text-solar-orange",
  },
  {
    key: "available_energy",
    value: "6.3",
    unit: "kWh",
    change: "+8%",
    positive: true,
    icon: Battery,
    bgColor: "bg-energy-green/10",
    textColor: "text-energy-green",
  },
]

export function EnergyKPICards() {
  const { t } = useI18n()

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {energyKpiData.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card key={kpi.key} className="border-0 bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t(`kpi.${kpi.key}`)}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-card-foreground">
                      {kpi.value}
                    </span>
                    {kpi.unit && (
                      <span className="text-sm text-muted-foreground">
                        {kpi.unit}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        kpi.positive ? "text-energy-green" : "text-destructive"
                      )}
                    >
                      {kpi.change}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("kpi.today")}
                    </span>
                  </div>
                </div>
                <div className={cn("rounded-xl p-3", kpi.bgColor)}>
                  <Icon className={cn("h-5 w-5", kpi.textColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function SavingsCard() {
  const { t } = useI18n()

  return (
    <Card className="border-0 bg-card shadow-sm h-full">
      <CardContent className="p-5 h-full flex flex-col justify-center">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              {t("kpi.monthly_savings")}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-card-foreground">
                $42.80
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-energy-green">
                +15%
              </span>
              <span className="text-xs text-muted-foreground">
                {t("kpi.this_month")}
              </span>
            </div>
          </div>
          <div className="rounded-xl p-3 bg-energy-green/10">
            <DollarSign className="h-5 w-5 text-energy-green" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

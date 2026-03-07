"use client"

import { useI18n } from "@/lib/i18n-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const data = [
  { day: "Mon", available: 5.1 },
  { day: "Tue", available: 6.2 },
  { day: "Wed", available: 1.3 },
  { day: "Thu", available: 6.9 },
  { day: "Fri", available: 6.6 },
  { day: "Sat", available: 8.2 },
  { day: "Sun", available: 6.3 },
]

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  t: (key: string) => string
}

function CustomTooltip({ active, payload, label, t }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-card-foreground">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-energy-green" />
          <span className="text-sm text-muted-foreground">{t("chart.available_energy")}</span>
        </div>
        <span className="text-sm font-semibold text-energy-green">{payload[0].value.toFixed(1)} kWh</span>
      </div>
    </div>
  )
}

export function AvailableEnergyChart() {
  const { t } = useI18n()

  return (
    <Card className="border-0 bg-card shadow-sm">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">{t("chart.available_energy")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Production - Consumption = Surplus</p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="availableGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3DDC97" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#3DDC97" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#3DDC97" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} strokeOpacity={0.5} />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              dx={-4}
              unit=" kWh"
            />
            <Tooltip content={<CustomTooltip t={t} />} />
            <Area
              type="monotone"
              dataKey="available"
              stroke="#3DDC97"
              strokeWidth={2.5}
              fill="url(#availableGradient)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#3DDC97", fill: "var(--background)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

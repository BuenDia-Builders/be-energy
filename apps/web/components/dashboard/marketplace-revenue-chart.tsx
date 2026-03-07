"use client"

import { useI18n } from "@/lib/i18n-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const data = [
  { day: "Mon", revenue: 4.2, energySold: 1.8 },
  { day: "Tue", revenue: 6.5, energySold: 2.8 },
  { day: "Wed", revenue: 3.1, energySold: 1.3 },
  { day: "Thu", revenue: 7.8, energySold: 3.4 },
  { day: "Fri", revenue: 8.2, energySold: 3.5 },
  { day: "Sat", revenue: 9.5, energySold: 4.1 },
  { day: "Sun", revenue: 6.8, energySold: 2.9 },
]

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const revenue = payload.find((p) => p.dataKey === "revenue")?.value || 0
  const energySold = payload.find((p) => p.dataKey === "energySold")?.value || 0

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-card-foreground">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-web3-purple" />
            <span className="text-sm text-muted-foreground">Revenue</span>
          </div>
          <span className="text-sm font-semibold text-web3-purple">${revenue.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/50" />
            <span className="text-sm text-muted-foreground">Energy sold</span>
          </div>
          <span className="text-sm font-semibold text-card-foreground">{energySold.toFixed(1)} kWh</span>
        </div>
      </div>
    </div>
  )
}

export function MarketplaceRevenueChart() {
  const { t } = useI18n()

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const totalEnergySold = data.reduce((sum, d) => sum + d.energySold, 0)

  return (
    <Card className="border-0 bg-card shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{t("chart.marketplace_revenue")}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Weekly earnings from energy sales</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-web3-purple">${totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{totalEnergySold.toFixed(1)} kWh sold</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C590FC" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#C590FC" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} strokeOpacity={0.5} />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
              dx={-4}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#C590FC"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#C590FC", fill: "var(--background)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

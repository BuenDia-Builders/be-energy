"use client"

import { useI18n } from "@/lib/i18n-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const data = [
  { day: "Mon", consumed: 6.5, stored: 4.2, sold: 4.5 },
  { day: "Tue", consumed: 7.8, stored: 5.1, sold: 5.6 },
  { day: "Wed", consumed: 5.2, stored: 3.8, sold: 3.8 },
  { day: "Thu", consumed: 8.5, stored: 5.8, sold: 5.8 },
  { day: "Fri", consumed: 7.2, stored: 6.1, sold: 6.1 },
  { day: "Sat", consumed: 9.1, stored: 6.8, sold: 6.4 },
  { day: "Sun", consumed: 7.5, stored: 5.5, sold: 5.4 },
]

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string; name: string }>
  label?: string
  t: (key: string) => string
}

function CustomTooltip({ active, payload, label, t }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const consumed = payload.find((p) => p.dataKey === "consumed")?.value || 0
  const stored = payload.find((p) => p.dataKey === "stored")?.value || 0
  const sold = payload.find((p) => p.dataKey === "sold")?.value || 0
  const total = consumed + stored + sold

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-card-foreground">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-sm bg-solar-orange" />
            <span className="text-sm text-muted-foreground">{t("chart.consumed_locally")}</span>
          </div>
          <span className="text-sm font-semibold text-card-foreground">{consumed.toFixed(1)} kWh</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-sm bg-energy-green" />
            <span className="text-sm text-muted-foreground">{t("chart.stored")}</span>
          </div>
          <span className="text-sm font-semibold text-card-foreground">{stored.toFixed(1)} kWh</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-sm bg-web3-purple" />
            <span className="text-sm text-muted-foreground">{t("chart.sold")}</span>
          </div>
          <span className="text-sm font-semibold text-card-foreground">{sold.toFixed(1)} kWh</span>
        </div>
        <div className="mt-2 border-t border-border pt-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-muted-foreground">Total</span>
            <span className="text-sm font-bold text-card-foreground">{total.toFixed(1)} kWh</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EnergyDistribution() {
  const { t } = useI18n()

  return (
    <Card className="border-0 bg-card shadow-sm">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">{t("chart.energy_distribution")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">How your generated energy is used</p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
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
            <Tooltip content={<CustomTooltip t={t} />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
            <Legend
              wrapperStyle={{ paddingTop: "12px" }}
              formatter={(value) => <span className="text-xs font-medium text-muted-foreground">{value}</span>}
            />
            <Bar dataKey="consumed" name={t("chart.consumed_locally")} stackId="a" fill="#FA9A4B" radius={[0, 0, 0, 0]} />
            <Bar dataKey="stored" name={t("chart.stored")} stackId="a" fill="#3DDC97" radius={[0, 0, 0, 0]} />
            <Bar dataKey="sold" name={t("chart.sold")} stackId="a" fill="#C590FC" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

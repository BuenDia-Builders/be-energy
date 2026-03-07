"use client"

import { useState } from "react"
import { useI18n } from "@/lib/i18n-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const data7d = [
  { day: "Mon", production: 15.2, consumption: 10.1 },
  { day: "Tue", production: 18.5, consumption: 12.3 },
  { day: "Wed", production: 12.8, consumption: 11.5 },
  { day: "Thu", production: 20.1, consumption: 13.2 },
  { day: "Fri", production: 19.4, consumption: 12.8 },
  { day: "Sat", production: 22.3, consumption: 14.1 },
  { day: "Sun", production: 18.4, consumption: 12.1 },
].map((d) => ({ ...d, surplus: Math.max(0, d.production - d.consumption) }))

const data24h = [
  { day: "00:00", production: 0, consumption: 0.5 },
  { day: "04:00", production: 0, consumption: 0.3 },
  { day: "08:00", production: 2.5, consumption: 1.8 },
  { day: "12:00", production: 5.8, consumption: 2.4 },
  { day: "16:00", production: 4.2, consumption: 3.1 },
  { day: "20:00", production: 0.8, consumption: 2.5 },
].map((d) => ({ ...d, surplus: Math.max(0, d.production - d.consumption) }))

const data30d = [
  { day: "Week 1", production: 98, consumption: 72 },
  { day: "Week 2", production: 112, consumption: 85 },
  { day: "Week 3", production: 105, consumption: 78 },
  { day: "Week 4", production: 125, consumption: 92 },
].map((d) => ({ ...d, surplus: Math.max(0, d.production - d.consumption) }))

type TimeRange = "24h" | "7d" | "30d"

const dataByRange: Record<TimeRange, typeof data7d> = {
  "24h": data24h,
  "7d": data7d,
  "30d": data30d,
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: string
  t: (key: string) => string
}

function CustomTooltip({ active, payload, label, t }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const production = payload.find((p) => p.dataKey === "production")?.value || 0
  const consumption = payload.find((p) => p.dataKey === "consumption")?.value || 0
  const surplus = production - consumption

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-card-foreground">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-solar-yellow" />
            <span className="text-sm text-muted-foreground">{t("chart.production")}</span>
          </div>
          <span className="text-sm font-semibold text-card-foreground">{production.toFixed(1)} kWh</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-solar-orange" />
            <span className="text-sm text-muted-foreground">{t("chart.consumption")}</span>
          </div>
          <span className="text-sm font-semibold text-card-foreground">{consumption.toFixed(1)} kWh</span>
        </div>
        {surplus > 0 && (
          <div className="mt-2 border-t border-border pt-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-energy-green" />
                <span className="text-sm text-muted-foreground">Surplus</span>
              </div>
              <span className="text-sm font-semibold text-energy-green">+{surplus.toFixed(1)} kWh</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function EnergyChart() {
  const { t } = useI18n()
  const [timeRange, setTimeRange] = useState<TimeRange>("7d")

  const ranges: TimeRange[] = ["24h", "7d", "30d"]

  return (
    <Card className="border-0 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">
            {t("chart.production_vs_consumption")}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Energy in kWh</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {ranges.map((range) => (
            <Button
              key={range}
              variant="ghost"
              size="sm"
              onClick={() => setTimeRange(range)}
              className={cn(
                "h-7 px-3 text-xs font-medium transition-all",
                timeRange === range && "bg-background shadow-sm"
              )}
            >
              {t(`chart.${range}`)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={dataByRange[timeRange]} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="surplusGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3DDC97" stopOpacity={0.2} />
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
            <Legend
              wrapperStyle={{ paddingTop: "16px" }}
              formatter={(value) => <span className="text-xs font-medium text-muted-foreground">{value}</span>}
            />
            <Area type="monotone" dataKey="surplus" name="Surplus" fill="url(#surplusGradient)" stroke="transparent" />
            <Line
              type="monotone"
              dataKey="production"
              name={t("chart.production")}
              stroke="#FEC800"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#FEC800", fill: "var(--background)" }}
            />
            <Line
              type="monotone"
              dataKey="consumption"
              name={t("chart.consumption")}
              stroke="#FA9A4B"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#FA9A4B", fill: "var(--background)" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

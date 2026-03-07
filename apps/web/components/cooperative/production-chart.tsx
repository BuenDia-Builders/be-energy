"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useCooperativeApp } from "./app-context"

const data = [
  { day: "Lun", production: 15.2, consumption: 10.8 },
  { day: "Mar", production: 17.8, consumption: 11.4 },
  { day: "Mié", production: 14.1, consumption: 12.3 },
  { day: "Jue", production: 19.6, consumption: 13.1 },
  { day: "Vie", production: 22.3, consumption: 14.0 },
  { day: "Sáb", production: 20.5, consumption: 10.2 },
  { day: "Dom", production: 18.4, consumption: 12.1 },
]

const dataEn = [
  { day: "Mon", production: 15.2, consumption: 10.8 },
  { day: "Tue", production: 17.8, consumption: 11.4 },
  { day: "Wed", production: 14.1, consumption: 12.3 },
  { day: "Thu", production: 19.6, consumption: 13.1 },
  { day: "Fri", production: 22.3, consumption: 14.0 },
  { day: "Sat", production: 20.5, consumption: 10.2 },
  { day: "Sun", production: 18.4, consumption: 12.1 },
]

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3.5 py-2.5 shadow-lg text-xs">
      <p className="font-medium text-foreground mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">{p.value} kWh</span>
        </div>
      ))}
    </div>
  )
}

export function CooperativeProductionChart() {
  const { t, language } = useCooperativeApp()
  const chartData = language === "es" ? data : dataEn

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {t("energyGenerationVsConsumption")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("last7days")}</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2.5 h-0.5 bg-[#FEC800] rounded-full inline-block" />
            {t("generation")}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2.5 h-0.5 bg-[#FA9A4B] rounded-full inline-block" />
            {t("consumption")}
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}`}
            unit=" kWh"
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="production"
            name={t("generation")}
            stroke="#FEC800"
            strokeWidth={2}
            dot={{ r: 3, fill: "#FEC800", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="consumption"
            name={t("consumption")}
            stroke="#FA9A4B"
            strokeWidth={2}
            dot={{ r: 3, fill: "#FA9A4B", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { useCooperativeApp } from "./app-context"

const areaData = [
  { time: "06:00", energy: 0.4 },
  { time: "08:00", energy: 1.2 },
  { time: "10:00", energy: 2.8 },
  { time: "12:00", energy: 4.1 },
  { time: "14:00", energy: 5.0 },
  { time: "16:00", energy: 4.3 },
  { time: "18:00", energy: 2.9 },
  { time: "20:00", energy: 1.0 },
  { time: "22:00", energy: 0.2 },
]

const barData = [
  { name: "Lun/Mon", consumed: 10.8, stored: 3.1, sold: 1.3 },
  { name: "Mar/Tue", consumed: 11.4, stored: 4.0, sold: 2.4 },
  { name: "Mié/Wed", consumed: 12.3, stored: 1.2, sold: 0.6 },
  { name: "Jue/Thu", consumed: 13.1, stored: 4.5, sold: 2.0 },
  { name: "Vie/Fri", consumed: 14.0, stored: 5.3, sold: 3.0 },
  { name: "Sáb/Sat", consumed: 10.2, stored: 6.8, sold: 3.5 },
  { name: "Dom/Sun", consumed: 12.1, stored: 4.2, sold: 2.1 },
]

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function AreaTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3.5 py-2.5 shadow-lg text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#3DDC97]" />
        <span className="text-muted-foreground">{payload[0].value.toFixed(1)} kWh</span>
      </div>
    </div>
  )
}

function BarTooltip({ active, payload, label }: TooltipProps) {
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

export function CooperativeAvailableEnergyChart() {
  const { t } = useCooperativeApp()

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-foreground">{t("availableEnergy")}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{t("availableEnergyDesc")}</p>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={areaData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="coopGreenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3DDC97" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3DDC97" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
            unit=" kWh"
          />
          <Tooltip content={<AreaTooltip />} />
          <Area
            type="monotone"
            dataKey="energy"
            stroke="#3DDC97"
            strokeWidth={2}
            fill="url(#coopGreenGrad)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "#3DDC97" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CooperativeGridDistributionChart() {
  const { t } = useCooperativeApp()

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{t("gridDistribution")}</h2>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded bg-[#FEC800]" />
            {t("selfConsumed")}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded bg-[#FA9A4B]" />
            {t("soldToNeighbors")}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded bg-[#3DDC97]" />
            {t("injectedToGrid")}
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            strokeOpacity={0.07}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
            unit=" kWh"
          />
          <Tooltip content={<BarTooltip />} />
          <Bar
            dataKey="consumed"
            name={t("selfConsumed")}
            stackId="a"
            fill="#FEC800"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="stored"
            name={t("soldToNeighbors")}
            stackId="a"
            fill="#FA9A4B"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="sold"
            name={t("injectedToGrid")}
            stackId="a"
            fill="#3DDC97"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

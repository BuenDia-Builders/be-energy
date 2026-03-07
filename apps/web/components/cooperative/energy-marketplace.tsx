"use client"

import { useCooperativeApp } from "./app-context"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

const tradingData = [
  { time: "00:00", volume: 45, price: 0.12 },
  { time: "04:00", volume: 52, price: 0.11 },
  { time: "08:00", volume: 78, price: 0.13 },
  { time: "12:00", volume: 95, price: 0.15 },
  { time: "16:00", volume: 142, price: 0.16 },
  { time: "20:00", volume: 118, price: 0.14 },
]

const recentTrades = [
  {
    id: 1,
    seller: "0x3f4a...",
    buyer: "0x8d2c...",
    energy: 50,
    price: 0.15,
    status: "completed",
    time: "2 min ago",
  },
  {
    id: 2,
    seller: "0x1b5a...",
    buyer: "0x6f2a...",
    energy: 75,
    price: 0.14,
    status: "completed",
    time: "5 min ago",
  },
  {
    id: 3,
    seller: "0x4e7c...",
    buyer: "0x9a3f...",
    energy: 120,
    price: 0.16,
    status: "pending",
    time: "8 min ago",
  },
  {
    id: 4,
    seller: "0x2d8e...",
    buyer: "0x5c1b...",
    energy: 45,
    price: 0.13,
    status: "completed",
    time: "12 min ago",
  },
]

export function EnergyMarketplace() {
  const { t } = useCooperativeApp()

  const totalVolume = tradingData.reduce((sum, d) => sum + d.volume, 0)
  const avgPrice = (tradingData.reduce((sum, d) => sum + d.price, 0) / tradingData.length).toFixed(
    2
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">{t("marketplaceMonitoring")}</h1>
        <p className="text-muted-foreground text-sm">
          Energy trading volume and marketplace analytics
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t("tradingVolume")}</p>
          <p className="text-3xl font-bold text-primary">{totalVolume} kWh</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t("avgPrice")}</p>
          <p className="text-3xl font-bold text-foreground">${avgPrice}/kWh</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t("txToday")}</p>
          <p className="text-3xl font-bold text-[#3DDC97]">{recentTrades.length}</p>
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("tradingVolume")}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={tradingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="time"
              stroke="var(--color-muted-foreground)"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-secondary)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "var(--color-foreground)" }}
            />
            <Bar dataKey="volume" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("avgPrice")}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tradingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="time"
              stroke="var(--color-muted-foreground)"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-secondary)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "var(--color-foreground)" }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="var(--color-web3-purple)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{t("recentTrades")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  {t("seller")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  {t("buyer")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                  {t("energy")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                  {t("price")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  {t("status")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-foreground">{trade.seller}</td>
                  <td className="px-6 py-4 text-sm font-mono text-foreground">{trade.buyer}</td>
                  <td className="px-6 py-4 text-sm text-right text-foreground">
                    {trade.energy} kWh
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-primary font-semibold">
                    ${trade.price}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        trade.status === "completed"
                          ? "bg-green-500/20 text-[#3DDC97]"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {trade.status === "completed" ? t("completed") : t("pending")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useCooperativeApp } from "./app-context"
import { Search } from "lucide-react"

const mockProsumers = [
  { id: 1, wallet: "0x3f4a9e21...", generated: 245.5, sold: 125.3, hdrop: 1250, status: "online" },
  { id: 2, wallet: "0x8d2c4e7f...", generated: 198.2, sold: 89.5, hdrop: 895, status: "online" },
  { id: 3, wallet: "0x1b5a9c3e...", generated: 312.8, sold: 156.4, hdrop: 1564, status: "offline" },
  { id: 4, wallet: "0x6f2a8e1d...", generated: 176.4, sold: 92.1, hdrop: 921, status: "online" },
  { id: 5, wallet: "0x4e7c2f9a...", generated: 289.1, sold: 144.5, hdrop: 1445, status: "online" },
]

export function Prosumers() {
  const { t } = useCooperativeApp()
  const [search, setSearch] = useState("")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">{t("prosumerManagement")}</h1>
        <p className="text-muted-foreground text-sm">
          Manage and monitor prosumer accounts and activities
        </p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  {t("walletAddress")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                  {t("energyGenerated")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                  {t("energySold")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                  {t("hdropMinted")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  {t("status")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockProsumers.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-foreground">{p.wallet}</td>
                  <td className="px-6 py-4 text-sm text-right text-foreground">
                    {p.generated.toFixed(1)} kWh
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-foreground">
                    {p.sold.toFixed(1)} kWh
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-primary font-semibold">
                    {p.hdrop}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        p.status === "online"
                          ? "bg-green-500/20 text-[#3DDC97]"
                          : "bg-orange-500/20 text-[#FA9A4B]"
                      }`}
                    >
                      {p.status === "online" ? t("online") : t("offline")}
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

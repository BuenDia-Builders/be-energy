"use client"

import { useCooperativeApp } from "./app-context"
import { Search } from "lucide-react"
import { useState } from "react"

const logs = [
  {
    id: 1,
    timestamp: "2024-01-16 14:32:15",
    event: "Energy Trade Completed",
    user: "Prosumer_001",
    module: "Marketplace",
    status: "completed",
  },
  {
    id: 2,
    timestamp: "2024-01-16 14:28:42",
    event: "Settlement Processed",
    user: "Admin",
    module: "Billing",
    status: "completed",
  },
  {
    id: 3,
    timestamp: "2024-01-16 14:25:11",
    event: "Meter Reading Failed",
    user: "System",
    module: "SmartMeters",
    status: "failed",
  },
  {
    id: 4,
    timestamp: "2024-01-16 14:22:08",
    event: "HDROP Minting",
    user: "Prosumer_045",
    module: "Blockchain",
    status: "completed",
  },
  {
    id: 5,
    timestamp: "2024-01-16 14:18:33",
    event: "Grid Threshold Alert",
    user: "System",
    module: "GridMonitoring",
    status: "pending",
  },
  {
    id: 6,
    timestamp: "2024-01-16 14:15:22",
    event: "Prosumer Registered",
    user: "Admin",
    module: "Users",
    status: "completed",
  },
  {
    id: 7,
    timestamp: "2024-01-16 14:12:45",
    event: "IoT Gateway Offline",
    user: "System",
    module: "IoT",
    status: "failed",
  },
  {
    id: 8,
    timestamp: "2024-01-16 14:09:10",
    event: "Price Update",
    user: "Admin",
    module: "Marketplace",
    status: "completed",
  },
]

export function SystemLogs() {
  const { t } = useCooperativeApp()
  const [search, setSearch] = useState("")

  const filteredLogs = logs.filter(
    (log) =>
      log.event.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.module.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-[#3DDC97]"
      case "failed":
        return "bg-red-500/20 text-red-400"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400"
      default:
        return "bg-secondary text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">{t("systemLogs")}</h1>
        <p className="text-muted-foreground text-sm">
          View and filter system events and activities
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
                  {t("timestamp")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  {t("event")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  {t("user")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  {t("module")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  {t("status")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">{log.event}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{log.user}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{log.module}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}
                    >
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
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

"use client"

import { useCooperativeApp } from "./app-context"

const mockMeters = [
  { id: "SM-001", status: "online", voltage: 230, frequency: 50.0, lastReading: "2 min ago" },
  { id: "SM-002", status: "online", voltage: 229, frequency: 50.1, lastReading: "1 min ago" },
  { id: "SM-003", status: "offline", voltage: 0, frequency: 0, lastReading: "45 min ago" },
  { id: "SM-004", status: "online", voltage: 231, frequency: 49.9, lastReading: "3 min ago" },
  { id: "SM-005", status: "online", voltage: 230, frequency: 50.0, lastReading: "1 min ago" },
  { id: "SM-006", status: "pending", voltage: 228, frequency: 50.2, lastReading: "15 min ago" },
]

export function SmartMeters() {
  const { t } = useCooperativeApp()

  const onlineCount = mockMeters.filter((m) => m.status === "online").length
  const offlineCount = mockMeters.filter((m) => m.status === "offline").length
  const pendingCount = mockMeters.filter((m) => m.status === "pending").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">{t("smartMeters")}</h1>
        <p className="text-muted-foreground text-sm">
          Monitor and manage smart meter network status
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t("onlineMeters")}</p>
          <p className="text-3xl font-bold text-[#3DDC97]">{onlineCount}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t("offlineMeters")}</p>
          <p className="text-3xl font-bold text-[#FA9A4B]">{offlineCount}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t("pendingReadings")}</p>
          <p className="text-3xl font-bold text-primary">{pendingCount}</p>
        </div>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Meter ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  {t("status")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                  Voltage (V)
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                  Frequency (Hz)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Last Reading
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockMeters.map((meter) => (
                <tr key={meter.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-foreground">{meter.id}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        meter.status === "online"
                          ? "bg-green-500/20 text-[#3DDC97]"
                          : meter.status === "offline"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {meter.status === "online"
                        ? t("online")
                        : meter.status === "offline"
                          ? t("offline")
                          : t("pending")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-foreground">{meter.voltage}</td>
                  <td className="px-6 py-4 text-sm text-right text-foreground">
                    {meter.frequency}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {meter.lastReading}
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

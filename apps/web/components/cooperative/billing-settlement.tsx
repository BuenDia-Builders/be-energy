"use client"

import { useCooperativeApp } from "./app-context"

const settlements = [
  { id: 1, date: "2024-01-15", cooperative: "Coop A", credits: 1250, status: "completed" },
  { id: 2, date: "2024-01-14", cooperative: "Coop B", credits: 980, status: "completed" },
  { id: 3, date: "2024-01-13", cooperative: "Coop C", credits: 2150, status: "pending" },
  { id: 4, date: "2024-01-12", cooperative: "Coop A", credits: 1850, status: "completed" },
]

export function BillingSettlement() {
  const { t } = useCooperativeApp()

  const totalCredits = settlements.reduce((sum, s) => sum + s.credits, 0)
  const completedCredits = settlements
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.credits, 0)
  const pendingCredits = settlements
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + s.credits, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">{t("billingSettlement")}</h1>
        <p className="text-muted-foreground text-sm">
          Energy credits and settlement management
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t("totalCreditsIssued")}</p>
          <p className="text-3xl font-bold text-primary">{totalCredits.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-2">Energy Credits</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t("energyRedeemed")}</p>
          <p className="text-3xl font-bold text-[#3DDC97]">{completedCredits.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-2">in Bills</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t("pendingSettlements")}</p>
          <p className="text-3xl font-bold text-[#FA9A4B]">{pendingCredits.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-2">Pending</p>
        </div>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Recent Settlements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  {t("timestamp")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Cooperative
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                  Credits Issued
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  {t("status")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {settlements.map((settlement) => (
                <tr key={settlement.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-foreground">{settlement.date}</td>
                  <td className="px-6 py-4 text-sm text-foreground font-medium">
                    {settlement.cooperative}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-primary font-semibold">
                    {settlement.credits.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        settlement.status === "completed"
                          ? "bg-green-500/20 text-[#3DDC97]"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {settlement.status === "completed" ? t("completed") : t("pending")}
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

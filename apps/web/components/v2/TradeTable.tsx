"use client"

import { useI18nV2 } from "@/lib/v2/i18n-provider"
import { StatusBadge } from "./StatusBadge"
import type { Trade } from "@/lib/v2/mock-data"

interface TradeTableProps {
  trades: Trade[]
  className?: string
}

export function TradeTable({ trades, className = "" }: TradeTableProps) {
  const { t } = useI18nV2()

  if (trades.length === 0) {
    return (
      <div
        className={`text-center py-12 ${className}`}
        style={{ color: "var(--v2-text-muted)" }}
      >
        {t("dash.trades.empty")}
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr
            className="text-left text-xs font-medium border-b"
            style={{
              color: "var(--v2-text-muted)",
              borderColor: "var(--v2-border)",
            }}
          >
            <th className="pb-3 pr-4">{t("dash.trades.from")}</th>
            <th className="pb-3 pr-4">{t("dash.trades.to")}</th>
            <th className="pb-3 pr-4 text-right">{t("dash.trades.amount")}</th>
            <th className="pb-3 pr-4">{t("dash.trades.status")}</th>
            <th className="pb-3">{t("dash.trades.time")}</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr
              key={trade.id}
              className="border-b last:border-0 transition-colors"
              style={{ borderColor: "var(--v2-border-subtle)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--v2-bg-card-hover)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
              }}
            >
              <td className="py-3 pr-4">
                <span className="text-sm font-medium" style={{ color: "var(--v2-text)" }}>
                  {trade.from}
                </span>
              </td>
              <td className="py-3 pr-4">
                <span className="text-sm" style={{ color: "var(--v2-text-secondary)" }}>
                  {trade.to}
                </span>
              </td>
              <td className="py-3 pr-4 text-right">
                <span className="text-sm font-medium mono" style={{ color: "var(--v2-text)" }}>
                  {trade.amount.toFixed(1)} kWh
                </span>
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={trade.status} />
              </td>
              <td className="py-3">
                <span className="text-xs" style={{ color: "var(--v2-text-muted)" }}>
                  {trade.timestamp}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

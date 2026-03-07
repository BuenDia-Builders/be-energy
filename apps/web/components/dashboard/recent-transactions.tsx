"use client"

import { useI18n } from "@/lib/i18n-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from "lucide-react"

const transactions = [
  { type: "energy_sale", amount: "+2.4 kWh", date: "2024-03-06 14:32", status: "completed" },
  { type: "token_transfer", amount: "+45 HDROP", date: "2024-03-06 12:15", status: "completed" },
  { type: "energy_purchase", amount: "-1.8 kWh", date: "2024-03-06 10:48", status: "pending" },
  { type: "energy_sale", amount: "+3.2 kWh", date: "2024-03-05 18:22", status: "completed" },
  { type: "token_transfer", amount: "+28 HDROP", date: "2024-03-05 15:05", status: "completed" },
]

const typeIcons: Record<string, typeof ArrowUpRight> = {
  energy_sale: ArrowUpRight,
  token_transfer: ArrowLeftRight,
  energy_purchase: ArrowDownRight,
}

const typeColors: Record<string, string> = {
  energy_sale: "text-energy-green bg-energy-green/10",
  token_transfer: "text-web3-purple bg-web3-purple/10",
  energy_purchase: "text-solar-orange bg-solar-orange/10",
}

export function RecentTransactions() {
  const { t } = useI18n()

  return (
    <Card className="border-0 bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{t("transactions.recent")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx, idx) => {
            const Icon = typeIcons[tx.type]
            return (
              <div
                key={idx}
                className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", typeColors[tx.type])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{t(`transactions.${tx.type}`)}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      tx.amount.startsWith("+") ? "text-energy-green" : "text-solar-orange"
                    )}
                  >
                    {tx.amount}
                  </span>
                  <Badge
                    variant={tx.status === "completed" ? "default" : "secondary"}
                    className={cn(
                      "text-xs",
                      tx.status === "completed"
                        ? "bg-energy-green/20 text-energy-green hover:bg-energy-green/30"
                        : "bg-solar-orange/20 text-solar-orange hover:bg-solar-orange/30"
                    )}
                  >
                    {t(`transactions.${tx.status}`)}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useI18n } from "@/lib/i18n-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Hexagon, ShieldCheck, BadgeCheck } from "lucide-react"

interface RankingUser {
  rank: number
  username: string
  avatar: string
  avatarColor: string
  energy: number
  savings: number
  efficiency: number
  zkVerified: boolean
}

const rankings: RankingUser[] = [
  { rank: 1, username: "SolarKing_01", avatar: "S", avatarColor: "bg-solar-yellow", energy: 245.8, savings: 92, efficiency: 5, zkVerified: true },
  { rank: 2, username: "GreenPower_MX", avatar: "G", avatarColor: "bg-energy-green", energy: 198.3, savings: 87, efficiency: 4, zkVerified: true },
  { rank: 3, username: "SunHarvest_22", avatar: "S", avatarColor: "bg-solar-orange", energy: 176.5, savings: 81, efficiency: 4, zkVerified: true },
  { rank: 4, username: "EcoEnergy_Pro", avatar: "E", avatarColor: "bg-web3-purple", energy: 154.2, savings: 76, efficiency: 3, zkVerified: false },
  { rank: 5, username: "CleanWatts_CR", avatar: "C", avatarColor: "bg-primary", energy: 132.9, savings: 71, efficiency: 3, zkVerified: true },
]

function HoneycombIndicator({ filled, total = 5 }: { filled: number; total?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <Hexagon
          key={i}
          className={cn(
            "h-3.5 w-3.5 transition-colors",
            i < filled ? "fill-solar-yellow text-solar-yellow" : "fill-transparent text-muted-foreground/30"
          )}
          strokeWidth={1.5}
        />
      ))}
    </div>
  )
}

function UserAvatar({ letter, color }: { letter: string; color: string }) {
  return (
    <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-black ring-2 ring-background", color)}>
      {letter}
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = {
    1: "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-sm",
    2: "bg-gradient-to-br from-gray-300 to-gray-500 text-black shadow-sm",
    3: "bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-sm",
  }

  if (rank <= 3) {
    return (
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", styles[rank])}>
        {rank}
      </div>
    )
  }

  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
      {rank}
    </div>
  )
}

export function CommunityRanking() {
  const { t } = useI18n()

  return (
    <Card className="border-0 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <span className="text-solar-yellow">&#127942;</span>
            {t("ranking.title")}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{t("ranking.subtitle")}</CardDescription>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <ShieldCheck className="h-5 w-5 text-energy-green" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {rankings.map((user) => {
          const isTopThree = user.rank <= 3
          const rowGradients: Record<number, string> = {
            1: "from-solar-yellow/10 via-solar-yellow/5 to-transparent border-l-2 border-l-solar-yellow",
            2: "from-gray-400/10 via-gray-400/5 to-transparent border-l-2 border-l-gray-400",
            3: "from-amber-500/10 via-amber-500/5 to-transparent border-l-2 border-l-amber-500",
          }

          return (
            <div
              key={user.rank}
              className={cn(
                "flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-primary/5",
                isTopThree && `bg-gradient-to-r ${rowGradients[user.rank]}`
              )}
            >
              <RankBadge rank={user.rank} />
              <UserAvatar letter={user.avatar} color={user.avatarColor} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{user.username}</span>
                  {user.zkVerified && (
                    <Badge variant="secondary" className="h-5 gap-1 bg-energy-green/10 px-1.5 text-[10px] font-medium text-energy-green hover:bg-energy-green/20">
                      <BadgeCheck className="h-3 w-3" />
                      ZK
                    </Badge>
                  )}
                </div>
                <HoneycombIndicator filled={user.efficiency} />
              </div>
              <div className="flex flex-col items-end gap-0.5 text-right">
                <span className="text-sm font-semibold text-solar-yellow">{user.energy} kWh</span>
                <span className="text-xs text-energy-green">
                  {user.savings}% {t("ranking.savings")}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

"use client"

import { useI18n } from "@/lib/i18n-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface EfficiencyScoreProps {
  score?: number
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#3DDC97"
  if (score >= 50) return "#FEC800"
  return "#FA9A4B"
}

export function EfficiencyScore({ score = 87 }: EfficiencyScoreProps) {
  const { t } = useI18n()

  const circumference = 2 * Math.PI * 42
  const strokeDashoffset = circumference - (score / 100) * circumference
  const scoreColor = getScoreColor(score)

  return (
    <Card className="border-0 bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{t("efficiency.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-2">
        <div className="relative">
          <svg className="h-28 w-28 -rotate-90 transform" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="10" strokeOpacity={0.3} />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={scoreColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
              style={{ filter: `drop-shadow(0 0 6px ${scoreColor}40)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: scoreColor }}>
              {score}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-solar-orange" />
            <span className="text-[10px] text-muted-foreground">0-50</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-solar-yellow" />
            <span className="text-[10px] text-muted-foreground">50-80</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-energy-green" />
            <span className="text-[10px] text-muted-foreground">80-100</span>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground leading-relaxed">{t("efficiency.description")}</p>
      </CardContent>
    </Card>
  )
}

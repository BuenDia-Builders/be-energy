"use client"

import { Sparkline } from "./Sparkline"

interface StatCardProps {
  title: string
  value: string
  subtitle: string
  trend?: number[]
  trendColor?: string
  icon?: React.ReactNode
  className?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendColor = "#22c55e",
  icon,
  className = "",
}: StatCardProps) {
  return (
    <div className={`v2-card p-5 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--v2-text-muted)" }}
        >
          {title}
        </span>
        {icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--v2-accent-subtle)" }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold mono" style={{ color: "var(--v2-text)" }}>
            {value}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--v2-text-secondary)" }}>
            {subtitle}
          </p>
        </div>
        {trend && <Sparkline data={trend} color={trendColor} />}
      </div>
    </div>
  )
}

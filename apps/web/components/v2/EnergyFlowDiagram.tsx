"use client"

import { useI18nV2 } from "@/lib/v2/i18n-provider"

interface EnergyFlowDiagramProps {
  className?: string
}

export function EnergyFlowDiagram({ className = "" }: EnergyFlowDiagramProps) {
  const { t } = useI18nV2()

  const steps = [
    { key: "flow.step1", icon: SunIcon },
    { key: "flow.step2", icon: MeterIcon },
    { key: "flow.step3", icon: PoolIcon },
    { key: "flow.step4", icon: DistributeIcon },
  ]

  return (
    <div className={`flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 ${className}`}>
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center gap-4 md:gap-0">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "var(--v2-accent-subtle)",
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              <step.icon />
            </div>
            <span
              className="text-sm font-medium text-center max-w-[100px]"
              style={{ color: "var(--v2-text-secondary)" }}
            >
              {t(step.key)}
            </span>
          </div>
          {i < steps.length - 1 && (
            <svg
              className="hidden md:block mx-6"
              width="48"
              height="24"
              viewBox="0 0 48 24"
            >
              <defs>
                <linearGradient id={`arrow-grad-${i}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--v2-accent)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--v2-accent)" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <line
                x1="0" y1="12" x2="38" y2="12"
                stroke={`url(#arrow-grad-${i})`}
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <polygon
                points="36,6 48,12 36,18"
                fill="var(--v2-accent)"
                opacity="0.8"
              />
            </svg>
          )}
        </div>
      ))}
    </div>
  )
}

function SunIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--v2-accent)" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MeterIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--v2-accent)" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

function PoolIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--v2-accent)" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="var(--v2-accent)" />
    </svg>
  )
}

function DistributeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--v2-accent)" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
      <path d="M8 8l-3-3M16 8l3-3M8 16l-3 3M16 16l3 3" />
    </svg>
  )
}

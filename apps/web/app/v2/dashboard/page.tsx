"use client"

import { useState } from "react"
import { useI18nV2 } from "@/lib/v2/i18n-provider"
import {
  StatCard,
  DonutChart,
  TradeTable,
  LanguageSwitcher,
  Sparkline,
} from "@/components/v2"
import { mockTrades, mockWeeklyGeneration, mockDashboardStats } from "@/lib/v2/mock-data"

export default function DashboardV2() {
  const { t } = useI18nV2()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const generationTrend = mockWeeklyGeneration.map((d) => d.kwh)
  const consumptionTrend = [10.2, 14.1, 9.8, 16.3, 12.5, 11.2, 13.7]
  const sharedTrend = [5.1, 7.2, 4.8, 9.1, 6.4, 8.8, 7.3]

  return (
    <div className="min-h-screen flex" style={{ background: "var(--v2-bg)" }}>
      {/* ─── Sidebar ─── */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ─── Main content ─── */}
      <main className="flex-1 md:ml-64">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-6 h-16"
          style={{
            background: "rgba(10,10,15,0.8)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--v2-border-subtle)",
          }}
        >
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: "var(--v2-text-secondary)" }}
            onClick={() => setSidebarOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--v2-text)" }}>
              {t("dash.welcome")}
            </h1>
            <p className="text-xs" style={{ color: "var(--v2-text-muted)" }}>
              {t("dash.overview")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "var(--v2-accent-subtle)", color: "var(--v2-accent)" }}
            >
              M
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* ─── 4 Stat Cards ─── */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t("dash.stat.balance")}
              value={`${mockDashboardStats.balance.toFixed(1)} kWh`}
              subtitle={t("dash.stat.balance.sub")}
              trend={generationTrend}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--v2-accent)" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              }
            />
            <StatCard
              title={t("dash.stat.generated")}
              value={`${mockDashboardStats.generatedToday} kWh`}
              subtitle={t("dash.stat.generated.sub")}
              trend={generationTrend}
              trendColor="#22c55e"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--v2-accent)" strokeWidth="2">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              }
            />
            <StatCard
              title={t("dash.stat.consumed")}
              value={`${mockDashboardStats.consumedToday} kWh`}
              subtitle={t("dash.stat.consumed.sub")}
              trend={consumptionTrend}
              trendColor="#f59e0b"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <path d="M3 12h4l3-9 4 18 3-9h4" />
                </svg>
              }
            />
            <StatCard
              title={t("dash.stat.shared")}
              value={`${mockDashboardStats.sharedToday} kWh`}
              subtitle={t("dash.stat.shared.sub")}
              trend={sharedTrend}
              trendColor="#3b82f6"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              }
            />
          </div>

          {/* ─── Generation Chart + Community Pool ─── */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Generation chart */}
            <div className="lg:col-span-2 v2-card-static p-6">
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--v2-text)" }}>
                {t("dash.chart.title")}
              </h3>
              <div className="flex items-end gap-3 h-48">
                {mockWeeklyGeneration.map((d, i) => {
                  const maxKwh = Math.max(...mockWeeklyGeneration.map((x) => x.kwh))
                  const heightPercent = (d.kwh / maxKwh) * 100

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span
                        className="text-xs mono"
                        style={{ color: "var(--v2-text-muted)" }}
                      >
                        {d.kwh}
                      </span>
                      <div className="w-full relative" style={{ height: "140px" }}>
                        <div
                          className="absolute bottom-0 w-full rounded-t-md transition-all duration-500"
                          style={{
                            height: `${heightPercent}%`,
                            background: "var(--v2-gradient-accent)",
                            opacity: 0.85,
                          }}
                        />
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: "var(--v2-text-muted)" }}
                      >
                        {d.day}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Community Pool */}
            <div className="v2-card-static p-6">
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--v2-text)" }}>
                {t("dash.pool.title")}
              </h3>

              <div className="flex justify-center mb-4">
                <DonutChart
                  segments={[
                    { value: mockDashboardStats.poolYourShare, color: "var(--v2-accent)", label: "You" },
                    { value: 100 - mockDashboardStats.poolYourShare, color: "var(--v2-border)", label: "Others" },
                  ]}
                  size={140}
                  strokeWidth={16}
                  centerValue={`${mockDashboardStats.poolYourShare}%`}
                  centerLabel={t("dash.pool.yourShare")}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "var(--v2-text-muted)" }}>
                    {t("dash.pool.total")}
                  </span>
                  <span className="text-sm font-bold mono" style={{ color: "var(--v2-text)" }}>
                    {mockDashboardStats.poolTotal.toLocaleString()} kWh
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "var(--v2-text-muted)" }}>
                    {t("dash.pool.members")}
                  </span>
                  <span className="text-sm font-bold mono" style={{ color: "var(--v2-text)" }}>
                    {mockDashboardStats.poolMembers}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Trades Table ─── */}
          <div className="v2-card-static p-6">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--v2-text)" }}>
              {t("dash.trades.title")}
            </h3>
            <TradeTable trades={mockTrades} />
          </div>

          {/* ─── Quick Actions ─── */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--v2-text)" }}>
              {t("dash.actions.title")}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ActionButton
                label={t("dash.actions.share")}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--v2-accent)" strokeWidth="1.5">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                }
              />
              <ActionButton
                label={t("dash.actions.trade")}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--v2-accent)" strokeWidth="1.5">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 014-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 01-4 4H3" />
                  </svg>
                }
              />
              <ActionButton
                label={t("dash.actions.history")}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--v2-accent)" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                }
              />
              <ActionButton
                label={t("dash.actions.settings")}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--v2-accent)" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                  </svg>
                }
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

/* ============================================
   Sidebar
   ============================================ */

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18nV2()

  const links = [
    {
      label: t("dash.sidebar.dashboard"),
      href: "/v2/dashboard",
      active: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      label: t("dash.sidebar.marketplace"),
      href: "#",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 014-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 01-4 4H3" />
        </svg>
      ),
    },
    {
      label: t("dash.sidebar.activity"),
      href: "#",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 12h4l3-9 4 18 3-9h4" />
        </svg>
      ),
    },
    {
      label: t("dash.sidebar.community"),
      href: "#",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
    {
      label: t("dash.sidebar.settings"),
      href: "#",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--v2-bg-elevated)",
          borderRight: "1px solid var(--v2-border-subtle)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 px-6 h-16"
          style={{ borderBottom: "1px solid var(--v2-border-subtle)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--v2-accent-subtle)", border: "1px solid rgba(34,197,94,0.3)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--v2-accent)" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-base font-bold" style={{ color: "var(--v2-text)" }}>
            BeEnergy
          </span>
        </div>

        {/* Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                color: link.active ? "var(--v2-accent)" : "var(--v2-text-secondary)",
                background: link.active ? "var(--v2-accent-subtle)" : "transparent",
              }}
            >
              {link.icon}
              {link.label}
            </a>
          ))}
        </nav>

        {/* Disconnect */}
        <div className="px-3 pb-4">
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
            style={{
              color: "var(--v2-text-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            {t("dash.sidebar.disconnect")}
          </button>
        </div>
      </aside>
    </>
  )
}

/* ============================================
   Action Button
   ============================================ */

function ActionButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button
      className="v2-card flex flex-col items-center gap-3 p-5 text-center cursor-pointer"
      style={{ border: "1px solid var(--v2-border)" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: "var(--v2-accent-subtle)" }}
      >
        {icon}
      </div>
      <span className="text-xs font-medium" style={{ color: "var(--v2-text-secondary)" }}>
        {label}
      </span>
    </button>
  )
}

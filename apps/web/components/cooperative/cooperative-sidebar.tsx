"use client"

import Link from "next/link"
import { useCooperativeApp } from "./app-context"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Zap,
  ShoppingCart,
  ArrowLeftRight,
  BarChart2,
  User,
  Settings,
  Leaf,
  ArrowLeft,
} from "lucide-react"

const navItems = [
  { key: "overview", icon: LayoutDashboard },
  { key: "gridMonitoring", icon: Zap },
  { key: "prosumers", icon: User },
  { key: "smartMeters", icon: ShoppingCart },
  { key: "energyMarketplace", icon: ArrowLeftRight },
  { key: "billing", icon: BarChart2 },
  { key: "systemLogs", icon: LayoutDashboard },
  { key: "settings", icon: Settings },
]

export function CooperativeSidebar() {
  const { t, activeSection, setActiveSection } = useCooperativeApp()

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-card border-r border-border h-screen sticky top-0 overflow-y-auto">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
          <Leaf className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-base font-semibold tracking-tight text-foreground">
          Be<span className="text-primary">Energy</span>
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ key, icon: Icon }) => {
          const isActive = activeSection === key
          return (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{t(key)}</span>
            </button>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          {t("backToApp")}
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{t("cooperativeAdmin")}</p>
            <p className="text-xs text-muted-foreground truncate">admin@beenergy.coop</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

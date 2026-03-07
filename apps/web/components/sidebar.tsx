"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n-context"
import { Home, Store, History, LogOut, Sun, Zap, BarChart3, User, Settings, Activity, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/wallet-context"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { disconnectWallet } = useWallet()
  const { t } = useI18n()

  const handleDisconnect = () => {
    disconnectWallet()
    router.push("/")
  }

  const menuItems = [
    { icon: Home, label: t("sidebar.dashboard"), href: "/dashboard", enabled: true },
    { icon: Building2, label: t("sidebar.cooperativas"), href: "/cooperativas", enabled: true },
    { icon: Zap, label: t("nav.energy"), href: "/energy", enabled: true },
    { icon: Store, label: t("sidebar.marketplace"), href: "/marketplace", enabled: true },
    { icon: History, label: t("sidebar.activity"), href: "/activity", enabled: true },
    { icon: BarChart3, label: t("nav.analytics"), href: "/analytics", enabled: true },
    { icon: Activity, label: t("sidebar.consumption"), href: "/consumption", enabled: true },
    { icon: User, label: t("nav.profile"), href: "/profile", enabled: true },
    { icon: Settings, label: t("nav.settings"), href: "/settings", enabled: true },
  ]

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex-col z-50">
      {/* Logo - estilo Downloads */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-solar-yellow">
            <Sun className="h-5 w-5 text-black" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">BeEnergy</span>
        </Link>
      </div>

      {/* Menu - estilo Downloads */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return item.enabled ? (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-solar-yellow"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-solar-yellow")} />
              {item.label}
            </Link>
          ) : (
            <div
              key={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/50 opacity-50 cursor-not-allowed"
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </div>
          )
        })}
      </nav>

      {/* Footer Solar Status - estilo Downloads */}
      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-energy-green/20">
              <Zap className="h-5 w-5 text-energy-green" />
            </div>
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">Solar Status</p>
              <p className="text-xs text-sidebar-foreground/70">Generating power</p>
            </div>
          </div>
        </div>
        <Button
          onClick={handleDisconnect}
          variant="outline"
          className="w-full justify-start gap-3 bg-transparent text-sm h-10"
        >
          <LogOut className="w-4 h-4" />
          {t("sidebar.disconnect")}
        </Button>
      </div>
    </aside>
  )
}

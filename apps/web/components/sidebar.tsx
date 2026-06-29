"use client"

import { usePathname, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n-context"
import { useAuth } from "@/lib/auth-context"
import { Home, History, LogOut, Zap, Award, Building2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/wallet-context"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { disconnectWallet } = useWallet()
  const { t } = useI18n()
  const { session } = useAuth()

  const handleDisconnect = () => {
    disconnectWallet()
    router.push("/")
  }

  const menuItems = [
    { icon: Home, label: t("sidebar.dashboard"), href: "/dashboard", enabled: true },
    { icon: Award, label: t("sidebar.certificates"), href: "/certificates", enabled: true },
    { icon: History, label: t("sidebar.activity"), href: "/activity", enabled: true },
    { icon: Zap, label: t("sidebar.consumption"), href: "/consumption", enabled: true },
  ]

  // Role-based items
  if (session && session.admin_cooperative_ids.length > 0) {
    menuItems.push({
      icon: Building2,
      label: t("sidebar.cooperative"),
      href: "/dashboard/cooperative",
      enabled: true,
    })
  }

  if (session?.is_super_admin) {
    menuItems.push({
      icon: Shield,
      label: t("sidebar.admin"),
      href: "/dashboard/admin",
      enabled: true,
    })
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img src="/beenergy-assets/BeEnergy-logo-white.svg" alt="BeEnergy" className="h-7 w-auto" />
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-0.5">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <button
              key={item.href}
              onClick={() => item.enabled && router.push(item.href)}
              disabled={!item.enabled}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left text-sm",
                active
                  ? "bg-sidebar-accent text-sidebar-primary font-semibold"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                !item.enabled && "opacity-40 cursor-not-allowed",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleDisconnect}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          {t("sidebar.disconnect")}
        </button>
      </div>
    </aside>
  )
}

"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n-context"
import { Home, Store, History, Settings, LogOut, Sun, Menu, Zap, BarChart3, User, Activity, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/wallet-context"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function MobileSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useI18n()
  const { disconnectWallet } = useWallet()
  const [open, setOpen] = useState(false)

  const handleDisconnect = () => {
    disconnectWallet()
    router.push("/")
    setOpen(false)
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

  const handleNavigate = (href: string, enabled: boolean) => {
    if (enabled) {
      router.push(href)
      setOpen(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-solar-yellow rounded-full flex items-center justify-center">
            <Sun className="w-6 h-6 text-black" />
              </div>
              <span className="text-2xl font-bold">BeEnergy</span>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigate(item.href, item.enabled)}
                  disabled={!item.enabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                    isActive && "bg-primary/10 text-primary font-semibold",
                    !isActive && item.enabled && "hover:bg-muted text-foreground",
                    !item.enabled && "opacity-50 cursor-not-allowed text-muted-foreground",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Disconnect Button */}
          <div className="p-4 border-t border-border">
            <Button onClick={handleDisconnect} variant="outline" className="w-full justify-start gap-3 bg-transparent">
            <LogOut className="w-5 h-5" />
            {t("sidebar.disconnect")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

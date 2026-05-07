"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n-context"
import { useAuth } from "@/lib/auth-context"
import { Home, History, LogOut, Menu, Zap, Award, Building2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/wallet-context"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"

export function MobileSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { disconnectWallet } = useWallet()
  const { t } = useI18n()
  const { session } = useAuth()
  const [open, setOpen] = useState(false)

  const handleDisconnect = () => {
    disconnectWallet()
    router.push("/")
    setOpen(false)
  }

  const menuItems = [
    { icon: Home, label: t("sidebar.dashboard"), href: "/dashboard", enabled: true },
    { icon: Award, label: t("sidebar.certificates"), href: "/certificates", enabled: true },
    { icon: History, label: t("sidebar.activity"), href: "/activity", enabled: true },
    { icon: Zap, label: t("sidebar.consumption"), href: "/consumption", enabled: true },
  ]

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
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-solar-yellow rounded-full flex items-center justify-center overflow-hidden">
                <img src="/beenergy-assets/iso-transparente.png" alt="BeEnergy" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-2xl font-bold">BeEnergy</span>
            </Link>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigate(item.href, item.enabled)}
                  disabled={!item.enabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                    active && "bg-primary/10 text-primary font-semibold",
                    !active && item.enabled && "hover:bg-muted text-foreground",
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

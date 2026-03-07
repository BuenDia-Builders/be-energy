"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { useI18n } from "@/lib/i18n-context"
import { useTheme } from "@/lib/theme-context"
import { cn } from "@/lib/utils"
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Copy,
  Check,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MobileSidebar } from "@/components/mobile-sidebar"

export function DashboardHeader() {
  const router = useRouter()
  const { address, shortAddress, userProfile, disconnectWallet } = useWallet()
  const { t, language, setLanguage } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLogout = () => {
    disconnectWallet()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      {/* Mobile Menu Button */}
      <div className="lg:hidden">
        <MobileSidebar />
      </div>

      {/* Welcome Message & Wallet */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:block">
          <h2 className="text-sm font-medium text-foreground">
            {t("header.welcome")},{" "}
            <span className="text-solar-yellow">{userProfile?.name ?? shortAddress ?? "User"}</span>
          </h2>
        </div>
        {shortAddress && (
          <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
            <span className="flex h-2 w-2 rounded-full bg-energy-green" />
            <span className="text-xs font-medium text-muted-foreground">{shortAddress}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleCopy}
              title={t("header.copy_wallet")}
            >
              {copied ? (
                <Check className="h-3 w-3 text-energy-green" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("header.search")}
            className="w-64 bg-secondary pl-9"
          />
        </div>
      </div>

      {/* Language Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1">
            <span className="text-sm font-medium">{language.toUpperCase()}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setLanguage("en")}
            className={cn(language === "en" && "bg-accent")}
          >
            English
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setLanguage("es")}
            className={cn(language === "es" && "bg-accent")}
          >
            Español
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme Toggle */}
      <Button variant="ghost" size="icon" className="relative" onClick={toggleTheme}>
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-solar-orange" />
        <span className="sr-only">{t("header.notifications")}</span>
      </Button>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            {userProfile?.avatar ? (
              <Avatar className="h-8 w-8">
                <img src={userProfile.avatar} alt={userProfile.name} className="h-full w-full object-cover" />
              </Avatar>
            ) : (
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-solar-yellow text-black">
                  {userProfile?.name?.charAt(0) ?? shortAddress?.slice(0, 2) ?? "BE"}
                </AvatarFallback>
              </Avatar>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <User className="mr-2 h-4 w-4" />
            {t("nav.profile")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            {t("nav.settings")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("nav.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

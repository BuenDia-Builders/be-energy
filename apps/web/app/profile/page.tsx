"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { useI18n } from "@/lib/i18n-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { generateIdenticon } from "@/lib/utils"
import { User, Camera, Save, ArrowLeft } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { isConnected, address, userProfile, setUserProfile, disconnectWallet } = useWallet()
  const { t } = useI18n()

  const [name, setName] = useState("")
  const [avatar, setAvatar] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name)
      setAvatar(userProfile.avatar)
    }
  }, [userProfile])

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result as string)
        setIsEditing(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatar(null)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!res.ok) {
        console.error("[Profile] Save failed:", await res.text())
        return
      }

      setUserProfile({ name: name.trim(), avatar })
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisconnect = () => {
    disconnectWallet()
    router.push("/")
  }

  const identiconColor = address ? generateIdenticon(address) : "#8DE8F2"

  if (!isConnected || !userProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64">
        <DashboardHeader />
        <main className="p-4 md:p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t("common.back") || "Volver"}
            </Button>

            {/* Profile Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-6 h-6" />
                  {t("profile.pageTitle") || "Mi Perfil"}
                </CardTitle>
                <CardDescription>{t("profile.pageDescription") || "Gestiona tu información personal"}</CardDescription>
              </CardHeader>
            </Card>

            {/* Avatar Section */}
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.avatar")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  {avatar ? (
                    <img
                      src={avatar || "/placeholder.svg"}
                      alt={name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl border-4 border-primary/20"
                      style={{ backgroundColor: identiconColor }}
                    >
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="space-y-2">
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <Button
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                      variant="outline"
                      className="gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      {t("profile.uploadPhoto")}
                    </Button>
                    {avatar && (
                      <Button onClick={handleRemoveAvatar} variant="ghost" className="w-full">
                        {t("profile.remove")}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.personalInfo") || "Información Personal"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("profile.name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setIsEditing(true)
                    }}
                    placeholder={t("profile.namePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("profile.walletAddress") || "Dirección de Wallet"}</Label>
                  <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">{address}</div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleSave} disabled={!isEditing || !name.trim() || isSaving} className="flex-1 gap-2">
                <Save className="w-4 h-4" />
                {isSaving ? t("profile.saving") || "Guardando..." : t("profile.saveChanges") || "Guardar Cambios"}
              </Button>
              <Button onClick={handleDisconnect} variant="destructive" className="sm:w-auto">
                {t("sidebar.disconnect")}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

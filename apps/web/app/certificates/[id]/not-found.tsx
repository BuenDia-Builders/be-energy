"use client"

import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n-context"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, SearchX } from "lucide-react"

export default function CertificateNotFound() {
  const router = useRouter()
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="md:ml-64">
        <DashboardHeader />

        <div className="p-4 md:p-6 space-y-6">
          <Button onClick={() => router.push("/certificates")} variant="ghost" className="hover:bg-muted">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back")}
          </Button>

          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <SearchX className="w-16 h-16 text-muted-foreground mx-auto opacity-50" />
              <h1 className="text-2xl font-bold">{t("certificates.detail.notFoundTitle")}</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t("certificates.detail.notFoundDesc")}
              </p>
              <Button onClick={() => router.push("/certificates")} variant="default" className="mt-4">
                {t("certificates.detail.backToList")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n-context"
import { useMyReadings } from "@/hooks/useMyReadings"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Zap, FileText, RefreshCw, CheckCircle2 } from "lucide-react"
import { InfoTooltip } from "@/components/shared/info-tooltip"

const STATUS_TOOLTIP: Record<string, string> = {
  pending: "Esta lectura está pendiente de validación por el administrador de tu cooperativa.",
  verified: "La cooperativa revisó y confirmó que esta lectura es correcta.",
  certified: "Esta lectura fue certificada y registrada en la blockchain como proto-certificado de energía renovable.",
}

const SOURCE_TOOLTIP: Record<string, string> = {
  meter: "Dato reportado automáticamente por un medidor físico conectado a tu instalación.",
  manual: "Dato cargado manualmente por un miembro o administrador de la cooperativa.",
  estimate: "Valor estimado a partir de la capacidad instalada y condiciones climáticas.",
}

export default function ConsumptionPage() {
  const { isConnected, address } = useWallet()
  const { session } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const { readings, loading, error, refetch } = useMyReadings(address)
  const [verifying, setVerifying] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  const verifyReading = useCallback(async (readingId: string) => {
    setVerifying(prev => ({ ...prev, [readingId]: true }))
    try {
      await fetch("/api/readings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reading_id: readingId, status: "verified" }),
      })
      refetch()
    } finally {
      setVerifying(prev => ({ ...prev, [readingId]: false }))
    }
  }, [refetch])

  const isAdminOf = (cooperativeId: string) =>
    session?.admin_cooperative_ids.includes(cooperativeId) ?? false

  if (!isConnected) {
    return null
  }

  const totalKwh = readings.reduce((sum, r) => sum + r.kwh_generated, 0)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="md:ml-64">
        <DashboardHeader />

        <div className="p-4 md:p-6">
          <Button onClick={() => router.push("/dashboard")} variant="ghost" className="mb-4 hover:bg-muted">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back")}
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl md:text-2xl">{t("sidebar.consumption")}</CardTitle>
                  <CardDescription>{t("consumption.description")}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={refetch} disabled={loading} className="gap-1">
                  <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && readings.length === 0 && (
                <div className="flex items-center justify-center py-16">
                  <Spinner className="size-6" />
                </div>
              )}

              {error && (
                <div className="text-center py-16 text-destructive text-sm">{error}</div>
              )}

              {!loading && !error && readings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Zap className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    {t("consumption.noData")}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {t("consumption.noDataDescription")}
                  </p>
                </div>
              )}

              {readings.length > 0 && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg bg-energy-green/10 border border-energy-green/20">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Zap className="w-6 h-6 text-energy-green" />
                        <InfoTooltip text="Suma total de kWh reportados por tus medidores o cargas manuales" />
                      </div>
                      <p className="text-2xl font-bold text-energy-green">
                        {totalKwh.toLocaleString("es-ES", { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">kWh {t("consumption.total")}</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted border border-border">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <FileText className="w-6 h-6 text-foreground" />
                        <InfoTooltip text="Cantidad de lecturas registradas. Cada lectura representa un periodo de generación." />
                      </div>
                      <p className="text-2xl font-bold">{readings.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Lecturas</p>
                    </div>
                  </div>

                  {/* Readings list */}
                  <div className="space-y-3">
                    {readings.map((reading) => (
                      <div key={reading.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="w-8 h-8 rounded-full bg-energy-green/10 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-energy-green" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{reading.kwh_generated} kWh</p>
                          <p className="text-xs text-muted-foreground">
                            {reading.reading_date
                              ? new Date(reading.reading_date).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : new Date(reading.created_at).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                            reading.status === "verified"
                              ? "bg-energy-green/10 text-energy-green"
                              : reading.status === "certified"
                                ? "bg-web3-purple/10 text-web3-purple"
                                : "bg-solar-yellow/10 text-solar-yellow"
                          }`}>
                            {reading.status === "verified" && <CheckCircle2 className="w-3 h-3" />}
                            {reading.status}
                            {STATUS_TOOLTIP[reading.status] && <InfoTooltip text={STATUS_TOOLTIP[reading.status]} />}
                          </span>
                          {reading.source && (
                            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                              {reading.source}
                              {SOURCE_TOOLTIP[reading.source] && <InfoTooltip text={SOURCE_TOOLTIP[reading.source]} />}
                            </span>
                          )}
                          {reading.status === "pending" && isAdminOf(reading.cooperative_id) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              disabled={verifying[reading.id]}
                              onClick={() => verifyReading(reading.id)}
                            >
                              {verifying[reading.id]
                                ? <Spinner className="size-3" />
                                : t("consumption.verify")}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

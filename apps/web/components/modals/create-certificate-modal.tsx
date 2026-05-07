"use client"

import { useState } from "react"
import { useI18n } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Award, AlertCircle, CheckCircle2 } from "lucide-react"

interface CreateCertificateModalProps {
  isOpen: boolean
  onClose: () => void
  cooperativeId: string
  onSuccess: () => void
}

export function CreateCertificateModal({ isOpen, onClose, cooperativeId, onSuccess }: CreateCertificateModalProps) {
  const { t } = useI18n()
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [totalKwh, setTotalKwh] = useState("")
  const [technology, setTechnology] = useState("solar")
  const [location, setLocation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const resetForm = () => {
    setPeriodStart("")
    setPeriodEnd("")
    setTotalKwh("")
    setTechnology("solar")
    setLocation("")
    setError(null)
    setSuccess(false)
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onClose()
    }
  }

  const handleSubmit = async () => {
    if (!periodStart || !periodEnd || !totalKwh) return
    if (periodStart > periodEnd) {
      setError(t("createCert.invalidDateRange"))
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cooperative_id: cooperativeId,
          generation_period_start: periodStart,
          generation_period_end: periodEnd,
          total_kwh: Number(totalKwh),
          technology,
          location: location || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        const errorMessages: Record<string, string> = {
          "No verified readings for this period": "No hay lecturas verificadas para este período. Verificá las lecturas antes de crear un certificado.",
          "Invalid date range": t("createCert.invalidDateRange"),
        }
        throw new Error(errorMessages[data.error] || data.error || "Error al crear el certificado")
      }
      setSuccess(true)
      onSuccess()
      setTimeout(handleClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-scale-in">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-energy-green/20 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-energy-green" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t("createCert.title")}</h2>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground" disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("createCert.periodStart")}</label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("createCert.periodEnd")}</label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            El período debe coincidir con lecturas verificadas registradas en el sistema.
          </p>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("createCert.kwh")}</label>
            <Input type="number" min="0" step="0.01" value={totalKwh} onChange={(e) => setTotalKwh(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("createCert.technology")}</label>
            <select value={technology} onChange={(e) => setTechnology(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="solar">Solar</option>
              <option value="wind">Wind</option>
              <option value="hydro">Hydro</option>
              <option value="biomass">Biomass</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("createCert.location")}</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>

        {error && (
          <div className="mb-4 border border-red-500/30 rounded-lg p-3 bg-red-500/10 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 border border-energy-green/30 rounded-lg p-3 bg-energy-green/10 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-energy-green shrink-0" />
            <p className="text-sm text-energy-green">{t("createCert.success")}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="flex-1 bg-transparent">
            {t("wallet.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !periodStart || !periodEnd || !totalKwh}
            className="flex-1 gradient-primary text-white font-semibold"
          >
            {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t("createCert.submit")}
          </Button>
        </div>
      </div>
    </div>
  )
}

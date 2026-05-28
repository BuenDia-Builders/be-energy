"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, BarChart3, AlertCircle, CheckCircle2 } from "lucide-react"

interface Meter {
  id: string
  device_type: string
  technology: string
  capacity_kw: number
}

interface SubmitReadingModalProps {
  isOpen: boolean
  onClose: () => void
  cooperativeId: string
  meters: Meter[]
  onSuccess: () => void
}

export function SubmitReadingModal({ isOpen, onClose, cooperativeId, meters, onSuccess }: SubmitReadingModalProps) {
  const { t } = useI18n()
  const [meterId, setMeterId] = useState("")
  const [kwhGenerated, setKwhGenerated] = useState("")
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split("T")[0])
  const [powerWatts, setPowerWatts] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const resetForm = () => {
    setMeterId("")
    setKwhGenerated("")
    setReadingDate(new Date().toISOString().split("T")[0])
    setPowerWatts("")
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
    if (!meterId || !kwhGenerated || !readingDate) return

      const today = new Date().toISOString().split("T")[0]
      if (readingDate > today) {
        setError("La fecha de lectura no puede ser futura")
        return
      }

    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meter_id: meterId,
          cooperative_id: cooperativeId,
          kwh_generated: Number(kwhGenerated),
          reading_date: readingDate,
          power_watts: powerWatts ? Number(powerWatts) : undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to submit reading")
      }
      toast.success(t("submitReading.success"))
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
            <div className="w-10 h-10 bg-web3-purple/20 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-web3-purple" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t("submitReading.title")}</h2>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground" disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("submitReading.meter")}</label>
            <select value={meterId} onChange={(e) => setMeterId(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">--</option>
              {meters.map((m) => (
                <option key={m.id} value={m.id}>{m.device_type} · {m.technology} · {m.capacity_kw} kW</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("submitReading.kwh")}</label>
            <Input type="number" min="0" step="0.01" max="999" value={kwhGenerated} onChange={(e) => setKwhGenerated(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("submitReading.date")}</label>
            <Input type="date" value={readingDate} onChange={(e) => setReadingDate(e.target.value)} max={new Date().toISOString().split("T")[0]} />
          </div>
          {/* Campo Potencia desactivado — no requerido para el flujo de lecturas
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("submitReading.power")}</label>
            <Input type="number" min="0" value={powerWatts} onChange={(e) => setPowerWatts(e.target.value)} />
          </div>
          */}
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
            <p className="text-sm text-energy-green">{t("submitReading.success")}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="flex-1 bg-transparent">
            {t("wallet.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !meterId || !kwhGenerated || !readingDate}
            className="flex-1 gradient-primary text-white font-semibold"
          >
            {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t("submitReading.submit")}
          </Button>
        </div>
      </div>
    </div>
  )
}

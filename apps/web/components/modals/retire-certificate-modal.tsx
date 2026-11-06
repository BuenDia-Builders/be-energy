"use client"

import { useState } from "react"
import { useI18n } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Flame, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react"
import { getStellarExpertUrl } from "@/lib/utils"

interface Certificate {
  id: string
  total_kwh: number
  technology: string
  cooperatives?: { name: string } | null
}

interface RetireCertificateModalProps {
  isOpen: boolean
  onClose: () => void
  certificate: Certificate | null
  onSuccess: () => void
}

/** Admin applies generation credit to billing (Pivot #2 — not external buyer). */
export function RetireCertificateModal({
  isOpen,
  onClose,
  certificate,
  onSuccess,
}: RetireCertificateModalProps) {
  const { t } = useI18n()
  const [buyerName, setBuyerName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const resetForm = () => {
    setBuyerName("")
    setError(null)
    setTxHash(null)
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onClose()
    }
  }

  const handleSubmit = async () => {
    if (!certificate) return
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/certificates/retire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificate_id: certificate.id,
          buyer_name: buyerName || "billing settlement",
          buyer_purpose: "billing_settlement",
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to apply credit")
      }
      const data = await res.json()
      setTxHash(data.burn_tx_hash)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !certificate) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-scale-in">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-solar-orange/20 rounded-full flex items-center justify-center">
              <Flame className="w-5 h-5 text-solar-orange" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{t("retire.title")}</h2>
              <p className="text-xs text-muted-foreground">
                {certificate.cooperatives?.name} · {certificate.technology}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {txHash ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-energy-green mx-auto mb-3" />
            <p className="font-semibold text-foreground mb-2">{t("retire.success")}</p>
            <a
              href={getStellarExpertUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Ver en Stellar Expert <ExternalLink className="w-3 h-3" />
            </a>
            <Button onClick={handleClose} className="w-full mt-4">
              {t("common.back")}
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{t("retire.subtitle")}</p>

            <div className="border border-border rounded-lg p-3 mb-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">{t("retire.kwh")}</p>
              <p className="text-2xl font-bold text-foreground">
                {certificate.total_kwh.toLocaleString()} kWh
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("retire.buyerName")}
                </label>
                <Input
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Member or billing cycle label"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Who / which cycle this credit is applied to (internal billing).
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 border border-red-500/30 rounded-lg p-3 bg-red-500/10 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 bg-transparent"
              >
                {t("wallet.cancel")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-solar-orange hover:bg-solar-orange/90 text-white font-semibold"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  t("retire.confirm")
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
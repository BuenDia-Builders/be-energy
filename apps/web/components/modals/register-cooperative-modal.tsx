"use client"

import { useState } from "react"
import { useI18n } from "@/lib/i18n-context"
import { useWallet } from "@/lib/wallet-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Building2, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react"

interface RegisterCooperativeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function RegisterCooperativeModal({ isOpen, onClose, onSuccess }: RegisterCooperativeModalProps) {
  const { t } = useI18n()
  const { address } = useWallet()
  const [name, setName] = useState("")
  const [technology, setTechnology] = useState("solar")
  const [country, setCountry] = useState("Argentina")
  const [province, setProvince] = useState("")
  const [city, setCity] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const resetForm = () => {
  setName("")
  setTechnology("solar")
  setCountry("Argentina")
  setProvince("")
  setCity("")
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
    if (!name.trim() || !address || !province.trim() || !city.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/cooperatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          technology,
          admin_stellar_address: address,
          country: country.trim(),
          province: province.trim(),
          city: city.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to register cooperative")
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
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t("registerCoop.title")}</h2>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground" disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("registerCoop.name")} <span className="text-red-500">*</span></label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("registerCoop.technology")}</label>
            <div className="relative">
              <select value={technology} onChange={(e) => setTechnology(e.target.value)} className="w-full rounded-md border border-border bg-background pl-3 pr-10 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                <option value="solar">{t("registerCoop.techs.solar")}</option>
                <option value="wind">{t("registerCoop.techs.wind")}</option>
                <option value="hydro">{t("registerCoop.techs.hydro")}</option>
                <option value="mixed">{t("registerCoop.techs.mixed")}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("registerCoop.country")}</label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={100} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("registerCoop.province")} <span className="text-red-500">*</span></label>
            <Input value={province} onChange={(e) => setProvince(e.target.value)} maxLength={100} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("registerCoop.city")} <span className="text-red-500">*</span></label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} />
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
            <p className="text-sm text-energy-green">{t("registerCoop.success")}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="flex-1 bg-transparent">
            {t("wallet.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="flex-1 gradient-primary text-white font-semibold"
          >
            {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t("registerCoop.submit")}
          </Button>
        </div>
      </div>
    </div>
  )
}

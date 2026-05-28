"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Gauge, AlertCircle, CheckCircle2 } from "lucide-react"

interface AddMeterModalProps {
  isOpen: boolean
  onClose: () => void
  cooperativeId: string
  onSuccess: () => void
}

export function AddMeterModal({ isOpen, onClose, cooperativeId, onSuccess }: AddMeterModalProps) {
  const { t } = useI18n()
  const [memberAddress, setMemberAddress] = useState("")
  const [deviceType, setDeviceType] = useState("smart_meter")
  const [technology, setTechnology] = useState("solar")
  const [capacityKw, setCapacityKw] = useState("")
  const [manufacturer, setManufacturer] = useState("")
  const [model, setModel] = useState("")
  const [serialNumber, setSerialNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const resetForm = () => {
    setMemberAddress("")
    setDeviceType("smart_meter")
    setTechnology("solar")
    setCapacityKw("")
    setManufacturer("")
    setModel("")
    setSerialNumber("")
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
    if (!memberAddress || !capacityKw || !serialNumber) return
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/meters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cooperative_id: cooperativeId,
          member_stellar_address: memberAddress,
          device_type: deviceType,
          technology,
          capacity_kw: Number(capacityKw),
          manufacturer: manufacturer || undefined,
          model: model || undefined,
          serial_number: serialNumber || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        const errorMessages: Record<string, string> = {
          "Validation failed": "Dirección de wallet inválida. Revisá que esté bien escrita.",
        }
        throw new Error(errorMessages[data.error] || data.error || "Error al agregar el medidor")
      }
      toast.success(t("addMeter.success"))
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
      <div className="glass-card rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Gauge className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t("addMeter.title")}</h2>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground" disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("addMeter.memberAddress")}</label>
            <Input value={memberAddress} onChange={(e) => setMemberAddress(e.target.value)} placeholder="G..." className="font-mono text-xs" />
            <p className="text-xs text-muted-foreground mt-1">Dirección Stellar del miembro (empieza con G, 56 caracteres)</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("addMeter.deviceType")} <span className="text-red-500">*</span></label>
              <select value={deviceType} onChange={(e) => setDeviceType(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="inverter">{t("addMeter.deviceTypes.inverter")}</option>
                <option value="bidirectional_meter">{t("addMeter.deviceTypes.bidirectional_meter")}</option>
                <option value="smart_meter">{t("addMeter.deviceTypes.smart_meter")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("addMeter.technology")}</label>
              <select value={technology} onChange={(e) => setTechnology(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="solar">Solar</option>
                <option value="wind">Wind</option>
                <option value="hydro">Hydro</option>
                <option value="biomass">Biomass</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("addMeter.capacity")}</label>
            <Input type="number" min="0" step="0.1" value={capacityKw} onChange={(e) => setCapacityKw(e.target.value)} />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("addMeter.manufacturer")}</label>
              <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("addMeter.model")}</label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("addMeter.serial")} <span className="text-red-500">*</span></label>
            <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
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
            <p className="text-sm text-energy-green">{t("addMeter.success")}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="flex-1 bg-transparent">
            {t("wallet.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !memberAddress || !capacityKw || !serialNumber}
            className="flex-1 gradient-primary text-white font-semibold"
          >
            {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t("addMeter.submit")}
          </Button>
        </div>
      </div>
    </div>
  )
}

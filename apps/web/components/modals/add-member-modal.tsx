"use client"

import { useState } from "react"
import { useI18n } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Users, AlertCircle, CheckCircle2, Clock } from "lucide-react"

type TxStatus = "idle" | "submitting" | "pending_chain" | "confirmed" | "error"

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  cooperativeId: string
  totalCapacityKw: number
  currentAllocatedPercent: number
  onSuccess: () => void
}

export function AddMemberModal({
  isOpen,
  onClose,
  cooperativeId,
  totalCapacityKw,
  currentAllocatedPercent,
  onSuccess,
}: AddMemberModalProps) {
  const { t } = useI18n()

  const [stellarAddress, setStellarAddress] = useState("")
  const [name, setName] = useState("")
  const [capacityKw, setCapacityKw] = useState("")
  const [role, setRole] = useState<"prosumer" | "copropietario" | "mixed">("prosumer")
  const [txStatus, setTxStatus] = useState<TxStatus>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const capacityNum = parseFloat(capacityKw) || 0

  // Share percentage with division-by-zero guard
  const newSharePercent =
    totalCapacityKw > 0 && capacityNum > 0
      ? (capacityNum / totalCapacityKw) * 100
      : 0

  const projectedTotal = currentAllocatedPercent + newSharePercent
  const wouldExceed = totalCapacityKw > 0 && capacityNum > 0 && projectedTotal > 100

  const isLocked = txStatus === "submitting" || txStatus === "pending_chain"
  const canSubmit = !isLocked && stellarAddress.length > 0 && !wouldExceed

  const resetForm = () => {
    setStellarAddress("")
    setName("")
    setCapacityKw("")
    setRole("prosumer")
    setTxStatus("idle")
    setErrorMsg(null)
  }

  const handleClose = () => {
    if (isLocked) return
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setTxStatus("submitting")
    setErrorMsg(null)

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stellar_address: stellarAddress.trim(),
          name: name.trim() || undefined,
          panel_capacity_kw: capacityNum > 0 ? capacityNum : undefined,
          cooperative_id: cooperativeId,
          role,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || "Error al agregar el miembro")
        setTxStatus("error")
        return
      }

      // Transition to pending_chain to represent the on-chain multisig propagation
      setTxStatus("pending_chain")
      setTimeout(() => {
        setTxStatus("confirmed")
        onSuccess()
        setTimeout(handleClose, 1500)
      }, 1200)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error de red")
      setTxStatus("error")
    }
  }

  if (!isOpen) return null

  const remainingPercent = Math.max(0, 100 - currentAllocatedPercent)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t("members.addMember")}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground disabled:opacity-40"
            disabled={isLocked}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Allocation preview bar */}
        {totalCapacityKw > 0 && (
          <div className="mb-5 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">{t("members.allocationUsed")}</span>
              <span className="text-xs font-mono">
                {currentAllocatedPercent.toFixed(1)}%
                {newSharePercent > 0 && (
                  <span className={wouldExceed ? "text-destructive" : "text-primary"}>
                    {" "}+ {newSharePercent.toFixed(1)}%
                  </span>
                )}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="flex h-full">
                <div
                  className="bg-primary rounded-l-full transition-all"
                  style={{ width: `${Math.min(100, currentAllocatedPercent)}%` }}
                />
                {newSharePercent > 0 && (
                  <div
                    className={`transition-all ${wouldExceed ? "bg-destructive" : "bg-primary/40"}`}
                    style={{
                      width: `${Math.min(remainingPercent, newSharePercent)}%`,
                    }}
                  />
                )}
              </div>
            </div>
            {wouldExceed && (
              <p className="text-xs text-destructive mt-1">{t("members.allocationExceeds")}</p>
            )}
            {!wouldExceed && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("members.allocationRemaining")}: {remainingPercent.toFixed(1)}%
              </p>
            )}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Dirección Stellar <span className="text-destructive">*</span>
            </label>
            <Input
              value={stellarAddress}
              onChange={(e) => setStellarAddress(e.target.value)}
              placeholder="G..."
              className="font-mono text-xs"
              disabled={isLocked}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Dirección pública Stellar (empieza con G, 56 caracteres)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t("members.name")}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del prosumer"
              disabled={isLocked}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t("members.capacityKw")}
              </label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={capacityKw}
                onChange={(e) => setCapacityKw(e.target.value)}
                placeholder="0.0"
                disabled={isLocked}
              />
              {totalCapacityKw === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("members.capacityGuard")}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t("members.role")}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                disabled={isLocked}
              >
                <option value="prosumer">Prosumer</option>
                <option value="copropietario">Copropietario</option>
                <option value="mixed">Mixto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status banners */}
        {txStatus === "pending_chain" && (
          <div className="mb-4 border border-solar-orange/30 rounded-lg p-3 bg-solar-orange/10 flex items-center gap-3">
            <div className="relative shrink-0">
              <Clock className="w-5 h-5 text-solar-orange" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-solar-orange rounded-full animate-ping" />
            </div>
            <p className="text-sm text-solar-orange">{t("members.pendingChain")}</p>
          </div>
        )}

        {txStatus === "confirmed" && (
          <div className="mb-4 border border-energy-green/30 rounded-lg p-3 bg-energy-green/10 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-energy-green shrink-0" />
            <p className="text-sm text-energy-green">{t("members.success")}</p>
          </div>
        )}

        {(txStatus === "error" || txStatus === "idle") && errorMsg && (
          <div className="mb-4 border border-destructive/30 rounded-lg p-3 bg-destructive/10 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{errorMsg}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLocked}
            className="flex-1 bg-transparent"
          >
            {t("wallet.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 gradient-primary text-white font-semibold"
          >
            {txStatus === "submitting" ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Procesando...
              </span>
            ) : (
              t("members.submit")
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n-context"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, Leaf } from "lucide-react"
import { useRouter } from "next/navigation"

interface SuccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "compra" | "venta"
  amount: number
  xlmAmount: number
  txHash?: string
  redirectTo?: string
}

export function SuccessModal({
  open,
  onOpenChange,
  type,
  amount,
  xlmAmount,
  txHash = "",
  redirectTo,
}: SuccessModalProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (open) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(txHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    onOpenChange(false)
    router.push(redirectTo ?? "/dashboard")
  }

  const shortHash = txHash ? `${txHash.slice(0, 8)}...${txHash.slice(-8)}` : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center space-y-6 py-6">
          {/* Animated Bee Logo */}
          <div className="relative">
            <div className="w-20 h-20 bg-[#F2C230] rounded-full flex items-center justify-center animate-float">
              <Leaf className="w-12 h-12 text-[#0300AB]" />
            </div>
            {showConfetti && (
              <div className="absolute inset-0 animate-pulse">
                <div className="absolute top-0 left-0 w-2 h-2 bg-[#8DE8F2] rounded-full animate-ping" />
                <div
                  className="absolute top-0 right-0 w-2 h-2 bg-[#059669] rounded-full animate-ping"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="absolute bottom-0 left-0 w-2 h-2 bg-[#F2C230] rounded-full animate-ping"
                  style={{ animationDelay: "0.4s" }}
                />
                <div
                  className="absolute bottom-0 right-0 w-2 h-2 bg-[#0300AB] rounded-full animate-ping"
                  style={{ animationDelay: "0.6s" }}
                />
              </div>
            )}
          </div>

          {/* Success Icon */}
          <div className="relative">
            <CheckCircle className="w-16 h-16 text-success animate-in zoom-in duration-300" />
          </div>

          {/* Title */}
          <DialogTitle className="text-3xl font-bold">{t("success.title")}</DialogTitle>

          {/* Details */}
          <div className="w-full space-y-3 text-left bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("success.type")}</span>
              <span className="font-semibold capitalize">
                {type === "compra" ? t("success.purchase") : t("success.sale")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("success.amount")}</span>
              <span className="font-semibold text-success">{amount} kWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("success.xlmAmount")}</span>
              <span className="font-semibold text-primary">{xlmAmount} XLM</span>
            </div>
          </div>

          {/* Transaction Hash */}
          {txHash && (
            <div className="w-full space-y-2">
              <p className="text-sm text-muted-foreground">{t("success.txHash")}</p>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                <code className="flex-1 text-sm font-mono truncate">{shortHash}</code>
                <Button size="sm" variant="ghost" onClick={handleCopy} className="flex-shrink-0">
                  {copied ? <CheckCircle className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 justify-center"
              >
                {t("success.viewOnStellarExpert")}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          {/* Action Button */}
          <Button onClick={handleClose} className="w-full gradient-primary text-white font-semibold" size="lg">
            {t("success.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

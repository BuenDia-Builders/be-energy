"use client"

import { useState, useEffect, type FormEvent } from "react"
import { useWallet } from "@/lib/wallet-context"
import { useEnergyToken } from "@/hooks/useEnergyToken"
import { useToast } from "@/hooks/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { LockKeyhole, ShieldAlert, Zap } from "lucide-react"

export function MintTokenPanel({ embedded = false }: { embedded?: boolean } = {}) {
  const { address } = useWallet()
  const { mintEnergy, checkIsMinter, isLoading } = useEnergyToken()
  const { toast } = useToast()

  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [hasMinterRole, setHasMinterRole] = useState<boolean | null>(null)
  const [isCheckingRole, setIsCheckingRole] = useState(false)

  // Verify minter role whenever the connected wallet changes.
  // checkIsMinter is a simulation call — it never touches the hook's isLoading,
  // so we track its own loading state locally.
  useEffect(() => {
    if (!address) {
      setHasMinterRole(null)
      return
    }

    let cancelled = false
    setIsCheckingRole(true)
    checkIsMinter(address)
      .then((result) => { if (!cancelled) setHasMinterRole(result) })
      .finally(() => { if (!cancelled) setIsCheckingRole(false) })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(amount)
    if (!recipient.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Invalid input",
        description: "Provide a valid recipient address and a positive kWh amount.",
        variant: "destructive",
      })
      return
    }

    try {
      const txHash = await mintEnergy(recipient.trim(), parsedAmount)
      toast({
        title: "Tokens minted",
        description: `${parsedAmount} HDROP → ${recipient.slice(0, 8)}… | Tx: ${txHash.slice(0, 10)}…${txHash.slice(-6)}`,
      })
      setRecipient("")
      setAmount("")
    } catch (err) {
      toast({
        title: "Minting failed",
        description: err instanceof Error ? err.message : "Unknown error occurred.",
        variant: "destructive",
      })
    }
  }

  const isFormDisabled = isLoading || hasMinterRole !== true
  const isSubmitDisabled = isFormDisabled || !recipient.trim() || !amount

  return (
    <Card
      className={
        embedded
          ? "glass-card border-2 border-primary/20"
          : "max-w-lg glass-card border-2 border-primary/20"
      }
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <CardTitle>Mint HDROP Tokens</CardTitle>
        </div>
        <CardDescription>
          Issue new tokens to a recipient address. The connected wallet must
          hold the on-chain{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
            minter
          </code>{" "}
          role.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Role verification feedback */}
        {isCheckingRole && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-3" />
            Verifying minter role on-chain…
          </div>
        )}

        {/* Unauthorized alert — only shown once role check is complete */}
        {!isCheckingRole && hasMinterRole === false && (
          <Alert
            variant="destructive"
            className="bg-destructive/5 border-destructive/30"
          >
            <ShieldAlert />
            <AlertDescription>
              <p>
                Unauthorized: You need the &apos;minter&apos; role to issue
                tokens. Please contact the administrator.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              type="text"
              placeholder="G…"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={isFormDisabled}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (kWh)</Label>
            <Input
              id="amount"
              type="number"
              min="0.0000001"
              step="any"
              placeholder="e.g. 100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isFormDisabled}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full gradient-primary text-white font-semibold"
            disabled={isSubmitDisabled}
          >
            {isLoading ? (
              <>
                <Spinner />
                Minting…
              </>
            ) : hasMinterRole !== true ? (
              <>
                <LockKeyhole />
                Locked
              </>
            ) : (
              <>
                <Zap />
                Mint Tokens
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { useI18n } from "@/lib/i18n-context"
import { useEnergyDistribution } from "@/hooks/useEnergyDistribution"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { SuccessModal } from "@/components/success-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Zap, ArrowLeft, Users, Activity, AlertCircle, Loader2 } from "lucide-react"
import { mockOffers, generateIdenticon, mockUser } from "@/lib/mock-data"
import { useEnergyToken } from "@/hooks/useEnergyToken"

interface Offer {
  id: number
  seller: string
  sellerShort: string
  amount: number
  pricePerKwh: number
  total: number
}

export default function MarketplacePage() {
  const { isConnected, address } = useWallet()
  const { transfer } = useEnergyToken()
  const { t } = useI18n()
  const router = useRouter()
  const { getTotalGenerated, getMemberList } = useEnergyDistribution()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [newOfferAmount, setNewOfferAmount] = useState("")
  const [newOfferPrice, setNewOfferPrice] = useState("")
  const [successData, setSuccessData] = useState<{ type: "compra" | "venta"; amount: number; xlmAmount: number; txHash?: string }>({
    type: "compra",
    amount: 0,
    xlmAmount: 0,
  })
  const [offers, setOffers] = useState<Offer[]>(mockOffers)
  const [userStockKwh, setUserStockKwh] = useState(mockUser.stockKwh)
  const [contractStats, setContractStats] = useState<{
    totalGenerated: number
    memberCount: number
    members: string[]
    isLoading: boolean
    error: string | null
  }>({ totalGenerated: 0, memberCount: 0, members: [], isLoading: true, error: null })

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  useEffect(() => {
    const savedOffers = localStorage.getItem("marketplaceOffers")
    const savedStockKwh = localStorage.getItem("userStockKwh")

    if (savedOffers) {
      setOffers(JSON.parse(savedOffers))
    }
    if (savedStockKwh) {
      setUserStockKwh(Number.parseFloat(savedStockKwh))
    }
  }, [])

  useEffect(() => {
    if (!address) return

    const fetchContractData = async () => {
      setContractStats(prev => ({ ...prev, isLoading: true, error: null }))
      try {
        const [totalGenerated, members] = await Promise.all([
          getTotalGenerated(),
          getMemberList(),
        ])
        setContractStats({
          totalGenerated,
          memberCount: members.length,
          members,
          isLoading: false,
          error: null,
        })
      } catch (err) {
        setContractStats(prev => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        }))
      }
    }

    fetchContractData()
  }, [address])

  if (!isConnected) {
    return null
  }

  const totalAvailableKwh = offers.reduce((sum, offer) => sum + offer.amount, 0)

  const handleCreateOffer = () => {
    const amount = Number.parseFloat(newOfferAmount)
    const price = Number.parseFloat(newOfferPrice)
    const xlmAmount = Number.parseFloat(calculateTotal())

    const newOffer: Offer = {
      id: Date.now(),
      seller: address || "unknow",
      sellerShort: address ? `${address.slice(0,4)}...${address.slice(-4)}` : "unknow",
      amount,
      pricePerKwh: price,
      total: xlmAmount,
    }

      const updatedOffers = [...offers, newOffer]
      setOffers(updatedOffers)
      localStorage.setItem("marketplaceOffers", JSON.stringify(updatedOffers))

      setSuccessData({ type: "venta", amount, xlmAmount })
      setShowCreateModal(false)
      setShowSuccessModal(true)
      setNewOfferAmount("")
      setNewOfferPrice("")
  }

  const handleBuy = (offer: Offer) => {
    setSelectedOffer(offer)
    setShowBuyModal(true)
  }

  const handleConfirmBuy = async () => {
    if (selectedOffer) {
      try{ 
        const txHash = await transfer(selectedOffer.seller, selectedOffer.amount)

        const updatedOffers = offers.filter((offer) => offer.id !== selectedOffer.id)
        setOffers(updatedOffers)
        localStorage.setItem("marketplaceOffers", JSON.stringify(updatedOffers))

        const newStock = userStockKwh + selectedOffer.amount
        setUserStockKwh(newStock)
        localStorage.setItem("userStockKwh", newStock.toString())

        const history = JSON.parse(localStorage.getItem("transactionHistory") || "[]")
        const newTransaction = {
          id: Date.now(),
          type: "compra",
          description: `Compra de energía - ${selectedOffer.sellerShort}`,
          amount: `+${selectedOffer.amount} kWh`,
          xlmAmount: selectedOffer.total,
          time: "Ahora",
          icon: "success",
          timestamp: new Date().toISOString(),
        }
        history.unshift(newTransaction)
        localStorage.setItem("transactionHistory", JSON.stringify(history))

        setSuccessData({
          type: "compra",
          amount: selectedOffer.amount,
          xlmAmount: selectedOffer.total,
          txHash,
        })
        setShowBuyModal(false)
        setShowSuccessModal(true)
      } catch (err) {
        console.error("Error en la compra: ", err)
      }
    }
  }

  const calculateTotal = () => {
    if (newOfferAmount && newOfferPrice) {
      return (Number.parseFloat(newOfferAmount) * Number.parseFloat(newOfferPrice)).toFixed(2)
    }
    return "0.00"
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="md:ml-64">
        <DashboardHeader />

        <div className="p-4 md:p-6">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            {t("common.back")}
          </Button>

          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{t("marketplace.title")}</h1>
                <p className="text-muted-foreground text-base md:text-lg">
                  {t("marketplace.availableKwh")}{" "}
                  <span className="font-semibold text-success">{totalAvailableKwh}</span>
                </p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="gradient-eco text-white font-semibold gap-2"
                size="lg"
              >
                <Plus className="w-5 h-5" />
                {t("marketplace.createOffer")}
              </Button>
            </div>
          </div>

          <Card className="mb-6 md:mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {t("marketplace.communityStats")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t("marketplace.contractData")}</p>
            </CardHeader>
            <CardContent>
              {contractStats.isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{t("marketplace.loadingContract")}</span>
                </div>
              ) : contractStats.error ? (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{t("marketplace.errorContract")}</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("marketplace.totalGenerated")}</p>
                    <p className="text-2xl font-bold text-success">
                      {contractStats.totalGenerated.toLocaleString()} kWh
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("marketplace.activeMembers")}</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      {contractStats.memberCount}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {offers.map((offer) => {
              const identiconColor = generateIdenticon(offer.seller)

              return (
                <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: identiconColor }}
                      >
                        {offer.sellerShort.slice(0, 2)}
                      </div>
                      <div>
                        <CardTitle className="text-sm md:text-base">{offer.sellerShort}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <Zap className="w-5 h-5 md:w-6 md:h-6 text-success flex-shrink-0" />
                      <span className="text-2xl md:text-3xl font-bold text-success">{offer.amount} kWh</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-base md:text-lg font-semibold">{offer.pricePerKwh} XLM/kWh</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Total: {offer.total} XLM</p>
                    </div>
                    <Button
                      onClick={() => handleBuy(offer)}
                      className="w-full gradient-primary text-white font-semibold hover:scale-105 transition-transform"
                    >
                      {t("marketplace.buy")}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("marketplace.createModal.title")}</DialogTitle>
            <DialogDescription>{t("marketplace.createModal.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t("marketplace.createModal.amount")}</Label>
              <Input
                id="amount"
                type="number"
                placeholder="50"
                value={newOfferAmount}
                onChange={(e) => setNewOfferAmount(e.target.value)}
                max={mockUser.stockKwh}
              />
              <p className="text-sm text-muted-foreground">
                {t("marketplace.createModal.available")} {mockUser.stockKwh} kWh
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">{t("marketplace.createModal.price")}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.50"
                value={newOfferPrice}
                onChange={(e) => setNewOfferPrice(e.target.value)}
              />
            </div>
            {newOfferAmount && newOfferPrice && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{t("marketplace.createModal.totalReceive")}</p>
                <p className="text-2xl font-bold">{calculateTotal()} XLM</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="w-full sm:w-auto">
              {t("marketplace.createModal.cancel")}
            </Button>
            <Button
              onClick={handleCreateOffer}
              className="gradient-eco text-white w-full sm:w-auto"
              disabled={!newOfferAmount || !newOfferPrice}
            >
              {t("marketplace.createModal.publish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBuyModal} onOpenChange={setShowBuyModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("marketplace.buyModal.title")}</DialogTitle>
            <DialogDescription>{t("marketplace.buyModal.description")}</DialogDescription>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("marketplace.buyModal.seller")}</span>
                  <span className="font-semibold">{selectedOffer.sellerShort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("marketplace.buyModal.quantity")}</span>
                  <span className="font-semibold text-success">{selectedOffer.amount} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("marketplace.buyModal.unitPrice")}</span>
                  <span className="font-semibold">{selectedOffer.pricePerKwh} XLM/kWh</span>
                </div>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <p className="text-sm text-muted-foreground">{t("marketplace.buyModal.totalPay")}</p>
                <p className="text-2xl md:text-3xl font-bold text-primary">{selectedOffer.total} XLM</p>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowBuyModal(false)} className="w-full sm:w-auto">
              {t("marketplace.createModal.cancel")}
            </Button>
            <Button onClick={handleConfirmBuy} className="gradient-primary text-white w-full sm:w-auto">
              {t("marketplace.buyModal.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        type={successData.type}
        amount={successData.amount}
        xlmAmount={successData.xlmAmount}
        txHash={successData.txHash}
        redirectTo="/marketplace"
      />
    </div>
  )
}

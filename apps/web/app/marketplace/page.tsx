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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Zap,
  Users,
  User,
  Tag,
  ShoppingCart,
  TrendingDown,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { mockOffers, generateIdenticon, mockUser } from "@/lib/mock-data"

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
  const { t } = useI18n()
  const router = useRouter()
  const { getTotalGenerated, getMemberList } = useEnergyDistribution()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [newOfferAmount, setNewOfferAmount] = useState("")
  const [newOfferPrice, setNewOfferPrice] = useState("")
  const [successData, setSuccessData] = useState<{ type: "compra" | "venta"; amount: number; xlmAmount: number }>({
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
    if (!isConnected) router.push("/")
  }, [isConnected, router])

  useEffect(() => {
    const savedOffers = localStorage.getItem("marketplaceOffers")
    const savedStockKwh = localStorage.getItem("userStockKwh")
    if (savedOffers) setOffers(JSON.parse(savedOffers))
    if (savedStockKwh) setUserStockKwh(Number.parseFloat(savedStockKwh))
  }, [])

  useEffect(() => {
    if (!address) return
    const fetchContractData = async () => {
      setContractStats((prev) => ({ ...prev, isLoading: true, error: null }))
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
        setContractStats((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        }))
      }
    }
    fetchContractData()
  }, [address, getTotalGenerated, getMemberList])

  if (!isConnected) return null

  const totalAvailableKwh = offers.reduce((sum, offer) => sum + offer.amount, 0)

  const handleCreateOffer = () => {
    const amount = Number.parseFloat(newOfferAmount)
    const xlmAmount = Number.parseFloat(calculateTotal())
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

  const handleConfirmBuy = () => {
    if (selectedOffer) {
      const updatedOffers = offers.filter((o) => o.id !== selectedOffer.id)
      setOffers(updatedOffers)
      localStorage.setItem("marketplaceOffers", JSON.stringify(updatedOffers))

      const newStock = userStockKwh + selectedOffer.amount
      setUserStockKwh(newStock)
      localStorage.setItem("userStockKwh", newStock.toString())

      const history = JSON.parse(localStorage.getItem("transactionHistory") || "[]")
      history.unshift({
        id: Date.now(),
        type: "compra",
        description: `Compra de energía - ${selectedOffer.sellerShort}`,
        amount: `+${selectedOffer.amount} kWh`,
        xlmAmount: selectedOffer.total,
        time: "Ahora",
        icon: "success",
        timestamp: new Date().toISOString(),
      })
      localStorage.setItem("transactionHistory", JSON.stringify(history))

      setSuccessData({ type: "compra", amount: selectedOffer.amount, xlmAmount: selectedOffer.total })
    }
    setShowBuyModal(false)
    setShowSuccessModal(true)
  }

  const calculateTotal = () => {
    if (newOfferAmount && newOfferPrice) {
      return (Number.parseFloat(newOfferAmount) * Number.parseFloat(newOfferPrice)).toFixed(2)
    }
    return "0.00"
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col lg:pl-64">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          {/* Page Header - estilo Downloads */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("marketplace.title")}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t("marketplace.availableKwh")} <span className="font-semibold text-energy-green">{totalAvailableKwh}</span>
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-solar-yellow text-black hover:bg-solar-yellow/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("marketplace.createOffer")}
            </Button>
          </div>

          {/* Community Statistics - estilo Downloads (con datos de contrato Be-energy) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-0 bg-card shadow-sm">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-solar-yellow/10">
                  <Zap className="h-6 w-6 text-solar-yellow" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("marketplace.total_energy")}</p>
                  {contractStats.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t("marketplace.loadingContract")}</span>
                    </div>
                  ) : contractStats.error ? (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{t("marketplace.errorContract")}</span>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-card-foreground">
                      {contractStats.totalGenerated.toLocaleString()} kWh
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card shadow-sm">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-energy-green/10">
                  <Users className="h-6 w-6 text-energy-green" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("marketplace.activeMembers")}</p>
                  {contractStats.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-card-foreground">
                      {contractStats.memberCount.toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs - estilo Downloads */}
          <Tabs defaultValue="sell" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-secondary">
              <TabsTrigger value="sell" className="data-[state=active]:bg-background">
                <Tag className="h-4 w-4 mr-2" />
                {t("marketplace.sell_offers")}
              </TabsTrigger>
              <TabsTrigger value="buy" className="data-[state=active]:bg-background">
                <ShoppingCart className="h-4 w-4 mr-2" />
                {t("marketplace.buy_offers")}
              </TabsTrigger>
            </TabsList>

            {/* Sell Offers - datos reales Be-energy */}
            <TabsContent value="sell" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {offers.map((offer) => {
                  const identiconColor = generateIdenticon(offer.seller)
                  return (
                    <Card
                      key={offer.id}
                      className="border-0 bg-card shadow-sm hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-sm"
                              style={{ backgroundColor: identiconColor }}
                            >
                              {offer.sellerShort.slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-semibold text-card-foreground text-sm">{offer.sellerShort}</p>
                              <span className="text-xs text-muted-foreground">
                                {offer.amount} kWh • {offer.pricePerKwh} XLM/kWh
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-solar-yellow/5 dark:bg-solar-yellow/10">
                            <div>
                              <p className="text-xs text-muted-foreground">{t("marketplace.available")}</p>
                              <p className="text-lg font-bold text-solar-yellow">{offer.amount} kWh</p>
                            </div>
                            <Zap className="h-8 w-8 text-solar-yellow/30" />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">{t("marketplace.price")}</p>
                              <p className="text-sm font-semibold text-card-foreground">{offer.pricePerKwh} XLM/kWh</p>
                            </div>
                            <Badge variant="secondary" className="bg-web3-purple/20 text-web3-purple">
                              {offer.total.toFixed(2)} XLM
                            </Badge>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleBuy(offer)}
                          className="w-full bg-energy-green text-black hover:bg-energy-green/90"
                        >
                          {t("marketplace.buy_energy")}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* Buy Offers - placeholder estético (Be-energy no tiene datos de compra aún) */}
            <TabsContent value="buy" className="mt-6">
              <div className="rounded-lg border border-dashed border-border p-12 text-center">
                <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">{t("marketplace.no_buy_offers")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Las ofertas de compra aparecerán aquí cuando otros usuarios busquen energía
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Create Offer Modal - funcionalidad Be-energy */}
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
              className="bg-energy-green hover:bg-energy-green/90 text-white w-full sm:w-auto"
              disabled={!newOfferAmount || !newOfferPrice}
            >
              {t("marketplace.createModal.publish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buy Confirmation Modal - funcionalidad Be-energy */}
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
                  <span className="font-semibold text-energy-green">{selectedOffer.amount} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("marketplace.buyModal.unitPrice")}</span>
                  <span className="font-semibold">{selectedOffer.pricePerKwh} XLM/kWh</span>
                </div>
              </div>
              <div className="p-4 bg-solar-yellow/10 rounded-lg border-2 border-solar-yellow">
                <p className="text-sm text-muted-foreground">{t("marketplace.buyModal.totalPay")}</p>
                <p className="text-2xl md:text-3xl font-bold text-solar-yellow">{selectedOffer.total} XLM</p>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowBuyModal(false)} className="w-full sm:w-auto">
              {t("marketplace.createModal.cancel")}
            </Button>
            <Button
              onClick={handleConfirmBuy}
              className="bg-solar-yellow hover:bg-solar-yellow/90 text-black w-full sm:w-auto"
            >
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
      />
    </div>
  )
}

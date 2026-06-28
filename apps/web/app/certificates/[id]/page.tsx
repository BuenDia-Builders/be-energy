"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, notFound } from "next/navigation"
import { useI18n } from "@/lib/i18n-context"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  ArrowLeft,
  Award,
  ExternalLink,
  Share2,
  Check,
  Zap,
  Building2,
  Calendar,
  Hash,
} from "lucide-react"
import { getStellarExpertUrl } from "@/lib/utils"

interface CertificateDetail {
  id: string
  cooperative_id: string
  generation_period_start: string
  generation_period_end: string
  total_kwh: number
  technology: string
  location: string | null
  status: "pending" | "available" | "retired"
  mint_tx_hash: string | null
  token_amount: number | null
  created_at: string
  cooperatives: {
    name: string
    technology: string
    location: string | null
    admin_stellar_address: string
  } | null
  retirement: {
    id: string
    certificate_id: string
    buyer_address: string
    buyer_name: string | null
    buyer_purpose: string
    kwh_retired: number
    burn_tx_hash: string | null
    retired_at: string
  } | null
  stellar_expert_link: string | null
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const purposeLabels: Record<string, string> = {
  esg_reporting: "ESG Reporting",
  carbon_offset: "Carbon Offset",
  voluntary_commitment: "Voluntary Commitment",
  regulatory_compliance: "Regulatory Compliance",
  other: "Other",
}

export default function CertificateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const id = params.id as string

  const [cert, setCert] = useState<CertificateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchCert() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/certificates/${id}`)
        if (res.status === 404) {
          notFound()
          return
        }
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to fetch certificate")
        }
        const data = await res.json()
        setCert(data)
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_NOT_FOUND") {
          notFound()
          return
        }
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchCert()
  }, [id])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="md:ml-64">
          <DashboardHeader />
          <div className="p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-center py-20">
              <Spinner className="size-8" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="md:ml-64">
          <DashboardHeader />
          <div className="p-4 md:p-6 space-y-6">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-destructive">{error || "Certificate not found"}</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push("/certificates")}>
                  {t("certificates.detail.backToList")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="md:ml-64">
        <DashboardHeader />

        <div className="p-4 md:p-6 space-y-6">
          <Button onClick={() => router.push("/certificates")} variant="ghost" className="hover:bg-muted">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back")}
          </Button>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Award className="w-7 h-7 text-energy-green" />
              <h1 className="text-2xl md:text-3xl font-bold">{t("certificates.detail.title")}</h1>
            </div>
            <Button variant="outline" onClick={handleShare} className="shrink-0">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-energy-green" />
                  {t("certificates.detail.copied")}
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  {t("certificates.detail.share")}
                </>
              )}
            </Button>
          </div>

          {/* Main Detail Card */}
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Status & ID Row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={cert.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Hash className="w-3.5 h-3.5" />
                    <span className="font-mono">{cert.id}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* kWh Amount */}
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-energy-green" />
                <div>
                  <p className="text-2xl font-bold">{cert.total_kwh.toLocaleString()} kWh</p>
                  <p className="text-xs text-muted-foreground">{t("certificates.stats.certified")}</p>
                </div>
              </div>

              <Separator />

              {/* Detail Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cert.cooperatives && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <span>{t("certificates.detail.cooperative")}</span>
                    </div>
                    <p className="font-medium">{cert.cooperatives.name}</p>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t("certificates.detail.technology")}</p>
                  <p className="font-medium capitalize">{cert.technology}</p>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{t("certificates.detail.generationPeriod")}</span>
                  </div>
                  <p className="font-medium">
                    {formatDate(cert.generation_period_start)} — {formatDate(cert.generation_period_end)}
                  </p>
                </div>

                {cert.location && (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm text-muted-foreground">Ubicación</p>
                    <p className="font-medium">{cert.location}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Mint Transaction */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t("certificates.detail.mintTransaction")}</p>
                {cert.mint_tx_hash ? (
                  <a
                    href={getStellarExpertUrl(cert.mint_tx_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-mono text-web3-purple hover:text-web3-purple/80 transition-colors break-all"
                  >
                    {cert.mint_tx_hash}
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Retirement Section */}
          {cert.status === "retired" && cert.retirement && (
            <Card className="border-solar-orange/20">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Award className="w-5 h-5 text-solar-orange" />
                  {t("certificates.retirement")}
                </h2>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t("certificates.buyer")}</p>
                    <p className="font-medium">{cert.retirement.buyer_name || cert.retirement.buyer_address}</p>
                    {cert.retirement.buyer_name && (
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {cert.retirement.buyer_address}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t("certificates.purpose")}</p>
                    <p className="font-medium">{purposeLabels[cert.retirement.buyer_purpose] || cert.retirement.buyer_purpose}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t("certificates.stats.retired")}</p>
                    <p className="font-medium">{cert.retirement.kwh_retired.toLocaleString()} kWh</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t("certificates.detail.retireTransaction")}</p>
                    {cert.retirement.burn_tx_hash ? (
                      <a
                        href={getStellarExpertUrl(cert.retirement.burn_tx_hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-mono text-web3-purple hover:text-web3-purple/80 transition-colors break-all"
                      >
                        {cert.retirement.burn_tx_hash}
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {t("certificates.detail.retiredBy")}: {formatDate(cert.retirement.retired_at)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

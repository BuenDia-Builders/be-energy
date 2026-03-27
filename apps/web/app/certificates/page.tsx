"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { useI18n } from "@/lib/i18n-context"
import { useCertificateStats } from "@/hooks/useCertificateStats"
import { useCertificates, type Certificate } from "@/hooks/useCertificates"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Award, Zap, Flame, Leaf, ExternalLink, ChevronDown, ChevronUp, AlertCircle } from "lucide-react"
import { InfoTooltip } from "@/components/shared/info-tooltip"
import { Spinner } from "@/components/ui/spinner"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { RetireCertificateModal } from "@/components/modals/retire-certificate-modal"

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })
}

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const styles: Record<string, string> = {
    pending: "bg-solar-yellow/10 text-solar-yellow border-solar-yellow/20",
    available: "bg-energy-green/10 text-energy-green border-energy-green/20",
    retired: "bg-solar-orange/10 text-solar-orange border-solar-orange/20",
  }
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {t(`certificates.status.${status}`)}
    </span>
  )
}

function CertificateCard({ cert, t, onRetire }: { cert: Certificate; t: (key: string) => string; onRetire?: (cert: Certificate) => void }) {
  const [expanded, setExpanded] = useState(false)
  const stellarExpertBase = "https://stellar.expert/explorer/testnet/tx/"

  return (
    <Card className="border border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm truncate">
                {cert.cooperatives?.name || cert.cooperative_id}
              </h3>
              <StatusBadge status={cert.status} t={t} />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("certificates.period")}: {formatDate(cert.generation_period_start)} — {formatDate(cert.generation_period_end)}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm font-semibold">{cert.total_kwh.toLocaleString()} kWh</span>
              <span className="text-xs text-muted-foreground capitalize">{cert.technology}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cert.status === "available" && onRetire && (
              <Button size="sm" variant="outline" onClick={() => onRetire(cert)} className="text-solar-orange border-solar-orange/30 hover:bg-solar-orange/10">
                <Flame className="w-3.5 h-3.5 mr-1" />
                {t("retire.title")}
              </Button>
            )}
            {cert.mint_tx_hash && (
              <a
                href={`${stellarExpertBase}${cert.mint_tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-web3-purple hover:text-web3-purple/80 transition-colors"
                title={t("certificates.viewOnStellar")}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">ID:</span>
                <p className="font-mono truncate">{cert.id}</p>
              </div>
              {cert.location && (
                <div>
                  <span className="text-muted-foreground">Ubicación:</span>
                  <p>{cert.location}</p>
                </div>
              )}
              {cert.mint_tx_hash && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Mint TX:</span>
                  <p className="font-mono truncate">{cert.mint_tx_hash}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function CertificatesPage() {
  const { isConnected } = useWallet()
  const { isAuthenticated } = useAuth()
  const { t } = useI18n()
  const router = useRouter()

  //const [mounted, setMounted] = useState(false)

  const [techFilter, setTechFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [retireCert, setRetireCert] = useState<Certificate | null>(null)

  const { stats, loading: statsLoading, error: statsError } = useCertificateStats()
  const { certificates, loading: certsLoading, error: certsError, refetch } = useCertificates({
    technology: techFilter === "all" ? undefined : techFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  })


   /*useEffect(() => {
    setMounted(true)
  }, [])*/


  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  if (!isConnected) return null

    // 🔥 Prevent hydration mismatch
  /*if (!mounted) return null*/

  // Extract unique technologies from certificates for filter
  const technologies = [...new Set(certificates.map((c) => c.technology))]

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="md:ml-64">
        <DashboardHeader />

        <div className="p-4 md:p-6 space-y-6">
          <Button onClick={() => router.push("/dashboard")} variant="ghost" className="mb-2 hover:bg-muted">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back")}
          </Button>

          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Award className="w-7 h-7 text-energy-green" />
            {t("certificates.title")}
          </h1>

          {/* Compact Stats */}
          {stats && !statsError && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-energy-green/10 border border-energy-green/20">
                <Zap className="w-5 h-5 text-energy-green shrink-0" />
                <div className="flex-1">
                  <p className="text-lg font-bold text-energy-green">{stats.total_kwh_certified.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{t("certificates.stats.certified")}</p>
                </div>
                <InfoTooltip text={t("certificates.tooltip.certified")} />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-solar-orange/10 border border-solar-orange/20">
                <Flame className="w-5 h-5 text-solar-orange shrink-0" />
                <div className="flex-1">
                  <p className="text-lg font-bold text-solar-orange">{stats.total_kwh_retired.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{t("certificates.stats.retired")}</p>
                </div>
                <InfoTooltip text={t("certificates.tooltip.retired")} />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-web3-purple/10 border border-web3-purple/20">
                <Leaf className="w-5 h-5 text-web3-purple shrink-0" />
                <div className="flex-1">
                  <p className="text-lg font-bold text-web3-purple">{stats.co2_avoided_kg.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{t("certificates.stats.co2")}</p>
                </div>
                <InfoTooltip text={t("certificates.tooltip.co2")} />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-solar-yellow/10 border border-solar-yellow/20">
                <Award className="w-5 h-5 text-solar-yellow shrink-0" />
                <div className="flex-1">
                  <p className="text-lg font-bold text-solar-yellow">{stats.certificates_available}</p>
                  <p className="text-xs text-muted-foreground">{t("certificates.stats.available")}</p>
                </div>
                <InfoTooltip text={t("certificates.tooltip.available")} />
              </div>
            </div>
          )}
          {statsLoading && (
            <div className="flex items-center gap-2 text-muted-foreground py-4 justify-center">
              <Spinner className="size-5" />
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="space-y-2">
              <Label htmlFor="technology-filter">
                {t("certificates.filterByTechnology")}
              </Label>
              <Select value={techFilter} onValueChange={setTechFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t("certificates.filter.technology")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("certificates.filter.all")}</SelectItem>
                  {technologies.map((tech) => (
                    <SelectItem key={tech} value={tech}>
                      {tech.charAt(0).toUpperCase() + tech.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">
                {t("certificates.filterByStatus")}
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t("certificates.filter.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("certificates.filter.all")}</SelectItem>
                  <SelectItem value="pending">{t("certificates.status.pending")}</SelectItem>
                  <SelectItem value="available">{t("certificates.status.available")}</SelectItem>
                  <SelectItem value="retired">{t("certificates.status.retired")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Certificates List */}
          {certsLoading && (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Spinner className="size-5" />
            </div>
          )}
          {certsError && (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive">{certsError}</p>
            </div>
          )}
          {!certsLoading && !certsError && certificates.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">{t("certificates.noData")}</p>
              </CardContent>
            </Card>
          )}
          {!certsLoading && !certsError && certificates.length > 0 && (
            <div className="space-y-3">
              {certificates.map((cert) => (
                <CertificateCard
                  key={cert.id}
                  cert={cert}
                  t={t}
                  onRetire={isAuthenticated ? setRetireCert : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <RetireCertificateModal
        isOpen={!!retireCert}
        onClose={() => setRetireCert(null)}
        certificate={retireCert}
        onSuccess={refetch}
      />
    </div>
  )
}

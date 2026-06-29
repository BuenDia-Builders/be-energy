"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n-context"
import { LanguageSelector } from "@/components/language-selector"
import { WalletConfirmationModal } from "@/components/wallet-confirmation-modal"
import { ProfileSetupModal } from "@/components/profile-setup-modal"
import { ArrowRight, ChevronDown } from "lucide-react"

// ── Brand hex pattern (exact from Brand Identity System: 3-hex tessellating grid 88×76) ──
function HexPattern({ id, stroke = "rgba(0,83,122,0.35)" }: { id: string; stroke?: string }) {
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={id} x="0" y="0" width="88" height="76" patternUnits="userSpaceOnUse">
          <polygon points="22,2 42,13 42,37 22,48 2,37 2,13" fill="none" stroke={stroke} strokeWidth="1" />
          <polygon points="66,2 86,13 86,37 66,48 46,37 46,13" fill="none" stroke={stroke} strokeWidth="1" />
          <polygon points="44,40 64,51 64,75 44,86 24,75 24,51" fill="none" stroke={stroke} strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

// ── Certificate card — Social Card from Brand Identity (visual signature of BeEnergy) ──
function CertCard() {
  return (
    <div
      style={{
        background: "#0F172A",
        borderRadius: 16,
        padding: "36px 36px 32px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}
    >
      <HexPattern id="hexcert" stroke="rgba(0,83,122,0.35)" />
      {/* Label */}
      <p style={{ position: "relative", zIndex: 1, fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#00537A" }}>
        Certificado emitido · Testnet
      </p>
      {/* Central data */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: 56, fontWeight: 700, color: "#FFD500", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 8 }}>
          152.4
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 300, marginBottom: 12 }}>
          MWh certificados en Stellar
        </p>
        <p style={{ fontSize: 14, fontWeight: 500, color: "#fff", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
          Cooperativa Solar<br />Andina Sur · Junio 2026
        </p>
      </div>
      {/* Footer */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img src="/beenergy-assets/BeEnergy-logo-white.svg" alt="BeEnergy" style={{ height: 16 }} />
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>beenergy.coop</span>
      </div>
    </div>
  )
}

// ── Phone mockup — from Brand Identity digital mockups section ──
function PhoneMockup() {
  const bars = [35, 55, 45, 70, 60, 85, 75]
  return (
    <div style={{ background: "#1E293B", borderRadius: 28, padding: "12px 9px", boxShadow: "0 24px 64px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", gap: 6, overflow: "hidden", width: 190 }}>
      <div style={{ width: 44, height: 5, background: "#0F172A", borderRadius: 3, margin: "0 auto 6px" }} />
      <div style={{ background: "#0F172A", borderRadius: 12, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div>
          <p style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Cooperativa Solar</p>
          <p style={{ fontSize: 10, fontWeight: 600, color: "#fff", marginTop: 1 }}>Andina Sur</p>
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#FFD500" }}>↑ 12%</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          { v: "842", l: "kWh hoy", c: "#fff" },
          { v: "38", l: "Certs.", c: "#FFD500" },
          { v: "24", l: "Miembros", c: "#fff" },
          { v: "OK", l: "Estado", c: "#10B981" },
        ].map((stat, i) => (
          <div key={i} style={{ background: "#0F172A", borderRadius: 10, padding: 10 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: stat.c, lineHeight: 1 }}>{stat.v}</p>
            <p style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 3 }}>{stat.l}</p>
          </div>
        ))}
      </div>
      <div style={{ background: "#0F172A", borderRadius: 10, padding: 10, display: "flex", alignItems: "flex-end", gap: 3, height: 72 }}>
        {bars.map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 5 ? "#FFD500" : "#00537A", borderRadius: "2px 2px 0 0" }} />
        ))}
      </div>
    </div>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────

const PERSONALITY = [
  { word: "Trustworthy", desc: "Cada activo emitido es verificable on-chain. La confianza no se declara, se demuestra con datos inmutables." },
  { word: "Transparent", desc: "Sin registros opacos ni intermediarios. El proceso de emisión y validación es abierto, auditable y accesible para todos." },
  { word: "Pioneering", desc: "Primera infraestructura de atributos ambientales energéticos sobre Stellar. Construimos el estándar, no lo seguimos." },
  { word: "Precise", desc: "1 token = 1 kWh. Sin ambigüedad, sin aproximación. La precisión es el núcleo del valor que entregamos." },
  { word: "Sustainable", desc: "No es greenwashing, es evidencia verificable. BeEnergy existe para que las cooperativas puedan demostrar su impacto real." },
  { word: "Enterprise", desc: "Diseñado para compradores institucionales, fondos ESG y mercados de atributos ambientales. Serio, escalable, global." },
]

const STEPS = [
  { num: "01", title: "La cooperativa registra su generación eléctrica.", desc: "Datos de producción ingresados en la plataforma, manual o mediante integración." },
  { num: "02", title: "La energía producida es validada.", desc: "BeEnergy verifica la información conforme a su metodología antes de proceder." },
  { num: "03", title: "Se emite un certificado digital único.", desc: "Cada certificado recibe un identificador único y queda registrado en blockchain Stellar." },
  { num: "04", title: "Las empresas adquieren y retiran certificados.", desc: "Para respaldar sus compromisos ambientales. Cada retiro es definitivo e irreversible." },
]

const AUDIENCES = [
  { role: "Cooperativas", desc: "Convertí la energía que ya generás en activos ambientales con valor demostrable. Sin procesos manuales." },
  { role: "Empresas", desc: "Respaldá tus objetivos ESG con atributos ambientales verificables, trazables y auditables." },
  { role: "Auditores", desc: "Accedé a registros transparentes con historial completo, verificables en cualquier momento." },
  { role: "Inversores", desc: "Conocé el origen y el recorrido completo de cada activo ambiental antes de tomar decisiones." },
]

const FAQ = [
  { q: "¿Qué es un Certificado BeEnergy?", a: "Representa un volumen específico de energía renovable verificada por una cooperativa participante. Cada activo tiene un identificador único y un historial trazable desde su emisión hasta su retiro." },
  { q: "¿Es un crédito de carbono?", a: "No. Los certificados BeEnergy acreditan atributos ambientales de generación de energía renovable — el origen y la cantidad de energía producida. Un crédito de carbono representa reducción o captura de emisiones. Son instrumentos distintos con finalidades distintas." },
  { q: "¿Quién valida la información?", a: "La generación registrada es verificada mediante la metodología definida por BeEnergy antes de emitir cualquier activo. El proceso está documentado y es auditable por terceros." },
  { q: "¿Por qué blockchain?", a: "Porque garantiza un historial inmutable, trazable y verificable sin depender de un único intermediario. Una vez registrado, ningún actor puede modificar el estado de un activo sin que quede evidencia." },
  { q: "¿Qué significa retirar un certificado?", a: "Significa que una empresa utilizó ese activo para respaldar un compromiso ambiental. Una vez retirado, queda marcado como usado de forma definitiva — esto elimina el doble conteo estructuralmente." },
  { q: "¿Puede verificarse externamente?", a: "Sí. Cualquier persona puede consultar el historial y la autenticidad de cualquier activo en cualquier momento, sin necesidad de acceder a sistemas propietarios." },
  { q: "¿Quién puede emitir certificados?", a: "Las cooperativas energéticas registradas que cumplan con el proceso de validación de BeEnergy y operen conforme a la metodología de registro." },
  { q: "¿Qué información queda on-chain?", a: "El identificador del activo y la información necesaria para verificar su autenticidad e integridad. Los datos operativos y la documentación de respaldo permanecen off-chain, referenciados por hash." },
]

// ── Page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { isConnected, connectWallet, userProfile, setUserProfile } = useWallet()
  const { login, isAuthenticated } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isConnected && isAuthenticated && userProfile) router.push("/dashboard")
  }, [isConnected, isAuthenticated, userProfile, router])

  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined
    async function init() {
      const { gsap } = await import("gsap")
      const { ScrollTrigger } = await import("gsap/ScrollTrigger")
      gsap.registerPlugin(ScrollTrigger)
      ctx = gsap.context(() => {
        document.querySelectorAll(".reveal").forEach((el) => {
          gsap.from(el, {
            y: 20,
            opacity: 0,
            duration: 0.55,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%" },
          })
        })
      }, mainRef)
    }
    init()
    return () => ctx?.revert()
  }, [])

  const handleConnectClick = () => setShowConfirmModal(true)
  const handleConfirmConnection = async () => {
    const walletAddress = await connectWallet()
    if (!walletAddress) throw new Error("cancelled")
    await login(walletAddress)
    if (userProfile) router.push("/dashboard")
    else setShowProfileSetup(true)
  }
  const handleProfileComplete = (name: string, avatar: string | null) => {
    setUserProfile({ name, avatar })
    setShowProfileSetup(false)
    router.push("/dashboard")
  }

  return (
    <div ref={mainRef} className="min-h-screen overflow-x-hidden" style={{ background: "#FFFFFF" }}>

      {/* ══ NAVBAR — navy + hex pattern ══════════════════════════════════ */}
      <header className="fixed top-0 inset-x-0 z-50" style={{ background: "#0F172A", position: "fixed" }}>
        <HexPattern id="hexnav" stroke="rgba(255,255,255,0.055)" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center gap-8" style={{ position: "relative", zIndex: 1 }}>
          <a href="/" className="shrink-0">
            <img src="/beenergy-assets/BeEnergy-logo-white.svg" alt="BeEnergy" className="h-6 w-auto" />
          </a>
          <nav className="hidden md:flex items-center gap-7 ml-auto">
            {[
              { label: "El problema", href: "#problema" },
              { label: "Cómo funciona", href: "#como-funciona" },
              { label: "FAQ", href: "#faq" },
            ].map((link) => (
              <a key={link.href} href={link.href}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 150ms" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3 ml-4">
            <LanguageSelector />
            <a href="/login"
              className="hidden md:inline-flex items-center h-8 px-4 rounded-md text-xs font-semibold"
              style={{ background: "#00537A", color: "#fff", textDecoration: "none" }}>
              Acceder a la plataforma
            </a>
          </div>
        </div>
      </header>

      {/* ══ HERO — split: headline left, CertCard right ══════════════════ */}
      <section style={{ paddingTop: 120, paddingBottom: 112, background: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

            {/* Left */}
            <div className="flex-1 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-10"
                style={{ borderColor: "rgba(0,83,122,0.18)", background: "rgba(0,83,122,0.04)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00537A" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#00537A", letterSpacing: "0.06em" }}>
                  Infraestructura de atributos ambientales · Testnet
                </span>
              </div>

              <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.06, color: "#0F172A", marginBottom: 28 }}>
                Energía renovable<br />
                que puede{" "}
                <span style={{ color: "#00537A" }}>demostrarse.</span>
              </h1>

              <p style={{ fontSize: "1.0625rem", lineHeight: 1.72, color: "#64748B", marginBottom: 40, maxWidth: 480 }}>
                Convertimos la generación real de energía renovable en activos ambientales verificables.
                Cooperativas que documentan producción. Empresas que demuestran impacto.
                Una sola fuente de verdad.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-3">
                <a href="/login"
                  className="inline-flex items-center gap-2 rounded-md font-semibold text-white"
                  style={{ background: "#00537A", height: 44, padding: "0 24px", fontSize: 14, textDecoration: "none" }}>
                  Acceder a la plataforma
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </a>
                <a href="#como-funciona"
                  className="inline-flex items-center rounded-md border"
                  style={{ height: 44, padding: "0 24px", fontSize: 14, color: "#0F172A", borderColor: "#E2E8F0", textDecoration: "none" }}>
                  Conocer cómo funciona
                </a>
              </div>
            </div>

            {/* Right — Certificate Card from brand */}
            <div className="shrink-0 w-full lg:w-auto reveal" style={{ maxWidth: 340 }}>
              <CertCard />
              {/* Metric tag below card */}
              <div className="mt-4 flex items-center gap-3">
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#94A3B8" }}>
                  Cada certificado
                </span>
                <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#94A3B8" }}>
                  Trazable · Único · Inmutable
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ EL PROBLEMA — dark navy + hex ════════════════════════════════ */}
      <section id="problema" style={{ background: "#0F172A", padding: "96px 0", position: "relative", overflow: "hidden" }}>
        <HexPattern id="hexprob" stroke="rgba(255,255,255,0.055)" />
        <div className="max-w-7xl mx-auto px-6 md:px-12" style={{ position: "relative", zIndex: 1 }}>
          <div className="max-w-2xl reveal">
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#00537A", display: "block", marginBottom: 28 }}>
              Por qué existimos
            </span>
            <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15, color: "#fff", marginBottom: 40 }}>
              Hoy, demostrar el origen de la energía sigue siendo complejo.
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, fontSize: "1.0625rem", lineHeight: 1.72 }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>
                Cada vez más organizaciones quieren respaldar sus compromisos ambientales con evidencia real.
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>
                Sin embargo, el registro de energía renovable sigue dependiendo de procesos manuales,
                documentos aislados y datos difíciles de auditar por terceros.
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>
                Cuando la información no puede verificarse de forma independiente, la confianza se pierde.
              </p>
              <p style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
                BeEnergy existe para hacer visible lo que ya sucede: la generación real de energía limpia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ QUÉ ES BEENERGY — white + phone mockup ═══════════════════════ */}
      <section style={{ background: "#FFFFFF", padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col lg:flex-row items-start gap-16 lg:gap-24">

            {/* Left — text */}
            <div className="flex-1 max-w-xl reveal">
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#00537A", display: "block", marginBottom: 28 }}>
                Qué es BeEnergy
              </span>
              <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15, color: "#0F172A", marginBottom: 32 }}>
                La infraestructura digital para registrar y verificar energía renovable.
              </h2>
              <p style={{ fontSize: "1.0625rem", lineHeight: 1.72, color: "#64748B", marginBottom: 28 }}>
                BeEnergy es la infraestructura digital que convierte la generación real de energía renovable
                en registros verificables. Cada activo emitido conserva un historial que permite conocer:
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
                {["quién generó la energía", "cuándo fue producida", "cuánta energía representa", "cuál es su estado actual"].map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00537A", flexShrink: 0 }} />
                    <span style={{ fontSize: "1.0625rem", color: "#0F172A" }}>{item}</span>
                  </li>
                ))}
              </ul>
              {/* Typography in context — from brand book */}
              <div style={{ background: "#0F172A", borderRadius: 8, padding: "20px 24px" }}>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
                  Ejemplo de activo verificable
                </p>
                <p style={{ fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em", marginBottom: 4 }}>
                  152.4 MWh registrados
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>
                  Cooperativa Solar Andina · Testnet · Junio 2026
                </p>
              </div>
            </div>

            {/* Right — phone mockup */}
            <div className="shrink-0 flex justify-center reveal">
              <PhoneMockup />
            </div>

          </div>
        </div>
      </section>

      {/* ══ CÓMO FUNCIONA — cloud bg ══════════════════════════════════════ */}
      <section id="como-funciona" style={{ background: "#F8FAFC", padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-xl mb-16 reveal">
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#00537A", display: "block", marginBottom: 28 }}>
              Cómo funciona
            </span>
            <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15, color: "#0F172A" }}>
              Cuatro pasos. Un flujo de registro transparente.
            </h2>
          </div>

          <div style={{ maxWidth: 560 }}>
            {STEPS.map((step, i) => (
              <div key={i} className="reveal" style={{ display: "flex", gap: 28, paddingBottom: 40, position: "relative" }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: "absolute", left: "1.075rem", top: 36, bottom: 0, width: 1, background: "#E2E8F0" }} />
                )}
                <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "50%", border: "2px solid #E2E8F0", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#0F172A" }}>{step.num}</span>
                </div>
                <div style={{ paddingTop: 6 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 6, letterSpacing: "-0.01em" }}>
                    {step.title}
                  </p>
                  <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.65 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BRAND PERSONALITY — exact from Brand Identity System ═════════ */}
      {/* 6 navy cards, 3×2 grid, teal accent bar + light word + description */}
      <section style={{ background: "#0F172A" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-4">
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 16 }}>
            Por qué BeEnergy
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }} className="max-w-7xl mx-auto px-6 md:px-12 pb-16">
          {PERSONALITY.map((p, i) => (
            <div key={i} className="reveal"
              style={{
                padding: "44px 36px",
                borderTop: i >= 3 ? "2px solid #1E293B" : undefined,
                borderLeft: i % 3 !== 0 ? "1px solid #1E293B" : undefined,
              }}>
              {/* Teal accent bar — exact from brand */}
              <div style={{ width: 20, height: 2, background: "#00537A", marginBottom: 16 }} />
              {/* Word — 300 weight, english, brand voice */}
              <p style={{ fontSize: 21, fontWeight: 300, color: "#fff", letterSpacing: "-0.01em", marginBottom: 10 }}>
                {p.word}
              </p>
              <p style={{ fontSize: 11, lineHeight: 1.75, color: "rgba(255,255,255,0.38)", fontWeight: 300 }}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ PARA QUIÉN — cloud bg ═════════════════════════════════════════ */}
      <section style={{ background: "#F8FAFC", padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-xl mb-16 reveal">
            <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15, color: "#0F172A" }}>
              ¿Para quién es?
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {AUDIENCES.map((a, i) => (
              <div key={i} className="reveal"
                style={{ background: "#fff", borderRadius: 12, padding: "28px", border: "1px solid #E2E8F0" }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 10 }}>{a.role}</p>
                <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.65 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA — dark navy + hex ═════════════════════════════════════════ */}
      <section style={{ background: "#0F172A", padding: "96px 0", position: "relative", overflow: "hidden" }}>
        <HexPattern id="hexcta" stroke="rgba(255,255,255,0.055)" />
        <div className="max-w-7xl mx-auto px-6 md:px-12" style={{ position: "relative", zIndex: 1 }}>
          <div className="max-w-2xl reveal">
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 28 }}>
              Qué sigue
            </span>
            <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15, color: "#fff", marginBottom: 24 }}>
              Empezá a registrar y verificar energía renovable.
            </h2>
            <p style={{ fontSize: "1.0625rem", lineHeight: 1.72, color: "rgba(255,255,255,0.45)", marginBottom: 40 }}>
              Una infraestructura preparada para cooperativas que documentan producción
              y empresas que necesitan evidencia real de su impacto ambiental.
            </p>
            <a href="/login"
              className="inline-flex items-center gap-2 rounded-md font-semibold"
              style={{ background: "#FFD500", color: "#0F172A", height: 44, padding: "0 24px", fontSize: 14, textDecoration: "none" }}>
              Solicitar una demo
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </section>

      {/* ══ FAQ — white ═══════════════════════════════════════════════════ */}
      <section id="faq" style={{ background: "#FFFFFF", padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 64 }} className="max-w-5xl">

            {/* Left sticky label */}
            <div className="reveal">
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#00537A", display: "block", marginBottom: 28 }}>
                Preguntas frecuentes
              </span>
              <h2 style={{ fontSize: "clamp(1.4rem, 2.8vw, 1.875rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "#0F172A", marginBottom: 20 }}>
                Sobre los activos y el proceso.
              </h2>
              <a href="mailto:info@beenergy.com"
                className="inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: "#00537A", fontSize: 13, textDecoration: "none" }}>
                ¿Más preguntas? Contactanos
                <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
              </a>
            </div>

            {/* Right accordion */}
            <div>
              {FAQ.map((item, i) => (
                <div key={i} style={{ borderTop: "1px solid #E2E8F0" }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "20px 0", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>{item.q}</span>
                    <ChevronDown
                      className="shrink-0 w-4 h-4"
                      strokeWidth={1.5}
                      style={{ color: "#94A3B8", transition: "transform 200ms", transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
                    />
                  </button>
                  {openFaq === i && (
                    <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, paddingBottom: 20, paddingRight: 32 }}>
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
              <div style={{ borderTop: "1px solid #E2E8F0" }} />
            </div>

          </div>
        </div>
      </section>

      {/* ══ FOOTER — dark navy + hex ══════════════════════════════════════ */}
      <footer style={{ background: "#0F172A", padding: "36px 0", position: "relative", overflow: "hidden" }}>
        <HexPattern id="hexfoot" stroke="rgba(255,255,255,0.055)" />
        <div className="max-w-7xl mx-auto px-6 md:px-12" style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src="/beenergy-assets/BeEnergy-logo-white.svg" alt="BeEnergy" style={{ height: 22 }} />
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#00537A" }} />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                © 2026
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {[
                {
                  href: "https://linkedin.com/company/111951545",
                  label: "LinkedIn",
                  icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>,
                },
                {
                  href: "https://x.com/BeEnergyCom",
                  label: "X",
                  icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
                },
                {
                  href: "https://github.com/BuenDia-Builders/be-energy",
                  label: "GitHub",
                  icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>,
                },
              ].map(({ href, label, icon }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  style={{ color: "rgba(255,255,255,0.25)", transition: "color 150ms" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#00537A")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <WalletConfirmationModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleConfirmConnection} />
      <ProfileSetupModal isOpen={showProfileSetup} onComplete={handleProfileComplete} />
    </div>
  )
}

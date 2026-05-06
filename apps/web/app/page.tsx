"use client"

import { useEffect, useState, useRef, lazy, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"
import { LanguageSelector } from "@/components/language-selector"
import { WalletConfirmationModal } from "@/components/wallet-confirmation-modal"
import { ProfileSetupModal } from "@/components/profile-setup-modal"
import { CityIllustration } from "@/components/landing/line-illustrations"
import { ChevronDown, ArrowRight } from "lucide-react"

const BeeCursor = lazy(() => import("@/components/landing/bee-cursor"))

export default function LandingPage() {
  const { isConnected, connectWallet, userProfile, setUserProfile } = useWallet()
  const { login, isAuthenticated } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isConnected && isAuthenticated && userProfile) {
      router.push("/dashboard")
    }
  }, [isConnected, isAuthenticated, userProfile, router])

  // GSAP
  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined
    async function init() {
      const { gsap } = await import("gsap")
      const { ScrollTrigger } = await import("gsap/ScrollTrigger")
      gsap.registerPlugin(ScrollTrigger)

      ctx = gsap.context(() => {
        // ── Circle transition (golden, Audax-style) ──
        gsap.to(".circle-transition", {
          scale: 60,
          ease: "none",
          scrollTrigger: {
            trigger: ".circle-trigger",
            start: "top center",
            end: "bottom top",
            scrub: 1,
          },
        })

        // ── Hero parallax ──
        gsap.to(".hero-content", {
          y: -100, opacity: 0,
          scrollTrigger: { trigger: ".circle-trigger", start: "top bottom", end: "top top", scrub: 1 },
        })

        // ── City illustration enters ──
        gsap.from(".city-illustration", {
          y: 100, opacity: 0,
          scrollTrigger: { trigger: ".city-illustration", start: "top 90%", end: "top 60%", scrub: 1 },
        })

        // ── Scroll indicator ──
        gsap.to(".scroll-dot", { y: 12, duration: 1.2, repeat: -1, yoyo: true, ease: "sine.inOut" })

        // ── Product sections: images float in ──
        gsap.from(".product-img-left", {
          x: -150, opacity: 0, duration: 1.2, ease: "power3.out",
          scrollTrigger: { trigger: ".product-img-left", start: "top 80%" },
        })
        gsap.from(".product-text-right", {
          x: 80, opacity: 0, duration: 1, ease: "power3.out", delay: 0.2,
          scrollTrigger: { trigger: ".product-text-right", start: "top 80%" },
        })
        gsap.from(".product-img-right", {
          x: 150, opacity: 0, duration: 1.2, ease: "power3.out",
          scrollTrigger: { trigger: ".product-img-right", start: "top 80%" },
        })
        gsap.from(".product-text-left", {
          x: -80, opacity: 0, duration: 1, ease: "power3.out", delay: 0.2,
          scrollTrigger: { trigger: ".product-text-left", start: "top 80%" },
        })

        // ── Floating images continuous ──
        gsap.to(".float-img-1", { y: -12, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" })
        gsap.to(".float-img-2", { y: -8, duration: 2.5, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.5 })

        // ── Quote color on scroll ──
        gsap.to(".quote-text", {
          color: "#FEC800",
          scrollTrigger: { trigger: ".quote-section", start: "top center", end: "bottom center", scrub: 1 },
        })
        gsap.to(".quote-line", {
          scaleY: 1,
          scrollTrigger: { trigger: ".quote-section", start: "top center", end: "bottom center", scrub: 1 },
        })

        // ── Steps fade in ──
        document.querySelectorAll(".reveal-up").forEach((el) => {
          gsap.from(el, {
            y: 50, opacity: 0, duration: 0.8, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
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
    if (!walletAddress) throw new Error("Wallet connection cancelled")
    await login(walletAddress)
    if (userProfile) {
      router.push("/dashboard")
    } else {
      setShowProfileSetup(true)
    }
  }

  const handleProfileComplete = (name: string, avatar: string | null) => {
    setUserProfile({ name, avatar })
    setShowProfileSetup(false)
    router.push("/dashboard")
  }

  return (
    <div ref={mainRef} className="min-h-screen overflow-x-hidden" style={{ background: "#f4f5f9" }}>

      {/* Bee cursor (logo that follows mouse) */}
      <Suspense fallback={null}>
        {/* <BeeCursor >*/}
      </Suspense>

      {/* ─── Header ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mr-auto">
            <img src="/beenergy-assets/iso-transparente.png" alt="BeEnergy" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold text-[#18191A] tracking-tight">BeEnergy</span>
          </div>
          {/* Nav center */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <a href="#que-hacemos" className="text-sm font-medium text-[#505050] hover:text-[#FEC800] transition-colors">{t("landing.nav.whatWeDo")}</a>
            <a href="#como-funciona" className="text-sm font-medium text-[#505050] hover:text-[#FEC800] transition-colors">{t("landing.nav.howItWorks")}</a>
          </nav>
          {/* Right */}
          <div className="flex items-center gap-3 ml-auto">
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative min-h-screen">
        {/* Background photo */}
        <div className="absolute inset-0">
          <img
            src="/beenergy-assets/hero-bg.jpeg"
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: "brightness(1.1) saturate(0.9)" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(244,245,249,0.3), rgba(244,245,249,0.7) 80%, #f4f5f9)" }} />
        </div>

        {/* Content */}
        <div className="hero-content relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-20 min-h-screen flex flex-col justify-center">
          <div className="max-w-xl">
            <h1 className="text-5xl md:text-7xl font-bold text-[#18191A] leading-[1.08] mb-6">
              {t("landing.hero.title1")}<br />
              <span style={{ color: "#FEC800" }}>{t("landing.hero.title2")}</span>
            </h1>
            <p className="text-xl text-[#505050] leading-relaxed mb-10">
              {t("landing.hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button
                onClick={handleConnectClick}
                size="lg"
                className="bg-[#FEC800] hover:bg-[#e8b800] text-[#18191A] font-bold text-base px-8 h-14 rounded-full hover:scale-105 transition-all shadow-lg shadow-[#FEC800]/20"
              >
                {t("landing.hero.cta")}
              </Button>
              <a
                href="https://forms.gle/M6TKQEee4zGHjhwb8"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 h-14 rounded-full border-2 border-[#18191A]/15 text-[#18191A] font-semibold text-base hover:border-[#FEC800] hover:text-[#FEC800] transition-all"
              >
                {t("landing.hero.waitlist")}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* City illustration */}
          <div className="city-illustration absolute bottom-0 right-0 w-[55%] hidden md:block pointer-events-none" style={{ opacity: 0.7 }}>
            <CityIllustration className="w-full" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-8 z-10 flex items-center gap-3">
          <div className="relative w-6 h-10 border-2 border-[#18191A]/20 rounded-full">
            <div className="scroll-dot absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#18191A]/40" />
          </div>
          <span className="text-xs text-[#505050] uppercase tracking-widest">Scroll<br />Down</span>
        </div>
      </section>

      {/* ─── Circle transition (golden, brand color) ─── */}
      <div className="circle-trigger relative h-[50vh] pointer-events-none" style={{ zIndex: 0 }}>
        <div className="sticky top-1/2 flex items-center justify-center">
          <div
            className="circle-transition w-20 h-20 rounded-full"
            style={{ border: "6px solid #FEC800", transformOrigin: "center center" }}
          />
        </div>
      </div>

      {/* ─── "Qué hacemos" ─── */}
      <section id="que-hacemos" className="py-32 px-6 bg-white">
        <div className="max-w-6xl mx-auto">

          {/* Product 1: Solar panel — soft rounded frame */}
          <div className="flex flex-col md:flex-row items-center gap-16 mb-32">
            <div className="product-img-left flex-1 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-6 rounded-[3rem] bg-[#FEC800]/8" />
                <div className="absolute -inset-3 rounded-[2.5rem] bg-[#FEC800]/5" />
                <img
                  src="/beenergy-assets/panel-solar.png"
                  alt="Panel solar"
                  className="float-img-1 relative w-full max-w-sm rounded-[2rem]"
                />
              </div>
            </div>
            <div className="product-text-right flex-1">
              <span className="text-sm font-bold text-[#FEC800] uppercase tracking-[0.15em]">{t("landing.section.generation")}</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#18191A] mt-3 mb-5 leading-tight">
                {t("landing.section.generationTitle")}
              </h2>
              <p className="text-lg text-[#505050] leading-relaxed">
                {t("landing.section.generationDesc")}
              </p>
            </div>
          </div>

          {/* Product 2: Smart meter — soft rounded frame */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-16">
            <div className="product-img-right flex-1 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-6 rounded-[3rem] bg-[#3DDC97]/8" />
                <div className="absolute -inset-3 rounded-[2.5rem] bg-[#3DDC97]/5" />
                <img
                  src="/beenergy-assets/medidorInteligente.png"
                  alt="Medidor inteligente"
                  className="float-img-2 relative w-full max-w-sm rounded-[2rem]"
                />
              </div>
            </div>
            <div className="product-text-left flex-1">
              <span className="text-sm font-bold text-[#3DDC97] uppercase tracking-[0.15em]">{t("landing.section.certification")}</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#18191A] mt-3 mb-5 leading-tight">
                {t("landing.section.certificationTitle")}
              </h2>
              <p className="text-lg text-[#505050] leading-relaxed">
                {t("landing.section.certificationDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Quote (Audax-style) ─── */}
      <section className="quote-section py-32 px-6" style={{ background: "#f4f5f9" }}>
        <div className="max-w-4xl mx-auto flex gap-8">
          <div className="relative w-1 shrink-0 rounded-full bg-[#E5E7EB] overflow-hidden">
            <div className="quote-line absolute top-0 left-0 w-full bg-[#FEC800] rounded-full" style={{ height: "100%", transformOrigin: "top", scaleY: 0 }} />
          </div>
          <blockquote className="quote-text text-3xl md:text-4xl font-bold text-[#E5E7EB] leading-snug">
            &ldquo;{t("landing.quote")}&rdquo;
          </blockquote>
        </div>
      </section>

      {/* ─── "Cómo funciona" — steps in brand amber ─── */}
      <section id="como-funciona" className="py-32 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20 reveal-up">
            <h2 className="text-3xl md:text-5xl font-bold text-[#18191A]">{t("landing.howItWorks")}</h2>
            <p className="text-lg text-[#505050] mt-4">{t("landing.fourSteps")}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
            {[
              { num: "01", title: t("landing.step1.title"), desc: t("landing.step1.desc") },
              { num: "02", title: t("landing.step2.title"), desc: t("landing.step2.desc") },
              { num: "03", title: t("landing.step3.title"), desc: t("landing.step3.desc") },
              { num: "04", title: t("landing.step4.title"), desc: t("landing.step4.desc") },
            ].map((step, i) => (
              <div key={i} className="reveal-up flex gap-6">
                <span className="text-5xl font-black shrink-0 text-[#FEC800]/25">{step.num}</span>
                <div>
                  <h3 className="text-xl font-bold text-[#18191A] mb-2">{step.title}</h3>
                  <p className="text-[#505050] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 py-8 px-6 border-t border-[#E5E7EB] bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/beenergy-assets/iso-transparente.png" alt="BeEnergy" className="w-5 h-5 object-contain" />
            <span className="text-sm font-semibold text-[#18191A]">BeEnergy</span>
            <span className="text-xs text-[#505050]/50 ml-1">© 2026</span>
          </div>
          <div className="flex items-center gap-5">
            {/* LinkedIn */}
            <a href="https://linkedin.com/company/111951545" target="_blank" rel="noopener noreferrer" className="text-[#505050]/50 hover:text-[#FEC800] transition-colors" aria-label="LinkedIn">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            {/* X (Twitter) */}
            <a href="https://x.com/BeEnergyCom" target="_blank" rel="noopener noreferrer" className="text-[#505050]/50 hover:text-[#FEC800] transition-colors" aria-label="X">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            {/* GitHub */}
            <a href="https://github.com/BuenDia-Builders/be-energy" target="_blank" rel="noopener noreferrer" className="text-[#505050]/50 hover:text-[#FEC800] transition-colors" aria-label="GitHub">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </footer>

      <WalletConfirmationModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleConfirmConnection} />
      <ProfileSetupModal isOpen={showProfileSetup} onComplete={handleProfileComplete} />
    </div>
  )
}

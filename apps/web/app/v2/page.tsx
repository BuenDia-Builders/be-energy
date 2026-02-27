"use client"

import { useI18nV2 } from "@/lib/v2/i18n-provider"
import {
  AnimatedCounter,
  ScrollReveal,
  SolarGridBG,
  EnergyFlowDiagram,
  LanguageSwitcher,
} from "@/components/v2"

export default function LandingPageV2() {
  const { t } = useI18nV2()

  return (
    <div className="min-h-screen" style={{ background: "var(--v2-bg)" }}>
      {/* ─── 1. Navigation ─── */}
      <Nav />

      {/* ─── 2. Hero ─── */}
      <HeroSection />

      {/* ─── 3. Problem ─── */}
      <ProblemSection />

      {/* ─── 4. Energy Flow SVG ─── */}
      <FlowSection />

      {/* ─── 5. Stats ─── */}
      <StatsSection />

      {/* ─── 6. How it works ─── */}
      <HowItWorksSection />

      {/* ─── 7. Social proof ─── */}
      <SocialProofSection />

      {/* ─── 8. Technology ─── */}
      <TechnologySection />

      {/* ─── 9. CTA ─── */}
      <CTASection />

      {/* ─── 10. Footer ─── */}
      <FooterSection />
    </div>
  )
}

/* ============================================
   1. Navigation
   ============================================ */

function Nav() {
  const { t } = useI18nV2()

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(10,10,15,0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--v2-border-subtle)",
      }}
    >
      <div className="v2-container flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center v2-glow"
            style={{ background: "var(--v2-accent-subtle)", border: "1px solid rgba(34,197,94,0.3)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--v2-accent)" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--v2-text)" }}>
            BeEnergy
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#how" className="text-sm transition-colors" style={{ color: "var(--v2-text-secondary)" }}>
            {t("nav.howItWorks")}
          </a>
          <a href="#community" className="text-sm transition-colors" style={{ color: "var(--v2-text-secondary)" }}>
            {t("nav.community")}
          </a>
          <a href="#technology" className="text-sm transition-colors" style={{ color: "var(--v2-text-secondary)" }}>
            {t("nav.technology")}
          </a>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button className="v2-btn-primary text-sm py-2 px-5">
            {t("nav.launchApp")}
          </button>
        </div>
      </div>
    </nav>
  )
}

/* ============================================
   2. Hero
   ============================================ */

function HeroSection() {
  const { t } = useI18nV2()

  return (
    <section className="relative pt-32 pb-24 overflow-hidden" style={{ background: "var(--v2-gradient-hero)" }}>
      <SolarGridBG />

      <div className="v2-container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <span className="v2-tag mb-6 inline-block">{t("hero.tag")}</span>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" style={{ color: "var(--v2-text)" }}>
              {t("hero.title")}
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p
              className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
              style={{ color: "var(--v2-text-secondary)" }}
            >
              {t("hero.subtitle")}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="v2-btn-primary text-base py-3.5 px-8">
                {t("hero.cta")}
              </button>
              <a href="#how" className="v2-btn-secondary text-base py-3.5 px-8">
                {t("hero.secondary")}
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div
              className="flex items-center justify-center gap-8 md:gap-16 mt-16 pt-10"
              style={{ borderTop: "1px solid var(--v2-border-subtle)" }}
            >
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold mono" style={{ color: "var(--v2-text)" }}>
                  <AnimatedCounter value={12} suffix="+" />
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--v2-text-muted)" }}>
                  {t("hero.stat.communities")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold mono" style={{ color: "var(--v2-text)" }}>
                  <AnimatedCounter value={847} suffix="K" />
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--v2-text-muted)" }}>
                  {t("hero.stat.energyShared")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold mono" style={{ color: "var(--v2-text)" }}>
                  <AnimatedCounter value={1240} suffix="+" />
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--v2-text-muted)" }}>
                  {t("hero.stat.members")}
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

/* ============================================
   3. Problem
   ============================================ */

function ProblemSection() {
  const { t } = useI18nV2()

  const cards = [
    { title: t("problem.card1.title"), desc: t("problem.card1.desc"), icon: EyeOffIcon },
    { title: t("problem.card2.title"), desc: t("problem.card2.desc"), icon: ZapOffIcon },
    { title: t("problem.card3.title"), desc: t("problem.card3.desc"), icon: UsersOffIcon },
  ]

  return (
    <section className="v2-section">
      <div className="v2-container">
        <ScrollReveal>
          <span className="v2-tag mb-4 inline-block">{t("problem.tag")}</span>
          <h2 className="text-3xl md:text-5xl font-bold mb-12" style={{ color: "var(--v2-text)" }}>
            {t("problem.title")}
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="v2-card p-6 h-full">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "var(--v2-red-subtle)" }}
                >
                  <card.icon />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--v2-text)" }}>
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--v2-text-secondary)" }}>
                  {card.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================
   4. Energy Flow
   ============================================ */

function FlowSection() {
  const { t } = useI18nV2()

  return (
    <section className="v2-section relative" style={{ background: "var(--v2-bg-elevated)" }}>
      <SolarGridBG />
      <div className="v2-container relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="v2-tag mb-4 inline-block">{t("flow.tag")}</span>
            <h2 className="text-3xl md:text-5xl font-bold" style={{ color: "var(--v2-text)" }}>
              {t("flow.title")}
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="v2-card-static p-10">
            <EnergyFlowDiagram />
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

/* ============================================
   5. Stats
   ============================================ */

function StatsSection() {
  const { t } = useI18nV2()

  const stats = [
    {
      value: 847230,
      label: t("stats.energy.label"),
      sub: t("stats.energy.sub"),
      color: "var(--v2-accent)",
    },
    {
      value: 423,
      label: t("stats.co2.label"),
      sub: t("stats.co2.sub"),
      color: "var(--v2-blue)",
    },
    {
      value: 127400,
      label: t("stats.savings.label"),
      sub: t("stats.savings.sub"),
      color: "var(--v2-amber)",
      prefix: "$",
    },
    {
      value: 1240,
      label: t("stats.members.label"),
      sub: t("stats.members.sub"),
      color: "var(--v2-purple)",
    },
  ]

  return (
    <section className="v2-section">
      <div className="v2-container">
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="v2-tag mb-4 inline-block">{t("stats.tag")}</span>
            <h2 className="text-3xl md:text-5xl font-bold" style={{ color: "var(--v2-text)" }}>
              {t("stats.title")}
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="v2-card p-6 text-center">
                <p className="text-3xl md:text-4xl font-bold mono mb-2" style={{ color: stat.color }}>
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} />
                </p>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--v2-text)" }}>
                  {stat.label}
                </p>
                <p className="text-xs" style={{ color: "var(--v2-text-muted)" }}>
                  {stat.sub}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================
   6. How it works
   ============================================ */

function HowItWorksSection() {
  const { t } = useI18nV2()

  const steps = [
    { num: "01", title: t("how.step1.title"), desc: t("how.step1.desc"), icon: PlugIcon },
    { num: "02", title: t("how.step2.title"), desc: t("how.step2.desc"), icon: ShareIcon },
    { num: "03", title: t("how.step3.title"), desc: t("how.step3.desc"), icon: CoinsIcon },
  ]

  return (
    <section id="how" className="v2-section" style={{ background: "var(--v2-bg-elevated)" }}>
      <div className="v2-container">
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="v2-tag mb-4 inline-block">{t("how.tag")}</span>
            <h2 className="text-3xl md:text-5xl font-bold" style={{ color: "var(--v2-text)" }}>
              {t("how.title")}
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <ScrollReveal key={i} delay={i * 150}>
              <div className="v2-card p-8 text-center h-full">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: "var(--v2-accent-subtle)", border: "1px solid rgba(34,197,94,0.2)" }}
                >
                  <step.icon />
                </div>
                <span
                  className="text-xs font-bold mono mb-2 block"
                  style={{ color: "var(--v2-accent)" }}
                >
                  {step.num}
                </span>
                <h3 className="text-xl font-bold mb-3" style={{ color: "var(--v2-text)" }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--v2-text-secondary)" }}>
                  {step.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================
   7. Social proof
   ============================================ */

function SocialProofSection() {
  const { t } = useI18nV2()

  const coops = [
    {
      name: t("social.coop1.name"),
      location: t("social.coop1.location"),
      quote: t("social.coop1.quote"),
    },
    {
      name: t("social.coop2.name"),
      location: t("social.coop2.location"),
      quote: t("social.coop2.quote"),
    },
    {
      name: t("social.coop3.name"),
      location: t("social.coop3.location"),
      quote: t("social.coop3.quote"),
    },
  ]

  return (
    <section id="community" className="v2-section">
      <div className="v2-container">
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="v2-tag mb-4 inline-block">{t("social.tag")}</span>
            <h2 className="text-3xl md:text-5xl font-bold" style={{ color: "var(--v2-text)" }}>
              {t("social.title")}
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {coops.map((coop, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="v2-card p-6 h-full flex flex-col">
                <div className="flex-1">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="var(--v2-accent)"
                    opacity="0.3"
                    className="mb-4"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p
                    className="text-sm leading-relaxed mb-6 italic"
                    style={{ color: "var(--v2-text-secondary)" }}
                  >
                    &ldquo;{coop.quote}&rdquo;
                  </p>
                </div>
                <div
                  className="pt-4"
                  style={{ borderTop: "1px solid var(--v2-border-subtle)" }}
                >
                  <p className="text-sm font-semibold" style={{ color: "var(--v2-text)" }}>
                    {coop.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--v2-text-muted)" }}>
                    {coop.location}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================
   8. Technology
   ============================================ */

function TechnologySection() {
  const { t } = useI18nV2()

  const features = [
    { title: t("tech.feature1.title"), desc: t("tech.feature1.desc"), icon: ClockIcon },
    { title: t("tech.feature2.title"), desc: t("tech.feature2.desc"), icon: DollarIcon },
    { title: t("tech.feature3.title"), desc: t("tech.feature3.desc"), icon: ShieldIcon },
    { title: t("tech.feature4.title"), desc: t("tech.feature4.desc"), icon: CodeIcon },
  ]

  return (
    <section id="technology" className="v2-section" style={{ background: "var(--v2-bg-elevated)" }}>
      <div className="v2-container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <ScrollReveal>
            <span className="v2-tag mb-4 inline-block">{t("tech.tag")}</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: "var(--v2-text)" }}>
              {t("tech.title")}
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--v2-text-secondary)" }}>
              {t("tech.desc")}
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="v2-card p-5 h-full">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: "var(--v2-blue-subtle)" }}
                  >
                    <feature.icon />
                  </div>
                  <h3 className="text-sm font-bold mb-1" style={{ color: "var(--v2-text)" }}>
                    {feature.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--v2-text-muted)" }}>
                    {feature.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================
   9. CTA
   ============================================ */

function CTASection() {
  const { t } = useI18nV2()

  return (
    <section className="v2-section relative overflow-hidden">
      <SolarGridBG />
      <div className="v2-container relative z-10">
        <ScrollReveal>
          <div
            className="v2-card-static p-12 md:p-16 text-center"
            style={{
              background: "linear-gradient(135deg, var(--v2-bg-card) 0%, rgba(34,197,94,0.05) 100%)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <h2
              className="text-3xl md:text-5xl font-bold mb-4"
              style={{ color: "var(--v2-text)" }}
            >
              {t("cta.title")}
            </h2>
            <p
              className="text-base md:text-lg mb-8 max-w-xl mx-auto"
              style={{ color: "var(--v2-text-secondary)" }}
            >
              {t("cta.subtitle")}
            </p>
            <button className="v2-btn-primary text-base py-3.5 px-10">
              {t("cta.button")}
            </button>
            <p className="text-xs mt-4" style={{ color: "var(--v2-text-muted)" }}>
              {t("cta.note")}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

/* ============================================
   10. Footer
   ============================================ */

function FooterSection() {
  const { t } = useI18nV2()

  return (
    <footer
      className="py-16"
      style={{
        borderTop: "1px solid var(--v2-border-subtle)",
        background: "var(--v2-bg)",
      }}
    >
      <div className="v2-container">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: "var(--v2-accent-subtle)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--v2-accent)" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="font-bold" style={{ color: "var(--v2-text)" }}>
                BeEnergy
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--v2-text-muted)" }}>
              {t("footer.powered")}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--v2-text-muted)" }}
            >
              {t("footer.product")}
            </h4>
            <div className="space-y-2">
              <FooterLink href="#how">{t("footer.howItWorks")}</FooterLink>
              <FooterLink href="#">{t("footer.pricing")}</FooterLink>
              <FooterLink href="#">{t("footer.docs")}</FooterLink>
            </div>
          </div>

          {/* Community */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--v2-text-muted)" }}
            >
              {t("footer.community")}
            </h4>
            <div className="space-y-2">
              <FooterLink href="#community">{t("footer.cooperatives")}</FooterLink>
              <FooterLink href="#">{t("footer.discord")}</FooterLink>
              <FooterLink href="https://github.com/BuenDia-Builders/be-energy">{t("footer.github")}</FooterLink>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--v2-text-muted)" }}
            >
              {t("footer.company")}
            </h4>
            <div className="space-y-2">
              <FooterLink href="#">{t("footer.about")}</FooterLink>
              <FooterLink href="#">{t("footer.blog")}</FooterLink>
              <FooterLink href="#">{t("footer.careers")}</FooterLink>
            </div>
          </div>
        </div>

        <div
          className="pt-8 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--v2-border-subtle)" }}
        >
          <p className="text-xs" style={{ color: "var(--v2-text-muted)" }}>
            &copy; {new Date().getFullYear()} BeEnergy. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="block text-sm transition-colors"
      style={{ color: "var(--v2-text-secondary)" }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.color = "var(--v2-text)"
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.color = "var(--v2-text-secondary)"
      }}
    >
      {children}
    </a>
  )
}

/* ============================================
   Inline SVG Icons
   ============================================ */

function EyeOffIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--v2-red)" strokeWidth="1.5" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function ZapOffIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--v2-red)" strokeWidth="1.5" strokeLinecap="round">
      <polyline points="12.41 6.75 13 2 10.57 4.92" />
      <polyline points="18.57 12.91 21 10 15.66 10" />
      <polyline points="8 8 3 14 12 14 11 22 16 16" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function UsersOffIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--v2-red)" strokeWidth="1.5" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function PlugIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--v2-accent)" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 22v-5M9 7V2M15 7V2M6 13V7h12v6a6 6 0 01-12 0z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--v2-accent)" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function CoinsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--v2-accent)" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1110.34 18" />
      <path d="M7 6h2v4" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--v2-blue)" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function DollarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--v2-blue)" strokeWidth="1.5" strokeLinecap="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--v2-blue)" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function CodeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--v2-blue)" strokeWidth="1.5" strokeLinecap="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}

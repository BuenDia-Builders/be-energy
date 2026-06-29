"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2 } from "lucide-react"

function HexPattern({ id, stroke = "rgba(0,83,122,0.35)" }: { id: string; stroke?: string }) {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      xmlns="http://www.w3.org/2000/svg">
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

type Step = "email" | "otp" | "loading"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!email || busy) return
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/auth/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error enviando el código"); return }
      setStep("otp")
    } catch {
      setError("Error de red. Intentá de nuevo.")
    } finally {
      setBusy(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!otp || busy) return
    setBusy(true)
    setError("")
    setStep("loading")
    try {
      const res = await fetch("/api/auth/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Código incorrecto")
        setStep("otp")
        return
      }
      router.push("/dashboard")
    } catch {
      setError("Error de red. Intentá de nuevo.")
      setStep("otp")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-sans, 'IBM Plex Sans', system-ui)" }}>

      {/* ── Left panel — form ── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "64px 72px",
        background: "#fff",
        maxWidth: 560,
      }}>
        {/* Logo */}
        <a href="/" style={{ display: "inline-block", marginBottom: 64 }}>
          <img src="/beenergy-assets/BeEnergy-logo-primary.svg" alt="BeEnergy" style={{ height: 28 }} />
        </a>

        {step === "loading" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16 }}>
            <Loader2 style={{ width: 32, height: 32, color: "#00537A", animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 15, color: "#64748B" }}>Preparando tu espacio…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A", marginBottom: 12, lineHeight: 1.1 }}>
              {step === "email" ? "Ingresá a tu cuenta" : "Verificá tu email"}
            </h1>
            <p style={{ fontSize: 15, color: "#64748B", marginBottom: 48, lineHeight: 1.65 }}>
              {step === "email"
                ? "Ingresá tu email y te enviamos un código de 6 dígitos."
                : `Enviamos un código a ${email}. Revisá tu bandeja de entrada.`
              }
            </p>

            {step === "email" ? (
              <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>Email</label>
                  <input
                    type="email"
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{
                      height: 44,
                      padding: "0 14px",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      fontSize: 14,
                      color: "#0F172A",
                      outline: "none",
                      width: "100%",
                      fontFamily: "inherit",
                    }}
                    onFocus={e => (e.target.style.borderColor = "#00537A")}
                    onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
                  />
                </div>

                {error && (
                  <p style={{ fontSize: 13, color: "#EF4444", marginTop: 4 }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={busy || !email}
                  style={{
                    height: 44,
                    background: busy || !email ? "#94A3B8" : "#00537A",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: busy || !email ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "background 150ms",
                    fontFamily: "inherit",
                    marginTop: 4,
                  }}>
                  {busy ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : null}
                  Continuar
                </button>

                <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 8 }}>
                  Sin wallet. Sin contraseña. Solo tu email.
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>Código de 6 dígitos</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    maxLength={6}
                    autoFocus
                    style={{
                      height: 52,
                      padding: "0 14px",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      fontSize: 22,
                      letterSpacing: "0.25em",
                      color: "#0F172A",
                      outline: "none",
                      width: "100%",
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                    onFocus={e => (e.target.style.borderColor = "#00537A")}
                    onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
                  />
                </div>

                {error && (
                  <p style={{ fontSize: 13, color: "#EF4444", marginTop: 4 }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={busy || otp.length < 6}
                  style={{
                    height: 44,
                    background: busy || otp.length < 6 ? "#94A3B8" : "#00537A",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: busy || otp.length < 6 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "background 150ms",
                    fontFamily: "inherit",
                  }}>
                  {busy ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : null}
                  Ingresar
                  {!busy && <ArrowRight style={{ width: 14, height: 14 }} />}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("email"); setOtp(""); setError("") }}
                  style={{ background: "none", border: "none", fontSize: 13, color: "#64748B", cursor: "pointer", textAlign: "left", padding: 0, fontFamily: "inherit" }}>
                  ← Cambiar email
                </button>
              </form>
            )}

            <div style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid #E2E8F0" }}>
              <p style={{ fontSize: 12, color: "#94A3B8" }}>
                ¿Sos cooperativa con wallet Stellar?{" "}
                <a href="/" style={{ color: "#00537A", textDecoration: "none", fontWeight: 500 }}>
                  Conectar wallet
                </a>
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Right panel — dark brand ── */}
      <div style={{
        flex: 1,
        background: "#0F172A",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "56px 64px",
        minHeight: "100vh",
      }}>
        <HexPattern id="hexlogin" stroke="rgba(0,83,122,0.4)" />

        {/* Certificate card preview */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -58%) rotate(-2deg)",
          background: "#013C58",
          borderRadius: 16,
          padding: "28px 32px",
          width: 260,
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
          zIndex: 1,
        }}>
          <HexPattern id="hexcard" stroke="rgba(0,83,122,0.5)" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#00537A", marginBottom: 20 }}>
              Certificado emitido · Testnet
            </p>
            <p style={{ fontSize: 44, fontWeight: 700, color: "#FFD500", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 6 }}>
              152.4
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 300, marginBottom: 12 }}>
              MWh registrados en Stellar
            </p>
            <p style={{ fontSize: 12, fontWeight: 500, color: "#fff", lineHeight: 1.4 }}>
              Cooperativa Solar<br />Andina Sur · 2026
            </p>
            <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <img src="/beenergy-assets/BeEnergy-logo-white.svg" alt="BeEnergy" style={{ height: 13 }} />
              <span style={{ fontSize: 7, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>beenergy.coop</span>
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.875rem)", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 12 }}>
            Generación real.<br />Activo verificable.
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.65, maxWidth: 380 }}>
            Cada activo ambiental se vincula a una cooperativa, un período
            y una medición real de energía renovable.
          </p>
        </div>
      </div>
    </div>
  )
}

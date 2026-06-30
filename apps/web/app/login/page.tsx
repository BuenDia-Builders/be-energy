"use client"

import { useState } from "react"
import { ArrowRight, Loader2, Eye, EyeOff } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

let _supabaseClient: ReturnType<typeof createClient> | null = null
function getSupabaseClient() {
  if (!_supabaseClient) {
    _supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabaseClient
}

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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError("")
    try {
      const { data, error: authError } = await getSupabaseClient().auth.signInWithPassword({ email, password })
      if (authError || !data.user) {
        setError("Email o contraseña incorrectos.")
        return
      }
      // Exchange Supabase session for our JWT via callback
      window.location.href = "/auth/callback/password?uid=" + data.user.id + "&email=" + encodeURIComponent(email)
    } catch {
      setError("Error de red. Intentá de nuevo.")
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
        <a href="/" style={{ display: "inline-block", marginBottom: 64 }}>
          <img src="/beenergy-assets/BeEnergy-logo-primary.svg" alt="BeEnergy" style={{ height: 28 }} />
        </a>

        <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A", marginBottom: 12, lineHeight: 1.1 }}>
          Ingresá a tu cuenta
        </h1>
        <p style={{ fontSize: 15, color: "#64748B", marginBottom: 40, lineHeight: 1.65 }}>
          Usá tu email y contraseña para acceder.
        </p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 400 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>Email</label>
            <input
              type="email"
              placeholder="tu@empresa.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              style={{ height: 44, padding: "0 14px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, color: "#0F172A", outline: "none", width: "100%", fontFamily: "inherit" }}
              onFocus={e => (e.target.style.borderColor = "#00537A")}
              onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>Contraseña</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ height: 44, padding: "0 42px 0 14px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, color: "#0F172A", outline: "none", width: "100%", fontFamily: "inherit" }}
                onFocus={e => (e.target.style.borderColor = "#00537A")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 0 }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p style={{ fontSize: 13, color: "#EF4444" }}>{error}</p>}

          <button
            type="submit"
            disabled={busy || !email || !password}
            style={{
              height: 44,
              background: busy || !email || !password ? "#94A3B8" : "#00537A",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: busy || !email || !password ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "inherit",
              marginTop: 4,
            }}>
            {busy ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : null}
            Ingresar
            {!busy && <ArrowRight style={{ width: 14, height: 14 }} />}
          </button>

          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </form>

        <div style={{ marginTop: 16, padding: "12px 14px", background: "#F1F5F9", borderRadius: 8, border: "1px solid #E2E8F0" }}>
          <p style={{ fontSize: 12, color: "#64748B", margin: 0, lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600, color: "#0F172A" }}>Demo:</span>{" "}
            demo@beenergy.coop{" "}
            <span style={{ color: "#CBD5E1" }}>·</span>{" "}
            Demo2026!
          </p>
        </div>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #E2E8F0" }}>
          <p style={{ fontSize: 12, color: "#94A3B8" }}>
            ¿Sos cooperativa con wallet Stellar?{" "}
            <a href="/" style={{ color: "#00537A", textDecoration: "none", fontWeight: 500 }}>
              Conectar wallet
            </a>
          </p>
        </div>
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

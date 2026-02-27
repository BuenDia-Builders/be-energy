"use client"

interface SolarGridBGProps {
  className?: string
}

export function SolarGridBG({ className = "" }: SolarGridBGProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Grid dots */}
      <div className="v2-grid-bg absolute inset-0 opacity-30" />

      {/* Radial glow top-right */}
      <div
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Radial glow bottom-left */}
      <div
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)",
        }}
      />
    </div>
  )
}

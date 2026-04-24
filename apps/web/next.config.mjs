/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === "production"

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isProduction ? [] : ["'unsafe-eval'"]),
  "https://va.vercel-scripts.com",
].join(" ")

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Empty turbopack config to use Turbopack (Next.js 16 default)
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Handle node polyfills for Stellar SDK (used when running with --webpack)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    return config
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src ${scriptSrc}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://stellar.creit.tech https://storage.herewallet.app https://*.lobstr.co https://*.albedo.link",
              "connect-src 'self' https://soroban-testnet.stellar.org https://horizon-testnet.stellar.org https://*.supabase.co wss://*.supabase.co https://api.defindex.tech https://stellar.creit.tech https://*.walletconnect.com wss://*.walletconnect.com https://va.vercel-scripts.com",
              "frame-src 'self' https://*.albedo.link https://*.xbull.app https://*.lobstr.co",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default nextConfig

"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Language = "es" | "en"
type Theme = "dark" | "light"

interface AppContextType {
  language: Language
  setLanguage: (lang: Language) => void
  theme: Theme
  setTheme: (theme: Theme) => void
  t: (key: string) => string
  activeSection: string
  setActiveSection: (section: string) => void
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    overview: "Resumen",
    gridMonitoring: "Monitoreo de Grid",
    prosumers: "Prosumers",
    smartMeters: "Medidores Inteligentes",
    energyMarketplace: "Mercado de Energía",
    billing: "Facturación",
    systemLogs: "Registros del Sistema",
    settings: "Configuración",
    cooperativeAdmin: "Administrador Cooperativo",
    search: "Buscar",
    notifications: "Notificaciones",
    theme: "Tema",
    darkMode: "Modo oscuro",
    lightMode: "Modo claro",
    copyAddress: "Copiar dirección",
    totalEnergyGenerated: "Energía Total Generada",
    activeProsumers: "Prosumers Activos",
    connectedMeters: "Medidores Conectados",
    networkHealth: "Salud de la Red",
    mwh: "MWh",
    kw: "kW",
    percent: "%",
    upTrend: "Arriba",
    downTrend: "Abajo",
    energyGenerationVsConsumption: "Generación vs Consumo de Energía",
    timeRange: "Rango de Tiempo",
    last7days: "Últimos 7 días",
    h24: "24h",
    d7: "7d",
    d30: "30d",
    generation: "Generación",
    consumption: "Consumo",
    gridDistribution: "Distribución de Energía de Grid",
    selfConsumed: "Autoconsumida",
    soldToNeighbors: "Vendida a Vecinos",
    injectedToGrid: "Inyectada a Red",
    networkStatus: "Estado de la Red",
    onlineMeters: "Medidores En Línea",
    offlineMeters: "Medidores Fuera de Línea",
    pendingReadings: "Lecturas Pendientes",
    iotGateway: "Pasarela IoT",
    online: "En Línea",
    offline: "Fuera de Línea",
    availableEnergy: "Energía Disponible",
    availableEnergyDesc: "Excedente en el tiempo",
    energyDistribution: "Distribución de Energía",
    prosumerManagement: "Gestión de Prosumers",
    walletAddress: "Dirección de Monedero",
    energyGenerated: "Energía Generada",
    energySold: "Energía Vendida",
    hdropMinted: "HDROP Acuñado",
    status: "Estado",
    marketplaceMonitoring: "Monitoreo del Mercado",
    tradingVolume: "Volumen de Transacciones",
    avgPrice: "Precio Promedio",
    txToday: "Transacciones Hoy",
    recentTrades: "Operaciones Recientes",
    seller: "Vendedor",
    buyer: "Comprador",
    energy: "Energía (kWh)",
    price: "Precio",
    timestamp: "Marca de Tiempo",
    billingSettlement: "Facturación y Liquidación",
    totalCreditsIssued: "Créditos Totales Emitidos",
    energyRedeemed: "Energía Canjeada",
    pendingSettlements: "Liquidaciones Pendientes",
    event: "Evento",
    user: "Usuario",
    module: "Módulo",
    completed: "Completado",
    failed: "Fallido",
    pending: "Pendiente",
    filter: "Filtrar",
    pagination: "Paginación",
    kWh: "kWh",
    backToApp: "Volver a BeEnergy",
  },
  en: {
    overview: "Overview",
    gridMonitoring: "Grid Monitoring",
    prosumers: "Prosumers",
    smartMeters: "Smart Meters",
    energyMarketplace: "Energy Marketplace",
    billing: "Billing",
    systemLogs: "System Logs",
    settings: "Settings",
    cooperativeAdmin: "Cooperative Admin",
    search: "Search",
    notifications: "Notifications",
    theme: "Theme",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    copyAddress: "Copy address",
    totalEnergyGenerated: "Total Energy Generated",
    activeProsumers: "Active Prosumers",
    connectedMeters: "Connected Smart Meters",
    networkHealth: "Network Health",
    mwh: "MWh",
    kw: "kW",
    percent: "%",
    upTrend: "Up",
    downTrend: "Down",
    energyGenerationVsConsumption: "Energy Generation vs Consumption",
    timeRange: "Time Range",
    last7days: "Last 7 days",
    h24: "24h",
    d7: "7d",
    d30: "30d",
    generation: "Generation",
    consumption: "Consumption",
    gridDistribution: "Grid Energy Distribution",
    selfConsumed: "Self-Consumed",
    soldToNeighbors: "Sold to Neighbors",
    injectedToGrid: "Injected to Grid",
    networkStatus: "Network Status",
    onlineMeters: "Online Meters",
    offlineMeters: "Offline Meters",
    pendingReadings: "Pending Readings",
    iotGateway: "IoT Gateway",
    online: "Online",
    offline: "Offline",
    availableEnergy: "Available Energy",
    availableEnergyDesc: "Surplus over time",
    energyDistribution: "Energy Distribution",
    prosumerManagement: "Prosumer Management",
    walletAddress: "Wallet Address",
    energyGenerated: "Energy Generated",
    energySold: "Energy Sold",
    hdropMinted: "HDROP Minted",
    status: "Status",
    marketplaceMonitoring: "Marketplace Monitoring",
    tradingVolume: "Trading Volume",
    avgPrice: "Avg Price",
    txToday: "Transactions Today",
    recentTrades: "Recent Trades",
    seller: "Seller",
    buyer: "Buyer",
    energy: "Energy (kWh)",
    price: "Price",
    timestamp: "Timestamp",
    billingSettlement: "Billing & Settlement",
    totalCreditsIssued: "Total Credits Issued",
    energyRedeemed: "Energy Redeemed",
    pendingSettlements: "Pending Settlements",
    event: "Event",
    user: "User",
    module: "Module",
    completed: "Completed",
    failed: "Failed",
    pending: "Pending",
    filter: "Filter",
    pagination: "Pagination",
    kWh: "kWh",
    backToApp: "Back to BeEnergy",
  },
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function CooperativeAppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("es")
  const [theme, setTheme] = useState<Theme>("dark")
  const [activeSection, setActiveSection] = useState("overview")

  const t = (key: string) => translations[language][key] ?? key

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    if (typeof document !== "undefined") {
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }

  return (
    <AppContext.Provider
      value={{ language, setLanguage, theme, setTheme: handleSetTheme, t, activeSection, setActiveSection }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useCooperativeApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useCooperativeApp must be used within CooperativeAppProvider")
  return ctx
}

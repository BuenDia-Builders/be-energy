"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Language = "es" | "en"

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const translations = {
  es: {
    // Landing Page
    "landing.title": "Energía Verde Tokenizada",
    "landing.subtitle": "Genera, consume y comercializa kWh en tu comunidad cooperativa",
    "landing.start": "Comenzar",
    "landing.connectWallet": "Conectar Wallet",
    "landing.feature.generate.title": "Genera",
    "landing.feature.generate.description": "Participa en instalaciones solares y eólicas compartidas",
    "landing.feature.trade.title": "Comercializa",
    "landing.feature.trade.description": "Vende tu energía excedente en el marketplace P2P",
    "landing.feature.manage.title": "Gestiona",
    "landing.feature.manage.description": "Monitorea tu consumo y producción en tiempo real",
    "landing.footer.docs": "Documentación",
    "landing.footer.powered": "Powered by Stellar",

    // Dashboard
    "dashboard.welcome": "Bienvenido,",
    "dashboard.balance": "Balance",
    "dashboard.availableKwh": "kWh Disponibles",
    "dashboard.consumption": "Consumo Noviembre",
    "dashboard.last7days": "Últimos 7 días",
    "dashboard.quickActions": "Acciones Rápidas",
    "dashboard.buyEnergy": "Comprar Energía",
    "dashboard.sellEnergy": "Vender Energía",
    "dashboard.viewHistory": "Ver Historial",
    "dashboard.recentActivity": "Actividad Reciente",
    "dashboard.recentTransactions": "Últimas transacciones",
    "dashboard.viewAll": "Ver todo",
    "dashboard.swap": "Swap → XLM",

    // Marketplace
    "marketplace.title": "Marketplace Comunitario",
    "marketplace.availableKwh": "kWh disponibles:",
    "marketplace.createOffer": "Crear Oferta",
    "marketplace.buy": "Comprar",
    "marketplace.createModal.title": "Crear Nueva Oferta",
    "marketplace.createModal.description": "Vende tu energía excedente al marketplace",
    "marketplace.createModal.amount": "Cantidad de kWh",
    "marketplace.createModal.available": "Disponible:",
    "marketplace.createModal.price": "Precio por kWh (XLM)",
    "marketplace.createModal.totalReceive": "Total a recibir",
    "marketplace.createModal.cancel": "Cancelar",
    "marketplace.createModal.publish": "Publicar Oferta",
    "marketplace.buyModal.title": "Confirmar Compra",
    "marketplace.buyModal.description": "Revisa los detalles de tu transacción",
    "marketplace.buyModal.seller": "Vendedor:",
    "marketplace.buyModal.quantity": "Cantidad:",
    "marketplace.buyModal.unitPrice": "Precio unitario:",
    "marketplace.buyModal.totalPay": "Total a pagar",
    "marketplace.buyModal.confirm": "Confirmar Compra",
    "marketplace.communityStats": "Estadísticas de la Comunidad",
    "marketplace.totalGenerated": "Total Generado",
    "marketplace.activeMembers": "Miembros Activos",
    "marketplace.contractData": "Datos en vivo de Stellar Testnet",
    "marketplace.loadingContract": "Cargando datos del contrato...",
    "marketplace.errorContract": "No se pudieron cargar los datos del contrato",

    // Wallet Confirmation Modal
    "wallet.title": "Conectar Wallet",
    "wallet.subtitle": "Autorización requerida",
    "wallet.permissions": "Permisos solicitados:",
    "wallet.permission1": "Ver tu dirección pública de Stellar",
    "wallet.permission2": "Consultar tu balance de tokens BeEnergy",
    "wallet.permission3": "Solicitar firma para transacciones",
    "wallet.security.title": "Tu seguridad es nuestra prioridad",
    "wallet.security.description":
      "BeEnergy nunca te pedirá tu clave privada ni podrá realizar transacciones sin tu confirmación explícita.",
    "wallet.error.title": "Error de conexión",
    "wallet.error.message": "No se pudo conectar a la wallet",
    "wallet.cancel": "Cancelar",
    "wallet.authorize": "Autorizar",
    "wallet.connecting": "Conectando...",

    // Profile Setup Modal
    "profile.title": "Configura tu Perfil",
    "profile.subtitle": "Personaliza tu experiencia",
    "profile.avatar": "Foto de Perfil",
    "profile.uploadPhoto": "Subir Foto",
    "profile.remove": "Quitar",
    "profile.optional": "Opcional - puedes añadirla más tarde",
    "profile.name": "Nombre",
    "profile.namePlaceholder": "¿Cómo te gustaría que te llamemos?",
    "profile.continue": "Continuar",
    "profile.pageTitle": "Mi Perfil",
    "profile.pageDescription": "Gestiona tu información personal",
    "profile.personalInfo": "Información Personal",
    "profile.walletAddress": "Dirección de Wallet",
    "profile.saveChanges": "Guardar Cambios",
    "profile.saving": "Guardando...",

    // Success Modal
    "success.title": "¡Transacción Exitosa!",
    "success.purchase": "Has comprado",
    "success.sale": "Has vendido",
    "success.transaction": "Tu transacción se ha procesado correctamente en la red Stellar",
    "success.close": "Cerrar",
    "success.type": "Tipo",
    "success.amount": "Cantidad",
    "success.xlmAmount": "Monto en XLM",
    "success.txHash": "Hash de transacción",
    "success.viewOnStellarExpert": "Ver en Stellar Expert",

    // Sidebar
    "sidebar.dashboard": "Dashboard",
    "sidebar.marketplace": "Marketplace",
    "sidebar.activity": "Actividad Reciente",
    "sidebar.consumption": "Historial de Consumo",
    "sidebar.settings": "Configuración",
    "sidebar.disconnect": "Desconectar",

    // Activity Page
    "activity.description": "Historial de transacciones de compra y venta",
    "activity.purchases": "Compras Recientes",
    "activity.purchasesDescription": "Últimos 2 meses",
    "activity.sales": "Ventas Recientes",
    "activity.salesDescription": "Últimos 2 meses",
    "activity.lastTwoMonths": "Visualiza tus transacciones de los últimos 2 meses",
    "activity.noPurchases": "No hay compras registradas en los últimos 2 meses",
    "activity.noSales": "No hay ventas registradas en los últimos 2 meses",
    "activity.selectMonth": "Seleccionar mes",
    "activity.selectYear": "Seleccionar año",
    "activity.allMonths": "Todos los meses",
    "activity.allYears": "Todos los años",
    "activity.january": "Enero",
    "activity.february": "Febrero",
    "activity.march": "Marzo",
    "activity.april": "Abril",
    "activity.may": "Mayo",
    "activity.june": "Junio",
    "activity.july": "Julio",
    "activity.august": "Agosto",
    "activity.september": "Septiembre",
    "activity.october": "Octubre",
    "activity.november": "Noviembre",
    "activity.december": "Diciembre",
    "activity.noTransactions": "No hay transacciones registradas",
    "activity.recentPayments": "Pagos Recientes",
    "activity.recentPaymentsDescription": "Últimos pagos obtenidos desde la red Stellar (Horizon)",
    "activity.loading": "Cargando transacciones...",
    "activity.errorFetching": "No se pudo cargar el historial de pagos",
    "activity.retry": "Reintentar",

    // Consumption Page
    "consumption.description": "Historial de consumo energético desde el inicio",
    "consumption.total": "consumidos",

    // Common
    "common.back": "Volver",
    "common.copyAddress": "Copiar dirección",
    "common.copied": "Copiado",
  },
  en: {
    // Landing Page
    "landing.title": "Tokenized Green Energy",
    "landing.subtitle": "Generate, consume and trade kWh in your cooperative community",
    "landing.start": "Get Started",
    "landing.connectWallet": "Connect Wallet",
    "landing.feature.generate.title": "Generate",
    "landing.feature.generate.description": "Participate in shared solar and wind installations",
    "landing.feature.trade.title": "Trade",
    "landing.feature.trade.description": "Sell your excess energy on the P2P marketplace",
    "landing.feature.manage.title": "Manage",
    "landing.feature.manage.description": "Monitor your consumption and production in real time",
    "landing.footer.docs": "Documentation",
    "landing.footer.powered": "Powered by Stellar",

    // Dashboard
    "dashboard.welcome": "Welcome,",
    "dashboard.balance": "Balance",
    "dashboard.availableKwh": "Available kWh",
    "dashboard.consumption": "November Consumption",
    "dashboard.last7days": "Last 7 days",
    "dashboard.quickActions": "Quick Actions",
    "dashboard.buyEnergy": "Buy Energy",
    "dashboard.sellEnergy": "Sell Energy",
    "dashboard.viewHistory": "View History",
    "dashboard.recentActivity": "Recent Activity",
    "dashboard.recentTransactions": "Recent transactions",
    "dashboard.viewAll": "View all",
    "dashboard.swap": "Swap → XLM",

    // Marketplace
    "marketplace.title": "Community Marketplace",
    "marketplace.availableKwh": "Available kWh:",
    "marketplace.createOffer": "Create Offer",
    "marketplace.buy": "Buy",
    "marketplace.createModal.title": "Create New Offer",
    "marketplace.createModal.description": "Sell your excess energy to the marketplace",
    "marketplace.createModal.amount": "kWh Amount",
    "marketplace.createModal.available": "Available:",
    "marketplace.createModal.price": "Price per kWh (XLM)",
    "marketplace.createModal.totalReceive": "Total to receive",
    "marketplace.createModal.cancel": "Cancel",
    "marketplace.createModal.publish": "Publish Offer",
    "marketplace.buyModal.title": "Confirm Purchase",
    "marketplace.buyModal.description": "Review your transaction details",
    "marketplace.buyModal.seller": "Seller:",
    "marketplace.buyModal.quantity": "Quantity:",
    "marketplace.buyModal.unitPrice": "Unit price:",
    "marketplace.buyModal.totalPay": "Total to pay",
    "marketplace.buyModal.confirm": "Confirm Purchase",
    "marketplace.communityStats": "Community Stats",
    "marketplace.totalGenerated": "Total Generated",
    "marketplace.activeMembers": "Active Members",
    "marketplace.contractData": "Live data from Stellar Testnet",
    "marketplace.loadingContract": "Loading contract data...",
    "marketplace.errorContract": "Could not load contract data",

    // Wallet Confirmation Modal
    "wallet.title": "Connect Wallet",
    "wallet.subtitle": "Authorization required",
    "wallet.permissions": "Requested permissions:",
    "wallet.permission1": "View your Stellar public address",
    "wallet.permission2": "Check your BeEnergy token balance",
    "wallet.permission3": "Request signature for transactions",
    "wallet.security.title": "Your security is our priority",
    "wallet.security.description":
      "BeEnergy will never ask for your private key or make transactions without your explicit confirmation.",
    "wallet.error.title": "Connection error",
    "wallet.error.message": "Could not connect to wallet",
    "wallet.cancel": "Cancel",
    "wallet.authorize": "Authorize",
    "wallet.connecting": "Connecting...",

    // Profile Setup Modal
    "profile.title": "Setup Your Profile",
    "profile.subtitle": "Personalize your experience",
    "profile.avatar": "Profile Picture",
    "profile.uploadPhoto": "Upload Photo",
    "profile.remove": "Remove",
    "profile.optional": "Optional - you can add it later",
    "profile.name": "Name",
    "profile.namePlaceholder": "What would you like to be called?",
    "profile.continue": "Continue",
    "profile.pageTitle": "My Profile",
    "profile.pageDescription": "Manage your personal information",
    "profile.personalInfo": "Personal Information",
    "profile.walletAddress": "Wallet Address",
    "profile.saveChanges": "Save Changes",
    "profile.saving": "Saving...",

    // Success Modal
    "success.title": "Transaction Successful!",
    "success.purchase": "You have purchased",
    "success.sale": "You have sold",
    "success.transaction": "Your transaction has been successfully processed on the Stellar network",
    "success.close": "Close",
    "success.type": "Type",
    "success.amount": "Amount",
    "success.xlmAmount": "XLM Amount",
    "success.txHash": "Transaction Hash",
    "success.viewOnStellarExpert": "View on Stellar Expert",

    // Sidebar
    "sidebar.dashboard": "Dashboard",
    "sidebar.marketplace": "Marketplace",
    "sidebar.activity": "Recent Activity",
    "sidebar.consumption": "Consumption History",
    "sidebar.settings": "Settings",
    "sidebar.disconnect": "Disconnect",

    // Activity Page
    "activity.description": "Transaction history of purchases and sales",
    "activity.purchases": "Recent Purchases",
    "activity.purchasesDescription": "Last 2 months",
    "activity.sales": "Recent Sales",
    "activity.salesDescription": "Last 2 months",
    "activity.lastTwoMonths": "View your transactions from the last 2 months",
    "activity.noPurchases": "No purchases recorded in the last 2 months",
    "activity.noSales": "No sales recorded in the last 2 months",
    "activity.selectMonth": "Select month",
    "activity.selectYear": "Select year",
    "activity.allMonths": "All months",
    "activity.allYears": "All years",
    "activity.january": "January",
    "activity.february": "February",
    "activity.march": "March",
    "activity.april": "April",
    "activity.may": "May",
    "activity.june": "June",
    "activity.july": "July",
    "activity.august": "August",
    "activity.september": "September",
    "activity.october": "October",
    "activity.november": "November",
    "activity.december": "December",
    "activity.noTransactions": "No transactions recorded",
    "activity.recentPayments": "Recent Payments",
    "activity.recentPaymentsDescription": "Latest payments fetched from the Stellar network (Horizon)",
    "activity.loading": "Loading transactions...",
    "activity.errorFetching": "Could not load payment history",
    "activity.retry": "Retry",

    // Consumption Page
    "consumption.description": "Energy consumption history from the beginning",
    "consumption.total": "consumed",

    // Common
    "common.back": "Back",
    "common.copyAddress": "Copy Address",
    "common.copied": "Copied",
  },
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("es")

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language | null
    if (savedLang && (savedLang === "es" || savedLang === "en")) {
      setLanguageState(savedLang)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)["es"]] || key
  }

  return <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}

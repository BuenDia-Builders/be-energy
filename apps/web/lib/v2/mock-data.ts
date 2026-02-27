export interface Trade {
  id: string
  from: string
  to: string
  amount: number
  status: "completed" | "pending" | "failed"
  timestamp: string
}

export interface Cooperative {
  name: string
  location: string
  members: number
  kwhShared: number
  quote: string
}

export const mockTrades: Trade[] = [
  {
    id: "t1",
    from: "Casa Martinez",
    to: "Pool Comunitario",
    amount: 12.4,
    status: "completed",
    timestamp: "2 min ago",
  },
  {
    id: "t2",
    from: "Pool Comunitario",
    to: "Depto. Fernandez",
    amount: 8.1,
    status: "completed",
    timestamp: "15 min ago",
  },
  {
    id: "t3",
    from: "Casa Lopez",
    to: "Pool Comunitario",
    amount: 22.7,
    status: "pending",
    timestamp: "32 min ago",
  },
  {
    id: "t4",
    from: "Pool Comunitario",
    to: "Local Comercial B",
    amount: 45.0,
    status: "completed",
    timestamp: "1h ago",
  },
  {
    id: "t5",
    from: "Casa Rossi",
    to: "Pool Comunitario",
    amount: 6.3,
    status: "failed",
    timestamp: "2h ago",
  },
]

export const mockCooperatives: Cooperative[] = [
  {
    name: "Sol del Sur",
    location: "Buenos Aires, Argentina",
    members: 127,
    kwhShared: 342100,
    quote: "Reduced collective energy bill by 34% in Q1.",
  },
  {
    name: "Energia Limpa",
    location: "Sao Paulo, Brazil",
    members: 89,
    kwhShared: 215400,
    quote: "Simple and transparent P2P energy sharing.",
  },
  {
    name: "Green Valley",
    location: "Mendoza, Argentina",
    members: 45,
    kwhShared: 98700,
    quote: "45 members sharing surplus energy seamlessly.",
  },
]

export const mockWeeklyGeneration = [
  { day: "Mon", kwh: 18.2 },
  { day: "Tue", kwh: 22.5 },
  { day: "Wed", kwh: 15.8 },
  { day: "Thu", kwh: 28.1 },
  { day: "Fri", kwh: 24.3 },
  { day: "Sat", kwh: 31.2 },
  { day: "Sun", kwh: 26.7 },
]

export const mockDashboardStats = {
  balance: 847.3,
  generatedToday: 24.6,
  consumedToday: 12.1,
  sharedToday: 8.4,
  poolTotal: 2340,
  poolMembers: 127,
  poolYourShare: 15,
}

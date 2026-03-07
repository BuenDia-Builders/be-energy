"use client"

import { CooperativeAppProvider } from "@/components/cooperative/app-context"
import { CooperativeSidebar } from "@/components/cooperative/cooperative-sidebar"
import { CooperativeHeader } from "@/components/cooperative/cooperative-header"
import { CooperativeDashboardContent } from "@/components/cooperative/dashboard-content"

export default function CooperativasPage() {
  return (
    <CooperativeAppProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <CooperativeSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <CooperativeHeader />
          <CooperativeDashboardContent />
        </div>
      </div>
    </CooperativeAppProvider>
  )
}

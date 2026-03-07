"use client"

import { useCooperativeApp } from "./app-context"
import { Save } from "lucide-react"

export function Settings() {
  const { t } = useCooperativeApp()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">{t("settings")}</h1>
        <p className="text-muted-foreground text-sm">
          Manage your cooperative and account settings
        </p>
      </div>
      <div className="max-w-2xl space-y-6">
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Cooperative Information</h2>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Cooperative Name
            </label>
            <input
              type="text"
              defaultValue="Energy Cooperative #1"
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Location</label>
            <input
              type="text"
              defaultValue="San José, Costa Rica"
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Contact Email</label>
            <input
              type="email"
              defaultValue="admin@beenergy.coop"
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Grid Configuration</h2>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Voltage Threshold (V)
            </label>
            <input
              type="number"
              defaultValue="230"
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Frequency Alert (Hz)
            </label>
            <input
              type="number"
              defaultValue="50"
              step="0.1"
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Energy Market</h2>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Base Price ($/kWh)</label>
            <input
              type="number"
              defaultValue="0.12"
              step="0.01"
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">HDROP Mint Rate</label>
            <input
              type="number"
              defaultValue="1.0"
              step="0.1"
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm text-foreground">Email alerts for grid anomalies</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm text-foreground">Daily settlement summary</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-foreground">Prosumer activity notifications</span>
          </label>
        </div>
        <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </div>
    </div>
  )
}

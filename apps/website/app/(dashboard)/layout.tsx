"use client"

import { useState } from "react"
import { Show } from "@clerk/nextjs"
import { TopNavbar } from "@/components/top-navbar"
import { BottomNav } from "@/components/bottom-nav"
import { AddSubscriptionSheet } from "@/components/add-subscription-sheet"
import { PaymentMethodsSheet } from "@/components/payment-methods-sheet"
import { CommandPalette } from "@/components/command-palette"
import { LandingPage } from "@/components/landing-page"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false)

  return (
    <>
      <Show when="signed-in">
        <div className="min-h-screen bg-muted/20">
          {/* Slim Top Brand Bar */}
          <TopNavbar onSearchClick={() => setCmdPaletteOpen(true)} />

          {/* Main Content Area */}
          <div className="flex min-h-[calc(100vh-4rem)] flex-col">
            <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-32 sm:p-6 sm:pb-36 lg:p-8 lg:pb-40">
              {children}
            </main>
          </div>

          {/* Floating Dock Navigation (all viewports) */}
          <BottomNav onAddClick={() => setAddOpen(true)} />

          {/* Add Subscription Modal/Sheet */}
          <AddSubscriptionSheet open={addOpen} onOpenChange={setAddOpen} />

          {/* Card Vault / Payment Methods Sheet */}
          <PaymentMethodsSheet
            open={paymentMethodsOpen}
            onOpenChange={setPaymentMethodsOpen}
          />

          {/* Command Palette */}
          <CommandPalette
            open={cmdPaletteOpen}
            onOpenChange={setCmdPaletteOpen}
            onAddSubscription={() => setAddOpen(true)}
            onOpenPaymentMethods={() => setPaymentMethodsOpen(true)}
          />
        </div>
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  )
}

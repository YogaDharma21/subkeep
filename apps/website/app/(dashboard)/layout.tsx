"use client"

import { useState } from "react"
import Image from "next/image"
import { UserButton, Show } from "@clerk/nextjs"
import { Search } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopSidebar } from "@/components/desktop-sidebar"
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
          {/* Desktop Sidebar */}
          <DesktopSidebar
            onAddClick={() => setAddOpen(true)}
            onSearchClick={() => setCmdPaletteOpen(true)}
            onCardsClick={() => setPaymentMethodsOpen(true)}
          />

          {/* Mobile Top Header */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
            <div className="flex items-center gap-2">
              <Image
                src="/app-icon.png"
                alt="SubKeep"
                width={28}
                height={28}
                className="size-7 rounded-lg object-contain shadow-xs"
              />
              <h1 className="text-base font-bold text-foreground">SubKeep</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCmdPaletteOpen(true)}
                className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Search & Commands"
              >
                <Search className="size-4" />
              </button>
              <UserButton />
            </div>
          </header>

          {/* Main Content Area */}
          <div className="md:pl-64 lg:pl-72 flex flex-col min-h-screen">
            <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
              {children}
            </main>
          </div>

          {/* Mobile Bottom Navigation */}
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

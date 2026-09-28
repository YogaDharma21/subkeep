"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Show } from "@clerk/nextjs"
import { TopNavbar } from "@/components/top-navbar"
import { BottomNav } from "@/components/bottom-nav"
import { AddSubscriptionSheet } from "@/components/add-subscription-sheet"
import { AddTransactionSheet } from "@/components/add-transaction-sheet"
import { AddAccountSheet } from "@/components/add-account-sheet"
import { QuickAddSheet, QuickAddKind } from "@/components/quick-add-sheet"
import { PaymentMethodsSheet } from "@/components/payment-methods-sheet"
import { CommandPalette } from "@/components/command-palette"
import { LandingPage } from "@/components/landing-page"
import { useEffect } from "react"
import { OPEN_ADD_SUBSCRIPTION_EVENT } from "@/lib/add-subscription-event"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [addTxnOpen, setAddTxnOpen] = useState(false)
  const [addAccountOpen, setAddAccountOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const openAdd = () => setAddOpen(true)
    window.addEventListener(OPEN_ADD_SUBSCRIPTION_EVENT, openAdd)
    return () => window.removeEventListener(OPEN_ADD_SUBSCRIPTION_EVENT, openAdd)
  }, [])

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
          <BottomNav onAddClick={() => setQuickAddOpen(true)} />

          {/* Quick Add chooser */}
          <QuickAddSheet
            open={quickAddOpen}
            onOpenChange={setQuickAddOpen}
            onSelect={(kind: QuickAddKind) => {
              setQuickAddOpen(false)
              if (kind === "transaction") setAddTxnOpen(true)
              else if (kind === "subscription") setAddOpen(true)
              else if (kind === "account") setAddAccountOpen(true)
              else if (kind === "budget") router.push("/budgets")
            }}
          />

          {/* Add Subscription Modal/Sheet */}
          <AddSubscriptionSheet open={addOpen} onOpenChange={setAddOpen} />

          {/* Add Transaction Modal/Sheet */}
          <AddTransactionSheet open={addTxnOpen} onOpenChange={setAddTxnOpen} />

          {/* Add Account Modal/Sheet */}
          <AddAccountSheet open={addAccountOpen} onOpenChange={setAddAccountOpen} />

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
            onAddTransaction={() => setAddTxnOpen(true)}
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

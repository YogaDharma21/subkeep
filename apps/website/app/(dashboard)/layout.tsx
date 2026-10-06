"use client"

import { useState } from "react"
import { Show } from "@clerk/nextjs"
import { TopNavbar } from "@/components/top-navbar"
import { BottomNav } from "@/components/bottom-nav"
import { AddSubscriptionSheet } from "@/components/add-subscription-sheet"
import { AddTransactionSheet } from "@/components/add-transaction-sheet"
import { AddAccountSheet } from "@/components/add-account-sheet"
import { AddBudgetSheet } from "@/components/add-budget-sheet"
import { QuickAddSheet, QuickAddKind } from "@/components/quick-add-sheet"
import { PaymentMethodsSheet } from "@/components/payment-methods-sheet"
import { CommandPalette } from "@/components/command-palette"
import { LandingPage } from "@/components/landing-page"
import { AutoNotificationManager } from "@/components/auto-notification-manager"
import { useEffect } from "react"
import { OPEN_ADD_SUBSCRIPTION_EVENT } from "@/lib/add-subscription-event"
import { OPEN_ADD_BUDGET_EVENT } from "@/lib/add-budget-event"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [addTxnOpen, setAddTxnOpen] = useState(false)
  const [addAccountOpen, setAddAccountOpen] = useState(false)
  const [addBudgetOpen, setAddBudgetOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false)

  useEffect(() => {
    const openAdd = () => setAddOpen(true)
    const openBudget = () => setAddBudgetOpen(true)
    window.addEventListener(OPEN_ADD_SUBSCRIPTION_EVENT, openAdd)
    window.addEventListener(OPEN_ADD_BUDGET_EVENT, openBudget)
    return () => {
      window.removeEventListener(OPEN_ADD_SUBSCRIPTION_EVENT, openAdd)
      window.removeEventListener(OPEN_ADD_BUDGET_EVENT, openBudget)
    }
  }, [])

  return (
    <>
      <Show when="signed-in">
        <div className="min-h-screen bg-muted/20">
          {/* Slim Top Brand Bar */}
          <TopNavbar onSearchClick={() => setCmdPaletteOpen(true)} />
          <AutoNotificationManager />

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
              else if (kind === "budget") setAddBudgetOpen(true)
            }}
          />

          {/* Add Subscription Modal/Sheet */}
          <AddSubscriptionSheet open={addOpen} onOpenChange={setAddOpen} />

          {/* Add Transaction Modal/Sheet */}
          <AddTransactionSheet open={addTxnOpen} onOpenChange={setAddTxnOpen} />

          {/* Add Account Modal/Sheet */}
          <AddAccountSheet open={addAccountOpen} onOpenChange={setAddAccountOpen} />

          {/* Set Budget Modal/Sheet */}
          <AddBudgetSheet open={addBudgetOpen} onOpenChange={setAddBudgetOpen} />

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
            onAddBudget={() => setAddBudgetOpen(true)}
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

"use client"

import { useState } from "react"
import { UserButton, Show } from "@clerk/nextjs"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { AddSubscriptionSheet } from "@/components/add-subscription-sheet"
import { LandingPage } from "@/components/landing-page"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <>
      <Show when="signed-in">
        <div className="min-h-screen bg-muted/20">
          {/* Desktop Sidebar (hidden on mobile, fixed on desktop) */}
          <DesktopSidebar onAddClick={() => setAddOpen(true)} />

          {/* Mobile Top Header (hidden on desktop) */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
            <h1 className="text-lg font-bold">SubKeep</h1>
            <UserButton />
          </header>

          {/* Main Content Area */}
          <div className="md:pl-64 lg:pl-72 flex flex-col min-h-screen">
            <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
              {children}
            </main>
          </div>

          {/* Mobile Bottom Navigation (hidden on desktop) */}
          <BottomNav onAddClick={() => setAddOpen(true)} />

          {/* Add Subscription Modal/Sheet */}
          <AddSubscriptionSheet open={addOpen} onOpenChange={setAddOpen} />
        </div>
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  )
}


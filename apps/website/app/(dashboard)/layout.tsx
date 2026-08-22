"use client"

import { useState } from "react"
import { UserButton, Show } from "@clerk/nextjs"
import { BottomNav } from "@/components/bottom-nav"
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
        <div className="mx-auto min-h-screen max-w-[480px] bg-muted">
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background px-4 py-3">
            <h1 className="text-lg font-bold">SubKeep</h1>
            <UserButton />
          </header>

          <main className="pb-20">{children}</main>

          <BottomNav onAddClick={() => setAddOpen(true)} />

          <AddSubscriptionSheet open={addOpen} onOpenChange={setAddOpen} />
        </div>
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  )
}

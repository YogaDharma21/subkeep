"use client"

import { useState } from "react"
import { Settings } from "lucide-react"
import { UserButton, Show } from "@clerk/nextjs"
import { BottomNav } from "@/components/bottom-nav"
import { AddSubscriptionSheet } from "@/components/add-subscription-sheet"
import { SettingsSheet } from "@/components/settings-sheet"
import { Button } from "@/components/ui/button"
import { LandingPage } from "@/components/landing-page"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <Show when="signed-in">
        <div className="mx-auto min-h-screen max-w-[480px] bg-muted">
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background px-4 py-3">
            <h1 className="text-lg font-bold">SubKeep</h1>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="size-5" />
              </Button>
              <UserButton />
            </div>
          </header>

          <main className="pb-20">{children}</main>

          <BottomNav onAddClick={() => setAddOpen(true)} />

          <AddSubscriptionSheet open={addOpen} onOpenChange={setAddOpen} />
          <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  )
}

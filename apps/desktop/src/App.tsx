import { useState, useEffect } from "react"
import { useAuth, useClerk } from "@clerk/clerk-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { DesktopTitlebar } from "@/components/desktop-titlebar"
import { DesktopSidebar, DesktopView } from "@/components/desktop-sidebar"
import { DashboardView } from "@/components/dashboard-view"
import { CalendarGrid } from "@/components/calendar-grid"
import { StatsCharts } from "@/components/stats-charts"
import { SettingsView } from "@/components/settings-view"
import { SubscriptionDetailView } from "@/components/subscription-detail-view"
import { AddSubscriptionSheet } from "@/components/add-subscription-sheet"
import { PaymentMethodsSheet } from "@/components/payment-methods-sheet"
import { CommandPalette } from "@/components/command-palette"
import { LandingPage } from "@/components/landing-page"
import { Toaster } from "@/components/ui/sonner"
import { useTheme } from "@/components/theme-provider"

export function App() {
  const { isSignedIn, isLoaded } = useAuth()
  const clerk = useClerk()
  const { setTheme, resolvedTheme } = useTheme()
  const isElectron = !!window.electronAPI?.isElectron

  const [currentView, setCurrentView] = useState<DesktopView>("dashboard")
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null)
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  const subscriptions = useQuery(
    api.subscriptions.list,
    isSignedIn ? {} : "skip"
  )
  const payments = useQuery(
    api.payments.list,
    isSignedIn ? {} : "skip"
  )

  const activeSubsCount = subscriptions?.filter((s) => s.isActive !== false).length || 0

  // Browser redirect trigger when user finishes auth in external browser
  const handleOpenDesktop = async () => {
    try {
      const session = clerk.session
      const sessionId = session?.id
      const token = await session?.getToken()

      await fetch("http://127.0.0.1:49221/auth-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          token,
          __clerk_created_session_id: sessionId,
        }),
      })
    } catch (e) {
      console.warn("Failed to post token to desktop loopback:", e)
    }

    try {
      window.location.href = `subkeep://auth-callback${window.location.search}`
    } catch {}
  }

  useEffect(() => {
    if (!isElectron && isSignedIn) {
      handleOpenDesktop()
    }
  }, [isElectron, isSignedIn])

  // Keyboard shortcut listener for theme toggle ('D') and Command Palette ('Ctrl+K')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase()
      const isInput = activeTag === "input" || activeTag === "textarea" || activeTag === "select"

      if (!isInput && (e.key === "d" || e.key === "D")) {
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [resolvedTheme, setTheme])

  const handleNavigate = (view: DesktopView | string, subId?: string) => {
    if (view === "detail" && subId) {
      setSelectedSubId(subId)
      setCurrentView("detail")
    } else {
      setSelectedSubId(null)
      setCurrentView(view as DesktopView)
    }
  }

  const handleSelectSubscription = (id: string) => {
    setSelectedSubId(id)
    setCurrentView("detail")
  }

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col bg-background text-foreground items-center justify-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
        <p className="text-xs text-muted-foreground font-semibold">Loading SubKeep Desktop...</p>
      </div>
    )
  }

  // If opened in external browser after signing in, prompt user to Open Desktop App
  if (!isElectron && isSignedIn) {
    return (
      <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-zinc-800 selection:text-white select-none">
        <div className="w-full max-w-sm mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="size-20 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-xl">
            <svg viewBox="0 0 24 24" className="size-10 fill-black" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.2L20.8 7.3L12 12.4L3.2 7.3L12 2.2Z" />
              <path d="M2.5 9.1L11.3 14.2V21.8L2.5 16.7V9.1Z" />
              <path d="M12.7 14.2L21.5 9.1V16.7L12.7 21.8V14.2Z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Authentication Complete</h2>
            <p className="text-xs text-zinc-400">
              You are signed in! Click below if your browser did not automatically prompt you to open SubKeep.
            </p>
          </div>
          <button
            onClick={handleOpenDesktop}
            className="w-full h-12 rounded-full bg-white text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all shadow-xl cursor-pointer"
          >
            Open SubKeep Desktop
          </button>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="h-screen w-screen flex flex-col bg-black text-white overflow-hidden">
        <DesktopTitlebar isLanding />
        <main className="flex-1 overflow-y-auto flex items-center justify-center bg-black">
          <LandingPage />
        </main>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Frameless Top Window Bar */}
      <DesktopTitlebar
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onAddSubscription={() => setAddSheetOpen(true)}
      />

      {/* Main Workspace with Sidebar and Content View */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DesktopSidebar
          currentView={currentView}
          onNavigate={(v) => handleNavigate(v)}
          onAddSubscription={() => setAddSheetOpen(true)}
          onOpenPaymentMethods={() => setPaymentSheetOpen(true)}
          activeSubCount={activeSubsCount}
        />

        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 bg-background">
          {currentView === "dashboard" && (
            <DashboardView
              onSelectSubscription={handleSelectSubscription}
              onAddSubscription={() => setAddSheetOpen(true)}
            />
          )}

          {currentView === "calendar" && (
            <div className="space-y-4 max-w-5xl mx-auto pb-12">
              <div>
                <h1 className="text-xl font-extrabold text-foreground">Billing Calendar</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  View scheduled renewal dates, free trial deadlines, and subscription start milestones.
                </p>
              </div>
              <CalendarGrid
                subscriptions={subscriptions || []}
                onSelectSubscription={handleSelectSubscription}
              />
            </div>
          )}

          {currentView === "stats" && (
            <div className="space-y-4 max-w-5xl mx-auto pb-12">
              <div>
                <h1 className="text-xl font-extrabold text-foreground">Spending Analytics</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Analyze your recurring spending trends, category breakdown, and payment history.
                </p>
              </div>
              <StatsCharts
                subscriptions={subscriptions || []}
                payments={payments || []}
              />
            </div>
          )}

          {currentView === "settings" && (
            <SettingsView
              onOpenPaymentMethods={() => setPaymentSheetOpen(true)}
            />
          )}

          {currentView === "detail" && selectedSubId && (
            <SubscriptionDetailView
              subscriptionId={selectedSubId}
              onBack={() => setCurrentView("dashboard")}
              onSelectSubscription={handleSelectSubscription}
            />
          )}
        </main>
      </div>

      {/* Global Add Subscription Sheet */}
      <AddSubscriptionSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
      />

      {/* Global Payment Methods / Card Vault Sheet */}
      <PaymentMethodsSheet
        open={paymentSheetOpen}
        onOpenChange={setPaymentSheetOpen}
      />

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNavigate={handleNavigate}
        onAddSubscription={() => setAddSheetOpen(true)}
        onOpenPaymentMethods={() => setPaymentSheetOpen(true)}
      />

      {/* Global Toast Notifications */}
      <Toaster />
    </div>
  )
}

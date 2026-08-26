import { useState, useEffect } from "react"
import { useAuth } from "@clerk/clerk-react"
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
import { DesktopCallbackPage } from "@/components/desktop-callback-page"
import { Toaster } from "@/components/ui/sonner"
import { useTheme } from "@/components/theme-provider"

export function App() {
  const { isSignedIn, isLoaded } = useAuth()
  const { setTheme, resolvedTheme } = useTheme()

  const isElectron =
    typeof window !== "undefined" &&
    (!!window.electronAPI?.isElectron ||
      (typeof navigator !== "undefined" &&
        navigator.userAgent.toLowerCase().includes(" electron/")))

  const isCallbackRoute =
    typeof window !== "undefined" &&
    (window.location.pathname.startsWith("/auth/desktop-callback") ||
      window.location.pathname.startsWith("/desktop-callback") ||
      window.location.pathname.includes("callback"))

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

  // Only render the browser handoff page if specifically navigating to the callback route in an external browser
  if (!isElectron && isCallbackRoute) {
    return <DesktopCallbackPage />
  }

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col bg-background text-foreground items-center justify-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
        <p className="text-xs text-muted-foreground font-semibold">Loading SubKeep Desktop...</p>
      </div>
    )
  }

  // When not signed in, show the sleek Landing Page with single Google sign-in action
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

  // When user is signed in inside Electron, render the full desktop workspace
  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Frameless Top Window Bar */}
      <DesktopTitlebar
        activeSubCount={activeSubsCount}
        totalSubCount={subscriptions?.length || 0}
        currentView={currentView}
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

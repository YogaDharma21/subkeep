import { useState } from "react"
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Plus,
  Globe,
  LogOut,
  Search,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  Repeat,
  ChevronDown,
} from "lucide-react"
import { UserButton, useUser, useClerk } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { cn } from "@/lib/utils"

export type DesktopView = "dashboard" | "transactions" | "subscriptions" | "budgets" | "accounts" | "calendar" | "stats" | "settings" | "detail"

interface DesktopSidebarProps {
  currentView: DesktopView
  onNavigate: (view: DesktopView) => void
  onAddSubscription: () => void
  onAddTransaction: () => void
  onAddAccount: () => void
  onAddBudget: () => void
  onSearchClick?: () => void
  activeSubCount?: number
}

export function DesktopSidebar({
  currentView,
  onNavigate,
  onAddSubscription,
  onAddTransaction,
  onAddAccount,
  onAddBudget,
  onSearchClick,
  activeSubCount = 0,
}: DesktopSidebarProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { primaryCurrency } = usePrimaryCurrency()
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const isMac =
    (typeof window !== "undefined" && window.electronAPI?.platform === "darwin") ||
    (typeof navigator !== "undefined" &&
      navigator.userAgent.toLowerCase().includes("mac") &&
      !navigator.userAgent.toLowerCase().includes("win"))

  const navGroups: Array<{
    id: string
    label: string
    icon: typeof LayoutDashboard
    target: DesktopView
    views: DesktopView[]
    badge?: number
    children?: Array<{ id: DesktopView; label: string }>
  }> = [
    {
      id: "home",
      label: "Home",
      icon: LayoutDashboard,
      target: "dashboard",
      views: ["dashboard"],
    },
    {
      id: "money",
      label: "Money",
      icon: Wallet,
      target: "transactions",
      views: ["transactions", "accounts"],
      children: [
        { id: "transactions", label: "Transactions" },
        { id: "accounts", label: "Accounts" },
      ],
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      icon: Repeat,
      target: "subscriptions",
      views: ["subscriptions", "calendar", "detail"],
      badge: activeSubCount > 0 ? activeSubCount : undefined,
      children: [
        { id: "subscriptions", label: "Tracker" },
        { id: "calendar", label: "Calendar" },
      ],
    },
    {
      id: "insights",
      label: "Insights",
      icon: BarChart3,
      target: "stats",
      views: ["stats", "budgets"],
      children: [
        { id: "stats", label: "Analytics" },
        { id: "budgets", label: "Budgets" },
      ],
    },
  ]

  const normalizedView = currentView === "detail" ? "subscriptions" : currentView

  const addOptions = [
    { label: "Transaction", icon: ArrowLeftRight, onClick: onAddTransaction },
    { label: "Subscription", icon: Repeat, onClick: onAddSubscription },
    { label: "Account", icon: Wallet, onClick: onAddAccount },
    { label: "Budget", icon: PiggyBank, onClick: onAddBudget },
  ]

  return (
    <aside className="w-60 border-r border-border bg-background/60 flex flex-col justify-between p-3 shrink-0 select-none">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="relative">
            <Button
              onClick={() => setAddMenuOpen((open) => !open)}
              className="h-10 w-full justify-between gap-2 rounded-full text-xs font-medium shadow-none cursor-pointer"
              aria-expanded={addMenuOpen}
            >
              <span className="flex items-center gap-2">
                <Plus className="size-4" />
                Add New
              </span>
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  addMenuOpen && "rotate-180"
                )}
              />
            </Button>

            {addMenuOpen ? (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAddMenuOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-border bg-popover p-1 shadow-2xl">
                  {addOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.label}
                        onClick={() => {
                          setAddMenuOpen(false)
                          option.onClick()
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] cursor-pointer"
                      >
                        <Icon className="size-4 text-muted-foreground" />
                        <span>{option.label}</span>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : null}
          </div>

          <button
            onClick={onSearchClick}
            className="flex w-full items-center justify-between rounded-full border border-border bg-[color-mix(in_oklab,var(--foreground)_3%,transparent)] px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="size-3.5" />
              <span>Search & Commands...</span>
            </div>
            <kbd className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono">
              {isMac ? "⌘K" : "Ctrl+K"}
            </kbd>
          </button>
        </div>

        <nav className="space-y-1">
          <p className="label px-2 pb-1.5">
            Navigation
          </p>
          {navGroups.map((group) => {
            const Icon = group.icon
            const isActive = group.views.includes(currentView)
            return (
              <div key={group.id}>
                <button
                  onClick={() => onNavigate(group.target)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-full px-3 py-2 text-xs font-medium transition-all cursor-pointer",
                    isActive
                      ? "bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] text-foreground"
                      : "text-muted-foreground hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="size-4" />
                    <span>{group.label}</span>
                  </div>
                  {group.badge !== undefined && (
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        isActive
                          ? "bg-background text-foreground border-border"
                          : "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {group.badge}
                    </span>
                  )}
                </button>

                {isActive && group.children ? (
                  <div className="ml-5 mt-1 space-y-0.5 border-l border-border pl-2">
                    {group.children.map((child) => {
                      const isChildActive = normalizedView === child.id
                      return (
                        <button
                          key={child.id}
                          onClick={() => onNavigate(child.id)}
                          className={cn(
                            "w-full rounded-full px-2.5 py-1.5 text-left text-[11px] font-medium transition-colors cursor-pointer",
                            isChildActive
                              ? "bg-foreground text-background"
                              : "text-muted-foreground hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] hover:text-foreground"
                          )}
                        >
                          {child.label}
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Footer: User profile & Active Currency */}
      <div className="space-y-3 pt-3 border-t border-border/60">
        <div className="flex items-center justify-between surface-inset px-3 py-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Globe className="size-3.5" />
            <span className="text-[11px] font-medium">Currency:</span>
          </div>
          <span className="numeral text-[11px] font-medium uppercase text-foreground">
            {primaryCurrency}
          </span>
        </div>

        <div className="surface-inset flex items-center gap-2.5 p-2">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-7",
              },
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "User"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {user?.primaryEmailAddress?.emailAddress || ""}
            </p>
          </div>
          <button
            onClick={() => onNavigate("settings")}
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer",
              currentView === "settings"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title="Settings & Backup"
          >
            <Settings className="size-3.5" />
          </button>
          <button
            onClick={() => signOut()}
            className="flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer shrink-0"
            title="Log Out"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}

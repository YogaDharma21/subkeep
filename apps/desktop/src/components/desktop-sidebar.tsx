import {
  LayoutDashboard,
  Calendar,
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
  onAddBudget: () => void
  onSearchClick?: () => void
  activeSubCount?: number
}

export function DesktopSidebar({
  currentView,
  onNavigate,
  onAddSubscription,
  onAddTransaction,
  onAddBudget,
  onSearchClick,
  activeSubCount = 0,
}: DesktopSidebarProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { primaryCurrency } = usePrimaryCurrency()
  const isMac =
    (typeof window !== "undefined" && window.electronAPI?.platform === "darwin") ||
    (typeof navigator !== "undefined" &&
      navigator.userAgent.toLowerCase().includes("mac") &&
      !navigator.userAgent.toLowerCase().includes("win"))

  const navItems = [
    {
      id: "dashboard" as DesktopView,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "transactions" as DesktopView,
      label: "Transactions",
      icon: ArrowLeftRight,
    },
    {
      id: "subscriptions" as DesktopView,
      label: "Subscriptions",
      icon: Repeat,
      badge: activeSubCount > 0 ? activeSubCount : undefined,
    },
    {
      id: "budgets" as DesktopView,
      label: "Budgets",
      icon: PiggyBank,
    },
    {
      id: "accounts" as DesktopView,
      label: "Accounts",
      icon: Wallet,
    },
    {
      id: "calendar" as DesktopView,
      label: "Calendar",
      icon: Calendar,
    },
    {
      id: "stats" as DesktopView,
      label: "Analytics",
      icon: BarChart3,
    },
    {
      id: "settings" as DesktopView,
      label: "Settings & Backup",
      icon: Settings,
    },
  ]

  return (
    <aside className="w-60 border-r border-border bg-sidebar/50 backdrop-blur-xs flex flex-col justify-between p-3 shrink-0 select-none">
      <div className="space-y-4">
        {/* Quick Add Buttons & Search & Commands */}
        <div className="space-y-2">
          <Button
            onClick={onAddTransaction}
            className="w-full gap-2 font-bold text-xs h-9 shadow-xs cursor-pointer"
          >
            <Plus className="size-4" />
            Add Transaction
          </Button>

          <Button
            onClick={onAddSubscription}
            variant="outline"
            className="w-full gap-2 font-bold text-xs h-9 shadow-xs cursor-pointer"
          >
            <Plus className="size-4" />
            Add Subscription
          </Button>

          <Button
            onClick={onAddBudget}
            variant="outline"
            className="w-full gap-2 font-bold text-xs h-9 shadow-xs cursor-pointer"
          >
            <Plus className="size-4" />
            Set Budget
          </Button>

          <button
            onClick={onSearchClick}
            className="flex w-full items-center justify-between rounded-full border border-white/[0.08] bg-muted/30 px-3.5 py-2 text-xs text-muted-foreground transition-all hover:border-violet-500/40 hover:bg-muted/60 hover:text-foreground cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="size-3.5" />
              <span>Search & Commands...</span>
            </div>
            <kbd className="rounded-full border border-white/[0.08] bg-background/80 px-2 py-0.5 text-[10px] font-mono">
              {isMac ? "⌘K" : "Ctrl+K"}
            </kbd>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer",
                  isActive
                    ? "bg-gradient-to-r from-violet-500/20 to-indigo-500/20 text-violet-300 border border-violet-500/30 shadow-xs shadow-violet-500/10"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold",
                      isActive
                        ? "bg-violet-500/30 text-violet-200 border border-violet-400/30"
                        : "bg-muted text-muted-foreground border border-border/80"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer: User profile & Active Currency */}
      <div className="space-y-3 pt-3 border-t border-border/60">
        <div className="flex items-center justify-between px-2 py-1 bg-muted/40 rounded-lg border border-border/60 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Globe className="size-3.5" />
            <span className="text-[11px] font-medium">Currency:</span>
          </div>
          <span className="font-bold text-foreground text-[11px] uppercase">
            {primaryCurrency}
          </span>
        </div>

        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-card border border-border shadow-2xs">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-7",
              },
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "User"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {user?.primaryEmailAddress?.emailAddress || ""}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="size-7 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer shrink-0"
            title="Log Out"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}

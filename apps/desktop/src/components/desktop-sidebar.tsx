import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  CreditCard,
  Settings,
  Plus,
  Globe,
  LogOut,
} from "lucide-react"
import { UserButton, useUser, useClerk } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { cn } from "@/lib/utils"

export type DesktopView = "dashboard" | "calendar" | "stats" | "settings" | "detail"

interface DesktopSidebarProps {
  currentView: DesktopView
  onNavigate: (view: DesktopView) => void
  onAddSubscription: () => void
  onOpenPaymentMethods: () => void
  activeSubCount?: number
}

export function DesktopSidebar({
  currentView,
  onNavigate,
  onAddSubscription,
  onOpenPaymentMethods,
  activeSubCount = 0,
}: DesktopSidebarProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { primaryCurrency } = usePrimaryCurrency()

  const navItems = [
    {
      id: "dashboard" as DesktopView,
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: activeSubCount > 0 ? activeSubCount : undefined,
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
        {/* Quick Add Button */}
        <Button
          onClick={onAddSubscription}
          className="w-full gap-2 font-bold text-xs h-9 shadow-xs cursor-pointer"
        >
          <Plus className="size-4" />
          Add Subscription
        </Button>

        {/* Navigation List */}
        <nav className="space-y-1">
          <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
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
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  isActive
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-md text-[10px] font-bold",
                      isActive
                        ? "bg-background/20 text-background"
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

        {/* Secondary Quick Access */}
        <div className="space-y-1 pt-2 border-t border-border/60">
          <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Tools & Vault
          </p>
          <button
            onClick={onOpenPaymentMethods}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all cursor-pointer"
          >
            <CreditCard className="size-4 text-primary" />
            <span>Card Vault</span>
          </button>
        </div>
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

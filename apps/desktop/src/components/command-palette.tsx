import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/clerk-react"
import { api } from "@/convex/_generated/api"
import { useTheme } from "@/components/theme-provider"
import {
  Search,
  Plus,
  Calendar,
  BarChart3,
  Settings,
  CreditCard,
  Moon,
  Sun,
  Globe,
  ArrowRight,
  Sparkles,
  X,
  LayoutDashboard,
} from "lucide-react"
import { DynamicIcon } from "@/components/dynamic-icon"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { convertAndFormat } from "@/lib/currency"
import { currencies } from "@/lib/constants"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (view: string, subId?: string) => void
  onAddSubscription?: () => void
  onOpenPaymentMethods?: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  onAddSubscription,
  onOpenPaymentMethods,
}: CommandPaletteProps) {
  const { isSignedIn } = useAuth()
  const { setTheme, resolvedTheme } = useTheme()
  const { primaryCurrency, setPrimaryCurrency, rates } = usePrimaryCurrency()
  const subscriptions = useQuery(
    api.subscriptions.list,
    isSignedIn ? {} : "skip"
  )

  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input smoothly on open
  useEffect(() => {
    if (open) {
      const timer = requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
      return () => cancelAnimationFrame(timer)
    }
  }, [open])

  // Global keyboard shortcut listener for Cmd+K / Ctrl+K & Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onOpenChange(!open)
      } else if (open && e.key === "Escape") {
        e.preventDefault()
        onOpenChange(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  // Filter subscriptions
  const filteredSubs = useMemo(() => {
    if (!subscriptions) return []
    const q = query.trim().toLowerCase()
    if (!q) return subscriptions.slice(0, 5)
    return subscriptions
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.account && s.account.toLowerCase().includes(q))
      )
      .slice(0, 6)
  }, [subscriptions, query])

  // Quick Navigation & Feature Actions
  const quickActions = useMemo(() => {
    const q = query.trim().toLowerCase()
    const actions = [
      {
        id: "add",
        label: "Add New Subscription",
        detail: "Create a custom or template subscription",
        icon: Plus,
        category: "Actions",
        run: () => {
          onOpenChange(false)
          onAddSubscription?.()
        },
      },
      {
        id: "cards",
        label: "Manage Payment Methods & Cards",
        detail: "View credit cards, spend breakdown & expiry",
        icon: CreditCard,
        category: "Actions",
        run: () => {
          onOpenChange(false)
          onOpenPaymentMethods?.()
        },
      },
      {
        id: "nav-dashboard",
        label: "Go to Dashboard",
        detail: "View active subscriptions and spending summary",
        icon: LayoutDashboard,
        category: "Navigation",
        run: () => {
          onOpenChange(false)
          onNavigate("dashboard")
        },
      },
      {
        id: "nav-calendar",
        label: "Go to Calendar",
        detail: "View billing projections and renewal dates",
        icon: Calendar,
        category: "Navigation",
        run: () => {
          onOpenChange(false)
          onNavigate("calendar")
        },
      },
      {
        id: "nav-stats",
        label: "Go to Spending Analytics",
        detail: "View charts, category breakdown & insights",
        icon: BarChart3,
        category: "Navigation",
        run: () => {
          onOpenChange(false)
          onNavigate("stats")
        },
      },
      {
        id: "nav-more",
        label: "Settings & Backup",
        detail: "Export, restore, currency & preferences",
        icon: Settings,
        category: "Navigation",
        run: () => {
          onOpenChange(false)
          onNavigate("settings")
        },
      },
      {
        id: "theme",
        label: `Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} Mode`,
        detail: "Toggle appearance theme",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        category: "Preferences",
        run: () => {
          setTheme(resolvedTheme === "dark" ? "light" : "dark")
          onOpenChange(false)
        },
      },
    ]

    if (!q) return actions
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.detail.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    )
  }, [
    query,
    resolvedTheme,
    setTheme,
    onNavigate,
    onOpenChange,
    onAddSubscription,
    onOpenPaymentMethods,
  ])

  // Currency search shortcuts
  const currencyActions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (
      !q.startsWith("curr") &&
      !q.startsWith("curr:") &&
      !q.includes("usd") &&
      !q.includes("eur") &&
      !q.includes("idr") &&
      !q.includes("gbp")
    ) {
      return []
    }
    return currencies
      .filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.value.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((c) => ({
        id: `currency-${c.value}`,
        label: `Set Primary Currency to ${c.label}`,
        detail: `Convert all totals to ${c.value}`,
        icon: Globe,
        category: "Currency",
        run: () => {
          setPrimaryCurrency(c.value)
          onOpenChange(false)
        },
      }))
  }, [query, setPrimaryCurrency, onOpenChange])

  // Combined flat list for keyboard arrow navigation
  const allItems = useMemo(() => {
    const items: Array<{
      id: string
      type: "sub" | "action" | "currency"
      action: () => void
    }> = []

    filteredSubs.forEach((sub) => {
      items.push({
        id: sub._id,
        type: "sub",
        action: () => {
          onOpenChange(false)
          onNavigate("detail", sub._id)
        },
      })
    })

    quickActions.forEach((qa) => {
      items.push({
        id: qa.id,
        type: "action",
        action: qa.run,
      })
    })

    currencyActions.forEach((ca) => {
      items.push({
        id: ca.id,
        type: "currency",
        action: ca.run,
      })
    })

    return items
  }, [filteredSubs, quickActions, currencyActions, onNavigate, onOpenChange])

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev <= 0 ? (allItems.length || 1) - 1 : prev - 1
        )
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (allItems[selectedIndex]) {
          allItems[selectedIndex].action()
        }
      }
    },
    [allItems, selectedIndex]
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[10vh] sm:pt-[12vh] transition-opacity duration-150 animate-in fade-in"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl transform-gpu transition-transform duration-150 animate-in zoom-in-98"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a subscription, command, or currency..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleInputKeyDown}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("")
                setSelectedIndex(0)
              }}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results Scrollable Area */}
        <div className="max-h-[55vh] overflow-y-auto p-2 space-y-3">
          {/* Subscriptions Section */}
          {filteredSubs.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Subscriptions ({filteredSubs.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredSubs.map((sub, idx) => {
                  const isSelected = selectedIndex === idx
                  return (
                    <button
                      key={sub._id}
                      onClick={() => {
                        onOpenChange(false)
                        onNavigate("detail", sub._id)
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors group cursor-pointer ${
                        isSelected ? "bg-muted text-foreground" : "hover:bg-muted/60"
                      }`}
                    >
                      <div
                        className="flex size-7 shrink-0 items-center justify-center rounded-md"
                        style={{ backgroundColor: sub.color }}
                      >
                        <DynamicIcon
                          name={sub.icon}
                          className="size-3.5 text-white"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {sub.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          <span className="capitalize">{sub.category}</span> ·
                          Next: {sub.nextBilling}
                          {sub.account && ` · ${sub.account}`}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-foreground">
                          {convertAndFormat(
                            sub.price,
                            sub.currency,
                            primaryCurrency,
                            rates
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          /{sub.cycle}
                        </div>
                      </div>
                      <ArrowRight
                        className={`size-3.5 text-muted-foreground transition-opacity ${
                          isSelected
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick Actions Section */}
          {quickActions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Actions & Navigation
              </div>
              <div className="space-y-1 mt-1">
                {quickActions.map((action, actionIdx) => {
                  const globalIdx = filteredSubs.length + actionIdx
                  const isSelected = selectedIndex === globalIdx
                  const Icon = action.icon
                  return (
                    <button
                      key={action.id}
                      onClick={action.run}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors group cursor-pointer ${
                        isSelected ? "bg-muted text-foreground" : "hover:bg-muted/60"
                      }`}
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                        <Icon className="size-3.5 text-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground">
                          {action.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {action.detail}
                        </div>
                      </div>
                      <ArrowRight
                        className={`size-3.5 text-muted-foreground transition-opacity ${
                          isSelected
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Currency Actions Section */}
          {currencyActions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Currency Conversion
              </div>
              <div className="space-y-1 mt-1">
                {currencyActions.map((action, cIdx) => {
                  const globalIdx =
                    filteredSubs.length + quickActions.length + cIdx
                  const isSelected = selectedIndex === globalIdx
                  return (
                    <button
                      key={action.id}
                      onClick={action.run}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors group cursor-pointer ${
                        isSelected ? "bg-muted text-foreground" : "hover:bg-muted/60"
                      }`}
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                        <Globe className="size-3.5 text-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground">
                          {action.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {action.detail}
                        </div>
                      </div>
                      <ArrowRight
                        className={`size-3.5 text-muted-foreground transition-opacity ${
                          isSelected
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {filteredSubs.length === 0 && quickActions.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching subscriptions or actions found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Keyboard navigation hints footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Navigate:</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono border border-border">
              ↑
            </kbd>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono border border-border">
              ↓
            </kbd>
            <span>Open:</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono border border-border">
              ↵
            </kbd>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="size-3 text-primary" />
            <span>SubKeep Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  )
}

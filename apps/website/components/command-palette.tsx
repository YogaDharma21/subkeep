"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { useTheme } from "next-themes"
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
} from "lucide-react"
import { DynamicIcon } from "@/components/dynamic-icon"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { convertAndFormat } from "@/lib/currency"
import { currencies } from "@/lib/constants"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddSubscription?: () => void
  onOpenPaymentMethods?: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
  onAddSubscription,
  onOpenPaymentMethods,
}: CommandPaletteProps) {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { setTheme, resolvedTheme } = useTheme()
  const { primaryCurrency, setPrimaryCurrency, rates } = usePrimaryCurrency()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")

  const [query, setQuery] = useState("")

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
      if (open && e.key === "Escape") {
        onOpenChange(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])


  // Filter subscriptions and actions
  const filteredSubs = useMemo(() => {
    if (!subscriptions) return []
    const q = query.trim().toLowerCase()
    if (!q) return subscriptions.slice(0, 5)
    return subscriptions.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.account && s.account.toLowerCase().includes(q))
    )
  }, [subscriptions, query])

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
        id: "nav-calendar",
        label: "Go to Calendar",
        detail: "View billing projections and renewal dates",
        icon: Calendar,
        category: "Navigation",
        run: () => {
          onOpenChange(false)
          router.push("/calendar")
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
          router.push("/stats")
        },
      },
      {
        id: "nav-more",
        label: "Settings",
        detail: "Export, restore, currency & preferences",
        icon: Settings,
        category: "Navigation",
        run: () => {
          onOpenChange(false)
          router.push("/more")
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
  }, [query, resolvedTheme, setTheme, router, onOpenChange, onAddSubscription, onOpenPaymentMethods])

  const currencyActions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q.startsWith("curr") && !q.startsWith("curr:") && !q.includes("usd") && !q.includes("eur") && !q.includes("idr") && !q.includes("gbp")) {
      return []
    }
    return currencies
      .filter((c) => c.label.toLowerCase().includes(q) || c.value.toLowerCase().includes(q))
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

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-xs animate-in fade-in-0"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a subscription, command, or currency..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
          {/* Subscriptions section */}
          {filteredSubs.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Subscriptions ({filteredSubs.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredSubs.map((sub) => (
                  <button
                    key={sub._id}
                    onClick={() => {
                      onOpenChange(false)
                      router.push(`/subscriptions/${sub._id}`)
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/70 group cursor-pointer"
                  >
                    <div
                      className="flex size-7 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: sub.color }}
                    >
                      <DynamicIcon name={sub.icon} className="size-3.5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {sub.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        <span className="capitalize">{sub.category}</span> · Next: {sub.nextBilling}
                        {sub.account && ` · ${sub.account}`}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-foreground">
                        {convertAndFormat(sub.price, sub.currency, primaryCurrency, rates)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        /{sub.cycle}
                      </div>
                    </div>
                    <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions section */}
          {quickActions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Actions & Navigation
              </div>
              <div className="space-y-1 mt-1">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.id}
                      onClick={action.run}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/70 group cursor-pointer"
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
                      <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Currency Actions section */}
          {currencyActions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Currency Conversion
              </div>
              <div className="space-y-1 mt-1">
                {currencyActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={action.run}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/70 group cursor-pointer"
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
                    <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredSubs.length === 0 && quickActions.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching subscriptions or actions found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono border border-border">↑</kbd>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono border border-border">↓</kbd>
            <span>Open:</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono border border-border">↵</kbd>
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

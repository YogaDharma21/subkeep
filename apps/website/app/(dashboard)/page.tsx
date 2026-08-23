"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import {
  ArrowUpDown,
  ChevronDown,
  Clock,
  Globe,
  Sparkles,
  Target,
  AlertTriangle,
} from "lucide-react"
import { SubscriptionCard } from "@/components/subscription-card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  convertCurrency,
  formatCurrencyAmount,
} from "@/lib/currency"
import { currencies } from "@/lib/constants"
import { UpcomingReminders } from "@/components/upcoming-reminders"
import { SmartInsights } from "@/components/smart-insights"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { differenceInDays } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export type FilterType = "all" | "due_soon" | "trial" | "regular"

export type SortOption =
  | "billing-asc"
  | "billing-desc"
  | "price-asc"
  | "price-desc"
  | "start-desc"
  | "name-asc"

export default function HomePage() {
  const { isSignedIn } = useAuth()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const userSettings = useQuery(api.userSettings.get, isSignedIn ? {} : "skip")
  const suspendMutation = useMutation(api.subscriptions.suspend)

  const { primaryCurrency, setPrimaryCurrency, rates } = usePrimaryCurrency()
  const [filter, setFilter] = useState<FilterType>("all")
  const [sortBy, setSortBy] = useState<SortOption>("billing-asc")

  const handleCurrencyChange = async (newCurr: string) => {
    await setPrimaryCurrency(newCurr)
    toast.success(`Primary currency set to ${newCurr}`)
  }

  const handleMarkCanceled = async (id: string) => {
    try {
      await suspendMutation({ id: id as never })
      toast.success("Subscription status updated")
    } catch {
      toast.error("Failed to update status")
    }
  }

  // Multi-Currency Converted Monthly & Yearly Totals
  const { count, monthlyTotalConverted, yearlyTotalConverted } = useMemo(() => {
    if (!subscriptions) return { count: 0, monthlyTotalConverted: 0, yearlyTotalConverted: 0 }

    const activeSubs = subscriptions.filter((s) => s.isActive)
    const count = activeSubs.length

    const monthlyTotalConverted = activeSubs.reduce((sum, s) => {
      const cycle = (s.cycle || "monthly").toLowerCase()
      let nativeMonthly = s.price
      if (cycle === "quarterly") nativeMonthly = s.price / 3
      else if (cycle === "semi-annual") nativeMonthly = s.price / 6
      else if (cycle === "yearly") nativeMonthly = s.price / 12
      else if (cycle === "weekly") nativeMonthly = s.price * 4.33
      else if (cycle === "daily") nativeMonthly = s.price * 30
      else if (cycle === "none") nativeMonthly = 0

      const converted = convertCurrency(nativeMonthly, s.currency, primaryCurrency, rates)
      return sum + converted
    }, 0)

    const yearlyTotalConverted = monthlyTotalConverted * 12

    return { count, monthlyTotalConverted, yearlyTotalConverted }
  }, [subscriptions, primaryCurrency, rates])

  // Budget calculations
  const budgetCap = userSettings?.monthlyBudgetCap
  const budgetUsedPct = budgetCap && budgetCap > 0 ? Math.round((monthlyTotalConverted / budgetCap) * 100) : null
  const isBudgetExceeded = budgetCap && monthlyTotalConverted > budgetCap

  // Filtered and Sorted Subscriptions
  const filteredSubs = useMemo(() => {
    if (!subscriptions) return []
    let list = [...subscriptions]

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Filter logic
    if (filter === "trial") {
      list = list.filter((s) => s.isTrial)
    } else if (filter === "regular") {
      list = list.filter((s) => !s.isTrial)
    } else if (filter === "due_soon") {
      list = list.filter((s) => {
        const dateStr = s.isTrial && s.trialEndDate ? s.trialEndDate : s.nextBilling
        if (!dateStr) return false
        const targetDate = new Date(dateStr)
        targetDate.setHours(0, 0, 0, 0)
        const diffDays = differenceInDays(targetDate, today)
        return diffDays >= 0 && diffDays <= 7
      })
    }

    // Sort logic
    return list.sort((a, b) => {
      switch (sortBy) {
        case "billing-asc": {
          const dateA = new Date(a.isTrial && a.trialEndDate ? a.trialEndDate : a.nextBilling || "9999-12-31").getTime()
          const dateB = new Date(b.isTrial && b.trialEndDate ? b.trialEndDate : b.nextBilling || "9999-12-31").getTime()
          return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB)
        }
        case "billing-desc": {
          const dateA = new Date(a.isTrial && a.trialEndDate ? a.trialEndDate : a.nextBilling || "1970-01-01").getTime()
          const dateB = new Date(b.isTrial && b.trialEndDate ? b.trialEndDate : b.nextBilling || "1970-01-01").getTime()
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA)
        }
        case "start-desc": {
          const dateA = new Date(a.startDate || "1970-01-01").getTime()
          const dateB = new Date(b.startDate || "1970-01-01").getTime()
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA)
        }
        case "price-asc": {
          const pA = convertCurrency(a.price, a.currency, primaryCurrency, rates)
          const pB = convertCurrency(b.price, b.currency, primaryCurrency, rates)
          return pA - pB
        }
        case "price-desc": {
          const pA = convertCurrency(a.price, a.currency, primaryCurrency, rates)
          const pB = convertCurrency(b.price, b.currency, primaryCurrency, rates)
          return pB - pA
        }
        case "name-asc":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })
  }, [subscriptions, filter, sortBy, primaryCurrency, rates])

  const getEmptyMessage = () => {
    switch (filter) {
      case "due_soon":
        return {
          title: "No subscriptions due in the next 7 days",
          subtitle: "All your upcoming payments are further out",
        }
      case "trial":
        return {
          title: "No active trial subscriptions",
          subtitle: "Tap + to add a free trial subscription",
        }
      case "regular":
        return {
          title: "No regular subscriptions found",
          subtitle: "Only trial subscriptions are currently added",
        }
      default:
        return {
          title: "No subscriptions yet",
          subtitle: "Tap + to add your first subscription",
        }
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Dynamic Summary Banner with Currency Converter */}
      <div className="rounded-lg border border-border bg-background p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Globe className="size-3.5 text-primary" />
            <span>Primary Currency Summary</span>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={primaryCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="h-7 rounded-lg border border-border bg-muted/50 px-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {currencies.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {subscriptions ? (
          <div className="grid grid-cols-3 divide-x divide-border/60 text-center items-center">
            <div className="flex flex-col items-center gap-0.5 px-2">
              <span className="text-xl sm:text-2xl font-extrabold text-foreground">{count}</span>
              <span className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Active Subs
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-0 px-2">
              <span className="text-base sm:text-lg font-extrabold text-foreground truncate max-w-full">
                {formatCurrencyAmount(monthlyTotalConverted, primaryCurrency)}
              </span>
              <span className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground font-medium truncate">
                Per Month ({primaryCurrency})
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-0 px-2">
              <span className="text-base sm:text-lg font-extrabold text-foreground truncate max-w-full">
                {formatCurrencyAmount(yearlyTotalConverted, primaryCurrency)}
              </span>
              <span className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground font-medium truncate">
                Per Year ({primaryCurrency})
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {/* Monthly Budget Cap Meter */}
        {budgetCap && budgetCap > 0 && (
          <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Target className="size-3.5 text-primary" />
                <span>Monthly Budget Cap</span>
              </div>
              <span className={cn("font-semibold", isBudgetExceeded ? "text-red-500" : "text-muted-foreground")}>
                {formatCurrencyAmount(monthlyTotalConverted, primaryCurrency)} / {formatCurrencyAmount(budgetCap, primaryCurrency)} ({budgetUsedPct}%)
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isBudgetExceeded
                    ? "bg-red-500"
                    : (budgetUsedPct || 0) >= 85
                    ? "bg-amber-500"
                    : "bg-primary"
                )}
                style={{ width: `${Math.min(100, budgetUsedPct || 0)}%` }}
              />
            </div>

            {isBudgetExceeded && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium pt-0.5">
                <AlertTriangle className="size-3 shrink-0" />
                <span>Budget exceeded by {formatCurrencyAmount(monthlyTotalConverted - budgetCap, primaryCurrency)}! Review recurring costs to stay on track.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Responsive Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column: Filters & Subscriptions */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          {/* Filter and Sort Toolbar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Filter Buttons */}
            <div className="flex items-center gap-1 min-w-0 overflow-x-auto">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0 cursor-pointer",
                  filter === "all"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilter("due_soon")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer",
                  filter === "due_soon"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Clock className="size-3" />
                Due Soon
              </button>
              <button
                onClick={() => setFilter("trial")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer",
                  filter === "trial"
                    ? "bg-emerald-500 text-white"
                    : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                )}
              >
                <Sparkles className="size-3" />
                Trials
              </button>
              <button
                onClick={() => setFilter("regular")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0 cursor-pointer",
                  filter === "regular"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Regular
              </button>
            </div>

            {/* Sort Selector */}
            <div className="relative inline-flex items-center shrink-0">
              <ArrowUpDown className="pointer-events-none absolute left-2 size-3 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-7 rounded-lg border border-border bg-background pl-6 pr-6 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                aria-label="Sort subscriptions"
              >
                <option value="billing-asc">Next Billing</option>
                <option value="billing-desc">Billing: Furthest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="start-desc">Start: Newest</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted-foreground" />
            </div>
          </div>

          {/* Subscriptions List / Empty State */}
          <div className="space-y-3">
            {subscriptions === undefined ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : filteredSubs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  {getEmptyMessage().title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  {getEmptyMessage().subtitle}
                </p>
              </div>
            ) : (
              filteredSubs.map((sub) => (
                <SubscriptionCard
                  key={sub._id}
                  sub={sub}
                  primaryCurrency={primaryCurrency}
                  rates={rates}
                />
              ))
            )}
          </div>
        </div>

        {/* Sidebar Column: Smart Insights & Upcoming Reminders */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <SmartInsights
            subscriptions={subscriptions || []}
            primaryCurrency={primaryCurrency}
            rates={rates}
          />
          <UpcomingReminders
            subscriptions={subscriptions || []}
            primaryCurrency={primaryCurrency}
            rates={rates}
            onMarkCanceled={handleMarkCanceled}
          />
        </div>
      </div>
    </div>
  )
}

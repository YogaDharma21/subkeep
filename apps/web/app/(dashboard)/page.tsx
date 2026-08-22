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
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
  const suspendMutation = useMutation(api.subscriptions.suspend)

  const { primaryCurrency, setPrimaryCurrency, rates } = usePrimaryCurrency()
  const [filter, setFilter] = useState<FilterType>("all")
  const [sortBy, setSortBy] = useState<SortOption>("billing-asc")

  const handleCurrencyChange = async (newCurr: string) => {
    await setPrimaryCurrency(newCurr)
  }

  const handleMarkCanceled = async (id: string) => {
    await suspendMutation({ id: id as never })
  }

  // Multi-Currency Converted Monthly & Yearly Totals
  const { count, monthlyTotalConverted, yearlyTotalConverted } = useMemo(() => {
    if (!subscriptions) return { count: 0, monthlyTotalConverted: 0, yearlyTotalConverted: 0 }

    const activeSubs = subscriptions.filter((s) => s.isActive)
    const count = activeSubs.length

    const monthlyTotalConverted = activeSubs.reduce((sum, s) => {
      // Calculate normalized monthly price in subscription's native currency
      const cycle = (s.cycle || "monthly").toLowerCase()
      let nativeMonthly = s.price
      if (cycle === "quarterly") nativeMonthly = s.price / 3
      else if (cycle === "semi-annual") nativeMonthly = s.price / 6
      else if (cycle === "yearly") nativeMonthly = s.price / 12
      else if (cycle === "weekly") nativeMonthly = s.price * 4.33
      else if (cycle === "daily") nativeMonthly = s.price * 30
      else if (cycle === "none") nativeMonthly = 0

      // Convert to selected primary currency using live exchange rates
      const converted = convertCurrency(nativeMonthly, s.currency, primaryCurrency, rates)
      return sum + converted
    }, 0)

    const yearlyTotalConverted = monthlyTotalConverted * 12

    return { count, monthlyTotalConverted, yearlyTotalConverted }
  }, [subscriptions, primaryCurrency, rates])

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
    <div className="p-4">
      {/* Dynamic Summary Banner with Currency Converter */}
      <div className="mb-4 rounded-2xl border border-border bg-background p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
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
          <div className="flex items-center justify-around text-center">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-extrabold">{count}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Active Subs
              </span>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div className="flex flex-col items-center gap-0.5 min-w-0 px-1">
              <span className="text-base font-extrabold text-foreground truncate max-w-[130px]">
                {formatCurrencyAmount(monthlyTotalConverted, primaryCurrency)}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Per Month ({primaryCurrency})
              </span>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div className="flex flex-col items-center gap-0.5 min-w-0 px-1">
              <span className="text-base font-extrabold text-foreground truncate max-w-[130px]">
                {formatCurrencyAmount(yearlyTotalConverted, primaryCurrency)}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Per Year ({primaryCurrency})
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-around">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        )}
      </div>

      {/* Upcoming Reminders Alert Banner */}
      {subscriptions && (
        <UpcomingReminders
          subscriptions={subscriptions}
          primaryCurrency={primaryCurrency}
          rates={rates}
          onMarkCanceled={handleMarkCanceled}
        />
      )}

      {/* Smart Insights & Savings Recommendations */}
      {subscriptions && (
        <SmartInsights
          subscriptions={subscriptions}
          primaryCurrency={primaryCurrency}
          rates={rates}
        />
      )}

      {/* Filter and Sort Toolbar */}
      <div className="mb-3 flex items-center justify-between gap-2">
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

      {/* Subscriptions List */}
      <div className="space-y-2">
        {subscriptions ? (
          filteredSubs.length > 0 ? (
            filteredSubs.map((sub) => (
              <SubscriptionCard
                key={sub._id}
                sub={sub}
                primaryCurrency={primaryCurrency}
                rates={rates}
              />
            ))
          ) : (
            <div className="rounded-xl border border-border bg-background py-10 px-4 text-center">
              <p className="text-sm font-medium text-foreground">
                {getEmptyMessage().title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {getEmptyMessage().subtitle}
              </p>
              {filter !== "all" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilter("all")}
                  className="mt-3 h-7 text-xs"
                >
                  Reset Filter
                </Button>
              ) : null}
            </div>
          )
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-xl" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

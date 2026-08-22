"use client"

import { useState, useEffect, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import {
  ArrowUpDown,
  Calendar,
  ChevronDown,
  Clock,
  Globe,
  Search,
  Sparkles,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SubscriptionCard } from "@/components/subscription-card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  convertCurrency,
  formatCurrencyAmount,
  fetchExchangeRates,
  fallbackRates,
} from "@/lib/currency"
import { currencies } from "@/lib/constants"
import { UpcomingReminders } from "@/components/upcoming-reminders"
import { SmartInsights } from "@/components/smart-insights"
import { differenceInDays } from "date-fns"
import { cn } from "@/lib/utils"

export type TimeFilter =
  | "all"
  | "due_7d"
  | "due_30d"
  | "monthly"
  | "yearly"
  | "weekly"
  | "trial"
  | "regular"

export type SortOption =
  | "billing-asc"
  | "billing-desc"
  | "start-desc"
  | "start-asc"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc"

export default function HomePage() {
  const { isSignedIn } = useAuth()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const userSettings = useQuery(api.userSettings.get, isSignedIn ? {} : "skip")

  const updateSettings = useMutation(api.userSettings.update)
  const suspendMutation = useMutation(api.subscriptions.suspend)

  const [activeFilter, setActiveFilter] = useState<TimeFilter>("all")
  const [sortBy, setSortBy] = useState<SortOption>("billing-asc")
  const [searchQuery, setSearchQuery] = useState("")
  const [rates, setRates] = useState<Record<string, number>>(fallbackRates)
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null)

  const primaryCurrency = selectedCurrency ?? userSettings?.primaryCurrency ?? "IDR"

  useEffect(() => {
    fetchExchangeRates().then(setRates)
  }, [])

  const handleCurrencyChange = async (newCurr: string) => {
    setSelectedCurrency(newCurr)
    if (isSignedIn) {
      try {
        await updateSettings({ primaryCurrency: newCurr })
      } catch (err) {
        console.warn("Could not save settings to Convex backend:", err)
      }
    }
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

  // Compute item counts for filters
  const filterCounts = useMemo(() => {
    if (!subscriptions) return {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let due7 = 0
    let due30 = 0
    let monthly = 0
    let yearly = 0
    let weekly = 0
    let trials = 0
    let regular = 0

    subscriptions.forEach((s) => {
      if (s.isTrial) trials++
      else regular++

      const cycle = (s.cycle || "").toLowerCase()
      if (cycle === "monthly") monthly++
      else if (cycle === "yearly") yearly++
      else if (cycle === "weekly") weekly++

      const dateStr = s.isTrial && s.trialEndDate ? s.trialEndDate : s.nextBilling
      if (dateStr) {
        const targetDate = new Date(dateStr)
        targetDate.setHours(0, 0, 0, 0)
        const diff = differenceInDays(targetDate, today)
        if (diff >= 0 && diff <= 7) due7++
        if (diff >= 0 && diff <= 30) due30++
      }
    })

    return {
      all: subscriptions.length,
      due_7d: due7,
      due_30d: due30,
      monthly,
      yearly,
      weekly,
      trial: trials,
      regular,
    }
  }, [subscriptions])

  // Filtered and Sorted Subscriptions
  const filteredSubs = useMemo(() => {
    if (!subscriptions) return []
    let list = [...subscriptions]

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q) ||
          s.account?.toLowerCase().includes(q)
      )
    }

    // 2. Time & Status Filter
    if (activeFilter === "trial") {
      list = list.filter((s) => s.isTrial)
    } else if (activeFilter === "regular") {
      list = list.filter((s) => !s.isTrial)
    } else if (activeFilter === "due_7d") {
      list = list.filter((s) => {
        const dateStr = s.isTrial && s.trialEndDate ? s.trialEndDate : s.nextBilling
        if (!dateStr) return false
        const targetDate = new Date(dateStr)
        targetDate.setHours(0, 0, 0, 0)
        const diffDays = differenceInDays(targetDate, today)
        return diffDays >= 0 && diffDays <= 7
      })
    } else if (activeFilter === "due_30d") {
      list = list.filter((s) => {
        const dateStr = s.isTrial && s.trialEndDate ? s.trialEndDate : s.nextBilling
        if (!dateStr) return false
        const targetDate = new Date(dateStr)
        targetDate.setHours(0, 0, 0, 0)
        const diffDays = differenceInDays(targetDate, today)
        return diffDays >= 0 && diffDays <= 30
      })
    } else if (activeFilter === "monthly") {
      list = list.filter((s) => (s.cycle || "monthly").toLowerCase() === "monthly")
    } else if (activeFilter === "yearly") {
      list = list.filter((s) => (s.cycle || "").toLowerCase() === "yearly")
    } else if (activeFilter === "weekly") {
      list = list.filter((s) => (s.cycle || "").toLowerCase() === "weekly")
    }

    // 3. Sorting (by Time, Price, Name)
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
        case "start-asc": {
          const dateA = new Date(a.startDate || "9999-12-31").getTime()
          const dateB = new Date(b.startDate || "9999-12-31").getTime()
          return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB)
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
        case "name-desc":
          return b.name.localeCompare(a.name)
        default:
          return 0
      }
    })
  }, [subscriptions, activeFilter, searchQuery, sortBy, primaryCurrency, rates])

  const filterPills: Array<{
    id: TimeFilter
    label: string
    icon?: React.ReactNode
    count?: number
  }> = [
    { id: "all", label: "All", count: filterCounts.all },
    {
      id: "due_7d",
      label: "Due in 7d",
      icon: <Clock className="size-3" />,
      count: filterCounts.due_7d,
    },
    {
      id: "due_30d",
      label: "Due in 30d",
      icon: <Calendar className="size-3" />,
      count: filterCounts.due_30d,
    },
    { id: "monthly", label: "Monthly", count: filterCounts.monthly },
    { id: "yearly", label: "Yearly", count: filterCounts.yearly },
    { id: "weekly", label: "Weekly", count: filterCounts.weekly },
    {
      id: "trial",
      label: "Trials",
      icon: <Sparkles className="size-3" />,
      count: filterCounts.trial,
    },
    { id: "regular", label: "Regular", count: filterCounts.regular },
  ]

  const getEmptyMessage = () => {
    if (searchQuery.trim()) {
      return {
        title: `No subscriptions found matching "${searchQuery}"`,
        subtitle: "Try searching with a different term or clear the search query",
      }
    }
    switch (activeFilter) {
      case "due_7d":
        return {
          title: "No subscriptions due in the next 7 days",
          subtitle: "All your upcoming payments are further out",
        }
      case "due_30d":
        return {
          title: "No subscriptions due in the next 30 days",
          subtitle: "No payments scheduled for this month",
        }
      case "trial":
        return {
          title: "No active trial subscriptions",
          subtitle: "Mark a subscription as a free trial to track expiry",
        }
      case "regular":
        return {
          title: "No regular subscriptions found",
          subtitle: "Only trial subscriptions are currently recorded",
        }
      case "monthly":
        return {
          title: "No monthly subscriptions found",
          subtitle: "Add a subscription with a monthly billing cycle",
        }
      case "yearly":
        return {
          title: "No yearly subscriptions found",
          subtitle: "Add a subscription with a yearly billing cycle",
        }
      case "weekly":
        return {
          title: "No weekly subscriptions found",
          subtitle: "Add a subscription with a weekly billing cycle",
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
          onMarkCanceled={handleMarkCanceled}
        />
      )}

      {/* Smart Insights & Savings Recommendations */}
      {subscriptions && (
        <SmartInsights
          subscriptions={subscriptions}
          primaryCurrency={primaryCurrency}
        />
      )}

      {/* Filter and Sort Toolbar */}
      <div className="mb-3 space-y-2.5">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8.5 pr-8 text-xs rounded-xl bg-background border-border/80"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-sm cursor-pointer"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills and Sort Bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Horizontally scrollable filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 -mx-1 px-1 scrollbar-none">
            {filterPills.map((pill) => (
              <button
                key={pill.id}
                onClick={() => setActiveFilter(pill.id)}
                className={cn(
                  "flex items-center gap-1 shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                  activeFilter === pill.id
                    ? pill.id === "trial"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-foreground text-background shadow-xs"
                    : pill.id === "trial"
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                    : "text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70"
                )}
              >
                {pill.icon}
                <span>{pill.label}</span>
                {pill.count !== undefined && pill.count > 0 && (
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-semibold",
                      activeFilter === pill.id
                        ? "bg-background/20 text-background"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {pill.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sort Selector Dropdown */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {subscriptions && (
              <span className="text-[11px] text-muted-foreground font-medium sm:hidden">
                {filteredSubs.length} of {subscriptions.length} subs
              </span>
            )}
            <div className="relative inline-flex items-center">
              <ArrowUpDown className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-7.5 rounded-lg border border-border bg-background pl-8 pr-7 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer shadow-2xs"
              >
                <option value="billing-asc">Billing Date: Soonest</option>
                <option value="billing-desc">Billing Date: Furthest</option>
                <option value="start-desc">Start Date: Newest</option>
                <option value="start-asc">Start Date: Oldest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 size-3 text-muted-foreground" />
            </div>
          </div>
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
              {activeFilter !== "all" || searchQuery ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveFilter("all")
                    setSearchQuery("")
                  }}
                  className="mt-3 h-7 text-xs"
                >
                  Reset Filters
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

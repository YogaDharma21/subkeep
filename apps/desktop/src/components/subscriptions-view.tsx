import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/clerk-react"
import { api } from "@/convex/_generated/api"
import {
  Search,
  DollarSign,
  Calendar,
  AlertCircle,
  Receipt,
  Clock,
  Sparkles,
  X,
  ArrowUpDown,
  ChevronDown,
  RotateCcw,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SubscriptionCard } from "@/components/subscription-card"
import { UpcomingReminders } from "@/components/upcoming-reminders"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { categories, billingCycles } from "@/lib/constants"
import { differenceInDays } from "date-fns"
import { cn } from "@/lib/utils"

export type StatusFilter = "active" | "due_soon" | "trial" | "canceled" | "all"
export type SortOption = "nextBilling" | "furthestBilling" | "priceDesc" | "priceAsc" | "name" | "recentlyAdded"

interface SubscriptionsViewProps {
  onSelectSubscription: (id: string) => void
}

export function SubscriptionsView({
  onSelectSubscription,
}: SubscriptionsViewProps) {
  const { isSignedIn } = useAuth()
  const { primaryCurrency, rates } = usePrimaryCurrency()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedCycle, setSelectedCycle] = useState("all")
  const [sortBy, setSortBy] = useState<SortOption>("nextBilling")

  const subscriptions = useQuery(
    api.subscriptions.list,
    isSignedIn ? {} : "skip"
  )
  const userSettings = useQuery(
    api.userSettings.get,
    isSignedIn ? {} : "skip"
  )

  const activeSubs = useMemo(() => {
    if (!subscriptions) return []
    return subscriptions.filter((s) => s.isActive !== false)
  }, [subscriptions])

  // Total Monthly & Yearly Calculations
  const { totalMonthly, totalYearly } = useMemo(() => {
    if (!activeSubs || activeSubs.length === 0) {
      return { totalMonthly: 0, totalYearly: 0 }
    }

    let monthlySum = 0
    activeSubs.forEach((sub) => {
      const cycle = (sub.cycle || "monthly").toLowerCase()
      let nativeMonthly = sub.price
      if (cycle === "monthly") nativeMonthly = sub.price
      else if (cycle === "quarterly") nativeMonthly = sub.price / 3
      else if (cycle === "semi-annual") nativeMonthly = sub.price / 6
      else if (cycle === "yearly") nativeMonthly = sub.price / 12
      else if (cycle === "weekly") nativeMonthly = sub.price * 4.33
      else if (cycle === "daily") nativeMonthly = sub.price * 30
      else if (cycle === "none") nativeMonthly = 0

      const converted = convertCurrency(nativeMonthly, sub.currency, primaryCurrency, rates)
      monthlySum += converted
    })

    return {
      totalMonthly: monthlySum,
      totalYearly: monthlySum * 12,
    }
  }, [activeSubs, primaryCurrency, rates])

  // Budget Limit Calculation
  const monthlyBudgetCap = userSettings?.monthlyBudgetCap
  const isBudgetExceeded = monthlyBudgetCap !== undefined && totalMonthly > monthlyBudgetCap
  const budgetPercentage = monthlyBudgetCap ? Math.min(100, Math.round((totalMonthly / monthlyBudgetCap) * 100)) : 0

  // Status Counts for Badges
  const statusCounts = useMemo(() => {
    if (!subscriptions) return { active: 0, due_soon: 0, trial: 0, canceled: 0, all: 0 }
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let active = 0
    let due_soon = 0
    let trial = 0
    let canceled = 0

    for (const sub of subscriptions) {
      const isActive = sub.isActive !== false
      if (isActive) {
        active++
        if (sub.isTrial) trial++
        const dateStr = sub.isTrial && sub.trialEndDate ? sub.trialEndDate : sub.nextBilling
        if (dateStr) {
          const targetDate = new Date(dateStr)
          targetDate.setHours(0, 0, 0, 0)
          const diff = differenceInDays(targetDate, today)
          if (diff >= 0 && diff <= 7) {
            due_soon++
          }
        }
      } else {
        canceled++
      }
    }

    return {
      active,
      due_soon,
      trial,
      canceled,
      all: subscriptions.length,
    }
  }, [subscriptions])

  // Filtered and Sorted Subscriptions
  const filteredSubs = useMemo(() => {
    if (!subscriptions) return []
    let list = [...subscriptions]
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 1. Status Filter
    if (statusFilter === "active") {
      list = list.filter((s) => s.isActive !== false)
    } else if (statusFilter === "due_soon") {
      list = list.filter((s) => {
        if (s.isActive === false) return false
        const dateStr = s.isTrial && s.trialEndDate ? s.trialEndDate : s.nextBilling
        if (!dateStr) return false
        const targetDate = new Date(dateStr)
        targetDate.setHours(0, 0, 0, 0)
        const diffDays = differenceInDays(targetDate, today)
        return diffDays >= 0 && diffDays <= 7
      })
    } else if (statusFilter === "trial") {
      list = list.filter((s) => s.isActive !== false && !!s.isTrial)
    } else if (statusFilter === "canceled") {
      list = list.filter((s) => s.isActive === false)
    }

    // 2. Search Query
    const q = searchQuery.toLowerCase().trim()
    if (q) {
      list = list.filter((s) => {
        const matchesName = s.name.toLowerCase().includes(q)
        const matchesCat = s.category.toLowerCase().includes(q)
        const matchesAccount = s.account ? s.account.toLowerCase().includes(q) : false
        const matchesWebsite = s.website ? s.website.toLowerCase().includes(q) : false
        return matchesName || matchesCat || matchesAccount || matchesWebsite
      })
    }

    // 3. Category Filter
    if (selectedCategory !== "all") {
      list = list.filter((s) => s.category.toLowerCase() === selectedCategory.toLowerCase())
    }

    // 4. Billing Cycle Filter
    if (selectedCycle !== "all") {
      list = list.filter((s) => (s.cycle || "monthly").toLowerCase() === selectedCycle.toLowerCase())
    }

    // 5. Sort
    return list.sort((a, b) => {
      if (sortBy === "priceDesc") {
        const aPrice = convertCurrency(a.price, a.currency, primaryCurrency, rates)
        const bPrice = convertCurrency(b.price, b.currency, primaryCurrency, rates)
        return bPrice - aPrice
      }
      if (sortBy === "priceAsc") {
        const aPrice = convertCurrency(a.price, a.currency, primaryCurrency, rates)
        const bPrice = convertCurrency(b.price, b.currency, primaryCurrency, rates)
        return aPrice - bPrice
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === "furthestBilling") {
        const dateA = new Date(a.isTrial && a.trialEndDate ? a.trialEndDate : a.nextBilling || "1970-01-01").getTime()
        const dateB = new Date(b.isTrial && b.trialEndDate ? b.trialEndDate : b.nextBilling || "1970-01-01").getTime()
        return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA)
      }
      if (sortBy === "recentlyAdded") {
        const dateA = new Date(a.startDate || "1970-01-01").getTime()
        const dateB = new Date(b.startDate || "1970-01-01").getTime()
        return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA)
      }
      // Default: nextBilling soonest
      const dateA = new Date(a.isTrial && a.trialEndDate ? a.trialEndDate : a.nextBilling || "9999-12-31").getTime()
      const dateB = new Date(b.isTrial && b.trialEndDate ? b.trialEndDate : b.nextBilling || "9999-12-31").getTime()
      return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB)
    })
  }, [subscriptions, statusFilter, searchQuery, selectedCategory, selectedCycle, sortBy, primaryCurrency, rates])

  const isFiltered =
    statusFilter !== "active" ||
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedCycle !== "all"

  const handleClearFilters = () => {
    setStatusFilter("active")
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedCycle("all")
  }

  const getEmptyMessage = () => {
    if (searchQuery.trim() !== "" || selectedCategory !== "all" || selectedCycle !== "all") {
      return {
        title: "No subscriptions match your filters",
        subtitle: "Try adjusting your search query, category, or billing cycle filters.",
      }
    }
    switch (statusFilter) {
      case "due_soon":
        return {
          title: "No subscriptions due in the next 7 days",
          subtitle: "All your upcoming payments are further out.",
        }
      case "trial":
        return {
          title: "No active trial subscriptions",
          subtitle: "You have no subscriptions currently in a trial period.",
        }
      case "canceled":
        return {
          title: "No canceled subscriptions",
          subtitle: "All your subscriptions are currently active.",
        }
      default:
        return {
          title: "No subscriptions yet",
          subtitle: "Get started by adding your recurring bills and subscriptions.",
        }
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Stat Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-background p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Spend</span>
            <DollarSign className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatCurrencyAmount(totalMonthly, primaryCurrency)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {activeSubs.length} active recurring subscription{activeSubs.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Yearly Projection</span>
            <Calendar className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatCurrencyAmount(totalYearly, primaryCurrency)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Estimated 12-month commitment
          </p>
        </div>

        {monthlyBudgetCap !== undefined && (
          <div className="rounded-lg border border-border bg-background p-4 sm:p-5 shadow-xs sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Budget Status</span>
              {isBudgetExceeded ? (
                <AlertCircle className="size-4 text-destructive" />
              ) : (
                <span className="text-xs font-bold text-foreground">{budgetPercentage}%</span>
              )}
            </div>
            <div className="text-lg font-bold text-foreground">
              {formatCurrencyAmount(totalMonthly, primaryCurrency)} / {formatCurrencyAmount(monthlyBudgetCap, primaryCurrency)}
            </div>
            <div className="w-full bg-muted rounded-lg h-2 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-lg transition-all ${
                  isBudgetExceeded ? "bg-destructive" : "bg-primary"
                }`}
                style={{ width: `${budgetPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Reminders & Trial Alerts */}
      {subscriptions && subscriptions.length > 0 && (
        <UpcomingReminders
          subscriptions={subscriptions}
          primaryCurrency={primaryCurrency}
          rates={rates}
        />
      )}

      {/* Reimagined Search & Filters Toolbar */}
      <div className="rounded-lg border border-border bg-card p-3.5 sm:p-4 space-y-3 shadow-2xs">
        {/* Top Controls: Search + Dropdowns */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, category, or account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs bg-background"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Filter Selects Group */}
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            {/* Category Select */}
            <div className="relative inline-flex items-center">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by category"
                className="h-8 rounded-lg border border-border bg-background px-2.5 pr-6 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value} className="bg-background text-foreground">
                    {c.value === "all" ? "All Categories" : c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted-foreground" />
            </div>

            {/* Billing Cycle Select */}
            <div className="relative inline-flex items-center">
              <select
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
                aria-label="Filter by billing cycle"
                className="h-8 rounded-lg border border-border bg-background px-2.5 pr-6 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="all" className="bg-background text-foreground">All Cycles</option>
                {billingCycles.map((bc) => (
                  <option key={bc.value} value={bc.value} className="bg-background text-foreground">
                    {bc.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted-foreground" />
            </div>

            {/* Sort Select */}
            <div className="relative inline-flex items-center">
              <ArrowUpDown className="pointer-events-none absolute left-2 size-3 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort subscriptions"
                className="h-8 rounded-lg border border-border bg-background pl-6 pr-6 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="nextBilling" className="bg-background text-foreground">Next Renewal</option>
                <option value="furthestBilling" className="bg-background text-foreground">Furthest Renewal</option>
                <option value="priceDesc" className="bg-background text-foreground">Highest Price</option>
                <option value="priceAsc" className="bg-background text-foreground">Lowest Price</option>
                <option value="name" className="bg-background text-foreground">Name A-Z</option>
                <option value="recentlyAdded" className="bg-background text-foreground">Recently Added</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Status Tabs with Live Count Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 border-t border-border/50">
          <button
            onClick={() => setStatusFilter("active")}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
              statusFilter === "active"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <span>Active</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                statusFilter === "active"
                  ? "bg-background/20 text-background"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {statusCounts.active}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("due_soon")}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
              statusFilter === "due_soon"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            )}
          >
            <Clock className="size-3" />
            <span>Due Soon</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                statusFilter === "due_soon"
                  ? "bg-white/20 text-white"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              )}
            >
              {statusCounts.due_soon}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("trial")}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
              statusFilter === "trial"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            )}
          >
            <Sparkles className="size-3" />
            <span>Trials</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                statusFilter === "trial"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              )}
            >
              {statusCounts.trial}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("canceled")}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
              statusFilter === "canceled"
                ? "bg-red-600 text-white shadow-xs"
                : "text-red-600 dark:text-red-400 hover:bg-red-500/10"
            )}
          >
            <X className="size-3" />
            <span>Canceled</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                statusFilter === "canceled"
                  ? "bg-white/20 text-white"
                  : "bg-red-500/15 text-red-600 dark:text-red-400"
              )}
            >
              {statusCounts.canceled}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
              statusFilter === "all"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <span>All</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                statusFilter === "all"
                  ? "bg-background/20 text-background"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {statusCounts.all}
            </span>
          </button>
        </div>

        {/* Active Filters Context Bar */}
        {isFiltered && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-foreground">
                Showing {filteredSubs.length} of {subscriptions?.length ?? 0}
              </span>

              {statusFilter !== "active" && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5">
                  Status: {statusFilter === "due_soon" ? "Due Soon" : statusFilter === "trial" ? "Trials" : statusFilter === "canceled" ? "Canceled" : "All"}
                  <button
                    onClick={() => setStatusFilter("active")}
                    className="hover:text-foreground cursor-pointer"
                    aria-label="Reset status filter"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              )}

              {searchQuery && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5">
                  Search: &ldquo;{searchQuery}&rdquo;
                  <button
                    onClick={() => setSearchQuery("")}
                    className="hover:text-foreground cursor-pointer"
                    aria-label="Clear search query"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              )}

              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5 capitalize">
                  Category: {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="hover:text-foreground cursor-pointer"
                    aria-label="Clear category filter"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              )}

              {selectedCycle !== "all" && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5 capitalize">
                  Cycle: {billingCycles.find((bc) => bc.value === selectedCycle)?.label || selectedCycle}
                  <button
                    onClick={() => setSelectedCycle("all")}
                    className="hover:text-foreground cursor-pointer"
                    aria-label="Clear cycle filter"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              )}
            </div>

            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer ml-auto"
            >
              <RotateCcw className="size-3" />
              <span>Reset filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Subscriptions Grid */}
      {filteredSubs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredSubs.map((sub) => (
            <SubscriptionCard
              key={sub._id}
              sub={sub}
              primaryCurrency={primaryCurrency}
              rates={rates}
              onClick={onSelectSubscription}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-lg border border-dashed border-border p-8">
          <div className="size-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mx-auto mb-3">
            <Receipt className="size-5" />
          </div>
          <h3 className="text-sm font-bold text-foreground">{getEmptyMessage().title}</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {getEmptyMessage().subtitle}
          </p>
          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3" />
              <span>Clear all filters</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}


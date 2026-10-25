import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/clerk-react"
import { api } from "@/convex/_generated/api"
import {
  Search,
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

  const hasReminders = (subscriptions || []).some((sub) => {
    if (sub.isActive === false) return false
    const date = sub.isTrial && sub.trialEndDate ? sub.trialEndDate : sub.nextBilling
    if (!date) return false
    const target = new Date(date)
    target.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = differenceInDays(target, today)
    return diff >= 0 && diff <= 7
  })

  return (
    <div className="mx-auto max-w-6xl space-y-3 pb-16">
      <section className="surface p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <p className="label">Recurring</p>
          <span className="rounded-full border border-border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {primaryCurrency}
          </span>
        </div>

        <div className="relative mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <p className="display-number text-[clamp(2.1rem,4.6vw,3.2rem)] text-foreground">
              {formatCurrencyAmount(totalMonthly, primaryCurrency)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              per month · {activeSubs.length} active{" "}
              {activeSubs.length === 1 ? "service" : "services"}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="numeral text-[15px] text-foreground">
              {formatCurrencyAmount(totalYearly, primaryCurrency)}
            </p>
            <p className="label mt-1.5">per year</p>
          </div>
        </div>

        {monthlyBudgetCap !== undefined && monthlyBudgetCap > 0 ? (
          <div className="relative mt-6 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-muted-foreground">
                Monthly cap · {formatCurrencyAmount(totalMonthly, primaryCurrency)} of{" "}
                {formatCurrencyAmount(monthlyBudgetCap, primaryCurrency)}
              </span>
              <span
                className={cn(
                  "numeral shrink-0",
                  isBudgetExceeded ? "text-negative" : "text-muted-foreground"
                )}
              >
                {budgetPercentage}%
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/10">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isBudgetExceeded
                    ? "bg-negative"
                    : budgetPercentage >= 85
                      ? "bg-warning"
                      : "bg-foreground/70"
                )}
                style={{ width: `${Math.min(100, budgetPercentage)}%` }}
              />
            </div>
            {isBudgetExceeded ? (
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-negative">
                <AlertCircle className="size-3 shrink-0" />
                <span>
                  Over by{" "}
                  {formatCurrencyAmount(totalMonthly - monthlyBudgetCap, primaryCurrency)} this
                  month.
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <div
        className={cn(
          "items-start gap-3",
          hasReminders && "grid grid-cols-1 lg:grid-cols-12"
        )}
      >
        <div className={cn("space-y-3", hasReminders && "lg:col-span-8")}>
          {/* Filter panel */}
          <div className="surface space-y-3 p-3.5 sm:p-4">
        {/* Top Controls: Search + Dropdowns */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, category, or account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 border-transparent bg-transparent pl-8 pr-7 text-xs"
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
                className="h-8 rounded-full border border-border bg-transparent px-2.5 pr-6 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value} className="bg-popover text-foreground">
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
                className="h-8 rounded-full border border-border bg-transparent px-2.5 pr-6 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="all" className="bg-popover text-foreground">All Cycles</option>
                {billingCycles.map((bc) => (
                  <option key={bc.value} value={bc.value} className="bg-popover text-foreground">
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
                className="h-8 rounded-full border border-border bg-transparent pl-6 pr-6 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="nextBilling" className="bg-popover text-foreground">Next Renewal</option>
                <option value="furthestBilling" className="bg-popover text-foreground">Furthest Renewal</option>
                <option value="priceDesc" className="bg-popover text-foreground">Highest Price</option>
                <option value="priceAsc" className="bg-popover text-foreground">Lowest Price</option>
                <option value="name" className="bg-popover text-foreground">Name A-Z</option>
                <option value="recentlyAdded" className="bg-popover text-foreground">Recently Added</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Status Tabs with Live Count Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-0.5 border-t border-border">
          <button
            onClick={() => setStatusFilter("active")}
            className={cn(
              "rounded-full px-2.5 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
              statusFilter === "active"
                ? "bg-foreground text-background shadow-none"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <span>Active</span>
            <span
              className={cn(
                "numeral text-[10px]",
                statusFilter === "active"
                  ? "text-background/55"
                  : "text-muted-foreground/55"
              )}
            >
              {statusCounts.active}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("due_soon")}
            className={cn(
              "rounded-full px-2.5 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
              statusFilter === "due_soon"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <Clock className="size-3" />
            <span>Due Soon</span>
            <span
              className={cn(
                "numeral text-[10px]",
                statusFilter === "due_soon"
                  ? "text-background/55"
                  : "text-muted-foreground/55"
              )}
            >
              {statusCounts.due_soon}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("trial")}
            className={cn(
              "rounded-full px-2.5 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
              statusFilter === "trial"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <Sparkles className="size-3" />
            <span>Trials</span>
            <span
              className={cn(
                "numeral text-[10px]",
                statusFilter === "trial"
                  ? "text-background/55"
                  : "text-muted-foreground/55"
              )}
            >
              {statusCounts.trial}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("canceled")}
            className={cn(
              "rounded-full px-2.5 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
              statusFilter === "canceled"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <X className="size-3" />
            <span>Canceled</span>
            <span
              className={cn(
                "numeral text-[10px]",
                statusFilter === "canceled"
                  ? "text-background/55"
                  : "text-muted-foreground/55"
              )}
            >
              {statusCounts.canceled}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "rounded-full px-2.5 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
              statusFilter === "all"
                ? "bg-foreground text-background shadow-none"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <span>All</span>
            <span
              className={cn(
                "numeral text-[10px]",
                statusFilter === "all"
                  ? "text-background/55"
                  : "text-muted-foreground/55"
              )}
            >
              {statusCounts.all}
            </span>
          </button>
        </div>

        {/* Active Filters Context Bar */}
        {isFiltered && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border text-xs text-muted-foreground flex-wrap">
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

          {/* Subscriptions list */}
          {filteredSubs.length > 0 ? (
            <div className="space-y-2">
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
            <div className="rounded-3xl border border-dashed border-border p-8 py-16 text-center">
              <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Receipt className="size-5" />
              </div>
              <h3 className="text-sm font-medium text-foreground">{getEmptyMessage().title}</h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                {getEmptyMessage().subtitle}
              </p>
              {isFiltered && (
                <button
                  onClick={handleClearFilters}
                  className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <RotateCcw className="size-3" />
                  <span>Clear all filters</span>
                </button>
              )}
            </div>
          )}
        </div>

        {hasReminders ? (
          <div className="lg:col-span-4">
            <UpcomingReminders
              subscriptions={subscriptions || []}
              primaryCurrency={primaryCurrency}
              rates={rates}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}


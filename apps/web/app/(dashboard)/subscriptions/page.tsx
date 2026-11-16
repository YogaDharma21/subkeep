"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import {
  ArrowUpDown,
  AlertTriangle,
  X,
  Search,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react"
import { SectionHeader } from "@/components/section-nav"
import { SubscriptionCard } from "@/components/subscription-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { currencies, categories, billingCycles } from "@/lib/constants"
import { UpcomingReminders } from "@/components/upcoming-reminders"
import { findUpcomingReminders } from "@/lib/notifications"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { differenceInDays } from "date-fns"
import { cn } from "@/lib/utils"
import { subscriptionTabs } from "@/lib/navigation"
import { toast } from "sonner"

export type StatusFilter = "active" | "due_soon" | "trial" | "canceled" | "all"

export type SortOption =
  | "billing-asc"
  | "billing-desc"
  | "price-asc"
  | "price-desc"
  | "start-desc"
  | "name-asc"

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "billing-asc", label: "Next Renewal" },
  { value: "billing-desc", label: "Furthest Renewal" },
  { value: "price-desc", label: "Highest Price" },
  { value: "price-asc", label: "Lowest Price" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "start-desc", label: "Recently Added" },
]

export default function SubscriptionsPage() {
  useDocumentTitle("Subscriptions")
  const { isSignedIn } = useAuth()
  const subscriptions = useQuery(
    api.subscriptions.list,
    isSignedIn ? {} : "skip"
  )
  const userSettings = useQuery(api.userSettings.get, isSignedIn ? {} : "skip")
  const suspendMutation = useMutation(api.subscriptions.suspend)

  const { primaryCurrency, setPrimaryCurrency, rates } = usePrimaryCurrency()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [cycleFilter, setCycleFilter] = useState("all")
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
    if (!subscriptions)
      return { count: 0, monthlyTotalConverted: 0, yearlyTotalConverted: 0 }

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

      const converted = convertCurrency(
        nativeMonthly,
        s.currency,
        primaryCurrency,
        rates
      )
      return sum + converted
    }, 0)

    const yearlyTotalConverted = monthlyTotalConverted * 12

    return { count, monthlyTotalConverted, yearlyTotalConverted }
  }, [subscriptions, primaryCurrency, rates])

  // Budget calculations
  const budgetCap = userSettings?.monthlyBudgetCap
  const budgetUsedPct =
    budgetCap && budgetCap > 0
      ? Math.round((monthlyTotalConverted / budgetCap) * 100)
      : null
  const isBudgetExceeded = budgetCap && monthlyTotalConverted > budgetCap

  // Status Counts for Badges
  const statusCounts = useMemo(() => {
    if (!subscriptions)
      return { active: 0, due_soon: 0, trial: 0, canceled: 0, all: 0 }
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
        const dateStr =
          sub.isTrial && sub.trialEndDate ? sub.trialEndDate : sub.nextBilling
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
        const dateStr =
          s.isTrial && s.trialEndDate ? s.trialEndDate : s.nextBilling
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
    } // "all" displays both active and inactive

    // 2. Search Filter
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((s) => {
        const matchesName = s.name.toLowerCase().includes(q)
        const matchesCategory = s.category.toLowerCase().includes(q)
        const matchesAccount = s.account
          ? s.account.toLowerCase().includes(q)
          : false
        const matchesWebsite = s.website
          ? s.website.toLowerCase().includes(q)
          : false
        return (
          matchesName || matchesCategory || matchesAccount || matchesWebsite
        )
      })
    }

    // 3. Category Filter
    if (categoryFilter !== "all") {
      list = list.filter(
        (s) => s.category.toLowerCase() === categoryFilter.toLowerCase()
      )
    }

    // 4. Billing Cycle Filter
    if (cycleFilter !== "all") {
      list = list.filter(
        (s) =>
          (s.cycle || "monthly").toLowerCase() === cycleFilter.toLowerCase()
      )
    }

    // 5. Sort logic
    return list.sort((a, b) => {
      switch (sortBy) {
        case "billing-asc": {
          const dateA = new Date(
            a.isTrial && a.trialEndDate
              ? a.trialEndDate
              : a.nextBilling || "9999-12-31"
          ).getTime()
          const dateB = new Date(
            b.isTrial && b.trialEndDate
              ? b.trialEndDate
              : b.nextBilling || "9999-12-31"
          ).getTime()
          return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB)
        }
        case "billing-desc": {
          const dateA = new Date(
            a.isTrial && a.trialEndDate
              ? a.trialEndDate
              : a.nextBilling || "1970-01-01"
          ).getTime()
          const dateB = new Date(
            b.isTrial && b.trialEndDate
              ? b.trialEndDate
              : b.nextBilling || "1970-01-01"
          ).getTime()
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA)
        }
        case "start-desc": {
          const dateA = new Date(a.startDate || "1970-01-01").getTime()
          const dateB = new Date(b.startDate || "1970-01-01").getTime()
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA)
        }
        case "price-asc": {
          const pA = convertCurrency(
            a.price,
            a.currency,
            primaryCurrency,
            rates
          )
          const pB = convertCurrency(
            b.price,
            b.currency,
            primaryCurrency,
            rates
          )
          return pA - pB
        }
        case "price-desc": {
          const pA = convertCurrency(
            a.price,
            a.currency,
            primaryCurrency,
            rates
          )
          const pB = convertCurrency(
            b.price,
            b.currency,
            primaryCurrency,
            rates
          )
          return pB - pA
        }
        case "name-asc":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })
  }, [
    subscriptions,
    statusFilter,
    searchQuery,
    categoryFilter,
    cycleFilter,
    sortBy,
    primaryCurrency,
    rates,
  ])

  const hasReminders = useMemo(
    () => findUpcomingReminders(subscriptions || [], 3).length > 0,
    [subscriptions]
  )

  const isFiltered =
    statusFilter !== "active" ||
    searchQuery.trim() !== "" ||
    categoryFilter !== "all" ||
    cycleFilter !== "all"

  const handleClearFilters = () => {
    setStatusFilter("active")
    setSearchQuery("")
    setCategoryFilter("all")
    setCycleFilter("all")
  }

  const getEmptyMessage = () => {
    if (
      searchQuery.trim() !== "" ||
      categoryFilter !== "all" ||
      cycleFilter !== "all"
    ) {
      return {
        title: "No subscriptions match your filters",
        subtitle:
          "Try adjusting your search query, category, or billing cycle filters.",
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
          subtitle: "Tap + to add your first recurring subscription.",
        }
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <SectionHeader title="Subscriptions" tabs={subscriptionTabs} />

      {/* Summary */}
      <section className="surface p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <p className="label">Recurring</p>
          <Select
            value={primaryCurrency}
            onValueChange={(val) => {
              if (val) handleCurrencyChange(val)
            }}
          >
            <SelectTrigger
              size="sm"
              aria-label="Primary currency"
              className="h-7 rounded-full border border-border bg-transparent px-3 text-[10px] font-medium tracking-[0.12em] text-muted-foreground focus:ring-1 focus:ring-ring focus:outline-none"
            >
              <SelectValue>
                {currencies.find((c) => c.value === primaryCurrency)?.label ??
                  primaryCurrency}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              {currencies.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {subscriptions ? (
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="min-w-0">
              <p className="display-number text-[clamp(2.1rem,4.6vw,3.2rem)] text-foreground">
                {formatCurrencyAmount(monthlyTotalConverted, primaryCurrency)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                per month · {count} active{" "}
                {count === 1 ? "service" : "services"}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="numeral text-[15px] text-foreground">
                {formatCurrencyAmount(yearlyTotalConverted, primaryCurrency)}
              </p>
              <p className="label mt-1.5">per year</p>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-11 w-64 rounded-2xl" />
            <Skeleton className="h-3 w-32 rounded-full" />
          </div>
        )}

        {budgetCap && budgetCap > 0 && subscriptions ? (
          <div className="mt-6 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-muted-foreground">
                Monthly cap ·{" "}
                {formatCurrencyAmount(monthlyTotalConverted, primaryCurrency)}{" "}
                of {formatCurrencyAmount(budgetCap, primaryCurrency)}
              </span>
              <span
                className={cn(
                  "numeral shrink-0",
                  isBudgetExceeded ? "text-negative" : "text-muted-foreground"
                )}
              >
                {budgetUsedPct}%
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/10">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isBudgetExceeded
                    ? "bg-negative"
                    : (budgetUsedPct || 0) >= 85
                      ? "bg-warning"
                      : "bg-foreground/70"
                )}
                style={{ width: `${Math.min(100, budgetUsedPct || 0)}%` }}
              />
            </div>
            {isBudgetExceeded ? (
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-negative">
                <AlertTriangle className="size-3 shrink-0" />
                <span>
                  Over by{" "}
                  {formatCurrencyAmount(
                    monthlyTotalConverted - budgetCap,
                    primaryCurrency
                  )}{" "}
                  this month.
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* Responsive Dashboard Grid */}
      <div
        className={cn(
          hasReminders && "grid grid-cols-1 items-start gap-6 lg:grid-cols-12"
        )}
      >
        {/* Main Column: Reimagined Filters & Subscriptions List */}
        <div
          className={cn(
            "space-y-4",
            hasReminders && "lg:col-span-7 xl:col-span-8"
          )}
        >
          {/* Filter panel */}
          <div className="surface space-y-3 p-3.5 sm:p-4">
            {/* Top Toolbar: Search + Secondary Filter Controls */}
            <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
              {/* Search Bar */}
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, category, or account..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 bg-transparent pr-7 pl-8 text-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {/* Filter Selects Group */}
              <div className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap">
                {/* Category Select */}
                <Select
                  value={categoryFilter}
                  onValueChange={(val) => {
                    if (val) setCategoryFilter(val)
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    aria-label="Filter by category"
                    className="h-8 rounded-full border border-border bg-transparent px-2.5 text-xs font-medium text-foreground focus:ring-1 focus:ring-ring focus:outline-none"
                  >
                    <SelectValue>
                      {categoryFilter === "all"
                        ? "All Categories"
                        : categories.find((c) => c.value === categoryFilter)
                            ?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.value === "all" ? "All Categories" : c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Billing Cycle Select */}
                <Select
                  value={cycleFilter}
                  onValueChange={(val) => {
                    if (val) setCycleFilter(val)
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    aria-label="Filter by billing cycle"
                    className="h-8 rounded-full border border-border bg-transparent px-2.5 text-xs font-medium text-foreground focus:ring-1 focus:ring-ring focus:outline-none"
                  >
                    <SelectValue>
                      {cycleFilter === "all"
                        ? "All Cycles"
                        : billingCycles.find((bc) => bc.value === cycleFilter)
                            ?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="all">All Cycles</SelectItem>
                    {billingCycles.map((bc) => (
                      <SelectItem key={bc.value} value={bc.value}>
                        {bc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort Select */}
                <Select
                  value={sortBy}
                  onValueChange={(val) => {
                    if (val) setSortBy(val as SortOption)
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    aria-label="Sort subscriptions"
                    className="h-8 rounded-full border border-border bg-transparent px-2.5 text-xs font-medium text-foreground focus:ring-1 focus:ring-ring focus:outline-none"
                  >
                    <ArrowUpDown className="mr-0.5 size-3 text-muted-foreground" />
                    <SelectValue>
                      {sortOptions.find((so) => so.value === sortBy)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {sortOptions.map((so) => (
                      <SelectItem key={so.value} value={so.value}>
                        {so.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status */}
            <div className="quiet-scroll flex items-center gap-1 overflow-x-auto border-t border-border pt-3 pb-0.5">
              {(
                [
                  { key: "active", label: "Active" },
                  { key: "due_soon", label: "Due soon" },
                  { key: "trial", label: "Trials" },
                  { key: "canceled", label: "Canceled" },
                  { key: "all", label: "All" },
                ] as Array<{ key: StatusFilter; label: string }>
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] transition-colors",
                    statusFilter === tab.key
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "numeral text-[10px]",
                      statusFilter === tab.key
                        ? "text-background/55"
                        : "text-muted-foreground/55"
                    )}
                  >
                    {statusCounts[tab.key]}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Filters Context Bar */}
            {isFiltered && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2 text-xs text-muted-foreground">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium text-foreground">
                    Showing {filteredSubs.length} of{" "}
                    {subscriptions?.length ?? 0}
                  </span>

                  {statusFilter !== "active" && (
                    <Badge
                      variant="secondary"
                      className="gap-1 py-0.5 text-[11px] font-normal"
                    >
                      Status:{" "}
                      {statusFilter === "due_soon"
                        ? "Due Soon"
                        : statusFilter === "trial"
                          ? "Trials"
                          : statusFilter === "canceled"
                            ? "Canceled"
                            : "All"}
                      <button
                        onClick={() => setStatusFilter("active")}
                        className="cursor-pointer hover:text-foreground"
                        aria-label="Reset status filter"
                      >
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  )}

                  {searchQuery && (
                    <Badge
                      variant="secondary"
                      className="gap-1 py-0.5 text-[11px] font-normal"
                    >
                      Search: &ldquo;{searchQuery}&rdquo;
                      <button
                        onClick={() => setSearchQuery("")}
                        className="cursor-pointer hover:text-foreground"
                        aria-label="Clear search query"
                      >
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  )}

                  {categoryFilter !== "all" && (
                    <Badge
                      variant="secondary"
                      className="gap-1 py-0.5 text-[11px] font-normal capitalize"
                    >
                      Category: {categoryFilter}
                      <button
                        onClick={() => setCategoryFilter("all")}
                        className="cursor-pointer hover:text-foreground"
                        aria-label="Clear category filter"
                      >
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  )}

                  {cycleFilter !== "all" && (
                    <Badge
                      variant="secondary"
                      className="gap-1 py-0.5 text-[11px] font-normal capitalize"
                    >
                      Cycle:{" "}
                      {billingCycles.find((bc) => bc.value === cycleFilter)
                        ?.label || cycleFilter}
                      <button
                        onClick={() => setCycleFilter("all")}
                        className="cursor-pointer hover:text-foreground"
                        aria-label="Clear cycle filter"
                      >
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  )}
                </div>

                <button
                  onClick={handleClearFilters}
                  className="ml-auto flex cursor-pointer items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  <RotateCcw className="size-3" />
                  <span>Reset filters</span>
                </button>
              </div>
            )}
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
              <div className="surface flex flex-col items-center justify-center px-4 py-12 text-center">
                <div className="surface-inset mb-3 flex size-10 items-center justify-center rounded-full text-muted-foreground">
                  <SlidersHorizontal className="size-4" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {getEmptyMessage().title}
                </p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  {getEmptyMessage().subtitle}
                </p>
                {isFiltered && (
                  <button
                    onClick={handleClearFilters}
                    className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] text-foreground transition-colors hover:bg-foreground/5"
                  >
                    <RotateCcw className="size-3" />
                    <span>Clear all filters</span>
                  </button>
                )}
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

        {/* Sidebar Column: Upcoming Reminders (only reserves space when items exist) */}
        {hasReminders && (
          <div className="mt-6 lg:col-span-5 lg:mt-0 xl:col-span-4">
            <div className="surface p-5 sm:p-6">
              <UpcomingReminders
                subscriptions={subscriptions || []}
                primaryCurrency={primaryCurrency}
                rates={rates}
                onMarkCanceled={handleMarkCanceled}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

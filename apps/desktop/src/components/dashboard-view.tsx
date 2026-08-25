import { useState, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/clerk-react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  Plus,
  Search,
  SlidersHorizontal,
  DollarSign,
  Calendar,
  AlertCircle,
  Receipt,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SubscriptionCard } from "@/components/subscription-card"
import { UpcomingReminders } from "@/components/upcoming-reminders"
import { SmartInsights } from "@/components/smart-insights"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { categories } from "@/lib/constants"
import { toast } from "sonner"

interface DashboardViewProps {
  onSelectSubscription: (id: string) => void
  onAddSubscription: () => void
}

export function DashboardView({
  onSelectSubscription,
  onAddSubscription,
}: DashboardViewProps) {
  const { isSignedIn } = useAuth()
  const { primaryCurrency, rates } = usePrimaryCurrency()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState<"nextBilling" | "priceDesc" | "priceAsc" | "name">("nextBilling")

  const subscriptions = useQuery(
    api.subscriptions.list,
    isSignedIn ? {} : "skip"
  )
  const userSettings = useQuery(
    api.userSettings.get,
    isSignedIn ? {} : "skip"
  )
  const suspendMutation = useMutation(api.subscriptions.suspend)

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

  // Filtered and Sorted Subscriptions
  const filteredSubs = useMemo(() => {
    if (!subscriptions) return []

    return subscriptions
      .filter((s) => {
        const matchesCategory =
          selectedCategory === "all" || s.category === selectedCategory
        const q = searchQuery.toLowerCase().trim()
        const matchesSearch =
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.account && s.account.toLowerCase().includes(q))
        return matchesCategory && matchesSearch
      })
      .sort((a, b) => {
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
        // Default: nextBilling
        return new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime()
      })
  }, [subscriptions, selectedCategory, searchQuery, sortBy, primaryCurrency, rates])

  const handleMarkCanceled = async (id: string) => {
    try {
      await suspendMutation({ id: id as Id<"subscriptions"> })
      toast.success("Subscription updated")
    } catch {
      toast.error("Failed to update subscription status")
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Stat Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-background p-4 sm:p-5 shadow-xs">
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

        <div className="rounded-xl border border-border bg-background p-4 sm:p-5 shadow-xs">
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
          <div className="rounded-xl border border-border bg-background p-4 sm:p-5 shadow-xs sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Budget Status</span>
              {isBudgetExceeded ? (
                <AlertCircle className="size-4 text-destructive" />
              ) : (
                <span className="text-xs font-bold text-emerald-500">{budgetPercentage}%</span>
              )}
            </div>
            <div className="text-lg font-bold text-foreground">
              {formatCurrencyAmount(totalMonthly, primaryCurrency)} / {formatCurrencyAmount(monthlyBudgetCap, primaryCurrency)}
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
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
          onMarkCanceled={handleMarkCanceled}
        />
      )}

      {/* Smart Insights & Savings Recommendations */}
      {subscriptions && subscriptions.length > 0 && (
        <SmartInsights
          subscriptions={subscriptions}
          primaryCurrency={primaryCurrency}
          rates={rates}
        />
      )}

      {/* Search & Filters Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter by name, category, or account email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 border border-border px-2 py-1 rounded-lg">
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-transparent text-foreground text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="nextBilling">Next Renewal</option>
                <option value="priceDesc">Highest Price</option>
                <option value="priceAsc">Lowest Price</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            <Button
              size="sm"
              onClick={onAddSubscription}
              className="text-xs font-bold gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="size-3.5" />
              <span>Add</span>
            </Button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <Badge
              key={cat.value}
              variant={selectedCategory === cat.value ? "default" : "outline"}
              className="cursor-pointer shrink-0 rounded-md px-3 py-1 text-xs transition-colors"
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
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
        <div className="py-16 text-center rounded-xl border border-dashed border-border p-8">
          <Receipt className="size-10 mx-auto mb-3 text-muted-foreground/60" />
          <h3 className="text-sm font-bold text-foreground">No subscriptions found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No active subscriptions match "${searchQuery}". Try clearing your search.`
              : "Get started by adding your recurring bills and subscriptions."}
          </p>
          <div className="mt-4">
            <Button
              size="sm"
              onClick={onAddSubscription}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <Plus className="size-3.5" />
              Add First Subscription
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

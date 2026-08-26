import { useMemo } from "react"
import { Sparkles, TrendingUp, TrendingDown, Minus, PieChart, Users } from "lucide-react"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { subMonths, endOfMonth } from "date-fns"

interface SmartInsightsProps {
  subscriptions: Array<{
    _id: string
    name: string
    price: number
    currency: string
    cycle: string
    category: string
    startDate?: string
    endDate?: string
    isActive?: boolean
    isTrial?: boolean
    isShared?: boolean
    totalPlanPrice?: number
    totalMembers?: number
    priceHistory?: Array<{ price: number; currency: string; changedAt: string }>
  }>
  primaryCurrency?: string
  rates?: Record<string, number>
}

export function SmartInsights({
  subscriptions,
  primaryCurrency = "IDR",
  rates,
}: SmartInsightsProps) {
  const insights = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return []

    const activeSubs = subscriptions.filter((s) => s.isActive !== false)
    if (activeSubs.length === 0) return []

    const list: Array<{
      id: string
      type: "category" | "trend" | "recommendation" | "shared" | "trial"
      title: string
      description: string
      badge?: string
      icon: typeof Sparkles
    }> = []

    // 1. Category Dominance Calculation
    const categoryTotals: Record<string, number> = {}
    let grandMonthlyTotal = 0

    activeSubs.forEach((sub) => {
      const cycle = (sub.cycle || "monthly").toLowerCase()
      let monthly = sub.price
      if (cycle === "quarterly") monthly = sub.price / 3
      else if (cycle === "semi-annual") monthly = sub.price / 6
      else if (cycle === "yearly") monthly = sub.price / 12
      else if (cycle === "weekly") monthly = sub.price * 4.33
      else if (cycle === "daily") monthly = sub.price * 30
      else if (cycle === "none") monthly = 0

      const converted = convertCurrency(monthly, sub.currency, primaryCurrency, rates)
      categoryTotals[sub.category] = (categoryTotals[sub.category] || 0) + converted
      grandMonthlyTotal += converted
    })

    if (grandMonthlyTotal > 0) {
      let topCategory = ""
      let topCategoryAmount = 0
      for (const [cat, amt] of Object.entries(categoryTotals)) {
        if (amt > topCategoryAmount) {
          topCategoryAmount = amt
          topCategory = cat
        }
      }

      const percent = Math.round((topCategoryAmount / grandMonthlyTotal) * 100)
      if (percent >= 30) {
        const catLabel = topCategory.charAt(0).toUpperCase() + topCategory.slice(1)
        list.push({
          id: "cat-dominance",
          type: "category",
          title: `${percent}% Spent on ${catLabel}`,
          description: `You spend ${percent}% of your total subscription budget on ${catLabel} alone (${formatCurrencyAmount(topCategoryAmount, primaryCurrency)}/mo).`,
          badge: "Budget Focus",
          icon: PieChart,
        })
      }
    }

    // 2. Real Month-over-Month Spending Trend
    const now = new Date()
    const prevMonthDate = subMonths(now, 1)
    const prevMonthEnd = endOfMonth(prevMonthDate)

    const calcMonthCost = (targetMonthEnd: Date) => {
      let sum = 0
      subscriptions.forEach((s) => {
        if (s.isActive === false) return
        const subStart = s.startDate ? new Date(s.startDate) : new Date(2000, 0, 1)
        const subEnd = s.endDate ? new Date(s.endDate) : null
        if (subStart <= targetMonthEnd && (!subEnd || subEnd >= targetMonthEnd)) {
          const cycle = (s.cycle || "monthly").toLowerCase()
          let m = s.price
          if (cycle === "quarterly") m = s.price / 3
          else if (cycle === "semi-annual") m = s.price / 6
          else if (cycle === "yearly") m = s.price / 12
          else if (cycle === "weekly") m = s.price * 4.33
          else if (cycle === "daily") m = s.price * 30
          else if (cycle === "none") m = 0
          sum += convertCurrency(m, s.currency, primaryCurrency, rates)
        }
      })
      return sum
    }

    const thisMonthSum = grandMonthlyTotal
    const lastMonthSum = calcMonthCost(prevMonthEnd)

    if (lastMonthSum > 0) {
      const diffPct = Math.round(((thisMonthSum - lastMonthSum) / lastMonthSum) * 100)
      const diffAbs = Math.abs(thisMonthSum - lastMonthSum)

      if (diffPct > 0) {
        list.push({
          id: "trend-insight",
          type: "trend",
          title: `Spending Trend (+${diffPct}% MoM)`,
          description: `Your monthly subscription spending increased by ${diffPct}% (+${formatCurrencyAmount(diffAbs, primaryCurrency)}/mo) compared to last month.`,
          badge: "Monthly Increase",
          icon: TrendingUp,
        })
      } else if (diffPct < 0) {
        list.push({
          id: "trend-insight",
          type: "trend",
          title: `Spending Trend (${diffPct}% MoM)`,
          description: `Your monthly subscription spending decreased by ${Math.abs(diffPct)}% (-${formatCurrencyAmount(diffAbs, primaryCurrency)}/mo) compared to last month.`,
          badge: "Monthly Savings",
          icon: TrendingDown,
        })
      } else {
        list.push({
          id: "trend-insight",
          type: "trend",
          title: "Stable Spending (0% MoM)",
          description: `Your recurring monthly commitments are consistent with last month at ${formatCurrencyAmount(thisMonthSum, primaryCurrency)}/mo.`,
          badge: "Steady Budget",
          icon: Minus,
        })
      }
    }

    // 3. Shared Subscriptions Savings Insight
    const sharedSubs = activeSubs.filter((s) => s.isShared)
    if (sharedSubs.length > 0) {
      let totalSavedMonthly = 0
      sharedSubs.forEach((s) => {
        if (s.totalPlanPrice && s.totalMembers && s.totalMembers > 1) {
          const fullMonthly = s.totalPlanPrice
          const userPortion = s.price
          const savedNative = fullMonthly - userPortion
          totalSavedMonthly += convertCurrency(savedNative, s.currency, primaryCurrency, rates)
        }
      })

      if (totalSavedMonthly > 0) {
        list.push({
          id: "shared-savings",
          type: "shared",
          title: `Shared Plans Saving You ${formatCurrencyAmount(totalSavedMonthly * 12, primaryCurrency)}/yr`,
          description: `You share ${sharedSubs.length} subscription(s) with family or friends, cutting your annual costs significantly!`,
          badge: "Family Savings",
          icon: Users,
        })
      }
    }

    // 4. Overlap & Consolidation Recommendation
    const entertainmentSubs = activeSubs.filter(
      (s) => s.category === "entertainment" || s.category === "music"
    )
    if (entertainmentSubs.length >= 3) {
      let entTotalMonthly = 0
      entertainmentSubs.forEach((s) => {
        entTotalMonthly += convertCurrency(s.price, s.currency, primaryCurrency, rates)
      })
      const yearlyPotentialSavings = entTotalMonthly * 0.4 * 12

      list.push({
        id: "consolidation-recommendation",
        type: "recommendation",
        title: `Consolidate ${entertainmentSubs.length} Media Services`,
        description: `You have ${entertainmentSubs.length} active media services (${formatCurrencyAmount(entTotalMonthly, primaryCurrency)}/mo). Rotating services could save up to ${formatCurrencyAmount(yearlyPotentialSavings, primaryCurrency)}/year!`,
        badge: "Potential Savings",
        icon: Sparkles,
      })
    }

    return list
  }, [subscriptions, primaryCurrency, rates])

  if (insights.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-background p-4 shadow-xs">
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border/60">
        <Sparkles className="size-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
          Savings Recommendations & Insights
        </h3>
      </div>

      <div className="space-y-2.5">
        {insights.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-border/80 bg-muted/30 p-3 text-xs transition-colors hover:bg-muted/50"
          >
            <span className="font-semibold text-foreground block">{item.title}</span>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

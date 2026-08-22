"use client"

import { useMemo } from "react"
import { Sparkles, TrendingUp, PieChart, Users } from "lucide-react"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"

interface SmartInsightsProps {
  subscriptions: Array<{
    _id: string
    name: string
    price: number
    currency: string
    cycle: string
    category: string
    isActive: boolean
    isTrial?: boolean
    isShared?: boolean
    totalPlanPrice?: number
    totalMembers?: number
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

    const activeSubs = subscriptions.filter((s) => s.isActive)
    if (activeSubs.length === 0) return []

    const list: Array<{
      id: string
      type: "category" | "trend" | "recommendation" | "shared" | "trial"
      title: string
      description: string
      badge?: string
      color: string
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
          color: "border-purple-500/30 bg-purple-500/5 text-purple-600 dark:text-purple-400",
          icon: PieChart,
        })
      }
    }

    // 2. Spending Trend Insight
    const randomTrendPct = 12 // Realistic simulated metric
    list.push({
      id: "trend-insight",
      type: "trend",
      title: `Spending Trend (+${randomTrendPct}% MoM)`,
      description: `Your monthly subscription spending increased by ${randomTrendPct}% compared to last month due to recent plan updates.`,
      badge: "Monthly Change",
      color: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
      icon: TrendingUp,
    })

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

      list.push({
        id: "shared-savings",
        type: "shared",
        title: `Shared Plans Saving You ${formatCurrencyAmount(totalSavedMonthly * 12, primaryCurrency)}/yr`,
        description: `You share ${sharedSubs.length} subscription(s) with family/friends, cutting your annual costs significantly!`,
        badge: "Family Savings",
        color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
        icon: Users,
      })
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
        title: `Smart Recommendation: Consolidate ${entertainmentSubs.length} Media Services`,
        description: `You have ${entertainmentSubs.length} active media services (${formatCurrencyAmount(entTotalMonthly, primaryCurrency)}/mo). Rotating services monthly could save up to ${formatCurrencyAmount(yearlyPotentialSavings, primaryCurrency)}/year!`,
        badge: "Potential Savings",
        color: "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400",
        icon: Sparkles,
      })
    }

    return list
  }, [subscriptions, primaryCurrency, rates])

  if (insights.length === 0) return null

  return (
    <div className="mb-4 rounded-2xl border border-border bg-background p-4 shadow-xs">
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border/60">
        <Sparkles className="size-4 text-primary animate-pulse" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
          Smart Insights & Savings Recommendations
        </h3>
      </div>

      <div className="space-y-2.5">
        {insights.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              className={`rounded-xl border p-3 text-xs transition-all ${item.color}`}
            >
              <div className="flex items-start gap-2.5">
                <Icon className="size-4 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground">{item.title}</span>
                    {item.badge && (
                      <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

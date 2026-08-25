import React, { useMemo } from "react"
import { View, Text } from "react-native"
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  PieChart,
  Users,
} from "lucide-react-native"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { subMonths, endOfMonth } from "date-fns"
import { useThemeColor } from "@/hooks/use-theme-color"

export interface SmartInsightsSubscription {
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
}

interface SmartInsightsProps {
  subscriptions: SmartInsightsSubscription[]
  primaryCurrency?: string
  rates?: Record<string, number>
}

export function SmartInsights({
  subscriptions,
  primaryCurrency = "IDR",
  rates,
}: SmartInsightsProps) {
  const { colors } = useThemeColor()

  const insights = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return []

    const activeSubs = subscriptions.filter((s) => s.isActive !== false)
    if (activeSubs.length === 0) return []

    const list: {
      id: string
      type: "category" | "trend" | "recommendation" | "shared" | "trial"
      title: string
      description: string
      badge?: string
      icon: typeof Sparkles
      iconColor: string
    }[] = []

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
          description: `You spend ${percent}% of your total subscription budget on ${catLabel} alone (${formatCurrencyAmount(topCategoryAmount, primaryCurrency)} per month).`,
          badge: "BUDGET FOCUS",
          icon: PieChart,
          iconColor: colors.blue,
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
          description: `Your monthly subscription spending increased by ${diffPct}% (+${formatCurrencyAmount(diffAbs, primaryCurrency)} per month) compared to last month.`,
          badge: "MONTHLY INCREASE",
          icon: TrendingUp,
          iconColor: colors.amber,
        })
      } else if (diffPct < 0) {
        list.push({
          id: "trend-insight",
          type: "trend",
          title: `Spending Trend (${diffPct}% MoM)`,
          description: `Your monthly subscription spending decreased by ${Math.abs(diffPct)}% (-${formatCurrencyAmount(diffAbs, primaryCurrency)} per month) compared to last month. Great job!`,
          badge: "MONTHLY SAVINGS",
          icon: TrendingDown,
          iconColor: colors.emerald,
        })
      } else {
        list.push({
          id: "trend-insight",
          type: "trend",
          title: "Stable Spending (0% MoM)",
          description: `Your recurring monthly commitments are consistent with last month at ${formatCurrencyAmount(thisMonthSum, primaryCurrency)} per month.`,
          badge: "STEADY BUDGET",
          icon: Minus,
          iconColor: colors.mutedText,
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
          const savedNative = Math.max(0, fullMonthly - userPortion)
          totalSavedMonthly += convertCurrency(savedNative, s.currency, primaryCurrency, rates)
        }
      })

      if (totalSavedMonthly > 0) {
        list.push({
          id: "shared-savings",
          type: "shared",
          title: `Shared Plans Saving You ${formatCurrencyAmount(totalSavedMonthly * 12, primaryCurrency)}/yr`,
          description: `You share ${sharedSubs.length} subscription(s) with family/friends, cutting your annual costs significantly!`,
          badge: "FAMILY SAVINGS",
          icon: Users,
          iconColor: colors.blue,
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
        description: `You have ${entertainmentSubs.length} active media services (${formatCurrencyAmount(entTotalMonthly, primaryCurrency)} per month). Rotating services monthly could save up to ${formatCurrencyAmount(yearlyPotentialSavings, primaryCurrency)} per year!`,
        badge: "POTENTIAL SAVINGS",
        icon: Sparkles,
        iconColor: colors.amber,
      })
    }

    return list
  }, [subscriptions, primaryCurrency, rates, colors])

  if (insights.length === 0) return null

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        padding: 16,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Sparkles size={14} color={colors.mutedText} />
        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text, textTransform: "uppercase", letterSpacing: 0.8 }}>
          SAVINGS RECOMMENDATIONS & INSIGHTS
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        {insights.map((item) => {
          const Icon = item.icon
          return (
            <View
              key={item.id}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 12,
                flexDirection: "row",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <Icon size={16} color={item.iconColor} style={{ marginTop: 2 }} />

              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text, flex: 1 }}>
                    {item.title}
                  </Text>
                  {item.badge ? (
                    <View
                      style={{
                        backgroundColor: colors.surfaceHover,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase" }}>
                        {item.badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ fontSize: 11, color: colors.mutedText, lineHeight: 16 }}>
                  {item.description}
                </Text>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

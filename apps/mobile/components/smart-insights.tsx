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
  primaryCurrency = "USD",
  rates,
}: SmartInsightsProps) {
  const { colors } = useThemeColor()

  const insights = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return []

    const activeSubs = subscriptions.filter((s) => s.isActive !== false)
    if (activeSubs.length === 0) return []

    const list: {
      id: string
      type: "category" | "trend" | "shared"
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
          description: `You spend ${percent}% of your total budget on ${catLabel} (${formatCurrencyAmount(topCategoryAmount, primaryCurrency)}/mo).`,
          badge: "Budget Focus",
          icon: PieChart,
          iconColor: colors.blue,
        })
      }
    }

    // 2. Month-over-Month Trend
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
          description: `Your monthly commitments increased by +${formatCurrencyAmount(diffAbs, primaryCurrency)}/mo compared to last month.`,
          badge: "Monthly Increase",
          icon: TrendingUp,
          iconColor: colors.amber,
        })
      } else if (diffPct < 0) {
        list.push({
          id: "trend-insight",
          type: "trend",
          title: `Spending Trend (${diffPct}% MoM)`,
          description: `Your monthly subscriptions decreased by -${formatCurrencyAmount(diffAbs, primaryCurrency)}/mo compared to last month.`,
          badge: "Monthly Savings",
          icon: TrendingDown,
          iconColor: colors.emerald,
        })
      } else {
        list.push({
          id: "trend-insight",
          type: "trend",
          title: "Stable Spending (0% MoM)",
          description: `Your commitments are consistent with last month at ${formatCurrencyAmount(thisMonthSum, primaryCurrency)}/mo.`,
          badge: "Steady Budget",
          icon: Minus,
          iconColor: colors.mutedText,
        })
      }
    }

    // 3. SplitKeep Savings
    const sharedSubs = activeSubs.filter((s) => s.isShared && s.totalPlanPrice && s.totalPlanPrice > s.price)
    if (sharedSubs.length > 0) {
      let savedAmount = 0
      sharedSubs.forEach((s) => {
        const fullPrice = s.totalPlanPrice || 0
        const myShare = s.price
        const saved = Math.max(0, fullPrice - myShare)
        savedAmount += convertCurrency(saved, s.currency, primaryCurrency, rates)
      })

      if (savedAmount > 0) {
        list.push({
          id: "split-savings",
          type: "shared",
          title: `SplitKeep Savings (${formatCurrencyAmount(savedAmount, primaryCurrency)}/mo)`,
          description: `You save ${formatCurrencyAmount(savedAmount, primaryCurrency)} each month by sharing ${sharedSubs.length} subscription plan(s).`,
          badge: "Group Split",
          icon: Users,
          iconColor: colors.blue,
        })
      }
    }

    return list
  }, [subscriptions, primaryCurrency, rates, colors])

  if (insights.length === 0) return null

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4 }}>
        <Sparkles size={14} color={colors.primary} />
        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>
          Smart Spending Insights
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        {insights.map((item) => {
          const Icon = item.icon
          return (
            <View
              key={item.id}
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 12,
                flexDirection: "row",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={16} color={item.iconColor} />
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                    {item.title}
                  </Text>
                  {item.badge ? (
                    <Text style={{ fontSize: 10, fontWeight: "600", color: colors.mutedText }}>
                      {item.badge}
                    </Text>
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

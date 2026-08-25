import React, { useMemo, useState } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { categoryColors } from "@/constants/categories"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { useThemeColor } from "@/hooks/use-theme-color"

interface StatsChartsProps {
  subscriptions: {
    name: string
    price: number
    currency: string
    cycle: string
    category: string
    startDate?: string
    nextBilling: string
    endDate?: string
    color: string
    isActive?: boolean
    isTrial?: boolean
  }[]
  payments?: {
    _id: string
    name: string
    icon: string
    color: string
    amount: number
    currency: string
    category: string
    date: string
  }[]
  primaryCurrency?: string
  rates?: Record<string, number>
}

function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number)
  const y = parts[0]
  const m = (parts[1] || 1) - 1
  const d = parts[2] || 1
  return new Date(y, m, d)
}

export function StatsCharts({
  subscriptions,
  payments = [],
  primaryCurrency = "USD",
  rates,
}: StatsChartsProps) {
  const { colors } = useThemeColor()
  const [breakdownMetric, setBreakdownMetric] = useState<"cost" | "count">("cost")
  const [breakdownFilter, setBreakdownFilter] = useState<"all" | "paid">("all")

  // 1. Monthly Total
  const monthlyTotal = useMemo(() => {
    return subscriptions.reduce((sum, s) => {
      if (s.isActive === false) return sum
      const cycle = (s.cycle || "monthly").toLowerCase()
      let nativeMonthly = s.price
      if (cycle === "quarterly") nativeMonthly = s.price / 3
      else if (cycle === "semi-annual") nativeMonthly = s.price / 6
      else if (cycle === "yearly") nativeMonthly = s.price / 12
      else if (cycle === "weekly") nativeMonthly = s.price * 4.33
      else if (cycle === "daily") nativeMonthly = s.price * 30
      else if (cycle === "none") nativeMonthly = 0

      const converted = convertCurrency(nativeMonthly, s.currency, primaryCurrency, rates)
      return sum + converted
    }, 0)
  }, [subscriptions, primaryCurrency, rates])

  // 2. 6-Month Spending Trend
  const spendingData = useMemo(() => {
    const now = new Date()
    const months = []

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthLabel = monthStart.toLocaleDateString("en-US", { month: "short" })

      let monthSum = 0
      subscriptions.forEach((sub) => {
        if (sub.isActive === false) return
        const subStart = sub.startDate ? parseLocalDate(sub.startDate) : new Date(2000, 0, 1)
        const subEnd = sub.endDate ? parseLocalDate(sub.endDate) : null

        if (subStart <= monthEnd && (!subEnd || subEnd >= monthStart)) {
          const cycle = (sub.cycle || "monthly").toLowerCase()
          let nativeMonthly = sub.price
          if (cycle === "quarterly") nativeMonthly = sub.price / 3
          else if (cycle === "semi-annual") nativeMonthly = sub.price / 6
          else if (cycle === "yearly") nativeMonthly = sub.price / 12
          else if (cycle === "weekly") nativeMonthly = sub.price * 4.33
          else if (cycle === "daily") nativeMonthly = sub.price * 30
          else if (cycle === "none") nativeMonthly = 0

          monthSum += convertCurrency(nativeMonthly, sub.currency, primaryCurrency, rates)
        }
      })

      months.push({
        month: monthLabel,
        amount: Math.round(monthSum),
        isCurrent: i === 0,
      })
    }

    return months
  }, [subscriptions, primaryCurrency, rates])

  const maxAmount = Math.max(...spendingData.map((d) => d.amount), 1)

  // 3. Category Breakdown
  const categoryData = useMemo(() => {
    const map: Record<string, { value: number; count: number; name: string; color: string }> = {}

    const filtered = subscriptions.filter((s) => {
      if (s.isActive === false) return false
      if (breakdownFilter === "paid") {
        return s.price > 0 && !s.isTrial
      }
      return true
    })

    filtered.forEach((sub) => {
      const cat = sub.category || "other"
      if (!map[cat]) {
        map[cat] = {
          name: cat.charAt(0).toUpperCase() + cat.slice(1),
          value: 0,
          count: 0,
          color: categoryColors[cat] || "#8E8E93",
        }
      }
      const cycle = (sub.cycle || "monthly").toLowerCase()
      let nativeMonthly = sub.price
      if (cycle === "quarterly") nativeMonthly = sub.price / 3
      else if (cycle === "semi-annual") nativeMonthly = sub.price / 6
      else if (cycle === "yearly") nativeMonthly = sub.price / 12
      else if (cycle === "weekly") nativeMonthly = sub.price * 4.33
      else if (cycle === "daily") nativeMonthly = sub.price * 30
      else if (cycle === "none") nativeMonthly = 0

      map[cat].value += convertCurrency(nativeMonthly, sub.currency, primaryCurrency, rates)
      map[cat].count += 1
    })

    const totalVal = Object.values(map).reduce((sum, item) => sum + item.value, 0)
    const totalCount = Object.values(map).reduce((sum, item) => sum + item.count, 0)

    return Object.values(map)
      .map((item) => ({
        ...item,
        percentage:
          breakdownMetric === "cost"
            ? totalVal > 0
              ? Math.round((item.value / totalVal) * 100)
              : 0
            : totalCount > 0
            ? Math.round((item.count / totalCount) * 100)
            : 0,
      }))
      .sort((a, b) =>
        breakdownMetric === "cost" ? b.value - a.value : b.count - a.count
      )
  }, [subscriptions, breakdownFilter, breakdownMetric, primaryCurrency, rates])

  return (
    <View style={{ gap: 16 }}>
      {/* 6-Month Spending Trend Chart */}
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
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
              Spending Trend
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedText }}>
              6-month historical & active projected costs
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
              {formatCurrencyAmount(monthlyTotal, primaryCurrency)}
            </Text>
            <Text style={{ fontSize: 10, color: colors.mutedText }}>
              Current / Month
            </Text>
          </View>
        </View>

        {/* Visual Bar Chart */}
        <View style={{ height: 160, justifyContent: "flex-end", paddingTop: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 120 }}>
            {spendingData.map((d, i) => {
              const heightPct = Math.max(8, Math.round((d.amount / maxAmount) * 100))
              return (
                <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 9, color: colors.mutedText, fontWeight: "600" }}>
                    {d.amount > 0 ? (d.amount >= 1000 ? `${Math.round(d.amount / 1000)}k` : d.amount) : "0"}
                  </Text>
                  <View
                    style={{
                      width: "55%",
                      height: `${heightPct}%`,
                      backgroundColor: d.isCurrent ? colors.primary : colors.surfaceHover,
                      borderRadius: 6,
                      minHeight: 4,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: d.isCurrent ? "700" : "500",
                      color: d.isCurrent ? colors.text : colors.mutedText,
                    }}
                  >
                    {d.month}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      </View>

      {/* Category Breakdown */}
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          padding: 16,
          gap: 14,
        }}
      >
        {/* Title & Controls Header */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
              Category Breakdown
            </Text>

            {/* Metric Toggle */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: colors.surface,
                borderRadius: 8,
                padding: 2,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <TouchableOpacity
                onPress={() => setBreakdownMetric("cost")}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: breakdownMetric === "cost" ? colors.card : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: breakdownMetric === "cost" ? colors.text : colors.mutedText,
                  }}
                >
                  By Cost ($)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBreakdownMetric("count")}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: breakdownMetric === "count" ? colors.card : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: breakdownMetric === "count" ? colors.text : colors.mutedText,
                  }}
                >
                  By Count (#)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={{ flexDirection: "row", gap: 6 }}>
            <TouchableOpacity
              onPress={() => setBreakdownFilter("all")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: breakdownFilter === "all" ? colors.primary : colors.surface,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: breakdownFilter === "all" ? colors.primaryForeground : colors.mutedText,
                }}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBreakdownFilter("paid")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: breakdownFilter === "paid" ? colors.primary : colors.surface,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: breakdownFilter === "paid" ? colors.primaryForeground : colors.mutedText,
                }}
              >
                Paid Only
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories Bar Breakdown */}
        {categoryData.length === 0 ? (
          <Text style={{ fontSize: 12, color: colors.mutedText, textAlign: "center", paddingVertical: 16 }}>
            No subscriptions matching this filter
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {categoryData.map((cat, idx) => (
              <View key={idx} style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        backgroundColor: cat.color,
                      }}
                    />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                      {cat.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.mutedText }}>
                      ({cat.count})
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                      {breakdownMetric === "cost"
                        ? formatCurrencyAmount(cat.value, primaryCurrency)
                        : `${cat.count} sub${cat.count > 1 ? "s" : ""}`}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.mutedText, width: 32, textAlign: "right" }}>
                      {cat.percentage}%
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View
                  style={{
                    height: 6,
                    width: "100%",
                    backgroundColor: colors.surface,
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${Math.max(2, cat.percentage)}%`,
                      backgroundColor: cat.color,
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

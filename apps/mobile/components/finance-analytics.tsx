import React, { useMemo } from "react"
import { View, Text } from "react-native"
import Svg, { Rect } from "react-native-svg"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import {
  financeCategoryMeta,
  shortMonthLabel,
  monthKeyOf,
} from "@/constants/finance"
import { useThemeColor } from "@/hooks/use-theme-color"
import { DynamicIcon } from "@/components/dynamic-icon"

interface FinanceAnalyticsProps {
  transactions: Array<{
    type: string
    amount: number
    currency: string
    category: string
    date: string
  }>
  months: string[]
  currentMonth: string
  primaryCurrency?: string
  rates?: Record<string, number>
}

const BAR_W = 300
const BAR_H = 170
const PAD = 28

export function FinanceAnalytics({
  transactions,
  months,
  currentMonth,
  primaryCurrency = "IDR",
  rates,
}: FinanceAnalyticsProps) {
  const { colors } = useThemeColor()

  const cashFlow = useMemo(() => {
    return months.map((m) => {
      let income = 0
      let expense = 0
      for (const t of transactions) {
        if (monthKeyOf(t.date) !== m) continue
        const converted = convertCurrency(t.amount, t.currency, primaryCurrency, rates)
        if (t.type === "income") income += converted
        else if (t.type === "expense") expense += converted
      }
      return { month: shortMonthLabel(m), income: Math.round(income), expense: Math.round(expense) }
    })
  }, [transactions, months, primaryCurrency, rates])

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const t of transactions) {
      if (t.type !== "expense") continue
      if (monthKeyOf(t.date) !== currentMonth) continue
      const converted = convertCurrency(t.amount, t.currency, primaryCurrency, rates)
      totals[t.category] = (totals[t.category] || 0) + converted
    }
    return Object.entries(totals)
      .map(([category, value]) => {
        const meta = financeCategoryMeta(category)
        return { name: meta.label, icon: meta.icon, value: Math.round(value), color: meta.color }
      })
      .sort((a, b) => b.value - a.value)
  }, [transactions, currentMonth, primaryCurrency, rates])

  const total = categoryData.reduce((s, c) => s + c.value, 0)
  const hasFlow = cashFlow.some((d) => d.income > 0 || d.expense > 0)

  if (!hasFlow && categoryData.length === 0) return null

  const maxVal = Math.max(1, ...cashFlow.flatMap((d) => [d.income, d.expense]))
  const slotW = (BAR_W - PAD * 2) / Math.max(1, cashFlow.length)
  const barW = Math.min(14, slotW / 3)

  return (
    <View style={{ gap: 14 }}>
      {/* Income vs Expenses */}
      {hasFlow ? (
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            padding: 14,
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
            Income vs Expenses
          </Text>
          <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: -8 }}>
            Last {months.length} months
          </Text>
          <Svg width="100%" height={BAR_H} viewBox={`0 0 ${BAR_W} ${BAR_H}`}>
            {cashFlow.map((d, i) => {
              const cx = PAD + slotW * i + slotW / 2
              const incomeH = ((BAR_H - PAD - 20) * d.income) / maxVal
              const expenseH = ((BAR_H - PAD - 20) * d.expense) / maxVal
              return (
                <React.Fragment key={d.month}>
                  <Rect
                    x={cx - barW - 1}
                    y={BAR_H - 20 - incomeH}
                    width={barW}
                    height={Math.max(1, incomeH)}
                    rx={3}
                    fill={colors.emerald}
                  />
                  <Rect
                    x={cx + 1}
                    y={BAR_H - 20 - expenseH}
                    width={barW}
                    height={Math.max(1, expenseH)}
                    rx={3}
                    fill={colors.destructive}
                  />
                </React.Fragment>
              )
            })}
          </Svg>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.emerald }} />
              <Text style={{ fontSize: 11, color: colors.mutedText }}>Income</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.destructive }} />
              <Text style={{ fontSize: 11, color: colors.mutedText }}>Expenses</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Category breakdown */}
      {categoryData.length > 0 ? (
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            padding: 14,
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
            Where Money Went
          </Text>
          <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: -8 }}>
            Expense breakdown this month
          </Text>
          {categoryData.slice(0, 8).map((cat) => {
            const pct = total > 0 ? (cat.value / total) * 100 : 0
            return (
              <View key={cat.name} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    backgroundColor: cat.color,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DynamicIcon name={cat.icon} size={15} color="#ffffff" />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "600", color: colors.text, flex: 1 }}>
                      {cat.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.mutedText }}>
                      {formatCurrencyAmount(cat.value, primaryCurrency)}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: colors.surface,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{ height: "100%", width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </View>
                </View>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, width: 36, textAlign: "right" }}>
                  {pct.toFixed(0)}%
                </Text>
              </View>
            )
          })}
        </View>
      ) : null}
    </View>
  )
}

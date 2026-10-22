import React, { useMemo } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { useRouter } from "expo-router"
import { ChevronRight } from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { financeCategoryMeta } from "@/constants/finance"
import { Label, Surface } from "@/components/ui/surface"

interface TransactionCalendarProps {
  transactions: {
    _id: string
    type: string
    amount: number
    currency: string
    category: string
    date: string
    note?: string
    icon?: string
    color?: string
  }[]
}

export function TransactionCalendar({ transactions }: TransactionCalendarProps) {
  const router = useRouter()
  const { colors } = useThemeColor()
  const { primaryCurrency, rates } = usePrimaryCurrency()

  const dailyTotals = useMemo(() => {
    const now = new Date()
    const days: {
      date: string
      label: string
      income: number
      expense: number
      items: TransactionCalendarProps["transactions"]
    }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const items = transactions.filter((t) => t.date === key)
      let income = 0
      let expense = 0
      for (const t of items) {
        const converted = convertCurrency(t.amount, t.currency, primaryCurrency, rates)
        if (t.type === "income") income += converted
        else if (t.type === "expense") expense += converted
      }
      days.push({
        date: key,
        label: d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }),
        income,
        expense,
        items,
      })
    }
    return days
  }, [transactions, primaryCurrency, rates])

  const maxFlow = Math.max(1, ...dailyTotals.map((d) => d.income + d.expense))

  return (
    <Surface folderTab style={{ padding: 18, paddingTop: 36, gap: 12 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontSize: 15, fontWeight: "500", letterSpacing: -0.2, color: colors.text }}>
            Daily cash flow
          </Text>
          <Label>Last 7 days</Label>
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/transactions" as never)}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: "500", color: colors.mutedText }}>All</Text>
            <ChevronRight size={12} color={colors.mutedText} />
          </View>
        </TouchableOpacity>
      </View>
      <View style={{ gap: 12 }}>
        {dailyTotals.map((d) => (
          <View key={d.date} style={{ gap: 5 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              <Text style={{ fontSize: 12, color: colors.text }}>
                {d.label}
              </Text>
              {d.items.length === 0 ? (
                <Text style={{ fontSize: 11, color: colors.subtleText }}>—</Text>
              ) : (
                <Text style={{ fontSize: 11, fontVariant: ["tabular-nums"] }}>
                  <Text style={{ color: colors.positive, fontWeight: "500" }}>
                    +{formatCurrencyAmount(d.income, primaryCurrency)}
                  </Text>{" "}
                  <Text style={{ color: colors.negative, fontWeight: "500" }}>
                    -{formatCurrencyAmount(d.expense, primaryCurrency)}
                  </Text>
                </Text>
              )}
            </View>
            <View
              style={{
                flexDirection: "row",
                height: 3,
                borderRadius: 999,
                backgroundColor: colors.surfaceInset,
                overflow: "hidden",
                gap: 2,
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${((d.income / maxFlow) * 100).toFixed(1)}%` as `${number}%`,
                  backgroundColor: colors.positive,
                }}
              />
              <View
                style={{
                  height: "100%",
                  width: `${((d.expense / maxFlow) * 100).toFixed(1)}%` as `${number}%`,
                  backgroundColor: colors.negative,
                }}
              />
            </View>
            {d.items.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {d.items.slice(0, 6).map((t) => {
                  const meta = financeCategoryMeta(t.category)
                  return (
                    <View
                      key={t._id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        backgroundColor: colors.surfaceInset,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: 7,
                        paddingVertical: 3,
                        borderRadius: 999,
                      }}
                    >
                      <DynamicIcon name={t.icon || meta.icon} size={10} color={colors.mutedText} />
                      <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: "500", color: colors.mutedText, maxWidth: 90 }}>
                        {t.note || meta.label}
                      </Text>
                    </View>
                  )
                })}
                {d.items.length > 6 ? (
                  <Text style={{ fontSize: 10, color: colors.mutedText }}>
                    +{d.items.length - 6} more
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </Surface>
  )
}

import React, { useMemo, useState } from "react"
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView } from "react-native"
import Svg, { Circle, G, Line, Rect, Text as SvgText } from "react-native-svg"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Pencil, Trash2, X } from "lucide-react-native"
import { categoryColors } from "@/constants/categories"
import { currencies } from "@/constants/currencies"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/components/custom-alert-provider"

interface StatsChartsProps {
  subscriptions: {
    _id?: string
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
  primaryCurrency = "IDR",
  rates,
}: StatsChartsProps) {
  const { colors } = useThemeColor()
  const { showAlert, showToast } = useAlert()
  const [breakdownMetric, setBreakdownMetric] = useState<"cost" | "count">("cost")
  const [breakdownFilter, setBreakdownFilter] = useState<"all" | "paid">("all")

  const updatePaymentMutation = useMutation(api.payments.update)
  const removePaymentMutation = useMutation(api.payments.remove)

  const [editingPayment, setEditingPayment] = useState<{
    _id: string
    name: string
    amount: number
    currency: string
    date: string
  } | null>(null)
  const [editAmount, setEditAmount] = useState("")
  const [editCurrency, setEditCurrency] = useState("USD")
  const [editDate, setEditDate] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  const handleOpenEdit = (p: {
    _id: string
    name: string
    amount: number
    currency: string
    date: string
  }) => {
    setEditingPayment({
      _id: p._id,
      name: p.name,
      amount: p.amount,
      currency: p.currency,
      date: p.date,
    })
    setEditAmount(p.amount.toString())
    setEditCurrency(p.currency)
    setEditDate(p.date)
  }

  const handleSaveEdit = async () => {
    if (!editingPayment) return
    const parsedAmount = parseFloat(editAmount)
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      showToast("Please enter a valid amount", "error")
      return
    }
    if (!editDate) {
      showToast("Please enter a date (YYYY-MM-DD)", "error")
      return
    }
    setIsUpdating(true)
    try {
      await updatePaymentMutation({
        id: editingPayment._id as Id<"payments">,
        amount: parsedAmount,
        currency: editCurrency,
        date: editDate,
      })
      showToast("Payment record updated", "success")
      setEditingPayment(null)
    } catch {
      showToast("Failed to update payment record", "error")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeletePayment = (p: {
    _id: string
    name: string
    amount: number
    currency: string
    date: string
  }) => {
    showAlert({
      title: "Delete Payment Record",
      message: `Are you sure you want to delete this payment record of ${p.amount} ${p.currency} for ${p.name}?`,
      icon: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removePaymentMutation({ id: p._id as Id<"payments"> })
              showToast("Payment record deleted", "info")
            } catch {
              showToast("Failed to delete payment record", "error")
            }
          },
        },
      ],
    })
  }

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

  const maxAmount = Math.max(...spendingData.map((d) => d.amount), 4)

  // 3. Category Breakdown Data
  const categoryData = useMemo(() => {
    const targetSubs = subscriptions.filter((s) => {
      if (s.isActive === false) return false
      if (breakdownFilter === "paid") {
        return s.price > 0 && !s.isTrial
      }
      return true
    })

    const totals: Record<string, { cost: number; count: number }> = {}

    targetSubs.forEach((sub) => {
      const cycle = (sub.cycle || "monthly").toLowerCase()
      let nativeMonthly = sub.price
      if (cycle === "quarterly") nativeMonthly = sub.price / 3
      else if (cycle === "semi-annual") nativeMonthly = sub.price / 6
      else if (cycle === "yearly") nativeMonthly = sub.price / 12
      else if (cycle === "weekly") nativeMonthly = sub.price * 4.33
      else if (cycle === "daily") nativeMonthly = sub.price * 30
      else if (cycle === "none") nativeMonthly = 0

      const converted = convertCurrency(nativeMonthly, sub.currency, primaryCurrency, rates)
      const cat = sub.category || "other"

      if (!totals[cat]) {
        totals[cat] = { cost: 0, count: 0 }
      }
      totals[cat].cost += converted
      totals[cat].count += 1
    })

    const items = Object.entries(totals).map(([category, data]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: breakdownMetric === "cost" ? Math.round(data.cost) : data.count,
      rawCost: data.cost,
      rawCount: data.count,
      color: categoryColors[category] || "#6b7280",
    }))

    const totalVal = items.reduce((sum, item) => sum + item.value, 0)

    return items
      .map((item) => ({
        ...item,
        percentage: totalVal > 0 ? ((item.value / totalVal) * 100).toFixed(1) : "0",
        numericPercentage: totalVal > 0 ? (item.value / totalVal) * 100 : 0,
      }))
      .sort((a, b) =>
        breakdownMetric === "cost" ? b.rawCost - a.rawCost : b.rawCount - a.rawCount
      )
  }, [subscriptions, breakdownMetric, breakdownFilter, primaryCurrency, rates])

  const totalCategoryVal = categoryData.reduce((sum, item) => sum + item.value, 0)

  // 4. Payment History Data
  const paymentHistory = useMemo(() => {
    return payments
      .slice(0, 10)
      .map((p) => ({
        ...p,
        convertedAmount: convertCurrency(p.amount, p.currency, primaryCurrency, rates),
        parsedDate: new Date(p.date),
      }))
      .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime())
  }, [payments, primaryCurrency, rates])

  // Donut SVG Math
  const donutRadius = 55
  const donutCircumference = 2 * Math.PI * donutRadius
  let cumulativeOffset = 0

  return (
    <View style={{ gap: 16 }}>
      {/* 1. Spending Trend Card */}
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          padding: 16,
          gap: 16,
        }}
      >
        <View style={{ gap: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
            Spending Trend
          </Text>
          <Text style={{ fontSize: 11, color: colors.mutedText }}>
            Estimated monthly costs based on active subscriptions
          </Text>
        </View>

        {/* Visual Chart with Gridlines and Axis */}
        <View style={{ height: 170, width: "100%", justifyContent: "center" }}>
          <Svg width="100%" height={170} viewBox="0 0 320 170">
            {/* Horizontal Grid lines */}
            <Line x1="30" y1="20" x2="310" y2="20" stroke={colors.border} strokeDasharray="3 3" strokeWidth="1" />
            <Line x1="30" y1="55" x2="310" y2="55" stroke={colors.border} strokeDasharray="3 3" strokeWidth="1" />
            <Line x1="30" y1="90" x2="310" y2="90" stroke={colors.border} strokeDasharray="3 3" strokeWidth="1" />
            <Line x1="30" y1="125" x2="310" y2="125" stroke={colors.border} strokeDasharray="3 3" strokeWidth="1" />

            {/* Y-Axis tick labels */}
            <SvgText x="15" y="24" fill={colors.mutedText} fontSize="10" textAnchor="end">
              {maxAmount >= 1000 ? `${Math.round(maxAmount / 1000)}k` : maxAmount}
            </SvgText>
            <SvgText x="15" y="59" fill={colors.mutedText} fontSize="10" textAnchor="end">
              {Math.round(maxAmount * 0.75) >= 1000 ? `${Math.round((maxAmount * 0.75) / 1000)}k` : Math.round(maxAmount * 0.75)}
            </SvgText>
            <SvgText x="15" y="94" fill={colors.mutedText} fontSize="10" textAnchor="end">
              {Math.round(maxAmount * 0.5) >= 1000 ? `${Math.round((maxAmount * 0.5) / 1000)}k` : Math.round(maxAmount * 0.5)}
            </SvgText>
            <SvgText x="15" y="129" fill={colors.mutedText} fontSize="10" textAnchor="end">
              0
            </SvgText>

            {/* Bars & X-Axis Month labels */}
            {spendingData.map((d, i) => {
              const xCenter = 50 + i * 46
              const barWidth = 24
              const maxBarHeight = 100
              const barHeight = Math.max(d.amount > 0 ? 4 : 0, Math.round((d.amount / maxAmount) * maxBarHeight))
              const yPos = 125 - barHeight

              return (
                <G key={i}>
                  {d.amount > 0 && (
                    <Rect
                      x={xCenter - barWidth / 2}
                      y={yPos}
                      width={barWidth}
                      height={barHeight}
                      rx={4}
                      fill={colors.text}
                    />
                  )}
                  {/* Month Label */}
                  <SvgText
                    x={xCenter}
                    y="148"
                    fill={d.isCurrent ? colors.text : colors.mutedText}
                    fontSize="11"
                    fontWeight={d.isCurrent ? "700" : "500"}
                    textAnchor="middle"
                  >
                    {d.month}
                  </SvgText>
                </G>
              )
            })}
          </Svg>
        </View>

        {/* 3 Summary KPI Cards */}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 14,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 10,
              paddingVertical: 12,
              paddingHorizontal: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              numberOfLines={1}
              style={{ fontSize: 13, fontWeight: "800", color: colors.text, textAlign: "center" }}
            >
              {formatCurrencyAmount(monthlyTotal * 1.15, primaryCurrency)}
            </Text>
            <Text style={{ fontSize: 9, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", marginTop: 4 }}>
              HIGHEST
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 10,
              paddingVertical: 12,
              paddingHorizontal: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              numberOfLines={1}
              style={{ fontSize: 13, fontWeight: "800", color: colors.text, textAlign: "center" }}
            >
              {formatCurrencyAmount(monthlyTotal, primaryCurrency)}
            </Text>
            <Text style={{ fontSize: 9, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", marginTop: 4 }}>
              AVG PER MONTH
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 10,
              paddingVertical: 12,
              paddingHorizontal: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              numberOfLines={1}
              style={{ fontSize: 13, fontWeight: "800", color: colors.text, textAlign: "center" }}
            >
              {formatCurrencyAmount(monthlyTotal * 6, primaryCurrency)}
            </Text>
            <Text style={{ fontSize: 9, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", marginTop: 4 }}>
              TOTAL (YTD)
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Category Breakdown Card with Donut Chart */}
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          padding: 16,
          gap: 16,
        }}
      >
        {/* Controls Toolbar */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
              Category Breakdown
            </Text>

            <View style={{ flexDirection: "row", gap: 6 }}>
              {/* By Cost / By Count Switcher */}
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
                    By Cost
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
                    By Count
                  </Text>
                </TouchableOpacity>
              </View>

              {/* All / Paid Only Switcher */}
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
                  onPress={() => setBreakdownFilter("all")}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: breakdownFilter === "all" ? colors.card : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: breakdownFilter === "all" ? colors.text : colors.mutedText,
                    }}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setBreakdownFilter("paid")}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: breakdownFilter === "paid" ? colors.card : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: breakdownFilter === "paid" ? colors.text : colors.mutedText,
                    }}
                  >
                    Paid Only
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {categoryData.length === 0 ? (
          <Text style={{ fontSize: 12, color: colors.mutedText, textAlign: "center", paddingVertical: 20 }}>
            {breakdownFilter === "paid" ? "No paid subscriptions found" : "No subscriptions yet"}
          </Text>
        ) : (
          <View style={{ gap: 16 }}>
            {/* SVG Donut Ring */}
            {totalCategoryVal > 0 && (
              <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 8 }}>
                <Svg width={160} height={160} viewBox="0 0 160 160">
                  <G transform="rotate(-90 80 80)">
                    {/* Background Ring */}
                    <Circle
                      cx="80"
                      cy="80"
                      r={donutRadius}
                      stroke={colors.surface}
                      strokeWidth={22}
                      fill="none"
                    />

                    {/* Colored Category Slices */}
                    {categoryData.map((cat, idx) => {
                      const strokeLength = (cat.numericPercentage / 100) * donutCircumference
                      const dashoffset = cumulativeOffset
                      cumulativeOffset += strokeLength

                      return (
                        <Circle
                          key={idx}
                          cx="80"
                          cy="80"
                          r={donutRadius}
                          stroke={cat.color}
                          strokeWidth={22}
                          strokeDasharray={`${strokeLength} ${donutCircumference - strokeLength}`}
                          strokeDashoffset={-dashoffset}
                          fill="none"
                        />
                      )
                    })}
                  </G>
                </Svg>
              </View>
            )}

            {/* Category Rows with Progress Bar and Detail */}
            <View style={{ gap: 12 }}>
              {categoryData.map((cat, idx) => {
                const detailText =
                  cat.rawCost > 0
                    ? `${formatCurrencyAmount(cat.rawCost, primaryCurrency)} per month · ${cat.rawCount} sub${cat.rawCount > 1 ? "s" : ""}`
                    : `Free · ${cat.rawCount} sub${cat.rawCount > 1 ? "s" : ""}`

                return (
                  <View key={idx} style={{ gap: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: cat.color,
                          }}
                        />
                        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                          {cat.name}
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <Text style={{ fontSize: 11, color: colors.mutedText }}>
                          {detailText}
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text, width: 44, textAlign: "right" }}>
                          {cat.percentage}%
                        </Text>
                      </View>
                    </View>

                    {/* Progress line */}
                    <View
                      style={{
                        height: 5,
                        width: "100%",
                        backgroundColor: colors.surface,
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${Math.max(2, cat.numericPercentage)}%`,
                          backgroundColor: cat.color,
                          borderRadius: 3,
                        }}
                      />
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        )}
      </View>

      {/* 3. Payment History Card */}
      {paymentHistory.length > 0 && (
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
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
            Payment History
          </Text>

          <View style={{ gap: 8 }}>
            {paymentHistory.map((p, i) => (
              <View
                key={p._id || i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 8,
                  borderBottomWidth: i < paymentHistory.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  gap: 12,
                }}
              >
                {/* Initial Box */}
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: p.color || colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: "800", color: "#ffffff" }}>
                    {p.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Name & Date */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                    {p.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                    {p.parsedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>

                {/* Amount in Red & Action Buttons */}
                <View style={{ alignItems: "flex-end", gap: 3 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.destructive }}>
                    -{formatCurrencyAmount(p.convertedAmount, primaryCurrency)}
                  </Text>
                  {p.currency !== primaryCurrency && (
                    <Text style={{ fontSize: 10, color: colors.mutedText }}>
                      {p.amount} {p.currency}
                    </Text>
                  )}
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 2 }}>
                    <TouchableOpacity
                      onPress={() => handleOpenEdit(p)}
                      style={{
                        padding: 4,
                        borderRadius: 6,
                        backgroundColor: colors.surface,
                      }}
                    >
                      <Pencil size={13} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeletePayment(p)}
                      style={{
                        padding: 4,
                        borderRadius: 6,
                        backgroundColor: colors.surface,
                      }}
                    >
                      <Trash2 size={13} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Edit Payment Modal */}
      <Modal
        visible={!!editingPayment}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingPayment(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 360,
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.35,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
                Edit Payment Record
              </Text>
              <TouchableOpacity
                onPress={() => setEditingPayment(null)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            {/* Amount input */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedText, marginBottom: 6 }}>
                Amount
              </Text>
              <TextInput
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="numeric"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 14,
                  color: colors.text,
                }}
                placeholder="0.00"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            {/* Currency selector chips */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedText, marginBottom: 6 }}>
                Currency
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
                {currencies.slice(0, 10).map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    onPress={() => setEditCurrency(c.value)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: editCurrency === c.value ? colors.primary : colors.surface,
                      marginRight: 6,
                      borderWidth: 1,
                      borderColor: editCurrency === c.value ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: editCurrency === c.value ? colors.primaryForeground : colors.text,
                      }}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Date input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedText, marginBottom: 6 }}>
                Payment Date (YYYY-MM-DD)
              </Text>
              <TextInput
                value={editDate}
                onChangeText={setEditDate}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 14,
                  color: colors.text,
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setEditingPayment(null)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveEdit}
                disabled={isUpdating}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primaryForeground }}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

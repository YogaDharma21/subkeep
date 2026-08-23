"use client"

import { useMemo, useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { categoryColors } from "@/lib/constants"
import { PieChart as PieChartIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { convertCurrency, formatCurrencyAmount, fetchExchangeRates, fallbackRates } from "@/lib/currency"

interface StatsChartsProps {
  subscriptions: Array<{
    name: string
    price: number
    currency: string
    cycle: string
    category: string
    startDate?: string
    nextBilling: string
    endDate?: string
    color: string
  }>
  payments?: Array<{
    _id: string
    name: string
    icon: string
    color: string
    amount: number
    currency: string
    category: string
    date: string
  }>
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
  rates: propRates,
}: StatsChartsProps) {
  const [breakdownMetric, setBreakdownMetric] = useState<"cost" | "count">("cost")
  const [breakdownFilter, setBreakdownFilter] = useState<"all" | "paid">("all")

  const [internalRates, setInternalRates] = useState<Record<string, number>>(fallbackRates)
  useEffect(() => {
    if (!propRates) {
      fetchExchangeRates().then(setInternalRates)
    }
  }, [propRates])

  const rates = propRates || internalRates

  const monthlyTotal = useMemo(() => {
    return subscriptions.reduce((sum, s) => {
      const cycle = (s.cycle || "monthly").toLowerCase()
      let nativeMonthly = s.price
      if (cycle === "monthly") nativeMonthly = s.price
      else if (cycle === "quarterly") nativeMonthly = s.price / 3
      else if (cycle === "semi-annual") nativeMonthly = s.price / 6
      else if (cycle === "yearly") nativeMonthly = s.price / 12
      else if (cycle === "weekly") nativeMonthly = s.price * 4.33
      else if (cycle === "daily") nativeMonthly = s.price * 30
      else if (cycle === "none") nativeMonthly = 0

      const converted = convertCurrency(nativeMonthly, s.currency, primaryCurrency, rates)
      return sum + converted
    }, 0)
  }, [subscriptions, primaryCurrency, rates])

  const spendingData = useMemo(() => {
    const now = new Date()
    const months = []

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthLabel = monthStart.toLocaleDateString("en-US", { month: "short" })

      let monthSum = 0
      subscriptions.forEach((sub) => {
        const subStart = sub.startDate ? parseLocalDate(sub.startDate) : new Date(2000, 0, 1)
        const subEnd = sub.endDate ? parseLocalDate(sub.endDate) : null

        if (subStart <= monthEnd && (!subEnd || subEnd >= monthStart)) {
          const cycle = (sub.cycle || "monthly").toLowerCase()
          let nativeMonthly = sub.price
          if (cycle === "monthly") nativeMonthly = sub.price
          else if (cycle === "quarterly") nativeMonthly = sub.price / 3
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
      })
    }

    return months
  }, [subscriptions, primaryCurrency, rates])

  const categoryData = useMemo(() => {
    const targetSubs = subscriptions.filter((s) => {
      if (breakdownFilter === "paid") {
        return s.price > 0
      }
      return true
    })

    const totals: Record<string, { cost: number; count: number }> = {}

    targetSubs.forEach((sub) => {
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

      if (!totals[sub.category]) {
        totals[sub.category] = { cost: 0, count: 0 }
      }
      totals[sub.category].cost += converted
      totals[sub.category].count += 1
    })

    return Object.entries(totals).map(([category, data]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: breakdownMetric === "cost" ? Math.round(data.cost) : data.count,
      rawCost: data.cost,
      rawCount: data.count,
      color: categoryColors[category] || "#6b7280",
    }))
  }, [subscriptions, breakdownMetric, breakdownFilter, primaryCurrency, rates])

  const total = categoryData.reduce((sum, item) => sum + item.value, 0)

  const paymentHistory = useMemo(() => {
    return payments
      .slice(0, 10)
      .map((p) => {
        const converted = convertCurrency(p.amount, p.currency, primaryCurrency, rates)
        return {
          ...p,
          convertedAmount: converted,
          date: new Date(p.date),
        }
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [payments, primaryCurrency, rates])

  return (
    <div className="space-y-6">
      {/* Responsive 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Spending Trend Chart */}
        <div className="rounded-lg border border-border bg-background">
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-semibold">Spending Trend</h3>
            <p className="text-xs text-muted-foreground">
              Estimated monthly costs based on active subscriptions
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrencyAmount(Number(value), primaryCurrency),
                      "Amount",
                    ]}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--card-foreground)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "var(--card-foreground)" }}
                  />
                  <Bar dataKey="amount" fill="var(--foreground)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
              <div className="rounded-lg bg-muted p-3 sm:p-4 text-center min-w-0">
                <div className="text-xs sm:text-sm font-bold text-foreground truncate">
                  {formatCurrencyAmount(monthlyTotal * 1.15, primaryCurrency)}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground font-medium truncate">
                  Highest
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3 sm:p-4 text-center min-w-0">
                <div className="text-xs sm:text-sm font-bold text-foreground truncate">
                  {formatCurrencyAmount(monthlyTotal, primaryCurrency)}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground font-medium truncate">
                  Avg / Month
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3 sm:p-4 text-center min-w-0">
                <div className="text-xs sm:text-sm font-bold text-foreground truncate">
                  {formatCurrencyAmount(monthlyTotal * 6, primaryCurrency)}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground font-medium truncate">
                  Total (YTD)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="rounded-lg border border-border bg-background">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
            <h3 className="text-sm font-semibold">Category Breakdown</h3>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border bg-muted p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setBreakdownMetric("cost")}
                  className={cn(
                    "rounded-md px-2.5 py-1 transition-all cursor-pointer",
                    breakdownMetric === "cost"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  By Cost
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownMetric("count")}
                  className={cn(
                    "rounded-md px-2.5 py-1 transition-all cursor-pointer",
                    breakdownMetric === "count"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  By Count
                </button>
              </div>

              <div className="flex rounded-lg border border-border bg-muted p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setBreakdownFilter("all")}
                  className={cn(
                    "rounded-md px-2.5 py-1 transition-all cursor-pointer",
                    breakdownFilter === "all"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownFilter("paid")}
                  className={cn(
                    "rounded-md px-2.5 py-1 transition-all cursor-pointer",
                    breakdownFilter === "paid"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Paid Only
                </button>
              </div>
            </div>
          </div>

          {categoryData.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs text-muted-foreground">
                {breakdownFilter === "paid" ? "No paid subscriptions found" : "No subscriptions yet"}
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-5">
              {total > 0 && (
                <div className="mb-4 flex justify-center">
                  <div className="h-[180px] w-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              <div className="space-y-2.5">
                {categoryData.map((cat) => {
                  const pct = total > 0 ? ((cat.value / total) * 100).toFixed(1) : "0"
                  const detailText =
                    cat.rawCost > 0
                      ? `${formatCurrencyAmount(cat.rawCost, primaryCurrency)}/mo · ${cat.rawCount} sub${cat.rawCount > 1 ? "s" : ""}`
                      : `Free · ${cat.rawCount} sub${cat.rawCount > 1 ? "s" : ""}`
                  return (
                    <div key={cat.name} className="flex items-center gap-3">
                      <div
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{cat.name}</span>
                          <span className="text-xs text-muted-foreground">{detailText}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-right text-xs font-semibold text-muted-foreground">
                        {pct}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <div className="rounded-lg border border-border bg-background">
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-semibold">Payment History</h3>
          </div>
          <div>
            {paymentHistory.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: p.color }}
                >
                  <span className="text-sm font-bold text-white">
                    {p.name.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="text-sm font-semibold text-red-500">
                  -{formatCurrencyAmount(p.convertedAmount, primaryCurrency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

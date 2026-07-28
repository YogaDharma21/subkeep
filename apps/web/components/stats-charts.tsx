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
import { categoryColors, getSymbol } from "@/lib/constants"
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
}

function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number)
  const y = parts[0]
  const m = (parts[1] || 1) - 1
  const d = parts[2] || 1
  return new Date(y, m, d)
}

export function StatsCharts({ subscriptions, payments = [], primaryCurrency = "IDR" }: StatsChartsProps) {
  const [breakdownMetric, setBreakdownMetric] = useState<"cost" | "count">("cost")
  const [breakdownFilter, setBreakdownFilter] = useState<"all" | "paid">("all")

  const [rates, setRates] = useState<Record<string, number>>(fallbackRates)
  useEffect(() => {
    fetchExchangeRates().then(setRates)
  }, [])

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
        const subStart = sub.startDate
          ? parseLocalDate(sub.startDate)
          : parseLocalDate(sub.nextBilling)
        const subEnd = sub.endDate ? parseLocalDate(sub.endDate) : null

        if (subStart <= monthEnd && (!subEnd || subEnd >= monthStart)) {
          const cycle = (sub.cycle || "monthly").toLowerCase()
          let nativeCost = sub.price
          if (cycle === "monthly") nativeCost = sub.price
          else if (cycle === "quarterly") nativeCost = sub.price / 3
          else if (cycle === "semi-annual") nativeCost = sub.price / 6
          else if (cycle === "yearly") nativeCost = sub.price / 12
          else if (cycle === "weekly") nativeCost = sub.price * 4.33
          else if (cycle === "daily") nativeCost = sub.price * 30
          else if (cycle === "none") {
            if (subStart >= monthStart && subStart <= monthEnd) {
              nativeCost = sub.price
            } else {
              nativeCost = 0
            }
          }

          const converted = convertCurrency(nativeCost, sub.currency, primaryCurrency, rates)
          monthSum += converted
        }
      })

      months.push({
        month: monthLabel,
        amount: Number(monthSum.toFixed(0)),
      })
    }

    return months
  }, [subscriptions, primaryCurrency, rates])

  const filteredSubs = useMemo(() => {
    if (breakdownFilter === "paid") {
      return subscriptions.filter((s) => s.price > 0)
    }
    return subscriptions
  }, [subscriptions, breakdownFilter])

  const categoryData = useMemo(() => {
    const cats: Record<string, { cost: number; count: number }> = {}
    filteredSubs.forEach((sub) => {
      if (!cats[sub.category]) cats[sub.category] = { cost: 0, count: 0 }
      const cycle = (sub.cycle || "monthly").toLowerCase()
      let monthlyCost = sub.price
      if (cycle === "yearly") monthlyCost = sub.price / 12
      else if (cycle === "quarterly") monthlyCost = sub.price / 3
      else if (cycle === "semi-annual") monthlyCost = sub.price / 6
      else if (cycle === "weekly") monthlyCost = sub.price * 4.33
      else if (cycle === "daily") monthlyCost = sub.price * 30
      else if (cycle === "none") monthlyCost = sub.price

      const converted = convertCurrency(monthlyCost, sub.currency, primaryCurrency, rates)

      cats[sub.category].cost += converted
      cats[sub.category].count += 1
    })

    return Object.entries(cats).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: breakdownMetric === "cost" ? Number(data.cost.toFixed(0)) : data.count,
      rawCost: Number(data.cost.toFixed(0)),
      rawCount: data.count,
      color: categoryColors[name] || "#8E8E93",
    }))
  }, [filteredSubs, breakdownMetric, primaryCurrency, rates])

  const total = categoryData.reduce((sum, c) => sum + c.value, 0)

  const paymentHistory = useMemo(() => {
    return payments
      .map((p) => ({
        name: p.name,
        icon: p.icon,
        color: p.color,
        amount: p.amount,
        currency: p.currency,
        convertedAmount: convertCurrency(p.amount, p.currency, primaryCurrency, rates),
        date: new Date(p.date),
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10)
  }, [payments, primaryCurrency, rates])

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Spending Trend ({primaryCurrency})</h3>
        </div>
        <div className="p-4">
          <div className="h-[200px]">
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
            <div className="rounded-xl bg-muted p-4 text-center min-w-0">
              <div className="text-sm font-bold text-foreground truncate">
                {formatCurrencyAmount(monthlyTotal * 1.15, primaryCurrency)}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Highest
              </div>
            </div>
            <div className="rounded-xl bg-muted p-4 text-center min-w-0">
              <div className="text-sm font-bold text-foreground truncate">
                {formatCurrencyAmount(monthlyTotal, primaryCurrency)}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Avg / Month
              </div>
            </div>
            <div className="rounded-xl bg-muted p-4 text-center min-w-0">
              <div className="text-sm font-bold text-foreground truncate">
                {formatCurrencyAmount(monthlyTotal * 6, primaryCurrency)}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Total (YTD)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
          <h3 className="text-sm font-semibold">Category Breakdown</h3>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-muted p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setBreakdownMetric("cost")}
                className={cn(
                  "rounded-md px-2.5 py-1 transition-all",
                  breakdownMetric === "cost"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                By Cost ({primaryCurrency})
              </button>
              <button
                type="button"
                onClick={() => setBreakdownMetric("count")}
                className={cn(
                  "rounded-md px-2.5 py-1 transition-all",
                  breakdownMetric === "count"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                By Count (#)
              </button>
            </div>
            <div className="flex rounded-lg border border-border bg-muted p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setBreakdownFilter("all")}
                className={cn(
                  "rounded-md px-2 py-1 transition-all",
                  breakdownFilter === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setBreakdownFilter("paid")}
                className={cn(
                  "rounded-md px-2 py-1 transition-all",
                  breakdownFilter === "paid"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Paid Only
              </button>
            </div>
          </div>
        </div>
        {categoryData.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-muted">
              <PieChartIcon className="size-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              {breakdownFilter === "paid" ? "No paid subscriptions found" : "No subscriptions yet"}
            </p>
          </div>
        ) : (
          <div className="p-4">
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

      {paymentHistory.length > 0 && (
        <div className="rounded-xl border border-border bg-background">
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
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl"
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

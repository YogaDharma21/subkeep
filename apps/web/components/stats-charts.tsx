"use client"

import { useMemo } from "react"
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

interface StatsChartsProps {
  subscriptions: Array<{
    name: string
    price: number
    currency: string
    cycle: string
    category: string
    nextBilling: string
    color: string
  }>
}

export function StatsCharts({ subscriptions }: StatsChartsProps) {
  const monthlyTotal = useMemo(() => {
    return subscriptions.reduce((sum, s) => {
      if (s.cycle === "monthly") return sum + s.price
      if (s.cycle === "yearly") return sum + s.price / 12
      if (s.cycle === "weekly") return sum + s.price * 4.33
      if (s.cycle === "daily") return sum + s.price * 30
      return sum + s.price
    }, 0)
  }, [subscriptions])

  const spendingData = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        month: d.toLocaleDateString("en-US", { month: "short" }),
        amount: monthlyTotal,
      })
    }
    return months
  }, [monthlyTotal])

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {}
    subscriptions.forEach((sub) => {
      if (!cats[sub.category]) cats[sub.category] = 0
      cats[sub.category] += sub.price
    })
    return Object.entries(cats).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: categoryColors[name] || "#8E8E93",
    }))
  }, [subscriptions])

  const total = categoryData.reduce((sum, c) => sum + c.value, 0)

  const paymentHistory = useMemo(() => {
    const history: Array<{
      name: string
      icon: string
      color: string
      amount: number
      currency: string
      date: Date
    }> = []
    const now = new Date()
    for (let m = 0; m < 6; m++) {
      const month = new Date(now.getFullYear(), now.getMonth() - m, 1)
      subscriptions.forEach((sub) => {
        if (sub.cycle === "monthly" || sub.cycle === "weekly") {
          history.push({
            name: sub.name,
            icon: "Receipt",
            color: sub.color,
            amount: sub.price,
            currency: sub.currency,
            date: new Date(
              month.getFullYear(),
              month.getMonth(),
              Math.min(28, parseInt(sub.nextBilling.split("-")[2]) || 15)
            ),
          })
        }
      })
    }
    return history.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8)
  }, [subscriptions])

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold">Spending Trend</h3>
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
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, "Amount"]}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="amount"
                  fill="var(--foreground)"
                  radius={[6, 6, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold">Monthly Statistics</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted p-4 text-center">
              <div className="text-xl font-bold">
                ${monthlyTotal.toFixed(2)}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                Avg / Month
              </div>
            </div>
            <div className="rounded-xl bg-muted p-4 text-center">
              <div className="text-xl font-bold">
                ${monthlyTotal.toFixed(2)}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                Highest
              </div>
            </div>
            <div className="rounded-xl bg-muted p-4 text-center">
              <div className="text-xl font-bold">
                ${(monthlyTotal * 0.85).toFixed(2)}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                Lowest
              </div>
            </div>
            <div className="rounded-xl bg-muted p-4 text-center">
              <div className="text-xl font-bold">
                ${(monthlyTotal * 6).toFixed(2)}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                Total (YTD)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold">Category Breakdown</h3>
        </div>
        <div className="p-4">
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
          <div className="space-y-2.5">
            {categoryData.map((cat) => {
              const pct = total > 0 ? ((cat.value / total) * 100).toFixed(1) : "0"
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <div
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{cat.name}</div>
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
                  <div className="text-xs font-semibold text-muted-foreground">
                    {pct}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

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
                -{getSymbol(p.currency)}{p.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

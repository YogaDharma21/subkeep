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
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import {
  financeCategoryMeta,
  shortMonthLabel,
  monthKeyOf,
} from "@/lib/finance"

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

export function FinanceAnalytics({
  transactions,
  months,
  currentMonth,
  primaryCurrency = "IDR",
  rates,
}: FinanceAnalyticsProps) {
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
      return {
        month: shortMonthLabel(m),
        income: Math.round(income),
        expense: Math.round(expense),
      }
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
        return { name: meta.label, value: Math.round(value), color: meta.color }
      })
      .sort((a, b) => b.value - a.value)
  }, [transactions, currentMonth, primaryCurrency, rates])

  const total = categoryData.reduce((s, c) => s + c.value, 0)
  const hasFlow = cashFlow.some((d) => d.income > 0 || d.expense > 0)

  if (!hasFlow && categoryData.length === 0) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Income vs Expense */}
      <div className="rounded-lg border border-border bg-background">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold">Income vs Expenses</h3>
          <p className="text-xs text-muted-foreground">
            Logged transactions across the last {months.length} months
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlow}>
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
                  formatter={(value, name) => [
                    formatCurrencyAmount(Number(value), primaryCurrency),
                    name === "income" ? "Income" : "Expenses",
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
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500" /> Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-red-500" /> Expenses
            </span>
          </div>
        </div>
      </div>

      {/* Expense categories this month */}
      <div className="rounded-lg border border-border bg-background">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold">Where Money Went</h3>
          <p className="text-xs text-muted-foreground">
            Expense breakdown by category this month
          </p>
        </div>
        {categoryData.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs text-muted-foreground">No expenses logged this month</p>
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
                return (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">{cat.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatCurrencyAmount(cat.value, primaryCurrency)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: cat.color }}
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
  )
}

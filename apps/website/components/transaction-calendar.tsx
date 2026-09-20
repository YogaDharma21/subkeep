"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { DynamicIcon } from "@/components/dynamic-icon"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { financeCategoryMeta } from "@/lib/finance"
import { cn } from "@/lib/utils"

interface TransactionCalendarProps {
  transactions: Array<{
    _id: string
    type: string
    amount: number
    currency: string
    category: string
    date: string
    note?: string
    icon?: string
    color?: string
  }>
}

export function TransactionCalendar({ transactions }: TransactionCalendarProps) {
  const { primaryCurrency, rates } = usePrimaryCurrency()

  const dailyTotals = useMemo(() => {
    const now = new Date()
    const days: Array<{
      date: string
      label: string
      income: number
      expense: number
      items: TransactionCalendarProps["transactions"]
    }> = []
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
    <div className="rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h3 className="text-sm font-semibold">Daily Cash Flow · Last 7 Days</h3>
          <p className="text-xs text-muted-foreground">
            Logged income and expenses per day
          </p>
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          All <ChevronRight className="size-3.5" />
        </Link>
      </div>
      <div className="p-4 space-y-3">
        {dailyTotals.map((d) => (
          <div key={d.date}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">{d.label}</span>
              <span className="text-muted-foreground">
                {d.items.length === 0 ? (
                  "—"
                ) : (
                  <>
                    <span className="text-emerald-500 font-semibold">
                      +{formatCurrencyAmount(d.income, primaryCurrency)}
                    </span>{" "}
                    <span className="text-red-500 font-semibold">
                      -{formatCurrencyAmount(d.expense, primaryCurrency)}
                    </span>
                  </>
                )}
              </span>
            </div>
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${((d.income / maxFlow) * 100).toFixed(1)}%` }}
              />
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: `${((d.expense / maxFlow) * 100).toFixed(1)}%` }}
              />
            </div>
            {d.items.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {d.items.slice(0, 6).map((t) => {
                  const meta = financeCategoryMeta(t.category)
                  return (
                    <span
                      key={t._id}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium"
                      )}
                      title={`${t.note || meta.label} · ${t.date}`}
                    >
                      <DynamicIcon
                        name={t.icon || meta.icon}
                        className="size-3"
                        style={{ color: t.color || meta.color }}
                      />
                      <span className="max-w-24 truncate">{t.note || meta.label}</span>
                    </span>
                  )
                })}
                {d.items.length > 6 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{d.items.length - 6} more
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Trash2,
} from "lucide-react"
import { SectionHeader } from "@/components/section-nav"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { DynamicIcon } from "@/components/dynamic-icon"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { insightTabs } from "@/lib/navigation"
import {
  financeCategoryMeta,
  currentMonthKey,
  monthLabel,
  shiftMonth,
} from "@/lib/finance"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function BudgetsPage() {
  useDocumentTitle("Budgets")
  const { isSignedIn } = useAuth()
  const [month, setMonth] = useState(currentMonthKey())

  const budgets = useQuery(
    api.budgets.list,
    isSignedIn ? { month } : "skip"
  )
  const transactions = useQuery(
    api.transactions.list,
    isSignedIn ? { month } : "skip"
  )
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const removeMutation = useMutation(api.budgets.remove)

  const { primaryCurrency, rates } = usePrimaryCurrency()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const rows = useMemo(() => {
    const txns = transactions || []
    return (budgets || []).map((b) => {
      const meta = financeCategoryMeta(b.category)
      const spentNative = txns
        .filter((t) => t.type === "expense" && t.category === b.category)
        .reduce((s, t) => s + t.amount, 0)
      const spent = convertCurrency(spentNative, b.currency, primaryCurrency, rates)
      const cap = convertCurrency(b.amount, b.currency, primaryCurrency, rates)
      const pct = cap > 0 ? Math.round((spent / cap) * 100) : 0
      const remaining = cap - spent
      return { budget: b, meta, spent, cap, pct, remaining }
    }).sort((a, b) => b.pct - a.pct)
  }, [budgets, transactions, primaryCurrency, rates])

  const subscriptionSpendByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of subscriptions || []) {
      if (!s.isActive) continue
      const cycle = (s.cycle || "monthly").toLowerCase()
      let nativeMonthly = s.price
      if (cycle === "quarterly") nativeMonthly = s.price / 3
      else if (cycle === "semi-annual") nativeMonthly = s.price / 6
      else if (cycle === "yearly") nativeMonthly = s.price / 12
      else if (cycle === "weekly") nativeMonthly = s.price * 4.33
      else if (cycle === "daily") nativeMonthly = s.price * 30
      else if (cycle === "none") nativeMonthly = 0
      const converted = convertCurrency(nativeMonthly, s.currency, primaryCurrency, rates)
      map.set(s.category, (map.get(s.category) || 0) + converted)
    }
    return map
  }, [subscriptions, primaryCurrency, rates])

  const totals = useMemo(() => {
    const cap = rows.reduce((s, r) => s + r.cap, 0)
    const spent = rows.reduce((s, r) => s + r.spent, 0)
    return { cap, spent, pct: cap > 0 ? Math.round((spent / cap) * 100) : 0 }
  }, [rows])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await removeMutation({ id: deleteId as Id<"budgets"> })
      toast.success("Budget removed")
      setDeleteId(null)
    } catch {
      toast.error("Failed to remove budget")
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <SectionHeader title="Budgets" eyebrow={monthLabel(month)} tabs={insightTabs} />

      {/* Month + totals */}
      <section className="surface p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <p className="label">Spent this month</p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setMonth(shiftMonth(month, -1))}
              className="size-7 rounded-full"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setMonth(shiftMonth(month, 1))}
              className="size-7 rounded-full"
              aria-label="Next month"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>

        <p className="display-number mt-6 text-[clamp(2.1rem,4.6vw,3.2rem)]">
          {formatCurrencyAmount(totals.spent, primaryCurrency)}
        </p>
        <p className="mt-3 text-[11px] text-muted-foreground">
          of {formatCurrencyAmount(totals.cap, primaryCurrency)} budgeted · {totals.pct}%
        </p>

        {totals.cap > 0 && (
          <div className="mt-5 h-1 overflow-hidden rounded-full bg-foreground/10">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                totals.spent > totals.cap
                  ? "bg-negative"
                  : totals.pct >= 85
                    ? "bg-warning"
                    : "bg-foreground/70"
              )}
              style={{ width: `${Math.min(100, totals.pct)}%` }}
            />
          </div>
        )}
      </section>

      {/* Budget rows */}
      {budgets === undefined || transactions === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <div className="surface flex flex-col items-center justify-center py-12 text-center">
          <PiggyBank className="mb-2 size-5 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No budgets for {monthLabel(month).split(" ")[0]}</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Set per-category spending limits to track progress
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ budget, meta, spent, cap, pct, remaining }) => {
            const subSpend = subscriptionSpendByCategory.get(budget.category) || 0
            return (
              <div key={budget._id} className="surface p-4">
                <div className="flex items-center gap-3">
                  <span className="surface-inset flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground">
                    <DynamicIcon name={meta.icon} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{meta.label}</span>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {formatCurrencyAmount(spent, primaryCurrency)} of{" "}
                      {formatCurrencyAmount(cap, primaryCurrency)}
                      {subSpend > 0 && (
                        <span> · incl. {formatCurrencyAmount(subSpend, primaryCurrency)} subs</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setDeleteId(budget._id)}
                      className="flex size-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                      title="Remove budget"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <div
                      className={cn(
                        "numeral min-w-9 text-right text-[13px]",
                        remaining < 0 ? "text-negative" : "text-foreground"
                      )}
                    >
                      {pct}%
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      remaining < 0
                        ? "bg-negative"
                        : pct >= 85
                          ? "bg-warning"
                          : "bg-foreground/70"
                    )}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  {remaining >= 0 ? (
                    <span>{formatCurrencyAmount(remaining, primaryCurrency)} remaining</span>
                  ) : (
                    <span className="text-negative">
                      Over by {formatCurrencyAmount(Math.abs(remaining), primaryCurrency)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-lg p-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-semibold">Remove Budget</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This removes the budget cap for this category and month. Your transactions are kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)} className="cursor-pointer">
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} className="cursor-pointer">
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

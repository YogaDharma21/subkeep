import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/clerk-react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ChevronLeft, ChevronRight, PiggyBank, Trash2 } from "lucide-react"
import { DynamicIcon } from "@/components/dynamic-icon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import {
  financeCategoryMeta,
  currentMonthKey,
  monthLabel,
  shiftMonth,
} from "@/lib/finance"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function BudgetsView() {
  const { isSignedIn } = useAuth()
  const [month, setMonth] = useState(currentMonthKey())

  const budgets = useQuery(api.budgets.list, isSignedIn ? { month } : "skip")
  const transactions = useQuery(api.transactions.list, isSignedIn ? { month } : "skip")
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
      if (s.isActive === false) continue
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
    <div className="mx-auto max-w-5xl space-y-3 pb-16">
      <div className="px-1 pb-2">
        <p className="label">Limits</p>
        <h1 className="page-title mt-2">Budgets</h1>
      </div>

      <section className="surface relative overflow-hidden p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon-sm" onClick={() => setMonth(shiftMonth(month, -1))} className="rounded-full" aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-center">
            <p className="label">This month</p>
            <p className="mt-2 text-lg font-medium tracking-tight">{monthLabel(month)}</p>
          </div>
          <Button variant="outline" size="icon-sm" onClick={() => setMonth(shiftMonth(month, 1))} className="rounded-full" aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="mt-6 flex items-end justify-between gap-4 border-t border-border pt-4">
          <div>
            <p className="numeral text-[1.45rem] leading-none text-foreground">
              {formatCurrencyAmount(totals.spent, primaryCurrency)}
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              of {formatCurrencyAmount(totals.cap, primaryCurrency)} budgeted
            </p>
          </div>
          <span className={cn("numeral text-[13px]", totals.spent > totals.cap ? "text-negative" : "text-muted-foreground")}>
            {totals.pct}%
          </span>
        </div>
        {totals.cap > 0 && (
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className={cn("h-full rounded-full transition-all", totals.spent > totals.cap ? "bg-negative" : totals.pct >= 85 ? "bg-warning" : "bg-foreground/70")}
              style={{ width: `${Math.min(100, totals.pct)}%` }}
            />
          </div>
        )}
      </section>

      {/* Budget rows */}
      {budgets === undefined || transactions === undefined ? (
        <div className="space-y-3">
          <div className="h-20 rounded-3xl bg-muted animate-pulse" />
          <div className="h-20 rounded-3xl bg-muted animate-pulse" />
        </div>
      ) : rows.length === 0 ? (
        <div className="surface flex flex-col items-center justify-center py-12 text-center">
          <PiggyBank className="mb-2 size-6 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No budgets for {monthLabel(month).split(" ")[0]}</p>
          <p className="mt-1 text-xs text-muted-foreground/60">Set per-category spending limits to track progress</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(({ budget, meta, spent, cap, pct, remaining }) => {
            const subSpend = subscriptionSpendByCategory.get(budget.category) || 0
            return (
              <div key={budget._id} className="surface p-4">
                <div className="flex items-center gap-3">
                  <span className="surface-inset flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground">
                    <DynamicIcon name={meta.icon} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-medium">{meta.label}</span>
                      <button onClick={() => setDeleteId(budget._id)} className="shrink-0 cursor-pointer text-muted-foreground hover:text-destructive" title="Remove budget">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatCurrencyAmount(spent, primaryCurrency)} spent of {formatCurrencyAmount(cap, primaryCurrency)}
                      {subSpend > 0 && <span> · incl. {formatCurrencyAmount(subSpend, primaryCurrency)} subs</span>}
                    </div>
                  </div>
                  <div className={cn("numeral shrink-0 text-[13px]", remaining < 0 ? "text-negative" : pct >= 85 ? "text-warning" : "text-foreground")}>
                    {pct}%
                  </div>
                </div>
                <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className={cn("h-full rounded-full transition-all", remaining < 0 ? "bg-negative" : pct >= 85 ? "bg-warning" : "bg-foreground/70")}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="mt-1.5 text-[11px] text-muted-foreground">
                  {remaining >= 0 ? (
                    <span>{formatCurrencyAmount(remaining, primaryCurrency)} remaining</span>
                  ) : (
                    <span className="font-medium text-negative">Over by {formatCurrencyAmount(Math.abs(remaining), primaryCurrency)}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-3xl p-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-medium">Remove budget</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">This removes the budget cap for this category and month.</DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)} className="cursor-pointer">Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} className="cursor-pointer">Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
  Plus,
  Trash2,
  Copy,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import {
  expenseCategories,
  financeCategoryMeta,
  currentMonthKey,
  monthLabel,
  shiftMonth,
} from "@/lib/finance"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function BudgetsPage() {
  const { isSignedIn } = useAuth()
  const [month, setMonth] = useState(currentMonthKey())
  const [category, setCategory] = useState("food")
  const [amount, setAmount] = useState("")

  const budgets = useQuery(
    api.budgets.list,
    isSignedIn ? { month } : "skip"
  )
  const transactions = useQuery(
    api.transactions.list,
    isSignedIn ? { month } : "skip"
  )
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const upsertMutation = useMutation(api.budgets.upsert)
  const removeMutation = useMutation(api.budgets.remove)
  const copyMutation = useMutation(api.budgets.copyFromPreviousMonth)

  const { primaryCurrency, rates } = usePrimaryCurrency()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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

  const usedCategories = new Set((budgets || []).map((b) => b.category))
  const availableCategories = expenseCategories.filter((c) => !usedCategories.has(c.value))

  const handleSave = async () => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Please enter a valid budget amount")
      return
    }
    setIsSaving(true)
    try {
      await upsertMutation({
        category,
        amount: parsed,
        currency: primaryCurrency,
        month,
      })
      const meta = financeCategoryMeta(category)
      toast.success(`Budget set for ${meta.label}`)
      setAmount("")
      if (availableCategories.length > 1) {
        const next = availableCategories.find((c) => c.value !== category)
        if (next) setCategory(next.value)
      }
    } catch {
      toast.error("Failed to save budget")
    } finally {
      setIsSaving(false)
    }
  }

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

  const handleCopy = async () => {
    try {
      const copied = await copyMutation({ month, fromMonth: shiftMonth(month, -1) })
      if (copied > 0) toast.success(`Copied ${copied} budget${copied > 1 ? "s" : ""} from last month`)
      else toast.info("No budgets to copy from last month")
    } catch {
      toast.error("Failed to copy budgets")
    }
  }

  return (
    <div className="space-y-4">
      {/* Month navigator + totals */}
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon-sm" onClick={() => setMonth(shiftMonth(month, -1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-center">
            <h2 className="flex items-center justify-center gap-1.5 text-sm font-bold">
              <PiggyBank className="size-4 text-emerald-500" />
              {monthLabel(month)}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {formatCurrencyAmount(totals.spent, primaryCurrency)} of{" "}
              {formatCurrencyAmount(totals.cap, primaryCurrency)} budgeted ({totals.pct}%)
            </p>
          </div>
          <Button variant="outline" size="icon-sm" onClick={() => setMonth(shiftMonth(month, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        {totals.cap > 0 && (
          <div className="mt-3 h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                totals.spent > totals.cap
                  ? "bg-red-500"
                  : totals.pct >= 85
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              )}
              style={{ width: `${Math.min(100, totals.pct)}%` }}
            />
          </div>
        )}
        {(budgets?.length || 0) === 0 && (
          <Button variant="ghost" size="sm" onClick={handleCopy} className="mt-3 w-full text-xs cursor-pointer">
            <Copy className="size-3.5" /> Copy last month&apos;s budgets
          </Button>
        )}
      </div>

      {/* Add budget */}
      <div className="rounded-lg border border-border bg-background p-4 space-y-3">
        <h3 className="text-sm font-semibold">Set Category Budget</h3>
        <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-0.5">
          {(availableCategories.length > 0 ? availableCategories : expenseCategories).map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={cn(
                "flex items-center gap-2 rounded-lg border-2 p-2 text-left transition-all cursor-pointer",
                category === c.value
                  ? "border-foreground bg-muted"
                  : "border-border hover:border-foreground/40"
              )}
            >
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-white"
                style={{ backgroundColor: c.color }}
              >
                <DynamicIcon name={c.icon} className="size-3.5" />
              </span>
              <span className="text-[11px] font-medium leading-tight">{c.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type="number"
              placeholder={`Monthly cap in ${primaryCurrency}`}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving || !amount} className="cursor-pointer">
            <Plus className="size-4" /> {isSaving ? "Saving..." : "Set"}
          </Button>
        </div>
      </div>

      {/* Budget rows */}
      {budgets === undefined || transactions === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
          <PiggyBank className="size-6 text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No budgets for {monthLabel(month).split(" ")[0]}</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Set per-category spending limits above to track progress
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ budget, meta, spent, cap, pct, remaining }) => {
            const subSpend = subscriptionSpendByCategory.get(budget.category) || 0
            return (
              <div key={budget._id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: meta.color }}
                  >
                    <DynamicIcon name={meta.icon} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold truncate">{meta.label}</span>
                      <button
                        onClick={() => setDeleteId(budget._id)}
                        className="text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                        title="Remove budget"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatCurrencyAmount(spent, primaryCurrency)} spent of{" "}
                      {formatCurrencyAmount(cap, primaryCurrency)}
                      {subSpend > 0 && (
                        <span> · incl. {formatCurrencyAmount(subSpend, primaryCurrency)} subs</span>
                      )}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "shrink-0 text-sm font-extrabold",
                      remaining < 0 ? "text-red-500" : pct >= 85 ? "text-amber-500" : "text-emerald-500"
                    )}
                  >
                    {pct}%
                  </div>
                </div>
                <div className="mt-2.5 h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      remaining < 0 ? "bg-red-500" : pct >= 85 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="mt-1.5 text-[11px] text-muted-foreground">
                  {remaining >= 0 ? (
                    <span>{formatCurrencyAmount(remaining, primaryCurrency)} remaining</span>
                  ) : (
                    <span className="text-red-500 font-medium">
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

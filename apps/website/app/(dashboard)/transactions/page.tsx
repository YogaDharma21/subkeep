"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Pencil,
  Trash2,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
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
import { AddTransactionSheet } from "@/components/add-transaction-sheet"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import {
  TransactionType,
  financeCategoryMeta,
  financeCategories,
  currentMonthKey,
  monthLabel,
  shiftMonth,
} from "@/lib/finance"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type TxnDoc = {
  _id: string
  type: string
  amount: number
  currency: string
  category: string
  date: string
  note?: string
  accountId?: string
  toAccountId?: string
  icon?: string
  color?: string
}

export default function TransactionsPage() {
  useDocumentTitle("Transactions")
  const { isSignedIn } = useAuth()
  const [month, setMonth] = useState(currentMonthKey())
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all")
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<TxnDoc | null>(null)
  const [deleting, setDeleting] = useState<TxnDoc | null>(null)

  const transactions = useQuery(
    api.transactions.list,
    isSignedIn ? { month } : "skip"
  )
  const accounts = useQuery(api.accounts.list, isSignedIn ? {} : "skip")
  const updateMutation = useMutation(api.transactions.update)
  const removeMutation = useMutation(api.transactions.remove)

  const { primaryCurrency, rates } = usePrimaryCurrency()

  const [editAmount, setEditAmount] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editNote, setEditNote] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const filtered = useMemo(() => {
    let list = [...(transactions || [])]
    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((t) => {
        const meta = financeCategoryMeta(t.category)
        return (
          (t.note || "").toLowerCase().includes(q) ||
          meta.label.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.date.includes(q)
        )
      })
    }
    return list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  }, [transactions, typeFilter, search])

  const totals = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of filtered) {
      const converted = convertCurrency(t.amount, t.currency, primaryCurrency, rates)
      if (t.type === "income") income += converted
      else if (t.type === "expense") expense += converted
    }
    return { income, expense, net: income - expense }
  }, [filtered, primaryCurrency, rates])

  const accountName = (id?: string) =>
    accounts?.find((a) => a._id === id)?.name

  const openEdit = (t: TxnDoc) => {
    setEditing(t)
    setEditAmount(String(t.amount))
    setEditDate(t.date)
    setEditNote(t.note || "")
    setEditCategory(t.category)
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    const parsed = parseFloat(editAmount)
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    setIsSaving(true)
    try {
      await updateMutation({
        id: editing._id as Id<"transactions">,
        amount: parsed,
        date: editDate,
        note: editNote || undefined,
        category: editCategory || undefined,
      })
      toast.success("Transaction updated")
      setEditing(null)
    } catch {
      toast.error("Failed to update transaction")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setIsSaving(true)
    try {
      await removeMutation({ id: deleting._id as Id<"transactions"> })
      toast.success("Transaction deleted")
      setDeleting(null)
    } catch {
      toast.error("Failed to delete transaction")
    } finally {
      setIsSaving(false)
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, TxnDoc[]>()
    for (const t of filtered) {
      const arr = map.get(t.date) || []
      arr.push(t)
      map.set(t.date, arr)
    }
    return [...map.entries()]
  }, [filtered])

  return (
    <div className="space-y-4">
      {/* Month navigator + totals */}
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon-sm" onClick={() => setMonth(shiftMonth(month, -1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-center">
            <h2 className="text-sm font-bold">{monthLabel(month)}</h2>
            <p className="text-[11px] text-muted-foreground">
              Net {formatCurrencyAmount(totals.net, primaryCurrency)}
            </p>
          </div>
          <Button variant="outline" size="icon-sm" onClick={() => setMonth(shiftMonth(month, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-extrabold text-emerald-500">
              <ArrowDownRight className="size-4" />
              {formatCurrencyAmount(totals.income, primaryCurrency)}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mt-0.5">
              Income
            </div>
          </div>
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-extrabold text-red-500">
              <ArrowUpRight className="size-4" />
              {formatCurrencyAmount(totals.expense, primaryCurrency)}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mt-0.5">
              Expenses
            </div>
          </div>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes, categories, dates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm" className="shrink-0 cursor-pointer">
          Add
        </Button>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto">
        {(
          [
            { value: "all", label: "All" },
            { value: "expense", label: "Expenses" },
            { value: "income", label: "Income" },
            { value: "transfer", label: "Transfers" },
          ] as Array<{ value: "all" | TransactionType; label: string }>
        ).map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0 cursor-pointer",
              typeFilter === f.value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {transactions === undefined ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
          <ArrowLeftRight className="size-6 text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No transactions found</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            {search ? "Try a different search" : "Tap Add to log your first transaction"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, items]) => (
            <div key={date} className="rounded-lg border border-border bg-background overflow-hidden">
              <div className="border-b border-border/60 bg-muted/30 px-4 py-2 text-[11px] font-semibold text-muted-foreground">
                {new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="divide-y divide-border/60">
                {items.map((t) => {
                  const meta = financeCategoryMeta(t.category)
                  return (
                    <div key={t._id} className="flex items-center gap-3 px-4 py-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        <DynamicIcon name={t.icon || meta.icon} className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {t.type === "transfer"
                            ? `Transfer${accountName(t.accountId) ? ` · ${accountName(t.accountId)}` : ""}${accountName(t.toAccountId) ? ` → ${accountName(t.toAccountId)}` : ""}`
                            : t.note || meta.label}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {meta.label}
                          {t.type !== "transfer" && accountName(t.accountId) ? ` · ${accountName(t.accountId)}` : ""}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div
                          className={cn(
                            "text-sm font-bold",
                            t.type === "income"
                              ? "text-emerald-500"
                              : t.type === "transfer"
                                ? "text-blue-500"
                                : "text-red-500"
                          )}
                        >
                          {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}
                          {formatCurrencyAmount(
                            convertCurrency(t.amount, t.currency, primaryCurrency, rates),
                            primaryCurrency
                          )}
                        </div>
                        {t.currency !== primaryCurrency && (
                          <div className="text-[10px] text-muted-foreground">
                            {t.amount} {t.currency}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(t)}
                          className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleting(t)}
                          className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddTransactionSheet open={addOpen} onOpenChange={setAddOpen} />

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm rounded-lg p-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-semibold">Edit Transaction</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update amount, date, category, or note.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Date</label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs"
              >
                {financeCategories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Note</label>
              <Input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="text-xs"
                placeholder="Optional note"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setEditing(null)} className="cursor-pointer">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={isSaving} className="cursor-pointer">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm rounded-lg p-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-semibold">Delete Transaction</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This will permanently remove this transaction. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button variant="outline" size="sm" onClick={() => setDeleting(null)} className="cursor-pointer">
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isSaving} className="cursor-pointer">
              {isSaving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

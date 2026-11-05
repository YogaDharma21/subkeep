"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Pencil,
  Trash2,
  ArrowLeftRight,
  Check,
  X,
} from "lucide-react"
import { SectionHeader } from "@/components/section-nav"
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
import { moneyTabs } from "@/lib/navigation"
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
  subscriptionId?: string
  icon?: string
  color?: string
}

export default function TransactionsPage() {
  useDocumentTitle("Transactions")
  const { isSignedIn } = useAuth()
  const [month, setMonth] = useState(currentMonthKey())
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all")
  const [editing, setEditing] = useState<TxnDoc | null>(null)
  const [deleting, setDeleting] = useState<TxnDoc | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const transactions = useQuery(
    api.transactions.list,
    isSignedIn ? { month } : "skip"
  )
  const accounts = useQuery(api.accounts.list, isSignedIn ? {} : "skip")
  const updateMutation = useMutation(api.transactions.update)
  const removeMutation = useMutation(api.transactions.remove)
  const removeBatch = useMutation(api.transactions.removeBatch)
  const updateCategoryBatch = useMutation(api.transactions.updateCategoryBatch)
  const updateAccountBatch = useMutation(api.transactions.updateAccountBatch)

  const { primaryCurrency, rates } = usePrimaryCurrency()

  const [editAmount, setEditAmount] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editNote, setEditNote] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [isBatchOperating, setIsBatchOperating] = useState(false)
  const [isBatchCategoryOpen, setIsBatchCategoryOpen] = useState(false)
  const [batchCategory, setBatchCategory] = useState<string>(financeCategories[0].value)
  const [isBatchAccountOpen, setIsBatchAccountOpen] = useState(false)
  const [batchAccountId, setBatchAccountId] = useState<string>("")
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false)

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(filtered.map((t) => t._id)))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const isAllSelected =
    filtered.length > 0 && filtered.every((t) => selectedIds.has(t._id))

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
      setSelectedIds((prev) => {
        if (!prev.has(deleting._id)) return prev
        const next = new Set(prev)
        next.delete(deleting._id)
        return next
      })
      toast.success("Transaction deleted")
      setDeleting(null)
    } catch {
      toast.error("Failed to delete transaction")
    } finally {
      setIsSaving(false)
    }
  }

  const handleBatchCategory = async () => {
    if (selectedIds.size === 0) return
    const category = batchCategory || financeCategories[0].value
    setIsBatchOperating(true)
    try {
      const res = await updateCategoryBatch({
        ids: Array.from(selectedIds) as Id<"transactions">[],
        category,
      })
      toast.success(`${res.count} transactions updated`)
      clearSelection()
      setIsBatchCategoryOpen(false)
    } catch {
      toast.error("Failed to update transactions")
    } finally {
      setIsBatchOperating(false)
    }
  }

  const handleBatchAccount = async () => {
    if (selectedIds.size === 0) return
    const accountId = (batchAccountId || accounts?.[0]?._id) as Id<"accounts"> | undefined
    if (!accountId) {
      toast.error("Please select an account")
      return
    }
    setIsBatchOperating(true)
    try {
      const res = await updateAccountBatch({
        ids: Array.from(selectedIds) as Id<"transactions">[],
        accountId,
      })
      toast.success(`${res.count} transactions updated`)
      clearSelection()
      setIsBatchAccountOpen(false)
    } catch {
      toast.error("Failed to update transactions")
    } finally {
      setIsBatchOperating(false)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    setIsBatchOperating(true)
    try {
      const res = await removeBatch({
        ids: Array.from(selectedIds) as Id<"transactions">[],
      })
      toast.success(`${res.count} transactions deleted`)
      clearSelection()
      setIsBatchDeleteOpen(false)
    } catch {
      toast.error("Failed to delete transactions")
    } finally {
      setIsBatchOperating(false)
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
    <div className="space-y-4 sm:space-y-5">
      <SectionHeader title="Money" eyebrow={monthLabel(month)} tabs={moneyTabs} />

      {/* Month + totals */}
      <section className="surface relative overflow-hidden p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setMonth(shiftMonth(month, -1))}
            className="rounded-full"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-center">
            <p className="label">This month</p>
            <p className="mt-2 text-lg font-medium tracking-tight text-foreground">
              {monthLabel(month)}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setMonth(shiftMonth(month, 1))}
            className="rounded-full"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-4">
          <div className="min-w-0">
            <p className="label">Net</p>
            <p className="numeral mt-1.5 truncate text-[15px] text-foreground">
              {formatCurrencyAmount(totals.net, primaryCurrency)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="label">In</p>
            <p className="numeral mt-1.5 truncate text-[15px] text-positive">
              +{formatCurrencyAmount(totals.income, primaryCurrency)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="label">Out</p>
            <p className="numeral mt-1.5 truncate text-[15px] text-foreground">
              -{formatCurrencyAmount(totals.expense, primaryCurrency)}
            </p>
          </div>
        </div>
      </section>

      {/* Search + filter */}
      <div className="surface flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes, categories, dates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-0 bg-transparent pl-8 text-xs shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {filtered.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0 border-r border-border/70 pr-2">
              <button
                type="button"
                onClick={isAllSelected ? clearSelection : selectAll}
                disabled={isBatchOperating}
                className="rounded-full px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isAllSelected ? "Clear" : "Select All"}
              </button>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-1">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {selectedIds.size} selected
                  </span>
                  {!isAllSelected && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      disabled={isBatchOperating}
                      className="rounded-full px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="quiet-scroll flex items-center gap-1 overflow-x-auto">
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
                  "shrink-0 rounded-full px-3 py-1.5 text-[11px] transition-colors cursor-pointer",
                  typeFilter === f.value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      {transactions === undefined ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface flex flex-col items-center justify-center py-12 text-center">
          <ArrowLeftRight className="mb-2 size-5 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No transactions found</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            {search ? "Try a different search" : "Tap + to log your first transaction"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, items]) => (
            <div key={date} className="surface overflow-hidden">
              <div className="border-b border-border px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="divide-y divide-border/70">
                {items.map((t) => {
                  const meta = financeCategoryMeta(t.category)
                  const isSelected = selectedIds.has(t._id)
                  return (
                    <div
                      key={t._id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.025]",
                        isSelected && "bg-foreground/[0.02]"
                      )}
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isSelected}
                        aria-label="Select transaction"
                        disabled={isBatchOperating}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!isBatchOperating) toggleSelect(t._id)
                        }}
                        className={cn(
                          "rounded-[4px] border size-4 shrink-0 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50 disabled:pointer-events-none",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border/80 hover:border-foreground/40 bg-foreground/[0.02]"
                        )}
                      >
                        {isSelected && <Check className="size-2.5 stroke-[3]" />}
                      </button>
                      <span className="surface-inset flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground">
                        <DynamicIcon name={t.icon || meta.icon} className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                          <span className="truncate">
                            {t.type === "transfer"
                              ? `Transfer${accountName(t.accountId) ? ` · ${accountName(t.accountId)}` : ""}${accountName(t.toAccountId) ? ` → ${accountName(t.toAccountId)}` : ""}`
                              : t.note || meta.label}
                          </span>
                          {t.subscriptionId && (
                            <Link
                              href={`/subscriptions/${t.subscriptionId}`}
                              className="inline-flex shrink-0 items-center rounded-xs bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                              title="View linked subscription"
                            >
                              Subscription
                            </Link>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {meta.label}
                          {t.type !== "transfer" && accountName(t.accountId) ? ` · ${accountName(t.accountId)}` : ""}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div
                          className={cn(
                            "numeral text-[13px]",
                            t.type === "income"
                              ? "text-positive"
                              : t.type === "transfer"
                                ? "text-muted-foreground"
                                : "text-foreground"
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
                className="flex h-9 w-full rounded-xl border border-border bg-foreground/[0.03] px-2.5 text-xs"
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

      {/* Floating Bulk Action Dock */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 sm:bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-full">
          <span className="tabular-nums text-xs font-medium text-foreground pl-2 pr-1">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsBatchCategoryOpen(true)}
            disabled={isBatchOperating}
            className="h-7 rounded-full px-2.5 text-xs font-normal"
            aria-label="Batch Category"
          >
            Category
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (accounts && accounts.length > 0 && !batchAccountId) {
                setBatchAccountId(accounts[0]._id)
              }
              setIsBatchAccountOpen(true)
            }}
            disabled={isBatchOperating}
            className="h-7 rounded-full px-2.5 text-xs font-normal"
            aria-label="Batch Account"
          >
            Account
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsBatchDeleteOpen(true)}
            disabled={isBatchOperating}
            className="h-7 rounded-full px-2.5 text-xs font-normal text-destructive hover:bg-destructive/10"
            aria-label="Batch Delete"
          >
            Delete
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={clearSelection}
            disabled={isBatchOperating}
            className="rounded-full size-7"
            aria-label="Clear selection"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Batch Category Dialog */}
      <Dialog
        open={isBatchCategoryOpen}
        onOpenChange={(o) => !isBatchOperating && setIsBatchCategoryOpen(o)}
      >
        <DialogContent className="max-w-sm rounded-lg p-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-semibold">Update Category</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Choose a category for {selectedIds.size} selected transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 py-2">
            <label className="text-xs font-medium">Category</label>
            <select
              value={batchCategory}
              onChange={(e) => setBatchCategory(e.target.value)}
              disabled={isBatchOperating}
              className="flex h-9 w-full rounded-xl border border-border bg-foreground/[0.03] px-2.5 text-xs text-foreground"
            >
              {financeCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBatchCategoryOpen(false)}
              disabled={isBatchOperating}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleBatchCategory}
              disabled={isBatchOperating}
              className="cursor-pointer"
            >
              {isBatchOperating ? "Updating..." : "Update Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Account Dialog */}
      <Dialog
        open={isBatchAccountOpen}
        onOpenChange={(o) => !isBatchOperating && setIsBatchAccountOpen(o)}
      >
        <DialogContent className="max-w-sm rounded-lg p-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-semibold">Update Account</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Choose an account for {selectedIds.size} selected transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 py-2">
            <label className="text-xs font-medium">Account</label>
            <select
              value={batchAccountId || accounts?.[0]?._id || ""}
              onChange={(e) => setBatchAccountId(e.target.value)}
              disabled={isBatchOperating}
              className="flex h-9 w-full rounded-xl border border-border bg-foreground/[0.03] px-2.5 text-xs text-foreground"
            >
              {accounts && accounts.length === 0 && (
                <option value="" disabled>
                  No accounts available
                </option>
              )}
              {accounts?.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBatchAccountOpen(false)}
              disabled={isBatchOperating}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleBatchAccount}
              disabled={isBatchOperating || !accounts || accounts.length === 0}
              className="cursor-pointer"
            >
              {isBatchOperating ? "Updating..." : "Update Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Delete Dialog */}
      <Dialog
        open={isBatchDeleteOpen}
        onOpenChange={(o) => !isBatchOperating && setIsBatchDeleteOpen(o)}
      >
        <DialogContent className="max-w-sm rounded-lg p-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-semibold">Delete Transactions</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Permanently delete {selectedIds.size} transactions? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBatchDeleteOpen(false)}
              disabled={isBatchOperating}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              disabled={isBatchOperating}
              className="cursor-pointer"
            >
              {isBatchOperating ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

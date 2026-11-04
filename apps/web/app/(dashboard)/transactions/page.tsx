"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Pencil,
  Trash2,
  ArrowLeftRight,
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
  expenseCategories,
  incomeCategories,
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

function InlineNoteCell({
  transaction,
  metaLabel,
  onSave,
}: {
  transaction: TxnDoc
  metaLabel: string
  onSave: (note: string | undefined) => Promise<unknown>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(transaction.note || "")
  const [optimisticNote, setOptimisticNote] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const skipBlurRef = useRef(false)
  const isSavingRef = useRef(false)

  const displayNote = optimisticNote !== null ? optimisticNote : (transaction.note || "")
  const displayText = displayNote || metaLabel

  useEffect(() => {
    if (optimisticNote !== null) {
      const current = transaction.note || ""
      if (current === optimisticNote) {
        setOptimisticNote(null)
      }
    }
  }, [transaction.note, optimisticNote])

  useEffect(() => {
    if (!isEditing) {
      setValue(displayNote)
    }
  }, [displayNote, isEditing])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (isSavingRef.current) return
    const trimmed = value.trim()
    const original = (transaction.note || "").trim()

    setIsEditing(false)

    if (trimmed === original) {
      return
    }

    isSavingRef.current = true
    setOptimisticNote(trimmed)
    try {
      await onSave(trimmed || undefined)
      toast.success("Note updated")
    } catch {
      setOptimisticNote(null)
      toast.error("Failed to update note")
    } finally {
      isSavingRef.current = false
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return

    if (e.key === "Enter") {
      e.preventDefault()
      skipBlurRef.current = true
      handleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      skipBlurRef.current = true
      setValue(displayNote)
      setIsEditing(false)
    }
  }

  const handleBlur = () => {
    if (skipBlurRef.current) {
      skipBlurRef.current = false
      return
    }
    handleSave()
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onClick={(e) => e.stopPropagation()}
        placeholder="Add note..."
        className="h-6.5 w-full min-w-0 max-w-[280px] rounded-md border border-border bg-foreground/[0.04] px-2 py-0.5 text-xs font-normal text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="group/note flex max-w-full items-center gap-1.5 truncate text-left font-medium text-foreground transition-colors hover:text-foreground/80 cursor-pointer rounded-xs px-1 -mx-1 py-0.5 -my-0.5 hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      title="Click to edit note"
    >
      <span className={cn("truncate", !displayNote && "text-muted-foreground/80")}>
        {displayText}
      </span>
    </button>
  )
}

function InlineCategorySelect({
  transaction,
  onSave,
}: {
  transaction: TxnDoc
  onSave: (category: string) => Promise<unknown>
}) {
  const [optimisticCategory, setOptimisticCategory] = useState<string | null>(null)
  const isSavingRef = useRef(false)

  const currentCategory = optimisticCategory ?? transaction.category
  const currentMeta = financeCategoryMeta(currentCategory)

  useEffect(() => {
    if (optimisticCategory !== null && transaction.category === optimisticCategory) {
      setOptimisticCategory(null)
    }
  }, [transaction.category, optimisticCategory])

  const options = useMemo(() => {
    const list = transaction.type === "income" ? incomeCategories : expenseCategories
    if (list.some((c) => c.value === currentCategory)) {
      return list
    }
    return [...list, currentMeta]
  }, [transaction.type, currentCategory, currentMeta])

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value
    if (!newCategory || newCategory === transaction.category || isSavingRef.current) return

    isSavingRef.current = true
    setOptimisticCategory(newCategory)
    try {
      await onSave(newCategory)
      toast.success("Category updated")
    } catch {
      setOptimisticCategory(null)
      toast.error("Failed to update category")
    } finally {
      isSavingRef.current = false
    }
  }

  return (
    <div className="group/cat relative inline-flex items-center min-w-0 max-w-full rounded-xs px-1 -mx-1 py-0.5 -my-0.5 transition-colors hover:bg-foreground/[0.04] focus-within:ring-1 focus-within:ring-ring border border-transparent hover:border-border cursor-pointer">
      <span className="truncate text-[11px] text-muted-foreground group-hover/cat:text-foreground">
        {currentMeta.label}
      </span>
      <ChevronDown className="ml-1 size-2.5 shrink-0 text-muted-foreground/40 group-hover/cat:text-foreground/70" />
      <select
        value={currentCategory}
        onChange={handleChange}
        onClick={(e) => e.stopPropagation()}
        disabled={isSavingRef.current}
        aria-label="Change category"
        title="Change category"
        className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed [&>option]:bg-card [&>option]:text-foreground"
      >
        {options.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function TransactionsPage() {
  useDocumentTitle("Transactions")
  const { isSignedIn } = useAuth()
  const [month, setMonth] = useState(currentMonthKey())
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all")
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
    accounts?.find((a: { _id: string; name: string }) => a._id === id)?.name

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
                  return (
                    <div key={t._id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.025]">
                      <span className="surface-inset flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground">
                        <DynamicIcon name={t.icon || meta.icon} className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium min-w-0">
                          {t.type === "transfer" ? (
                            <span className="truncate">
                              {`Transfer${accountName(t.accountId) ? ` · ${accountName(t.accountId)}` : ""}${accountName(t.toAccountId) ? ` → ${accountName(t.toAccountId)}` : ""}`}
                            </span>
                          ) : (
                            <InlineNoteCell
                              transaction={t}
                              metaLabel={meta.label}
                              onSave={(note) =>
                                updateMutation({
                                  id: t._id as Id<"transactions">,
                                  note,
                                })
                              }
                            />
                          )}
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
                        <div className="flex items-center text-[11px] text-muted-foreground min-w-0 truncate">
                          {t.type === "transfer" ? (
                            <span className="truncate">{meta.label}</span>
                          ) : (
                            <InlineCategorySelect
                              transaction={t}
                              onSave={async (newCategory) => {
                                const catMeta = financeCategoryMeta(newCategory)
                                await updateMutation({
                                  id: t._id as Id<"transactions">,
                                  category: newCategory,
                                  icon: catMeta.icon,
                                  color: catMeta.color,
                                })
                              }}
                            />
                          )}
                          {t.type !== "transfer" && accountName(t.accountId) ? (
                            <span className="truncate"> · {accountName(t.accountId)}</span>
                          ) : null}
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
    </div>
  )
}

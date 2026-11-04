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
  Plus,
  RefreshCw,
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
import {
  RecurringTransactionSheet,
  recurringApi,
  type RecurringTransactionDoc,
} from "@/components/recurring-transaction-sheet"

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
  recurringTransactionId?: string
  icon?: string
  color?: string
}

export default function TransactionsPage() {
  useDocumentTitle("Transactions")
  const { isSignedIn } = useAuth()
  const [viewMode, setViewMode] = useState<"transactions" | "recurring">("transactions")
  const [month, setMonth] = useState(currentMonthKey())
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all")
  const [editing, setEditing] = useState<TxnDoc | null>(null)
  const [deleting, setDeleting] = useState<TxnDoc | null>(null)

  // Recurring state
  const [recurringSearch, setRecurringSearch] = useState("")
  const [recurringTypeFilter, setRecurringTypeFilter] = useState<"all" | TransactionType>("all")
  const [isRecurringSheetOpen, setIsRecurringSheetOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransactionDoc | null>(null)
  const [deletingRecurring, setDeletingRecurring] = useState<RecurringTransactionDoc | null>(null)
  const [isDeletingRecurring, setIsDeletingRecurring] = useState(false)

  const transactions = useQuery(
    api.transactions.list,
    isSignedIn ? { month } : "skip"
  )
  const accounts = useQuery(api.accounts.list, isSignedIn ? {} : "skip")
  const updateMutation = useMutation(api.transactions.update)
  const removeMutation = useMutation(api.transactions.remove)

  const recurringTransactions = useQuery(
    recurringApi.list,
    isSignedIn ? {} : "skip"
  ) as RecurringTransactionDoc[] | undefined
  const toggleActiveMutation = useMutation(recurringApi.toggleActive)
  const removeRecurringMutation = useMutation(recurringApi.remove)

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

  const recurringTotals = useMemo(() => {
    let monthlyInflow = 0
    let monthlyCommitment = 0
    let activeCount = 0

    for (const r of recurringTransactions || []) {
      if (!r.isActive) continue
      activeCount++
      const converted = convertCurrency(r.amount, r.currency, primaryCurrency, rates)
      let multiplier = 1
      if (r.frequency === "daily") multiplier = 30
      else if (r.frequency === "weekly") multiplier = 52 / 12
      else if (r.frequency === "bi-weekly") multiplier = 26 / 12
      else if (r.frequency === "monthly") multiplier = 1
      else if (r.frequency === "yearly") multiplier = 1 / 12

      const monthlyAmount = converted * multiplier

      if (r.type === "income") {
        monthlyInflow += monthlyAmount
      } else if (r.type === "expense") {
        monthlyCommitment += monthlyAmount
      }
    }

    return {
      monthlyInflow,
      monthlyCommitment,
      netMonthly: monthlyInflow - monthlyCommitment,
      activeCount,
      totalCount: (recurringTransactions || []).length,
    }
  }, [recurringTransactions, primaryCurrency, rates])

  const filteredRecurring = useMemo(() => {
    let list = [...(recurringTransactions || [])]
    if (recurringTypeFilter !== "all") {
      list = list.filter((r) => r.type === recurringTypeFilter)
    }
    const q = recurringSearch.trim().toLowerCase()
    if (q) {
      list = list.filter((r) => {
        const meta = financeCategoryMeta(r.category)
        return (
          r.name.toLowerCase().includes(q) ||
          (r.note || "").toLowerCase().includes(q) ||
          meta.label.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.frequency.toLowerCase().includes(q) ||
          r.nextDueDate.includes(q)
        )
      })
    }
    return list.sort((a, b) => (a.nextDueDate > b.nextDueDate ? 1 : a.nextDueDate < b.nextDueDate ? -1 : 0))
  }, [recurringTransactions, recurringTypeFilter, recurringSearch])

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

  const handleToggleActive = async (id: Id<"recurringTransactions">) => {
    try {
      const newState = await toggleActiveMutation({ id })
      toast.success(newState ? "Rule activated" : "Rule paused")
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleDeleteRecurring = async () => {
    if (!deletingRecurring) return
    setIsDeletingRecurring(true)
    try {
      await removeRecurringMutation({ id: deletingRecurring._id })
      toast.success("Recurring transaction deleted")
      setDeletingRecurring(null)
    } catch {
      toast.error("Failed to delete recurring rule")
    } finally {
      setIsDeletingRecurring(false)
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

      {/* View mode toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="surface inline-flex p-1 rounded-full border border-border">
          <button
            type="button"
            onClick={() => setViewMode("transactions")}
            className={cn(
              "rounded-full px-3.5 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer",
              viewMode === "transactions"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Transactions
          </button>
          <button
            type="button"
            onClick={() => setViewMode("recurring")}
            className={cn(
              "rounded-full px-3.5 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer",
              viewMode === "recurring"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Recurring
          </button>
        </div>

        {viewMode === "recurring" && (
          <Button
            size="sm"
            onClick={() => {
              setEditingRecurring(null)
              setIsRecurringSheetOpen(true)
            }}
            className="cursor-pointer h-8 text-xs px-3"
          >
            <Plus className="mr-1.5 size-3.5" />
            Add Recurring
          </Button>
        )}
      </div>

      {viewMode === "transactions" ? (
        <>
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
                              {t.recurringTransactionId && (
                                <button
                                  type="button"
                                  onClick={() => setViewMode("recurring")}
                                  className="inline-flex shrink-0 items-center rounded-xs bg-blue/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue hover:bg-blue/20 transition-colors cursor-pointer"
                                  title="Generated from recurring rule"
                                >
                                  Recurring
                                </button>
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
        </>
      ) : (
        <>
          {/* Recurring Summary */}
          <section className="surface relative overflow-hidden p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label">Recurring Overview</p>
                <p className="mt-1 text-base font-medium tracking-tight text-foreground">
                  Monthly Commitment & Inflow
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center rounded-full border border-border bg-foreground/5 px-2.5 py-0.5 text-[11px] text-muted-foreground numeral font-medium">
                  {recurringTotals.activeCount} active · {recurringTotals.totalCount} rules
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-4">
              <div className="min-w-0">
                <p className="label">Net Impact</p>
                <p
                  className={cn(
                    "numeral mt-1.5 truncate text-[15px]",
                    recurringTotals.netMonthly > 0
                      ? "text-positive"
                      : recurringTotals.netMonthly < 0
                        ? "text-foreground"
                        : "text-muted-foreground"
                  )}
                >
                  {recurringTotals.netMonthly > 0 ? "+" : ""}
                  {formatCurrencyAmount(recurringTotals.netMonthly, primaryCurrency)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="label">Monthly Inflow</p>
                <p className="numeral mt-1.5 truncate text-[15px] text-positive">
                  +{formatCurrencyAmount(recurringTotals.monthlyInflow, primaryCurrency)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="label">Monthly Commitment</p>
                <p className="numeral mt-1.5 truncate text-[15px] text-foreground">
                  -{formatCurrencyAmount(recurringTotals.monthlyCommitment, primaryCurrency)}
                </p>
              </div>
            </div>
          </section>

          {/* Search + filter for recurring */}
          <div className="surface flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search rules, categories, notes..."
                value={recurringSearch}
                onChange={(e) => setRecurringSearch(e.target.value)}
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
                  type="button"
                  onClick={() => setRecurringTypeFilter(f.value)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-[11px] transition-colors cursor-pointer",
                    recurringTypeFilter === f.value
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recurring List */}
          {recurringTransactions === undefined ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : filteredRecurring.length === 0 ? (
            <div className="surface flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-border p-8">
              <div className="flex size-10 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground mb-3">
                <RefreshCw className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {recurringSearch || recurringTypeFilter !== "all"
                  ? "No matching recurring rules found"
                  : "No recurring transactions"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                {recurringSearch || recurringTypeFilter !== "all"
                  ? "Try a different search query or filter"
                  : "Automate recurring income, rent, utilities, and debt payments with scheduled rules."}
              </p>
              {!(recurringSearch || recurringTypeFilter !== "all") && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingRecurring(null)
                    setIsRecurringSheetOpen(true)
                  }}
                  className="mt-4 cursor-pointer"
                >
                  <Plus className="mr-1.5 size-3.5" />
                  Add Recurring Rule
                </Button>
              )}
            </div>
          ) : (
            <div className="surface overflow-hidden divide-y divide-border/70 rounded-2xl border border-border">
              {filteredRecurring.map((r) => {
                const meta = financeCategoryMeta(r.category)
                return (
                  <div
                    key={r._id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.025]",
                      !r.isActive && "opacity-60"
                    )}
                  >
                    <span className="surface-inset flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground">
                      <DynamicIcon name={r.icon || meta.icon} className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate text-sm font-medium text-foreground">
                          {r.name}
                        </span>
                        <span className="inline-flex shrink-0 items-center rounded-xs bg-foreground/5 border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                          {r.frequency === "bi-weekly"
                            ? "Bi-weekly"
                            : r.frequency.charAt(0).toUpperCase() + r.frequency.slice(1)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(r._id)}
                          className={cn(
                            "inline-flex shrink-0 items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border transition-all active:scale-95 cursor-pointer",
                            r.isActive
                              ? "bg-emerald/10 text-emerald border-emerald/25 hover:bg-emerald/15"
                              : "bg-foreground/5 text-muted-foreground border-border hover:bg-foreground/10"
                          )}
                          title={r.isActive ? "Pause rule" : "Activate rule"}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              r.isActive ? "bg-emerald" : "bg-muted-foreground"
                            )}
                          />
                          {r.isActive ? "Active" : "Paused"}
                        </button>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                        <span>{meta.label}</span>
                        <span>·</span>
                        <span>
                          {r.type === "transfer"
                            ? `${accountName(r.accountId) || "Account"} → ${accountName(r.toAccountId) || "Account"}`
                            : accountName(r.accountId) || "Unassigned"}
                        </span>
                        <span>·</span>
                        <span className="numeral">Next: {r.nextDueDate}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className={cn(
                          "numeral text-[13px] font-medium",
                          r.type === "income"
                            ? "text-positive"
                            : r.type === "transfer"
                              ? "text-muted-foreground"
                              : "text-foreground"
                        )}
                      >
                        {r.type === "income" ? "+" : r.type === "expense" ? "-" : ""}
                        {formatCurrencyAmount(
                          convertCurrency(r.amount, r.currency, primaryCurrency, rates),
                          primaryCurrency
                        )}
                      </div>
                      {r.currency !== primaryCurrency && (
                        <div className="numeral text-[10px] text-muted-foreground">
                          {r.amount} {r.currency}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditingRecurring(r)
                          setIsRecurringSheetOpen(true)
                        }}
                        className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Edit recurring rule"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeletingRecurring(r)}
                        className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Delete recurring rule"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Edit dialog for transactions */}
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

      {/* Delete dialog for transactions */}
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

      {/* Delete dialog for recurring transactions */}
      <Dialog open={!!deletingRecurring} onOpenChange={(o) => !o && setDeletingRecurring(null)}>
        <DialogContent className="max-w-sm rounded-lg p-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-semibold">Delete Recurring Rule</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This will stop automatic posting and permanently remove &ldquo;{deletingRecurring?.name}&rdquo;. Past generated transactions will remain.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingRecurring(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteRecurring}
              disabled={isDeletingRecurring}
              className="cursor-pointer"
            >
              {isDeletingRecurring ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring Transaction Sheet */}
      <RecurringTransactionSheet
        open={isRecurringSheetOpen}
        onOpenChange={(open) => {
          setIsRecurringSheetOpen(open)
          if (!open) setEditingRecurring(null)
        }}
        editing={editingRecurring}
      />
    </div>
  )
}

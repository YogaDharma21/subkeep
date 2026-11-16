"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import type { FunctionReference } from "convex/server"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DynamicIcon } from "@/components/dynamic-icon"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { currencies } from "@/lib/constants"
import {
  TransactionType,
  expenseCategories,
  incomeCategories,
  financeCategoryMeta,
  todayKey,
} from "@/lib/finance"

export interface RecurringTransactionDoc {
  _id: Id<"recurringTransactions">
  _creationTime?: number
  userId?: string
  name: string
  type: string
  amount: number
  currency: string
  category: string
  frequency: string
  startDate: string
  nextDueDate: string
  endDate?: string
  accountId?: Id<"accounts">
  toAccountId?: Id<"accounts">
  isActive: boolean
  note?: string
  icon?: string
  color?: string
  lastProcessedDate?: string
}

export type RecurringApiType = {
  list: FunctionReference<"query">
  get: FunctionReference<"query">
  create: FunctionReference<"mutation">
  update: FunctionReference<"mutation">
  remove: FunctionReference<"mutation">
  toggleActive: FunctionReference<"mutation">
}

export const recurringApi = (
  api as unknown as { recurringTransactions: RecurringApiType }
).recurringTransactions

interface RecurringTransactionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: RecurringTransactionDoc | null
  defaultType?: TransactionType
}

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
]

interface RecurringFormContentProps {
  editing?: RecurringTransactionDoc | null
  defaultType: TransactionType
  onClose: () => void
}

function RecurringFormContent({
  editing,
  defaultType,
  onClose,
}: RecurringFormContentProps) {
  const { isSignedIn } = useAuth()
  const create = useMutation(recurringApi.create)
  const update = useMutation(recurringApi.update)

  const accounts = useQuery(
    api.accounts.list,
    isSignedIn ? {} : "skip"
  )

  const [name, setName] = useState(editing?.name || "")
  const [type, setType] = useState<TransactionType>(
    (editing?.type as TransactionType) || defaultType
  )
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "")
  const [currency, setCurrency] = useState(
    editing?.currency || accounts?.[0]?.currency || "USD"
  )
  const [category, setCategory] = useState(
    editing?.category || (defaultType === "income" ? "salary" : "food")
  )
  const [frequency, setFrequency] = useState(editing?.frequency || "monthly")
  const [startDate, setStartDate] = useState(editing?.startDate || todayKey())
  const [nextDueDate, setNextDueDate] = useState(
    editing?.nextDueDate || editing?.startDate || todayKey()
  )
  const [accountId, setAccountId] = useState(
    editing?.accountId ? String(editing.accountId) : ""
  )
  const [toAccountId, setToAccountId] = useState(
    editing?.toAccountId ? String(editing.toAccountId) : ""
  )
  const [note, setNote] = useState(editing?.note || "")
  const [isSaving, setIsSaving] = useState(false)

  const categoryOptions = type === "income" ? incomeCategories : expenseCategories
  const activeCategory = useMemo(
    () => financeCategoryMeta(type === "transfer" ? "transfer" : category),
    [category, type]
  )

  const handleTypeChange = (next: TransactionType) => {
    setType(next)
    if (next === "income" && !incomeCategories.some((c) => c.value === category)) {
      setCategory("salary")
    }
    if (next === "expense" && !expenseCategories.some((c) => c.value === category)) {
      setCategory("food")
    }
    if (next === "transfer") {
      setCategory("transfer")
    }
  }

  const handleAccountChange = (accId: string) => {
    setAccountId(accId)
    const acc = accounts?.find((a) => a._id === accId)
    if (acc?.currency && (!currency || (!editing && currency === "USD"))) {
      setCurrency(acc.currency)
    }
  }

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Please enter a name")
      return
    }

    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!startDate) {
      toast.error("Please select a start date")
      return
    }

    if (!nextDueDate) {
      toast.error("Please select a next due date")
      return
    }

    if (type === "transfer") {
      if (!accountId || !toAccountId) {
        toast.error("Pick both source and destination accounts for a transfer")
        return
      }
      if (accountId === toAccountId) {
        toast.error("Transfer accounts must be different")
        return
      }
    }

    setIsSaving(true)
    try {
      const cat = type === "transfer" ? "transfer" : category
      const meta = financeCategoryMeta(cat)

      if (editing) {
        await update({
          id: editing._id,
          name: trimmedName,
          type,
          amount: parsed,
          currency,
          category: cat,
          frequency,
          startDate,
          nextDueDate,
          accountId: accountId ? (accountId as Id<"accounts">) : null,
          toAccountId: type === "transfer" && toAccountId ? (toAccountId as Id<"accounts">) : null,
          note: note.trim() || null,
          icon: meta.icon,
          color: meta.color,
        })
        toast.success("Recurring transaction updated")
      } else {
        await create({
          name: trimmedName,
          type,
          amount: parsed,
          currency,
          category: cat,
          frequency,
          startDate,
          nextDueDate,
          accountId: accountId ? (accountId as Id<"accounts">) : undefined,
          toAccountId: type === "transfer" && toAccountId ? (toAccountId as Id<"accounts">) : undefined,
          note: note.trim() || undefined,
          icon: meta.icon,
          color: meta.color,
          isActive: true,
        })
        toast.success("Recurring transaction created")
      }
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save recurring transaction"
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <SheetHeader className="flex-row items-center justify-between border-b border-border p-4">
        <SheetTitle>{editing ? "Edit Recurring Transaction" : "New Recurring Transaction"}</SheetTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="cursor-pointer"
        >
          <X className="size-4" />
        </Button>
      </SheetHeader>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
        {/* Type Toggle */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-foreground/[0.03] p-1">
          {(
            [
              { value: "expense", label: "Expense" },
              { value: "income", label: "Income" },
              { value: "transfer", label: "Transfer" },
            ] as Array<{ value: TransactionType; label: string }>
          ).map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleTypeChange(t.value)}
              className={cn(
                "rounded-xl py-2 text-xs font-medium transition-all active:scale-95 cursor-pointer",
                type === t.value
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Salary, Apartment Rent, Car Loan EMI"
            className="h-10 text-xs"
          />
        </div>

        {/* Amount & Currency */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Amount & Currency</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-base font-medium h-10 numeral flex-1"
              inputMode="decimal"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="flex h-10 w-24 shrink-0 rounded-xl border border-border bg-foreground/[0.03] px-2 text-xs font-medium"
            >
              {currencies.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.value}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Frequency */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Frequency</label>
          <div className="grid grid-cols-5 gap-1 rounded-xl border border-border bg-foreground/[0.03] p-1">
            {FREQUENCY_OPTIONS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFrequency(f.value)}
                className={cn(
                  "rounded-lg py-1.5 text-[11px] font-medium transition-all active:scale-95 cursor-pointer text-center",
                  frequency === f.value
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category (if not transfer) */}
        {type !== "transfer" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Category</label>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DynamicIcon name={activeCategory.icon} className="size-3.5" />
                <span>{activeCategory.label}</span>
              </div>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-foreground/[0.03] px-3 text-xs"
            >
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Accounts */}
        {type === "transfer" ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">From Account</label>
              <select
                value={accountId}
                onChange={(e) => handleAccountChange(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-border bg-foreground/[0.03] px-3 text-xs"
              >
                <option value="">Select source</option>
                {accounts?.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">To Account</label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-border bg-foreground/[0.03] px-3 text-xs"
              >
                <option value="">Select destination</option>
                {accounts?.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Account (Optional)</label>
            <select
              value={accountId}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-foreground/[0.03] px-3 text-xs"
            >
              <option value="">None / Unassigned</option>
              {accounts?.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Start Date & Next Due Date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                const val = e.target.value
                setStartDate(val)
                if (!editing && (!nextDueDate || nextDueDate === startDate)) {
                  setNextDueDate(val)
                }
              }}
              className="h-10 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Next Due Date</label>
            <Input
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="h-10 text-xs"
            />
          </div>
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Note (Optional)</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Additional details or reference..."
            className="h-10 text-xs"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isSaving}
          className="cursor-pointer"
        >
          {isSaving ? "Saving..." : editing ? "Save Changes" : "Create Recurring Rule"}
        </Button>
      </div>
    </>
  )
}

export function RecurringTransactionSheet({
  open,
  onOpenChange,
  editing,
  defaultType = "expense",
}: RecurringTransactionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[92vh] overflow-hidden flex flex-col sm:max-w-xl sm:mx-auto"
        showCloseButton={false}
      >
        {open && (
          <RecurringFormContent
            key={editing ? editing._id : "new"}
            editing={editing}
            defaultType={defaultType}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

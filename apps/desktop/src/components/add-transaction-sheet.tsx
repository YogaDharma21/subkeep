"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/clerk-react"
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
  accountTypes,
  todayKey,
} from "@/lib/finance"

interface AddTransactionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: TransactionType
  defaultAccountId?: string
}

export function AddTransactionSheet({
  open,
  onOpenChange,
  defaultType = "expense",
  defaultAccountId,
}: AddTransactionSheetProps) {
  const { isSignedIn } = useAuth()
  const create = useMutation(api.transactions.create)
  const accounts = useQuery(
    api.accounts.list,
    isSignedIn && open ? {} : "skip"
  )

  const [type, setType] = useState<TransactionType>(defaultType)
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("food")
  const [date, setDate] = useState(todayKey())
  const [note, setNote] = useState("")
  const [accountId, setAccountId] = useState(defaultAccountId || "")
  const [toAccountId, setToAccountId] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const categoryOptions = type === "income" ? incomeCategories : expenseCategories
  const activeCategory = useMemo(
    () => financeCategoryMeta(type === "transfer" ? "transfer" : category),
    [category, type]
  )

  const resetForm = () => {
    setType(defaultType)
    setAmount("")
    setCategory("food")
    setDate(todayKey())
    setNote("")
    setAccountId(defaultAccountId || "")
    setToAccountId("")
  }

  const handleTypeChange = (next: TransactionType) => {
    setType(next)
    if (next === "income" && !incomeCategories.some((c) => c.value === category)) {
      setCategory("salary")
    }
    if (next === "expense" && !expenseCategories.some((c) => c.value === category)) {
      setCategory("food")
    }
  }

  const handleSubmit = async () => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    if (!date) {
      toast.error("Please select a date")
      return
    }
    if (type === "transfer" && (!accountId || !toAccountId || accountId === toAccountId)) {
      toast.error("Pick two different accounts for a transfer")
      return
    }
    setIsSaving(true)
    try {
      const accountCurrency =
        accounts?.find((a) => a._id === accountId)?.currency || "IDR"
      await create({
        type,
        amount: parsed,
        currency: accountCurrency,
        category: type === "transfer" ? "transfer" : category,
        date,
        note: note || undefined,
        accountId: (accountId || undefined) as Id<"accounts"> | undefined,
        toAccountId:
          type === "transfer"
            ? ((toAccountId || undefined) as Id<"accounts"> | undefined)
            : undefined,
        icon: activeCategory.icon,
        color: activeCategory.color,
      })
      toast.success(
        type === "income" ? "Income added" : type === "transfer" ? "Transfer recorded" : "Expense added"
      )
      resetForm()
      onOpenChange(false)
    } catch {
      toast.error("Failed to save transaction")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm()
        onOpenChange(o)
      }}
    >
      <SheetContent className="rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <SheetHeader className="flex-row items-center justify-between border-b border-border p-4">
          <SheetTitle>Add Transaction</SheetTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
          >
            <X className="size-4" />
          </Button>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/40 p-1">
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
                  "rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer",
                  type === t.value
                    ? t.value === "income"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : t.value === "transfer"
                        ? "bg-blue-500 text-white shadow-xs"
                        : "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg font-bold h-12"
                inputMode="decimal"
              />
              <span className="text-xs font-semibold text-muted-foreground shrink-0 w-10 text-right">
                {accounts?.find((a) => a._id === accountId)?.currency || currencies[0]?.value}
              </span>
            </div>
          </div>

          {type !== "transfer" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {categoryOptions.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 transition-all cursor-pointer",
                      category === c.value
                        ? "border-foreground bg-muted shadow-xs"
                        : "border-border bg-background hover:border-foreground/40"
                    )}
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                      <DynamicIcon name={c.icon} className="size-4" />
                    </span>
                    <span className="text-[10px] font-medium leading-tight text-center">
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={cn("grid gap-3", type === "transfer" ? "grid-cols-2" : "grid-cols-1")}>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {type === "transfer" ? "From Account" : "Account (Optional)"}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="">No account</option>
                {accounts?.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} · {a.currency}
                  </option>
                ))}
              </select>
            </div>
            {type === "transfer" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">To Account</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="">Select destination</option>
                  {accounts
                    ?.filter((a) => a._id !== accountId)
                    .map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} · {a.currency}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {accounts !== undefined && accounts.length === 0 && (
            <p className="text-[11px] text-muted-foreground">
              Tip: create an account under Accounts to track balances per wallet, bank, or card. ({accountTypes.length} account types supported.)
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (Optional)</label>
              <Input
                placeholder={type === "income" ? "e.g. March salary" : "e.g. Lunch with team"}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-border p-4">
          <Button
            className="w-full cursor-pointer"
            onClick={handleSubmit}
            disabled={isSaving || !amount || !date}
          >
            {isSaving ? "Saving..." : type === "income" ? "Add Income" : type === "transfer" ? "Record Transfer" : "Add Expense"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Wallet, Plus, Pencil, Trash2, Archive, PlusCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AddAccountSheet } from "@/components/add-account-sheet"
import { AddTransactionSheet } from "@/components/add-transaction-sheet"
import { DynamicIcon } from "@/components/dynamic-icon"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { accountTypeMeta, currentMonthKey } from "@/lib/finance"
import { getContrastTextColor } from "@/lib/constants"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type AccountDoc = {
  _id: string
  name: string
  type: string
  balance: number
  currency: string
  icon: string
  color: string
  last4?: string
  isArchived?: boolean
}

export default function AccountsPage() {
  const { isSignedIn } = useAuth()
  const accounts = useQuery(
    api.accounts.list,
    isSignedIn ? { includeArchived: true } : "skip"
  )
  const month = currentMonthKey()
  const monthTxns = useQuery(
    api.transactions.list,
    isSignedIn ? { month } : "skip"
  )
  const archiveMutation = useMutation(api.accounts.archive)
  const removeMutation = useMutation(api.accounts.remove)

  const { primaryCurrency, rates } = usePrimaryCurrency()

  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<AccountDoc | null>(null)
  const [txnForAccount, setTxnForAccount] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AccountDoc | null>(null)

  const { active, archived, totalNetWorth } = useMemo(() => {
    const all = accounts || []
    const active = all.filter((a) => !a.isArchived)
    const archived = all.filter((a) => a.isArchived)
    const totalNetWorth = active.reduce(
      (s, a) => s + convertCurrency(a.balance, a.currency, primaryCurrency, rates),
      0
    )
    return { active, archived, totalNetWorth }
  }, [accounts, primaryCurrency, rates])

  const monthFlowByAccount = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>()
    for (const t of monthTxns || []) {
      if (!t.accountId) continue
      const entry = map.get(t.accountId) || { income: 0, expense: 0 }
      const converted = convertCurrency(t.amount, t.currency, primaryCurrency, rates)
      if (t.type === "income") entry.income += converted
      else if (t.type === "expense") entry.expense += converted
      map.set(t.accountId, entry)
    }
    return map
  }, [monthTxns, primaryCurrency, rates])

  const handleArchive = async (a: AccountDoc) => {
    try {
      await archiveMutation({ id: a._id as Id<"accounts"> })
      toast.success(a.isArchived ? "Account restored" : "Account archived")
    } catch {
      toast.error("Failed to update account")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await removeMutation({ id: deleteTarget._id as Id<"accounts"> })
      toast.success("Account deleted")
      setDeleteTarget(null)
    } catch {
      toast.error("Failed to delete account")
    }
  }

  const renderCard = (a: AccountDoc) => {
    const meta = accountTypeMeta(a.type)
    const flow = monthFlowByAccount.get(a._id)
    return (
      <div
        key={a._id}
        className={cn(
          "rounded-lg border border-border bg-background p-4",
          a.isArchived && "opacity-60"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-lg shadow-xs"
            style={{ backgroundColor: a.color }}
          >
            <DynamicIcon
              name={a.icon || meta.icon}
              className="size-5"
              style={{ color: getContrastTextColor(a.color) }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-bold">{a.name}</span>
              {a.last4 && (
                <span className="text-[11px] text-muted-foreground shrink-0">
                  ···· {a.last4}
                </span>
              )}
              {a.isArchived && (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground shrink-0">
                  Archived
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground capitalize">
              {meta.label}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-sm font-extrabold">
              {formatCurrencyAmount(
                convertCurrency(a.balance, a.currency, primaryCurrency, rates),
                primaryCurrency
              )}
            </div>
            {a.currency !== primaryCurrency && (
              <div className="text-[10px] text-muted-foreground">
                {a.balance.toLocaleString()} {a.currency}
              </div>
            )}
          </div>
        </div>

        {flow && (flow.income > 0 || flow.expense > 0) && (
          <div className="mt-3 flex items-center gap-3 border-t border-border/60 pt-2.5 text-[11px]">
            <span className="font-medium text-emerald-500">
              +{formatCurrencyAmount(flow.income, primaryCurrency)}
            </span>
            <span className="font-medium text-red-500">
              -{formatCurrencyAmount(flow.expense, primaryCurrency)}
            </span>
            <span className="text-muted-foreground">this month</span>
          </div>
        )}

        <div className="mt-3 flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs cursor-pointer"
            onClick={() => setTxnForAccount(a._id)}
          >
            <PlusCircle className="size-3.5" /> Log
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setEditing(a)}
            title="Edit account"
            className="cursor-pointer"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleArchive(a)}
            title={a.isArchived ? "Restore account" : "Archive account"}
            className="cursor-pointer"
          >
            <Archive className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDeleteTarget(a)}
            title="Delete account"
            className="text-muted-foreground hover:text-destructive cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-background p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Wallet className="size-3.5 text-primary" />
            <span>Total Net Worth ({primaryCurrency})</span>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)} className="cursor-pointer">
            <Plus className="size-4" /> Add Account
          </Button>
        </div>
        {accounts === undefined ? (
          <Skeleton className="mt-3 h-9 w-40" />
        ) : (
          <div className="mt-2 text-2xl font-extrabold">
            {formatCurrencyAmount(totalNetWorth, primaryCurrency)}
          </div>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground">
          Sum of all active account balances converted to {primaryCurrency}. Archived accounts are excluded.
        </p>
      </div>

      {accounts === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : active.length === 0 && archived.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
          <Wallet className="size-6 text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No accounts yet</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Add checking, savings, cash, or e-wallets to track balances
          </p>
          <Button size="sm" onClick={() => setAddOpen(true)} className="mt-4 cursor-pointer">
            <Plus className="size-4" /> Add your first account
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {active.map(renderCard)}
          </div>
          {archived.length > 0 && (
            <div className="space-y-2">
              <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Archived ({archived.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {archived.map(renderCard)}
              </div>
            </div>
          )}
        </>
      )}

      <AddAccountSheet open={addOpen} onOpenChange={setAddOpen} />
      <AddAccountSheet
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        editing={editing}
      />
      <AddTransactionSheet
        open={txnForAccount !== null}
        onOpenChange={(o) => !o && setTxnForAccount(null)}
        defaultAccountId={txnForAccount || undefined}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-background p-6 border border-border shadow-xl">
            <h3 className="mb-2 text-center text-lg font-semibold">Delete Account?</h3>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              {deleteTarget.name} will be removed. Linked transactions are kept but detached from this account.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1 cursor-pointer" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

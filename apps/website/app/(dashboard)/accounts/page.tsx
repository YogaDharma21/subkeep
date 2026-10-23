"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Wallet, Pencil, Trash2, Archive } from "lucide-react"
import { SectionHeader } from "@/components/section-nav"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AddAccountSheet } from "@/components/add-account-sheet"
import { DynamicIcon } from "@/components/dynamic-icon"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { accountTypeMeta, currentMonthKey } from "@/lib/finance"
import { moneyTabs } from "@/lib/navigation"
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
  useDocumentTitle("Accounts")
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
  const subscriptions = useQuery(
    api.subscriptions.list,
    isSignedIn ? {} : "skip"
  )
  const archiveMutation = useMutation(api.accounts.archive)
  const removeMutation = useMutation(api.accounts.remove)

  const { primaryCurrency, rates } = usePrimaryCurrency()

  const [editing, setEditing] = useState<AccountDoc | null>(null)
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

  const subscriptionsByAccount = useMemo(() => {
    const map = new Map<string, { count: number; monthlyCommitment: number }>()
    for (const s of subscriptions || []) {
      if (!s.accountId || !s.isActive) continue
      const entry = map.get(s.accountId) || { count: 0, monthlyCommitment: 0 }
      entry.count += 1
      const monthlyCost =
        s.cycle === "yearly"
          ? s.price / 12
          : s.cycle === "weekly"
          ? (s.price * 52) / 12
          : s.cycle === "daily"
          ? s.price * 30
          : s.price
      entry.monthlyCommitment += convertCurrency(monthlyCost, s.currency, primaryCurrency, rates)
      map.set(s.accountId, entry)
    }
    return map
  }, [subscriptions, primaryCurrency, rates])

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
          "surface surface-interactive relative p-4",
          a.isArchived && "opacity-60"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className="surface-inset flex size-10 shrink-0 items-center justify-center rounded-full"
          >
            <DynamicIcon
              name={a.icon || meta.icon}
              className="size-4"
              style={{ color: a.color }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-medium">{a.name}</span>
              {a.last4 && (
                <span className="text-[11px] text-muted-foreground shrink-0">
                  ···· {a.last4}
                </span>
              )}
              {a.isArchived && (
                <span className="shrink-0 rounded-full border border-border px-1.5 py-px text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                  Archived
                </span>
              )}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground capitalize">
              {meta.label}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="numeral text-[13px] font-medium">
              {formatCurrencyAmount(
                convertCurrency(a.balance, a.currency, primaryCurrency, rates),
                primaryCurrency
              )}
            </div>
            {a.currency !== primaryCurrency && (
              <div className="mt-1 text-[10px] text-muted-foreground">
                {a.balance.toLocaleString()} {a.currency}
              </div>
            )}
          </div>
        </div>

        {flow && (flow.income > 0 || flow.expense > 0) && (
          <div className="mt-3 flex items-center gap-3 border-t border-border pt-2.5 text-[11px]">
            <span className="numeral font-medium text-positive">
              +{formatCurrencyAmount(flow.income, primaryCurrency)}
            </span>
            <span className="numeral font-medium text-foreground">
              -{formatCurrencyAmount(flow.expense, primaryCurrency)}
            </span>
            <span className="text-muted-foreground">this month</span>
          </div>
        )}

        {(() => {
          const subInfo = subscriptionsByAccount.get(a._id)
          if (!subInfo || subInfo.count === 0) return null
          return (
            <div className="surface-inset mt-2.5 flex items-center justify-between rounded-full px-3 py-1.5 text-[11px] text-muted-foreground">
              <span>
                {subInfo.count} linked {subInfo.count === 1 ? "subscription" : "subscriptions"}
              </span>
              <span className="numeral text-foreground">
                ~{formatCurrencyAmount(subInfo.monthlyCommitment, primaryCurrency)}/mo
              </span>
            </div>
          )
        })()}

        <div className="mt-3 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setEditing(a)}
            title="Edit account"
            className="size-7 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleArchive(a)}
            title={a.isArchived ? "Restore account" : "Archive account"}
            className="size-7 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Archive className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDeleteTarget(a)}
            title="Delete account"
            className="size-7 rounded-full text-muted-foreground hover:text-destructive cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <SectionHeader title="Money" eyebrow={primaryCurrency} tabs={moneyTabs} />

      <section className="surface relative overflow-hidden p-5 sm:p-7">
        <div className="folder-tab" aria-hidden />
        <div className="relative flex items-start justify-between gap-3">
          <p className="label">Net worth</p>
          <p className="label">{primaryCurrency}</p>
        </div>
        {accounts === undefined ? (
          <Skeleton className="mt-6 h-12 w-56 rounded-2xl" />
        ) : (
          <p className="display-number mt-6 text-[clamp(2.1rem,4.6vw,3.2rem)]">
            {formatCurrencyAmount(totalNetWorth, primaryCurrency)}
          </p>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">
          {active.length} active {active.length === 1 ? "account" : "accounts"} · archived excluded
        </p>
      </section>

      {accounts === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : active.length === 0 && archived.length === 0 ? (
        <div className="surface flex flex-col items-center justify-center py-12 text-center">
          <Wallet className="mb-2 size-5 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No accounts yet</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Add checking, savings, cash, or e-wallets to track balances
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {active.map(renderCard)}
          </div>
          {archived.length > 0 && (
            <div className="space-y-2">
              <h3 className="px-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Archived ({archived.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {archived.map(renderCard)}
              </div>
            </div>
          )}
        </>
      )}

      <AddAccountSheet
        key={editing?._id ?? "new"}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        editing={editing}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="surface w-full max-w-sm p-6">
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

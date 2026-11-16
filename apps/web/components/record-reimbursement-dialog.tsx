"use client"

import React, { useState, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DynamicIcon } from "@/components/dynamic-icon"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { toast } from "sonner"
import { Wallet, Calendar, AlertCircle, FileText } from "lucide-react"

export interface ReimbursementMember {
  index: number
  name: string
  shareAmount: number
}

export interface ReimbursementSubscription {
  _id: Id<"subscriptions">
  name: string
  currency: string
  icon?: string
  color?: string
  accountId?: Id<"accounts">
  splitMembers?: Array<{
    name: string
    shareAmount: number
    isPaid?: boolean
  }>
}

export interface RecordReimbursementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: ReimbursementMember | null
  subscription: ReimbursementSubscription | null
  rates?: Record<string, number>
  onSuccess?: () => void
}

interface AccountItem {
  _id: string
  name: string
  type: string
  balance: number
  currency: string
  isArchived?: boolean
}

function RecordReimbursementForm({
  member,
  subscription,
  activeAccounts,
  rates,
  onClose,
  onSuccess,
}: {
  member: ReimbursementMember
  subscription: ReimbursementSubscription
  activeAccounts: AccountItem[]
  rates?: Record<string, number>
  onClose: () => void
  onSuccess?: () => void
}) {
  const createTransactionMutation = useMutation(api.transactions.create)
  const updateSubscriptionMutation = useMutation(api.subscriptions.update)

  const defaultAccountId = useMemo(() => {
    if (subscription.accountId && activeAccounts.some((a: AccountItem) => a._id === subscription.accountId)) {
      return subscription.accountId
    }
    return activeAccounts.length > 0 ? activeAccounts[0]._id : ""
  }, [subscription.accountId, activeAccounts])

  const [amount, setAmount] = useState(() => member.shareAmount.toString())
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [accountId, setAccountId] = useState(defaultAccountId)
  const [note, setNote] = useState(() => `${member.name} share for ${subscription.name}`)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedAccount = activeAccounts.find((a: AccountItem) => a._id === accountId)
  const parsedAmount = parseFloat(amount || "0")
  const convertedAccountAmount =
    selectedAccount && selectedAccount.currency !== subscription.currency
      ? convertCurrency(parsedAmount, subscription.currency, selectedAccount.currency, rates)
      : parsedAmount

  const handleRecordIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!date) {
      toast.error("Please enter a valid date")
      return
    }

    setIsSubmitting(true)
    try {
      const isConverted = Boolean(
        selectedAccount && selectedAccount.currency !== subscription.currency
      )
      const finalAmount = isConverted
        ? Math.round(convertedAccountAmount * 100) / 100
        : numAmount
      const finalCurrency = isConverted && selectedAccount
        ? selectedAccount.currency
        : subscription.currency

      await createTransactionMutation({
        type: "income",
        amount: finalAmount,
        currency: finalCurrency,
        category: "other-income",
        date,
        note: note.trim() || undefined,
        accountId: accountId ? (accountId as Id<"accounts">) : undefined,
        subscriptionId: subscription._id,
        icon: "Plus",
        color: "#A7B3A2",
      })

      const currentMembers = subscription.splitMembers ? [...subscription.splitMembers] : []
      const updatedMembers = currentMembers.map((m: { name: string; shareAmount: number; isPaid?: boolean }, idx: number) => ({
        name: m.name,
        shareAmount: m.shareAmount,
        isPaid: idx === member.index ? true : Boolean(m.isPaid),
      }))

      await updateSubscriptionMutation({
        id: subscription._id,
        splitMembers: updatedMembers,
      })

      toast.success(`Recorded income and marked ${member.name} as paid`)
      onClose()
      onSuccess?.()
    } catch {
      toast.error(`Failed to record reimbursement for ${member.name}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkPaidOnly = async () => {
    setIsSubmitting(true)
    try {
      const currentMembers = subscription.splitMembers ? [...subscription.splitMembers] : []
      const updatedMembers = currentMembers.map((m: { name: string; shareAmount: number; isPaid?: boolean }, idx: number) => ({
        name: m.name,
        shareAmount: m.shareAmount,
        isPaid: idx === member.index ? true : Boolean(m.isPaid),
      }))

      await updateSubscriptionMutation({
        id: subscription._id,
        splitMembers: updatedMembers,
      })

      toast.success(`Marked ${member.name} as paid`)
      onClose()
      onSuccess?.()
    } catch {
      toast.error(`Failed to mark ${member.name} as paid`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleRecordIncome} className="space-y-4 py-2">
      {/* Account to deposit to */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium flex items-center gap-1.5">
          <Wallet className="size-3.5 text-primary" />
          Deposit to Account
        </label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="flex h-9 w-full rounded-xl border border-border bg-foreground/[0.03] px-3 text-xs outline-none focus:ring-1 focus:ring-primary font-mono tabular-nums"
        >
          {activeAccounts.length === 0 ? (
            <option value="">No accounts available</option>
          ) : (
            <>
              {activeAccounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.name} ({acc.type}) · {formatCurrencyAmount(acc.balance, acc.currency)}
                </option>
              ))}
              <option value="">None (Record without account balance deposit)</option>
            </>
          )}
        </select>
        {selectedAccount && selectedAccount.currency !== subscription.currency && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono tabular-nums">
            <AlertCircle className="size-3 text-warning shrink-0" />
            Will deposit ~{formatCurrencyAmount(convertedAccountAmount, selectedAccount.currency)} into {selectedAccount.name}
          </p>
        )}
      </div>

      {/* Amount and Date grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium">
            Amount ({subscription.currency})
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-xs font-mono tabular-nums rounded-xl border border-border bg-foreground/[0.03]"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium flex items-center gap-1">
            <Calendar className="size-3 text-muted-foreground" />
            Payment Date
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs font-mono tabular-nums rounded-xl border border-border bg-foreground/[0.03]"
            required
          />
        </div>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium flex items-center gap-1">
          <FileText className="size-3 text-muted-foreground" />
          Note
        </label>
        <Input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={`e.g. ${member.name} share`}
          className="text-xs rounded-xl border border-border bg-foreground/[0.03]"
        />
      </div>

      <DialogFooter className="gap-2 sm:gap-2 mt-5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-xl cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleMarkPaidOnly}
          disabled={isSubmitting}
          className="rounded-xl cursor-pointer"
        >
          {isSubmitting ? "Saving..." : "Mark Paid Only"}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !amount || !date}
          className="rounded-xl cursor-pointer"
        >
          {isSubmitting ? "Recording..." : "Record Income"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function RecordReimbursementDialog({
  open,
  onOpenChange,
  member,
  subscription,
  rates,
  onSuccess,
}: RecordReimbursementDialogProps) {
  const accounts = useQuery(api.accounts.list, {})
  const activeAccounts = useMemo(() => {
    return ((accounts as AccountItem[] | undefined)?.filter((a: AccountItem) => !a.isArchived) || []) as AccountItem[]
  }, [accounts])

  if (!member || !subscription) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-5 border border-border bg-card">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2.5">
            <span
              className="surface-inset flex size-9 shrink-0 items-center justify-center rounded-xl text-foreground shadow-xs"
              style={subscription.color ? { backgroundColor: `${subscription.color}20`, color: subscription.color } : undefined}
            >
              <DynamicIcon name={subscription.icon || "receipt"} className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold">Record Reimbursement</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {member.name} · <span className="font-mono tabular-nums">{formatCurrencyAmount(member.shareAmount, subscription.currency)}</span> for {subscription.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {open && (
          <RecordReimbursementForm
            key={`${subscription._id}-${member.index}-${open}`}
            member={member}
            subscription={subscription}
            activeAccounts={activeAccounts}
            rates={rates}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

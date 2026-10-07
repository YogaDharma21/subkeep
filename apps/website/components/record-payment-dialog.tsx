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
import { Wallet, Calendar, AlertCircle } from "lucide-react"

export interface RecordPaymentTarget {
  _id: string
  name: string
  price: number
  currency: string
  cycle?: string
  accountId?: string
  icon?: string
  color?: string
  nextBilling?: string
  lastPaymentDate?: string
}

interface RecordPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription: RecordPaymentTarget | null
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

function RecordPaymentForm({
  subscription,
  activeAccounts,
  rates,
  onClose,
  onSuccess,
}: {
  subscription: RecordPaymentTarget
  activeAccounts: AccountItem[]
  rates?: Record<string, number>
  onClose: () => void
  onSuccess?: () => void
}) {
  const recordPaymentMutation = useMutation(api.subscriptions.recordPayment)

  const defaultAccountId = useMemo(() => {
    if (subscription.accountId && activeAccounts.some((a) => a._id === subscription.accountId)) {
      return subscription.accountId
    }
    return activeAccounts.length > 0 ? activeAccounts[0]._id : ""
  }, [subscription.accountId, activeAccounts])

  const [amount, setAmount] = useState(() => subscription.price.toString())
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [accountId, setAccountId] = useState(defaultAccountId)
  const [linkAccount, setLinkAccount] = useState(() =>
    Boolean(subscription.accountId && activeAccounts.some((a) => a._id === subscription.accountId))
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedAccount = activeAccounts.find((a) => a._id === accountId)
  const parsedAmount = parseFloat(amount || "0")
  const convertedAccountDeduction =
    selectedAccount && selectedAccount.currency !== subscription.currency
      ? convertCurrency(parsedAmount, subscription.currency, selectedAccount.currency, rates)
      : parsedAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!date) {
      toast.error("Please enter a valid date")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await recordPaymentMutation({
        id: subscription._id as Id<"subscriptions">,
        amount: numAmount,
        date,
        accountId: accountId ? (accountId as Id<"accounts">) : undefined,
        linkAccount: Boolean(accountId && linkAccount),
      })

      toast.success(
        res.isActive
          ? `Recorded payment for ${subscription.name}! Next renewal: ${res.nextBilling}`
          : `Recorded final payment for ${subscription.name}! Term completed.`
      )

      onClose()
      onSuccess?.()
    } catch {
      toast.error(`Failed to record payment for ${subscription.name}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      {/* Account to pay from */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium flex items-center gap-1.5">
          <Wallet className="size-3.5 text-primary" />
          Pay from Account
        </label>
        <select
          value={accountId}
          onChange={(e) => {
            const newAcc = e.target.value
            setAccountId(newAcc)
            if (!newAcc) {
              setLinkAccount(false)
            } else if (newAcc === subscription.accountId) {
              setLinkAccount(true)
            }
          }}
          className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
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
              <option value="">None (Record without account balance deduction)</option>
            </>
          )}
        </select>
        {selectedAccount && selectedAccount.currency !== subscription.currency && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <AlertCircle className="size-3 text-amber-500 shrink-0" />
            Will deduct ~{formatCurrencyAmount(convertedAccountDeduction, selectedAccount.currency)} from {selectedAccount.name}
          </p>
        )}
      </div>

      {/* Amount & Date grid */}
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
            className="text-xs"
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
            className="text-xs"
            required
          />
        </div>
      </div>

      {/* Link account toggle */}
      {accountId && (
        <label className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={linkAccount}
            onChange={(e) => setLinkAccount(e.target.checked)}
            className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
          <div className="text-xs leading-tight">
            <div className="font-medium text-foreground">
              Set as default account for future renewals
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Links this subscription to {selectedAccount?.name || "this account"} for automated billing commitment tracking.
            </div>
          </div>
        </label>
      )}

      <DialogFooter className="gap-2 sm:gap-0 mt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !amount || !date}
        >
          {isSubmitting ? "Recording..." : "Confirm Payment"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  subscription,
  rates,
  onSuccess,
}: RecordPaymentDialogProps) {
  const accounts = useQuery(api.accounts.list, {})
  const activeAccounts = (accounts?.filter((a) => !a.isArchived) || []) as AccountItem[]

  if (!subscription) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg p-5">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2.5">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg shadow-xs"
              style={{ backgroundColor: subscription.color || "#3b82f6" }}
            >
              <DynamicIcon name={subscription.icon || "receipt"} className="size-5 text-white" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold">Record Payment</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {subscription.name} · {formatCurrencyAmount(subscription.price, subscription.currency)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {open && (
          <RecordPaymentForm
            key={`${subscription._id}-${open}`}
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

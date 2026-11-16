"use client"

import React, { useState } from "react"
import { useMutation } from "convex/react"
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
import { formatCurrencyAmount } from "@/lib/currency"
import { todayKey } from "@/lib/finance"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { CheckCircle2, ArrowUpRight, ArrowDownRight } from "lucide-react"

export interface ReconcileAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: {
    _id: string
    name: string
    balance: number
    currency: string
    icon?: string
    color?: string
  } | null
}

function ReconcileAccountForm({
  account,
  onClose,
}: {
  account: NonNullable<ReconcileAccountDialogProps["account"]>
  onClose: () => void
}) {
  const createTransaction = useMutation(api.transactions.create)
  const [actualBalance, setActualBalance] = useState("")
  const [note, setNote] = useState("Reconciliation adjustment")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const parsedActual = parseFloat(actualBalance)
  const isInputValid = actualBalance.trim() !== "" && !isNaN(parsedActual)
  const actual = isInputValid ? parsedActual : 0
  const rawDelta = isInputValid ? actual - account.balance : 0
  const roundedDelta = Math.round(rawDelta * 100) / 100
  const delta = Math.abs(roundedDelta) < 0.000001 ? 0 : roundedDelta
  const hasDiscrepancy = isInputValid && delta !== 0
  const direction: "income" | "expense" = delta > 0 ? "income" : "expense"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isInputValid || delta === 0) return

    setIsSubmitting(true)
    try {
      await createTransaction({
        type: delta > 0 ? "income" : "expense",
        amount: Math.abs(delta),
        currency: account.currency,
        category: "Adjustment",
        date: todayKey(),
        note: note.trim() || "Reconciliation adjustment",
        accountId: account._id as Id<"accounts">,
      })
      toast.success("Account reconciled")
      onClose()
    } catch {
      toast.error("Failed to reconcile account")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="surface-inset flex items-center justify-between rounded-xl p-3.5">
        <div className="space-y-0.5">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Recorded Balance
          </div>
          <div className="text-xs text-muted-foreground">
            {account.name} - {account.currency}
          </div>
        </div>
        <div className="numeral text-base font-semibold text-foreground">
          {formatCurrencyAmount(account.balance, account.currency)}
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="actual-balance"
          className="text-xs font-medium text-foreground"
        >
          Actual Bank / Statement Balance
        </label>
        <Input
          id="actual-balance"
          type="number"
          step="any"
          placeholder={account.balance.toString()}
          value={actualBalance}
          onChange={(e) => setActualBalance(e.target.value)}
          className="numeral"
          autoFocus
        />
      </div>

      {!hasDiscrepancy ? (
        <div className="surface-inset flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-xs text-muted-foreground">
          <CheckCircle2 className="size-4 shrink-0 text-positive" />
          <span>
            {isInputValid && delta === 0
              ? "Balance matches recorded balance. Zero discrepancy."
              : "Zero discrepancy. Enter statement balance."}
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="surface-inset space-y-2.5 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Direction</span>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                  direction === "income"
                    ? "bg-positive/10 text-positive"
                    : "bg-negative/10 text-negative"
                )}
              >
                {direction === "income" ? (
                  <ArrowUpRight className="size-3" />
                ) : (
                  <ArrowDownRight className="size-3" />
                )}
                {direction}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Adjustment Amount</span>
              <span
                className={cn(
                  "numeral text-sm font-semibold",
                  direction === "income" ? "text-positive" : "text-negative"
                )}
              >
                {direction === "income" ? "+" : "-"}
                {formatCurrencyAmount(Math.abs(delta), account.currency)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="reconcile-note"
              className="text-xs font-medium text-foreground"
            >
              Adjustment Note
            </label>
            <Input
              id="reconcile-note"
              type="text"
              placeholder="Reconciliation adjustment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      )}

      <DialogFooter className="gap-2 sm:gap-0">
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
          disabled={isSubmitting || !isInputValid || delta === 0}
        >
          {isSubmitting ? "Reconciling..." : "Reconcile Account"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ReconcileAccountDialog({
  open,
  onOpenChange,
  account,
}: ReconcileAccountDialogProps) {
  if (!account) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-5">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2.5">
            <span className="surface-inset flex size-9 shrink-0 items-center justify-center rounded-xl text-foreground shadow-xs">
              <DynamicIcon
                name={account.icon || "Wallet"}
                className="size-5"
                style={{ color: account.color }}
              />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold">
                Reconcile Account
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {account.name} - {account.currency}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {open && (
          <ReconcileAccountForm
            key={`${account._id}-${open}`}
            account={account}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

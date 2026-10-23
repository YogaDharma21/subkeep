"use client"

import { ArrowLeftRight, PiggyBank, Repeat, Wallet, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export type QuickAddKind = "transaction" | "subscription" | "account" | "budget"

interface QuickAddSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (kind: QuickAddKind) => void
}

const options: Array<{
  kind: QuickAddKind
  label: string
  detail: string
  icon: typeof Wallet
}> = [
  {
    kind: "transaction",
    label: "Transaction",
    detail: "Expense, income, transfer",
    icon: ArrowLeftRight,
  },
  {
    kind: "subscription",
    label: "Subscription",
    detail: "Recurring bill or trial",
    icon: Repeat,
  },
  {
    kind: "account",
    label: "Account",
    detail: "Bank, cash, e-wallet",
    icon: Wallet,
  },
  {
    kind: "budget",
    label: "Budget",
    detail: "Monthly category cap",
    icon: PiggyBank,
  },
]

export function QuickAddSheet({ open, onOpenChange, onSelect }: QuickAddSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl" showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between border-b border-border p-4">
          <SheetTitle>Quick Add</SheetTitle>
          <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
            <X className="size-4" />
          </Button>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-2 p-4">
          {options.map((opt) => {
            const Icon = opt.icon
            return (
              <button
                key={opt.kind}
                type="button"
                onClick={() => onSelect(opt.kind)}
                className="flex cursor-pointer flex-col items-start gap-2.5 rounded-2xl border border-border bg-foreground/[0.02] p-3.5 text-left transition-all hover:border-foreground/30 hover:bg-foreground/[0.04] active:scale-[0.98]"
              >
                <span className="flex size-9 items-center justify-center rounded-xl border border-border bg-foreground/[0.03] text-foreground">
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {opt.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground">
                    {opt.detail}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}

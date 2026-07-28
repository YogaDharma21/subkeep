"use client"

import Link from "next/link"
import { getSymbol } from "@/lib/constants"
import { format, differenceInDays } from "date-fns"
import { DynamicIcon } from "@/components/dynamic-icon"
import { convertAndFormat, formatCurrencyAmount } from "@/lib/currency"

interface Subscription {
  _id: string
  name: string
  icon: string
  color: string
  price: number
  currency: string
  cycle: string
  category: string
  nextBilling: string
  endDate?: string
  account?: string
  website?: string
  isTrial?: boolean
  trialEndDate?: string
  cancelUrl?: string
}

interface SubscriptionCardProps {
  sub: Subscription
  primaryCurrency?: string
}

export function SubscriptionCard({ sub, primaryCurrency = "IDR" }: SubscriptionCardProps) {
  const isTrial = !!sub.isTrial
  const showConverted = primaryCurrency && primaryCurrency !== sub.currency

  let trialDaysLeft: number | null = null
  if (isTrial && sub.trialEndDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tEnd = new Date(sub.trialEndDate)
    tEnd.setHours(0, 0, 0, 0)
    trialDaysLeft = Math.max(0, differenceInDays(tEnd, today))
  }

  return (
    <Link
      href={`/subscriptions/${sub._id}`}
      className="flex items-center gap-3.5 rounded-xl border border-border bg-background p-3.5 transition-all hover:border-border/80 active:scale-[0.98] active:opacity-80 relative overflow-hidden group"
    >
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
        style={{ backgroundColor: sub.color }}
      >
        <DynamicIcon name={sub.icon} className="size-5 text-white" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate">
          <span className="truncate text-sm font-semibold">{sub.name}</span>
          {sub.account && (
            <span className="truncate text-xs font-normal text-muted-foreground">
              ({sub.account})
            </span>
          )}
          {isTrial && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wide shrink-0">
              TRIAL
            </span>
          )}
        </div>

        <div className="text-xs text-muted-foreground mt-0.5">
          <span>{sub.category}</span>
          <span className="mx-1">&middot;</span>
          {isTrial && sub.trialEndDate ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Trial ends: {format(new Date(sub.trialEndDate), "MMM d")}
              {trialDaysLeft !== null && ` (${trialDaysLeft}d left)`}
            </span>
          ) : (
            <span>Next: {format(new Date(sub.nextBilling), "MMM d")}</span>
          )}

          {sub.endDate && !isTrial && (
            <span className="ml-1 text-[11px] font-normal text-muted-foreground/80">
              (Ends {format(new Date(sub.endDate), "MMM d, yyyy")})
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="text-sm font-bold text-foreground">
          {showConverted
            ? convertAndFormat(sub.price, sub.currency, primaryCurrency)
            : formatCurrencyAmount(sub.price, sub.currency)}
        </div>

        <div className="text-[11px] text-muted-foreground flex items-center justify-end gap-1">
          {showConverted && (
            <span className="text-[10px] text-muted-foreground/80">
              ({getSymbol(sub.currency)}{sub.price})
            </span>
          )}
          <span>/{sub.cycle}</span>
        </div>
      </div>
    </Link>
  )
}

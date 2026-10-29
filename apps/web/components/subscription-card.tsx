"use client"

import Link from "next/link"
import { getSymbol } from "@/lib/constants"
import { format, differenceInDays } from "date-fns"
import { DynamicIcon } from "@/components/dynamic-icon"
import { convertAndFormat, formatCurrencyAmount } from "@/lib/currency"
import { cn } from "@/lib/utils"

interface Subscription {
  _id: string
  name: string
  icon: string
  color?: string
  price: number
  currency: string
  cycle: string
  category: string
  nextBilling: string
  endDate?: string
  account?: string
  website?: string
  isActive: boolean
  isTrial?: boolean
  trialEndDate?: string
  cancelUrl?: string
  isShared?: boolean
  totalPlanPrice?: number
  totalMembers?: number
  pendingCancel?: boolean
}

interface SubscriptionCardProps {
  sub: Subscription
  primaryCurrency?: string
  rates?: Record<string, number>
}

export function SubscriptionCard({
  sub,
  primaryCurrency = "IDR",
  rates,
}: SubscriptionCardProps) {
  const isTrial = !!sub.isTrial
  const isShared = !!sub.isShared
  const showConverted = primaryCurrency && primaryCurrency !== sub.currency

  let trialDaysLeft: number | null = null
  if (isTrial && sub.trialEndDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tEnd = new Date(sub.trialEndDate)
    tEnd.setHours(0, 0, 0, 0)
    trialDaysLeft = Math.max(0, differenceInDays(tEnd, today))
  }

  const tooltipText = sub.account ? `${sub.name} (${sub.account})` : sub.name

  const badge = isTrial
    ? { label: "Trial", tone: "text-warning border-warning/30" }
    : !sub.isActive
      ? { label: "Canceled", tone: "text-muted-foreground border-border" }
      : sub.pendingCancel
        ? { label: "Canceling", tone: "text-warning border-warning/30" }
        : isShared
          ? {
              label: `Split${sub.totalMembers ? ` 1/${sub.totalMembers}` : ""}`,
              tone: "text-muted-foreground border-border",
            }
          : null

  return (
    <Link
      href={`/subscriptions/${sub._id}`}
      title={tooltipText}
      className={cn(
        "surface surface-interactive group relative flex items-center gap-3.5 overflow-hidden p-3.5 pl-4",
        !sub.isActive && "opacity-65"
      )}
    >
      <span className="surface-inset relative flex size-10 shrink-0 items-center justify-center rounded-full">
        <DynamicIcon
          name={sub.icon}
          className="size-4 text-foreground/80"
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-medium text-foreground" title={sub.name}>
            {sub.name}
          </span>
          {badge ? (
            <span
              className={cn(
                "shrink-0 rounded-full border px-1.5 py-px text-[9px] uppercase tracking-[0.1em]",
                badge.tone
              )}
            >
              {badge.label}
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-[11px] text-muted-foreground">
          <span className="capitalize">{sub.category}</span>
          <span className="text-muted-foreground/40">/</span>
          {isTrial && sub.trialEndDate ? (
            <span className="text-warning">
              Ends {format(new Date(sub.trialEndDate), "MMM d")}
              {trialDaysLeft !== null && trialDaysLeft > 0
                ? ` · ${trialDaysLeft}d`
                : trialDaysLeft === 0
                  ? " · expired"
                  : ""}
            </span>
          ) : (
            <span>Next {format(new Date(sub.nextBilling), "MMM d")}</span>
          )}
          {sub.account ? (
            <>
              <span className="text-muted-foreground/40">/</span>
              <span className="truncate">{sub.account}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="numeral text-[13px] font-medium text-foreground">
          {showConverted
            ? convertAndFormat(sub.price, sub.currency, primaryCurrency, rates)
            : formatCurrencyAmount(sub.price, sub.currency)}
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">
          {showConverted ? `${getSymbol(sub.currency)}${sub.price} · ` : ""}
          {sub.cycle}
        </div>
      </div>
    </Link>
  )
}

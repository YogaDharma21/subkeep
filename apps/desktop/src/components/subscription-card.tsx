import { getSymbol } from "@/lib/constants"
import { format, differenceInDays } from "date-fns"
import { DynamicIcon } from "@/components/dynamic-icon"
import { convertAndFormat, formatCurrencyAmount } from "@/lib/currency"

export interface Subscription {
  _id: string
  name: string
  icon: string
  color: string
  price: number
  currency: string
  cycle: string
  category: string
  startDate: string
  nextBilling: string
  endDate?: string
  account?: string
  website?: string
  isActive?: boolean
  isTrial?: boolean
  trialEndDate?: string
  cancelUrl?: string
  isShared?: boolean
  totalPlanPrice?: number
  totalMembers?: number
  paymentMethodId?: string
  splitMembers?: Array<{
    name: string
    shareAmount: number
    isPaid?: boolean
  }>
  priceHistory?: Array<{
    price: number
    currency: string
    changedAt: string
  }>
  receiptStorageId?: string
  receiptFileName?: string
  receiptUrl?: string | null
}

interface SubscriptionCardProps {
  sub: Subscription
  primaryCurrency?: string
  rates?: Record<string, number>
  onClick?: (id: string) => void
}

export function SubscriptionCard({
  sub,
  primaryCurrency = "IDR",
  rates,
  onClick,
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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(sub._id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.(sub._id)
        }
      }}
      title={tooltipText}
      className="flex items-center gap-3.5 rounded-lg border border-border bg-background p-3.5 transition-all hover:border-border/90 hover:bg-muted/30 active:scale-[0.99] cursor-pointer relative overflow-hidden group shadow-xs"
    >
      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 overflow-hidden shadow-xs"
        style={{ backgroundColor: sub.color }}
      >
        <DynamicIcon name={sub.icon} className="size-6 text-white" />
      </div>

      <div className="min-w-0 flex-1">
        {/* Line 1: Service Name & Badges */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate text-sm font-bold text-foreground" title={sub.name}>
            {sub.name}
          </span>

          {isTrial && (
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider shrink-0">
              TRIAL
            </span>
          )}

          {isShared && (
            <span className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[9px] font-extrabold text-blue-600 dark:text-blue-400 border border-blue-500/30 uppercase tracking-wider shrink-0">
              SPLIT {sub.totalMembers ? `(1/${sub.totalMembers})` : ""}
            </span>
          )}

          {sub.isActive === false && (
            <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-[9px] font-extrabold text-red-600 dark:text-red-400 border border-red-500/30 uppercase tracking-wider shrink-0">
              PAUSED
            </span>
          )}
        </div>

        {/* Line 2: Account/Email Line */}
        {sub.account && (
          <div className="text-[11px] font-normal text-muted-foreground truncate max-w-full leading-snug" title={sub.account}>
            {sub.account}
          </div>
        )}

        {/* Line 3: Category & Billing Info */}
        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
          <span className="capitalize">{sub.category}</span>
          <span>&middot;</span>
          {isTrial && sub.trialEndDate ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Expires {format(new Date(sub.trialEndDate), "MMM d")}
              {trialDaysLeft !== null && ` (${trialDaysLeft}d)`}
            </span>
          ) : (
            <span>Next: {format(new Date(sub.nextBilling), "MMM d, yyyy")}</span>
          )}

          {sub.endDate && !isTrial && (
            <span className="text-[11px] text-muted-foreground/80">
              (Ends {format(new Date(sub.endDate), "MMM d")})
            </span>
          )}
        </div>
      </div>

      {/* Price Column */}
      <div className="shrink-0 text-right">
        <div className="text-sm font-extrabold text-foreground">
          {showConverted
            ? convertAndFormat(sub.price, sub.currency, primaryCurrency, rates)
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
    </div>
  )
}

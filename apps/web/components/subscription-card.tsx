"use client"

import Link from "next/link"
import { getSymbol } from "@/lib/constants"
import { format } from "date-fns"
import { DynamicIcon } from "@/components/dynamic-icon"

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
}

export function SubscriptionCard({ sub }: { sub: Subscription }) {
  return (
    <Link
      href={`/subscriptions/${sub._id}`}
      className="flex items-center gap-3.5 rounded-xl border border-border bg-background p-3.5 transition-all active:scale-[0.98] active:opacity-80"
    >
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-xl"
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
        </div>
        <div className="text-xs text-muted-foreground">
          {sub.category} &middot; Next: {format(new Date(sub.nextBilling), "MMM d")}
          {sub.endDate && (
            <span className="ml-1 text-[11px] font-normal text-muted-foreground/80">
              (Ends {format(new Date(sub.endDate), "MMM d, yyyy")})
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold">
          {getSymbol(sub.currency)}{sub.price}
        </div>
        <div className="text-xs text-muted-foreground">/{sub.cycle}</div>
      </div>
    </Link>
  )
}

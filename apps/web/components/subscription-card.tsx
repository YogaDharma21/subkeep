"use client"

import Link from "next/link"
import * as LucideIcons from "lucide-react"
import { getSymbol } from "@/lib/constants"
import { format } from "date-fns"
import type { ComponentType } from "react"

const icons = LucideIcons as unknown as Record<string, ComponentType<Record<string, unknown>>>

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] || LucideIcons.Receipt
  return <Icon className={className} />
}

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
        <div className="truncate text-sm font-semibold">{sub.name}</div>
        <div className="text-xs text-muted-foreground">
          {sub.category} &middot;{" "}
          {format(new Date(sub.nextBilling), "MMM d")}
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

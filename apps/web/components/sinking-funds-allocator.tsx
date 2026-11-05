"use client"

import React from "react"
import { Coins, PiggyBank } from "lucide-react"
import { DynamicIcon } from "@/components/dynamic-icon"
import { formatCurrencyAmount } from "@/lib/currency"
import type { SinkingFundItem, SinkingFundsTotals } from "@/lib/sinking-funds"
import { cn } from "@/lib/utils"

export type { SinkingFundItem, SinkingFundsTotals }

export interface SinkingFundsAllocatorProps {
  items: SinkingFundItem[]
  totals: SinkingFundsTotals
  primaryCurrency: string
  className?: string
}

function formatCycleBadge(cycle?: string, cycleMonths?: number): string {
  if (cycle) {
    const c = cycle.toLowerCase().trim()
    if (c === "yearly" || c === "annual") return "Annual"
    if (
      c === "semi-annual" ||
      c === "semiannual" ||
      c === "semi_annual" ||
      c === "6 months"
    ) {
      return "6-Month"
    }
    if (c === "quarterly" || c === "3 months") return "Quarterly"
    return cycle.charAt(0).toUpperCase() + cycle.slice(1)
  }
  if (cycleMonths) {
    return `${cycleMonths} mo`
  }
  return "Reserve"
}

function formatRenewalDate(dateStr?: string): string | null {
  if (!dateStr) return null
  const trimmed = dateStr.trim()
  if (!trimmed) return null

  const parts = trimmed.slice(0, 10).split("-")
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      const d = new Date(year, month, day)
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      }
    }
  }

  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return trimmed
}

function getItemProperties(item: SinkingFundItem) {
  const sub = (item.subscription as Record<string, unknown> | undefined) || {}
  const name =
    item.name ?? (sub.name as string | undefined) ?? "Subscription"
  const icon =
    item.icon ?? (sub.icon as string | undefined) ?? "coins"
  const category =
    item.category ?? (sub.category as string | undefined) ?? "General"
  const cycle =
    item.cycle ?? (sub.cycle as string | undefined)
  const nextBilling =
    item.nextBilling ?? (sub.nextBilling as string | undefined)
  const totalCost =
    item.totalCost ??
    item.cost ??
    (sub.price as number | undefined) ??
    0
  const monthlyReserve = item.monthlyReserve ?? 0
  const accruedAmount = item.accruedAmount ?? 0
  const pct =
    typeof item.pct === "number"
      ? Math.min(100, Math.max(0, item.pct))
      : 0
  const cycleMonths = item.cycleMonths

  return {
    name,
    icon,
    category,
    cycle,
    nextBilling,
    totalCost,
    monthlyReserve,
    accruedAmount,
    pct,
    cycleMonths,
  }
}

export function SinkingFundsAllocator({
  items,
  totals,
  primaryCurrency,
  className,
}: SinkingFundsAllocatorProps) {
  return (
    <section className={cn("surface p-5 sm:p-7 rounded-[24px]", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="surface-inset size-9 rounded-full text-muted-foreground flex items-center justify-center shrink-0">
          <Coins className="size-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-[15px] font-medium tracking-[-0.015em] text-foreground">
            Sinking Funds
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Monthly reserve allocations for multi-month renewals
          </p>
        </div>
      </div>

      {/* Summary Statistics Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 border-b border-border/40 pb-6 sm:grid-cols-3">
        <div className="space-y-1">
          <span className="label">Monthly Reserve</span>
          <div className="display-number text-2xl sm:text-3xl font-semibold tabular-nums text-foreground">
            +{formatCurrencyAmount(totals.totalMonthlyReserve, primaryCurrency)}
            <span className="ml-1 text-xs font-normal text-muted-foreground tracking-normal">
              / mo
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Target monthly reserve
          </p>
        </div>
        <div className="space-y-1">
          <span className="label">Total Accrued Target</span>
          <div className="display-number text-2xl sm:text-3xl font-semibold tabular-nums text-foreground">
            {formatCurrencyAmount(totals.totalAccruedTarget, primaryCurrency)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Accrued towards upcoming renewals
          </p>
        </div>
        <div className="space-y-1">
          <span className="label">Active Funds</span>
          <div className="display-number text-2xl sm:text-3xl font-semibold tabular-nums text-foreground">
            {totals.count}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Multi-month subscriptions
          </p>
        </div>
      </div>

      {/* Breakdown or Empty State */}
      {items.length === 0 ? (
        <div className="surface-inset mt-6 flex flex-col items-center justify-center rounded-[16px] py-10 text-center">
          <PiggyBank className="mb-2 size-5 text-muted-foreground/40" />
          <p className="text-[13px] font-medium text-foreground">
            No active sinking funds
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Subscriptions with multi-month billing cycles will appear here with
            monthly reserve targets.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item, idx) => {
            const {
              name,
              icon,
              category,
              cycle,
              nextBilling,
              totalCost,
              monthlyReserve,
              accruedAmount,
              pct,
              cycleMonths,
            } = getItemProperties(item)

            const renewalDate = formatRenewalDate(nextBilling)
            const sub = (item.subscription as Record<string, unknown> | undefined) || {}
            const itemKey =
              item.id ??
              (sub._id as string | undefined) ??
              (sub.id as string | undefined) ??
              `${name}-${idx}`

            return (
              <div
                key={itemKey}
                className="surface-inset p-3.5 sm:p-4 rounded-[16px] space-y-3"
              >
                <div className="flex items-center gap-3">
                  <span className="surface flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground">
                    <DynamicIcon name={icon} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium text-foreground">
                        {name}
                      </span>
                      <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {formatCycleBadge(cycle, cycleMonths)}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      <span>{category}</span>
                      {renewalDate && <span> · Renews {renewalDate}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="numeral text-[13px] font-medium text-foreground tabular-nums">
                      +{formatCurrencyAmount(monthlyReserve, primaryCurrency)} / mo
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className="h-full rounded-full bg-foreground/70 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
                    <span>
                      {formatCurrencyAmount(accruedAmount, primaryCurrency)} accrued of{" "}
                      {formatCurrencyAmount(totalCost, primaryCurrency)} ({pct}%)
                    </span>
                    {renewalDate && (
                      <span className="hidden sm:inline text-muted-foreground/80">
                        Renewal: {renewalDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

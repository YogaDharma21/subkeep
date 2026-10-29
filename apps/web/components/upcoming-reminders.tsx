"use client"

import { useState } from "react"
import { Id } from "@/convex/_generated/dataModel"
import { ExternalLink, Check } from "lucide-react"
import { DynamicIcon } from "@/components/dynamic-icon"
import { convertAndFormat } from "@/lib/currency"
import { findUpcomingReminders, ReminderItem } from "@/lib/notifications"
import Link from "next/link"
import { RecordPaymentDialog, RecordPaymentTarget } from "@/components/record-payment-dialog"

interface UpcomingRemindersProps {
  subscriptions: Array<{
    _id: string
    name: string
    icon: string
    color?: string
    price: number
    currency: string
    cycle: string
    nextBilling: string
    isTrial?: boolean
    trialEndDate?: string
    cancelUrl?: string
    isActive: boolean
    accountId?: Id<"accounts">
    endDate?: string
    lastPaymentDate?: string
  }>
  primaryCurrency?: string
  rates?: Record<string, number>
  onMarkCanceled?: (id: string) => Promise<void>
}

export function UpcomingReminders({
  subscriptions,
  primaryCurrency = "IDR",
  rates,
}: UpcomingRemindersProps) {
  const [selectedReminder, setSelectedReminder] = useState<RecordPaymentTarget | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const reminders = findUpcomingReminders(subscriptions, 3)

  if (reminders.length === 0) return null

  const handleOpenRecordPayment = (item: ReminderItem) => {
    setSelectedReminder(item)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label">Upcoming</p>
          <h2 className="mt-1.5 text-[15px] font-medium tracking-tight text-foreground">
            Due soon
          </h2>
        </div>
        <span className="numeral flex size-7 items-center justify-center rounded-full border border-border text-[11px] text-muted-foreground">
          {reminders.length}
        </span>
      </div>

      <div className="divide-y divide-border/70">
        {reminders.map((item) => {
          const isTrial = item.type === "trial"
          const priceFormatted = convertAndFormat(item.price, item.currency, primaryCurrency, rates)

          return (
            <div key={item._id} className="flex items-center gap-3 py-3">
              <Link
                href={`/subscriptions/${item._id}`}
                className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-75"
              >
                <span className="surface-inset flex size-8 shrink-0 items-center justify-center rounded-full text-foreground">
                  <DynamicIcon
                    name={item.icon}
                    className="size-3.5"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] text-foreground">{item.name}</span>
                    {isTrial ? (
                      <span className="shrink-0 rounded-full border border-border px-1.5 py-px text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                        Trial
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {isTrial ? "Ends" : "Due"}{" "}
                    {item.daysLeft === 0 ? "today" : `in ${item.daysLeft}d`} ·{" "}
                    <span className="numeral">{priceFormatted}</span>
                  </span>
                </span>
              </Link>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  title={`Cancel ${item.name}`}
                  aria-label={`Cancel ${item.name}`}
                  onClick={() => {
                    const url =
                      item.cancelUrl ||
                      `https://www.google.com/search?q=${encodeURIComponent(
                        `how to cancel ${item.name} subscription`
                      )}`
                    window.open(url, "_blank", "noopener,noreferrer")
                  }}
                  className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  <ExternalLink className="size-3.5" />
                </button>
                <button
                  type="button"
                  title={`Record payment for ${item.name}`}
                  aria-label={`Record payment for ${item.name}`}
                  onClick={() => handleOpenRecordPayment(item)}
                  className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                >
                  <Check className="size-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <RecordPaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subscription={selectedReminder}
        rates={rates}
      />
    </div>
  )
}

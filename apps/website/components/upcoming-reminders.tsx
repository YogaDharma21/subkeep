"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Bell, ExternalLink, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DynamicIcon } from "@/components/dynamic-icon"
import { convertAndFormat } from "@/lib/currency"
import { getContrastTextColor } from "@/lib/constants"
import { toast } from "sonner"
import { findUpcomingReminders, ReminderItem } from "@/lib/notifications"
import Link from "next/link"

interface UpcomingRemindersProps {
  subscriptions: Array<{
    _id: string
    name: string
    icon: string
    color: string
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
  const [payingId, setPayingId] = useState<string | null>(null)
  const recordPaymentMutation = useMutation(api.subscriptions.recordPayment)

  const reminders = findUpcomingReminders(subscriptions, 3)

  if (reminders.length === 0) return null

  const handleRecordPayment = async (item: ReminderItem) => {
    setPayingId(item._id)
    try {
      const res = await recordPaymentMutation({
        id: item._id as Id<"subscriptions">,
        accountId: item.accountId ? (item.accountId as Id<"accounts">) : undefined,
      })
      toast.success(
        res.isActive
          ? `Recorded payment for ${item.name}! Next renewal: ${res.nextBilling}`
          : `Recorded final payment for ${item.name}! Term completed.`
      )
    } catch {
      toast.error(`Failed to record payment for ${item.name}`)
    } finally {
      setPayingId(null)
    }
  }

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Bell className="size-3.5 text-amber-500" />
          <span>Upcoming Billing & Trial Alerts ({reminders.length})</span>
        </div>
      </div>

      <div className="space-y-2">
        {reminders.map((item) => {
          const isTrial = item.type === "trial"
          const priceFormatted = convertAndFormat(item.price, item.currency, primaryCurrency, rates)
          const isPaying = payingId === item._id

          return (
            <div
              key={item._id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 text-xs transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/subscriptions/${item._id}`}
                  className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity"
                >
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-black/10 dark:border-white/10 shadow-xs"
                    style={{ backgroundColor: item.color || "#6366F1" }}
                  >
                    <DynamicIcon name={item.icon} className="size-4" style={{ color: getContrastTextColor(item.color) }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold truncate text-foreground">{item.name}</span>
                      {isTrial && (
                        <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          TRIAL
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {isTrial
                        ? `Trial ends ${item.daysLeft === 0 ? "today" : `in ${item.daysLeft} d`}`
                        : `Due ${item.daysLeft === 0 ? "today" : `in ${item.daysLeft} d`} (${priceFormatted})`}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const url = item.cancelUrl || `https://www.google.com/search?q=${encodeURIComponent(`how to cancel ${item.name} subscription`)}`
                      window.open(url, "_blank", "noopener,noreferrer")
                    }}
                    className="h-7 px-2 text-[11px] font-medium gap-1 cursor-pointer"
                  >
                    <ExternalLink className="size-3" />
                    Cancel
                  </Button>

                  <Button
                    size="sm"
                    variant="default"
                    disabled={isPaying}
                    onClick={() => handleRecordPayment(item)}
                    className="h-7 px-2.5 text-[11px] font-medium gap-1 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isPaying ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-3" />
                    )}
                    {isPaying ? "Recording..." : "Record Payment"}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

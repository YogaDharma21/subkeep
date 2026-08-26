"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Bell, Send, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DynamicIcon } from "@/components/dynamic-icon"
import { convertAndFormat } from "@/lib/currency"
import { toast } from "sonner"
import { findUpcomingReminders, ReminderItem, sendWebPushNotification } from "@/lib/notifications"
import { CancellationGuideModal } from "./cancellation-guide-modal"

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
  }>
  primaryCurrency?: string
  rates?: Record<string, number>
  onMarkCanceled?: (id: string) => Promise<void>
}

export function UpcomingReminders({
  subscriptions,
  primaryCurrency = "IDR",
  rates,
  onMarkCanceled,
}: UpcomingRemindersProps) {
  const [selectedSubForCancel, setSelectedSubForCancel] = useState<ReminderItem | null>(null)
  const [sentAlerts, setSentAlerts] = useState<Record<string, boolean>>({})
  const updateMutation = useMutation(api.subscriptions.update)

  const reminders = findUpcomingReminders(subscriptions, 3)

  if (reminders.length === 0) return null

  const handleSendTestNotification = (item: ReminderItem) => {
    const isTrial = item.isTrial
    const title = isTrial ? `🎁 Trial Ending Soon: ${item.name}` : `⚠️ Billing Due: ${item.name}`
    const priceFormatted = convertAndFormat(item.price, item.currency, primaryCurrency, rates)
    const body = isTrial
      ? `Your free trial for ${item.name} ends in ${item.daysLeft} day(s). Cancel before auto-renewal!`
      : `Payment of ${priceFormatted} for ${item.name} is due in ${item.daysLeft} day(s).`

    sendWebPushNotification(title, body)
    setSentAlerts((prev) => ({ ...prev, [item._id]: true }))
  }

  const handleUpdateCancelUrl = async (id: string, url: string) => {
    try {
      await updateMutation({
        id: id as Id<"subscriptions">,
        cancelUrl: url.trim() || undefined,
      })
      toast.success("Cancellation page URL updated")
    } catch {
      toast.error("Failed to update cancellation URL")
    }
  }

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <Bell className="size-3.5 animate-bounce" />
          <span>Upcoming Billing & Trial Alerts ({reminders.length})</span>
        </div>
      </div>

      <div className="space-y-2">
        {reminders.map((item) => {
          const isSent = !!sentAlerts[item._id]
          const isTrial = item.type === "trial"
          const priceFormatted = convertAndFormat(item.price, item.currency, primaryCurrency, rates)

          return (
            <div
              key={item._id}
              className={`flex flex-col gap-2 rounded-lg border p-3 text-xs transition-all ${
                isTrial
                  ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20"
                  : "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: item.color }}
                  >
                    <DynamicIcon name={item.icon} className="size-4 text-white" />
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
                        ? `Trial ends in ${item.daysLeft === 0 ? "today" : `${item.daysLeft} d`}`
                        : `Due in ${item.daysLeft === 0 ? "today" : `${item.daysLeft} d`} (${priceFormatted})`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedSubForCancel(item)}
                    className="h-7 px-2 text-[11px] font-medium gap-1 cursor-pointer"
                  >
                    <ExternalLink className="size-3" />
                    Cancel Link
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSendTestNotification(item)}
                    className={`h-7 px-2 text-[11px] gap-1 cursor-pointer ${
                      isSent ? "text-emerald-500" : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {isSent ? <Check className="size-3" /> : <Send className="size-3" />}
                    {isSent ? "Alert Sent" : "Notify"}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <CancellationGuideModal
        open={!!selectedSubForCancel}
        onOpenChange={(o) => { if (!o) setSelectedSubForCancel(null) }}
        subscription={selectedSubForCancel}
        onMarkCanceled={onMarkCanceled}
        onUpdateCancelUrl={handleUpdateCancelUrl}
        primaryCurrency={primaryCurrency}
      />
    </div>
  )
}

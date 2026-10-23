import { useState } from "react"
import { Id } from "@/convex/_generated/dataModel"
import { Bell, Send, Check, ExternalLink, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DynamicIcon } from "@/components/dynamic-icon"
import { convertAndFormat } from "@/lib/currency"
import { findUpcomingReminders, ReminderItem, sendDesktopNotification } from "@/lib/notifications"
import { RecordPaymentDialog, RecordPaymentTarget } from "@/components/record-payment-dialog"
import { cn } from "@/lib/utils"

interface UpcomingRemindersProps {
  subscriptions: {
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
    isActive?: boolean
    accountId?: Id<"accounts">
    lastPaymentDate?: string
    endDate?: string
  }[]
  primaryCurrency?: string
  rates?: Record<string, number>
  compact?: boolean
}

export function UpcomingReminders({
  subscriptions,
  primaryCurrency = "IDR",
  rates,
  compact = false,
}: UpcomingRemindersProps) {
  const [sentAlerts, setSentAlerts] = useState<Record<string, boolean>>({})
  const [selectedReminder, setSelectedReminder] = useState<RecordPaymentTarget | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const reminders = findUpcomingReminders(subscriptions, 3)

  if (reminders.length === 0) return null

  const handleOpenRecordPayment = (item: ReminderItem) => {
    setSelectedReminder(item)
    setDialogOpen(true)
  }

  const handleSendTestNotification = (item: ReminderItem) => {
    const isTrial = item.isTrial
    const title = isTrial ? `Trial Ending Soon: ${item.name}` : `Billing Due: ${item.name}`
    const priceFormatted = convertAndFormat(item.price, item.currency, primaryCurrency, rates)
    const body = isTrial
      ? `Your free trial for ${item.name} ends in ${item.daysLeft} day(s). Cancel before auto-renewal!`
      : `Payment of ${priceFormatted} for ${item.name} is due in ${item.daysLeft} day(s).`

    sendDesktopNotification(title, body)
    setSentAlerts((prev) => ({ ...prev, [item._id]: true }))
  }

  return (
    <div className={cn("surface relative overflow-hidden", compact ? "p-4 pt-9" : "p-5 pt-10")}>
      <span className="folder-tab" aria-hidden />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <Bell className="size-3.5 text-muted-foreground" />
            <h2 className="text-[15px] font-medium tracking-tight text-foreground">Due soon</h2>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Trials and billing in the next few days
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {reminders.length} alert{reminders.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-3 divide-y divide-border/70">
        {reminders.map((item) => {
          const isTrial = item.type === "trial"
          const isSent = !!sentAlerts[item._id]
          const priceFormatted = convertAndFormat(item.price, item.currency, primaryCurrency, rates)

          return (
            <div key={item._id} className="space-y-2 py-3 first:pt-2 last:pb-0">
              <div className="flex items-center gap-2.5">
                <span className="surface-inset flex size-8 shrink-0 items-center justify-center rounded-full text-foreground">
                  <DynamicIcon name={item.icon} className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] text-foreground">{item.name}</span>
                    {isTrial ? (
                      <span className="rounded-full border border-border px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.14em] text-positive">
                        Trial
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isTrial
                      ? `Ends ${item.daysLeft === 0 ? "today" : `in ${item.daysLeft}d`}`
                      : `Due ${item.daysLeft === 0 ? "today" : `in ${item.daysLeft}d`}`}
                  </p>
                </div>
                {!isTrial ? (
                  <span className="numeral shrink-0 text-[12px] text-foreground">{priceFormatted}</span>
                ) : null}
              </div>

              <div className="flex items-center gap-1.5 pl-10">
                {!isTrial ? (
                  <Button
                    size="sm"
                    onClick={() => handleOpenRecordPayment(item)}
                    className="h-6 gap-1 px-2.5 text-[10px]"
                  >
                    <CheckCircle2 className="size-3" />
                    Record
                  </Button>
                ) : null}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const url =
                      item.cancelUrl ||
                      `https://www.google.com/search?q=${encodeURIComponent(
                        `how to cancel ${item.name} subscription`
                      )}`
                    if (window.electronAPI?.openExternal) {
                      window.electronAPI.openExternal(url)
                    } else {
                      window.open(url, "_blank", "noopener,noreferrer")
                    }
                  }}
                  className="h-6 gap-1 px-2.5 text-[10px] text-muted-foreground"
                >
                  <ExternalLink className="size-3" />
                  Cancel
                </Button>

                <button
                  type="button"
                  onClick={() => handleSendTestNotification(item)}
                  title={isSent ? "Alert sent" : "Send test notification"}
                  className={cn(
                    "ml-auto flex size-6 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted",
                    isSent ? "text-positive" : "text-muted-foreground"
                  )}
                >
                  {isSent ? <Check className="size-3" /> : <Send className="size-3" />}
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

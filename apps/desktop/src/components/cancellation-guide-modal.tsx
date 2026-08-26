import { useState } from "react"
import { ExternalLink, CheckSquare, Square, ShieldAlert, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DynamicIcon } from "@/components/dynamic-icon"
import { convertAndFormat } from "@/lib/currency"

interface CancellationGuideModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription: {
    _id: string
    name: string
    icon: string
    color: string
    price: number
    currency: string
    cycle: string
    cancelUrl?: string
    isTrial?: boolean
    trialEndDate?: string
  } | null
  onMarkCanceled?: (id: string) => Promise<void>
  primaryCurrency?: string
  rates?: Record<string, number>
}

export function CancellationGuideModal({
  open,
  onOpenChange,
  subscription,
  onMarkCanceled,
  primaryCurrency = "IDR",
  rates,
}: CancellationGuideModalProps) {
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({})

  if (!subscription) return null

  const directUrl =
    subscription.cancelUrl ||
    `https://www.google.com/search?q=${encodeURIComponent(
      `how to cancel ${subscription.name} subscription`
    )}`

  const steps = [
    {
      title: "1. Access Cancellation Page",
      detail: `Click the direct link button below to open ${subscription.name}'s cancellation page in your browser.`,
    },
    {
      title: "2. Sign In to Your Account",
      detail: "Log in with the account credentials used for this subscription.",
    },
    {
      title: "3. Locate Billing or Plan Details",
      detail: "Navigate to Account Settings -> Membership / Billing / Subscriptions.",
    },
    {
      title: "4. Confirm Cancellation",
      detail: "Click 'Cancel Subscription' or 'Turn Off Auto-Renew' and complete all confirmation prompts.",
    },
    {
      title: "5. Mark as Canceled in SubKeep",
      detail: "Update SubKeep so your monthly expense stats stay accurate and active reminders stop.",
    },
  ]

  const toggleStep = (index: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const handleOpenLink = () => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(directUrl)
    } else {
      window.open(directUrl, "_blank", "noopener,noreferrer")
    }
    setCheckedSteps((prev) => ({ ...prev, 0: true }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg p-5" onClose={() => onOpenChange(false)}>
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: subscription.color }}
            >
              <DynamicIcon name={subscription.icon} className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Cancel {subscription.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {subscription.isTrial ? (
                  <span className="font-medium text-amber-500">
                    Free Trial Guide
                  </span>
                ) : (
                  <span>
                    {convertAndFormat(
                      subscription.price,
                      subscription.currency,
                      primaryCurrency,
                      rates
                    )}{" "}
                    / {subscription.cycle}
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {subscription.isTrial && (
          <div className="flex items-start gap-2.5 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <ShieldAlert className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Cancel before free trial ends!</p>
              <p className="mt-0.5 text-[11px] opacity-90">
                Cancel now to prevent auto-renewal charges while retaining access until your trial period expires.
              </p>
            </div>
          </div>
        )}

        <div className="my-2 space-y-2">
          <Button
            onClick={handleOpenLink}
            className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90 font-medium text-xs h-10 rounded-lg cursor-pointer"
          >
            <ExternalLink className="size-3.5" />
            Open Direct Cancellation Page
          </Button>

          <p className="text-[11px] text-center text-muted-foreground truncate">
            {directUrl}
          </p>
        </div>

        <div className="space-y-2.5 rounded-lg border border-border bg-muted/30 p-3 text-xs">
          <div className="flex items-center justify-between font-medium text-foreground pb-1 border-b border-border/50">
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              Step-by-Step Cancellation Checklist
            </span>
            <span className="text-[10px] text-muted-foreground">
              {Object.values(checkedSteps).filter(Boolean).length}/{steps.length} done
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {steps.map((step, idx) => {
              const isChecked = !!checkedSteps[idx]
              return (
                <div
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  className="flex items-start gap-2.5 cursor-pointer select-none group"
                >
                  {isChecked ? (
                    <CheckSquare className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                  ) : (
                    <Square className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`font-medium ${
                        isChecked
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {step.detail}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {onMarkCanceled && (
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={async () => {
                await onMarkCanceled(subscription._id)
                onOpenChange(false)
              }}
              className="w-full text-xs h-9 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
            >
              Mark as Canceled / Suspended in SubKeep
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

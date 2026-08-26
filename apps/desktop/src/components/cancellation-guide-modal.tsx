import { useState } from "react"
import {
  ExternalLink,
  ShieldAlert,
  Search,
  Pencil,
  Check,
  X,
  Link2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  onUpdateCancelUrl?: (id: string, url: string) => Promise<void>
  primaryCurrency?: string
  rates?: Record<string, number>
}

export function CancellationGuideModal({
  open,
  onOpenChange,
  subscription,
  onMarkCanceled,
  onUpdateCancelUrl,
  primaryCurrency = "IDR",
  rates,
}: CancellationGuideModalProps) {
  const [isEditingUrl, setIsEditingUrl] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [savingUrl, setSavingUrl] = useState(false)

  if (!subscription) return null

  const hasCustomUrl = Boolean(subscription.cancelUrl && subscription.cancelUrl.trim().length > 0)
  const directUrl =
    subscription.cancelUrl ||
    `https://www.google.com/search?q=${encodeURIComponent(
      `how to cancel ${subscription.name} subscription`
    )}`

  const handleOpenLink = () => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(directUrl)
    } else {
      window.open(directUrl, "_blank", "noopener,noreferrer")
    }
  }

  const handleStartEditUrl = () => {
    setNewUrl(subscription.cancelUrl || "")
    setIsEditingUrl(true)
  }

  const handleSaveUrl = async () => {
    if (!onUpdateCancelUrl) return
    setSavingUrl(true)
    try {
      await onUpdateCancelUrl(subscription._id, newUrl.trim())
      setIsEditingUrl(false)
    } finally {
      setSavingUrl(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md max-h-[88vh] overflow-y-auto flex flex-col gap-3.5 rounded-lg p-5"
        onClose={() => onOpenChange(false)}
      >
        <DialogHeader className="pr-6 space-y-1.5 text-left mb-0">
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-lg shadow-xs"
              style={{ backgroundColor: subscription.color }}
            >
              <DynamicIcon name={subscription.icon} className="size-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold truncate">
                Cancel {subscription.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate">
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
              <p className="mt-0.5 text-[11px] opacity-90 leading-relaxed">
                Cancel now to prevent auto-renewal charges while retaining access until your trial period expires.
              </p>
            </div>
          </div>
        )}

        {/* Cancellation Link Box */}
        <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
          {isEditingUrl ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Link2 className="size-3.5 text-primary" />
                  Edit Cancellation URL
                </label>
                <button
                  onClick={() => setIsEditingUrl(false)}
                  className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <Input
                placeholder="https://service.com/account/cancel"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="h-8 text-xs bg-background"
                autoFocus
              />
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingUrl(false)}
                  className="h-7 text-xs px-2 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveUrl}
                  disabled={savingUrl}
                  className="h-7 text-xs px-2.5 gap-1 cursor-pointer"
                >
                  <Check className="size-3" />
                  {savingUrl ? "Saving..." : "Save URL"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                onClick={handleOpenLink}
                className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90 font-medium text-xs h-9 rounded-lg cursor-pointer"
              >
                {hasCustomUrl ? (
                  <>
                    <ExternalLink className="size-3.5" />
                    Open Direct Cancellation Page
                  </>
                ) : (
                  <>
                    <Search className="size-3.5" />
                    Search Cancellation Guide (Google)
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between gap-2 px-0.5 pt-0.5">
                <p className="text-[11px] text-muted-foreground truncate flex-1">
                  {hasCustomUrl ? (
                    <span className="text-foreground/80 font-mono text-[10.5px]">
                      {subscription.cancelUrl}
                    </span>
                  ) : (
                    <span>Default search query</span>
                  )}
                </p>

                {onUpdateCancelUrl && (
                  <button
                    onClick={handleStartEditUrl}
                    className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
                  >
                    <Pencil className="size-2.5" />
                    {hasCustomUrl ? "Change" : "Set URL"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {onMarkCanceled && (
          <div>
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

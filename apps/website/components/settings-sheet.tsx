"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { Moon, Globe, Bell, X, Target } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { currencies, getSymbol } from "@/lib/constants"
import { requestWebPushPermission, sendWebPushNotification } from "@/lib/notifications"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { toast } from "sonner"

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { isSignedIn } = useAuth()

  const userSettings = useQuery(api.userSettings.get, isSignedIn ? {} : "skip")
  const updateSettings = useMutation(api.userSettings.update)

  const { primaryCurrency, setPrimaryCurrency } = usePrimaryCurrency()
  const [localReminderDays, setLocalReminderDays] = useState<number | null>(null)
  const [localWebPush, setLocalWebPush] = useState<boolean | null>(null)
  const [localBudgetCap, setLocalBudgetCap] = useState<string | null>(null)

  const reminderDays = localReminderDays ?? userSettings?.reminderDays ?? 3
  const webPushEnabled = localWebPush ?? userSettings?.webPushEnabled ?? false
  const budgetCap = localBudgetCap ?? (userSettings?.monthlyBudgetCap !== undefined ? String(userSettings.monthlyBudgetCap) : "")

  const isDark = resolvedTheme === "dark" || theme === "dark"

  const handleCurrencyChange = async (val: string) => {
    await setPrimaryCurrency(val)
    toast.success(`Primary currency changed to ${val}`)
  }

  const handleReminderDaysChange = async (days: number) => {
    setLocalReminderDays(days)
    try {
      await updateSettings({ reminderDays: days })
      toast.success(`Reminder alert set to ${days === 0 ? "due date" : `${days} days before`}`)
    } catch {
      toast.error("Failed to update reminder timing")
    }
  }

  const handleSaveBudgetCap = async () => {
    const val = budgetCap.trim() ? parseFloat(budgetCap.trim()) : undefined
    try {
      await updateSettings({ monthlyBudgetCap: val })
      toast.success(val ? `Monthly budget cap set to ${getSymbol(primaryCurrency)}${val}` : "Budget cap removed")
    } catch {
      toast.error("Failed to save budget cap")
    }
  }

  const handleToggleWebPush = async () => {
    if (!webPushEnabled) {
      const granted = await requestWebPushPermission()
      if (granted) {
        setLocalWebPush(true)
        try {
          await updateSettings({ webPushEnabled: true })
          toast.success("Web push notifications enabled!")
          sendWebPushNotification("SubKeep Reminders Active", "You will now receive billing and free trial push notifications!")
        } catch {
          toast.error("Failed to save notification preference")
        }
      } else {
        toast.error("Browser push notification permission denied. Please enable in browser settings.")
      }
    } else {
      setLocalWebPush(false)
      try {
        await updateSettings({ webPushEnabled: false })
        toast.success("Web push notifications disabled")
      } catch {
        toast.error("Failed to update notification settings")
      }
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto" showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between border-b border-border p-4">
          <SheetTitle>Settings & Preferences</SheetTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            <X className="size-4" />
          </Button>
        </SheetHeader>

        <div className="p-4 space-y-5">
          {/* Preferences */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              General & Display
            </h3>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <Moon className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium">Dark Mode</span>
              </div>
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="relative h-7 w-12 rounded-full bg-muted transition-colors data-[state=on]:bg-foreground cursor-pointer"
                data-state={isDark ? "on" : "off"}
              >
                <span
                  className="absolute left-1 top-1 h-5 w-5 rounded-full bg-background shadow-sm transition-transform data-[state=on]:translate-x-5"
                  data-state={isDark ? "on" : "off"}
                />
              </button>
            </div>

            <Separator />

            {/* Primary Currency Conversion */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <Globe className="size-5 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">Primary Currency</span>
                  <p className="text-[11px] text-muted-foreground">
                    All monthly totals will automatically convert to this currency
                  </p>
                </div>
              </div>

              <select
                value={primaryCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground focus:outline-none"
              >
                {currencies.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Separator />

          {/* Monthly Budget Cap Setting */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Monthly Spending Budget Cap
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Set a monthly spending limit in your primary currency ({primaryCurrency}). You will receive progress and threshold warnings.
            </p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                  {getSymbol(primaryCurrency)}
                </span>
                <Input
                  type="number"
                  placeholder="e.g. 150"
                  step="0.01"
                  value={budgetCap}
                  onChange={(e) => setLocalBudgetCap(e.target.value)}
                  className="pl-8 text-xs h-9"
                />
              </div>
              <Button size="sm" onClick={handleSaveBudgetCap} className="text-xs h-9 cursor-pointer">
                Save Cap
              </Button>
            </div>
          </div>

          <Separator />

          {/* Notifications & Reminders */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notifications & Alerts
            </h3>

            {/* Web Push */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <Bell className="size-5 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">Web Push Notifications</span>
                  <p className="text-[11px] text-muted-foreground">
                    Get browser notifications before due date & trial expiry
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleWebPush}
                className="relative h-7 w-12 rounded-full bg-muted transition-colors data-[state=on]:bg-foreground cursor-pointer"
                data-state={webPushEnabled ? "on" : "off"}
              >
                <span
                  className="absolute left-1 top-1 h-5 w-5 rounded-full bg-background shadow-sm transition-transform data-[state=on]:translate-x-5"
                  data-state={webPushEnabled ? "on" : "off"}
                />
              </button>
            </div>

            {/* Reminder Timing */}
            <div className="space-y-2 rounded-lg bg-muted/40 p-3 border border-border">
              <label className="text-xs font-semibold text-foreground">
                Reminder Timing
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { days: 3, label: "3 Days Before" },
                  { days: 1, label: "1 Day Before" },
                  { days: 0, label: "On Due Date" },
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => handleReminderDaysChange(item.days)}
                    className={`rounded-lg py-2 text-xs font-medium border transition-all cursor-pointer ${
                      reminderDays === item.days
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:border-foreground/50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

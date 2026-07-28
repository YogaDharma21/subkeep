"use client"

import { useState, useEffect } from "react"
import { Moon, Bell, DollarSign, X, Send, Check, ShieldAlert, Globe, MessageSquare } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { currencies } from "@/lib/constants"
import { requestWebPushPermission, sendTelegramNotification, sendWebPushNotification } from "@/lib/notifications"

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const hasUserSettings = !!(api as Record<string, any>).userSettings?.get
  const userSettings = useQuery(
    hasUserSettings ? (api as Record<string, any>).userSettings.get : "skip"
  )

  const hasUpdateSettings = !!(api as Record<string, any>).userSettings?.update
  const updateSettingsMutation = hasUpdateSettings
    ? (api as Record<string, any>).userSettings.update
    : (api as Record<string, any>).subscriptions.suspend

  const updateSettings = useMutation(updateSettingsMutation)

  const [primaryCurrency, setPrimaryCurrency] = useState("IDR")
  const [reminderDays, setReminderDays] = useState(3)
  const [webPushEnabled, setWebPushEnabled] = useState(false)
  const [telegramEnabled, setTelegramEnabled] = useState(false)
  const [telegramBotToken, setTelegramBotToken] = useState("")
  const [telegramChatId, setTelegramChatId] = useState("")
  const [telegramTestStatus, setTelegramTestStatus] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (userSettings) {
      if (userSettings.primaryCurrency) setPrimaryCurrency(userSettings.primaryCurrency)
      if (userSettings.reminderDays) setReminderDays(userSettings.reminderDays)
      if (userSettings.webPushEnabled !== undefined) setWebPushEnabled(userSettings.webPushEnabled)
      if (userSettings.telegramEnabled !== undefined) setTelegramEnabled(userSettings.telegramEnabled)
      if (userSettings.telegramBotToken) setTelegramBotToken(userSettings.telegramBotToken)
      if (userSettings.telegramChatId) setTelegramChatId(userSettings.telegramChatId)
    }
  }, [userSettings])

  const isDark = mounted ? (resolvedTheme === "dark" || theme === "dark") : false

  const handleCurrencyChange = async (val: string) => {
    setPrimaryCurrency(val)
    if (hasUpdateSettings) {
      try {
        await updateSettings({ primaryCurrency: val })
      } catch (e) {
        console.warn("Could not update settings in Convex backend:", e)
      }
    }
  }

  const handleReminderDaysChange = async (days: number) => {
    setReminderDays(days)
    if (hasUpdateSettings) {
      try {
        await updateSettings({ reminderDays: days })
      } catch (e) {
        console.warn("Could not update settings in Convex backend:", e)
      }
    }
  }

  const handleToggleWebPush = async () => {
    if (!webPushEnabled) {
      const granted = await requestWebPushPermission()
      if (granted) {
        setWebPushEnabled(true)
        if (hasUpdateSettings) {
          try {
            await updateSettings({ webPushEnabled: true })
          } catch (e) {
            console.warn("Could not update settings in Convex backend:", e)
          }
        }
        sendWebPushNotification("SubKeep Reminders Active", "You will now receive billing and free trial push notifications!")
      } else {
        alert("Browser push notification permission denied. Please allow notifications in your browser settings.")
      }
    } else {
      setWebPushEnabled(false)
      if (hasUpdateSettings) {
        try {
          await updateSettings({ webPushEnabled: false })
        } catch (e) {
          console.warn("Could not update settings in Convex backend:", e)
        }
      }
    }
  }

  const handleSaveTelegram = async () => {
    await updateSettings({
      telegramEnabled,
      telegramBotToken,
      telegramChatId,
    })
  }

  const handleTestTelegram = async () => {
    setTelegramTestStatus("Sending test message...")
    const res = await sendTelegramNotification(
      telegramBotToken,
      telegramChatId,
      `🔔 <b>SubKeep Notification Test</b>\n\nYour Telegram bot integration is working properly! You will receive subscription due date & free trial alerts here.`
    )
    if (res.success) {
      setTelegramTestStatus("Success! Check your Telegram app.")
    } else {
      setTelegramTestStatus(`Error: ${res.error}`)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto" showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between border-b border-border p-4">
          <SheetTitle>Settings</SheetTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </SheetHeader>

        <div className="p-4 space-y-5">
          {/* Appearance */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Preferences
            </h3>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <Moon className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium">Dark Mode</span>
              </div>
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="relative h-7 w-12 rounded-full bg-muted transition-colors data-[state=on]:bg-foreground"
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

          {/* Notifications & Reminders */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notifications & Reminders
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
                className="relative h-7 w-12 rounded-full bg-muted transition-colors data-[state=on]:bg-foreground"
                data-state={webPushEnabled ? "on" : "off"}
              >
                <span
                  className="absolute left-1 top-1 h-5 w-5 rounded-full bg-background shadow-sm transition-transform data-[state=on]:translate-x-5"
                  data-state={webPushEnabled ? "on" : "off"}
                />
              </button>
            </div>

            {/* Reminder Timing */}
            <div className="space-y-2 rounded-xl bg-muted/40 p-3 border border-border">
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
                    className={`rounded-lg py-2 text-xs font-medium border transition-all ${
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

            {/* Telegram Bot Integration */}
            <div className="space-y-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-blue-500" />
                  <span className="text-sm font-semibold text-foreground">
                    Telegram Bot Integration
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={telegramEnabled}
                  onChange={(e) => {
                    setTelegramEnabled(e.target.checked)
                    updateSettings({ telegramEnabled: e.target.checked })
                  }}
                  className="size-4 rounded accent-blue-500 cursor-pointer"
                />
              </div>

              {telegramEnabled && (
                <div className="space-y-2.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Bot Token (from @BotFather)
                    </label>
                    <Input
                      type="password"
                      placeholder="e.g. 123456789:ABCdefGhIJK..."
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      onBlur={handleSaveTelegram}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Chat ID (Your Telegram Chat ID)
                    </label>
                    <Input
                      placeholder="e.g. 987654321"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      onBlur={handleSaveTelegram}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleTestTelegram}
                      disabled={!telegramBotToken || !telegramChatId}
                      className="h-7 text-xs gap-1.5 text-blue-600 dark:text-blue-400 border-blue-500/30"
                    >
                      <Send className="size-3" />
                      Test Telegram Alert
                    </Button>

                    {telegramTestStatus && (
                      <span className="text-[10px] text-muted-foreground">
                        {telegramTestStatus}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

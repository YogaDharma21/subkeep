"use client"

import { useEffect, useRef } from "react"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import {
  findUpcomingReminders,
  registerServiceWorker,
  sendWebPushNotification,
} from "@/lib/notifications"
import { convertAndFormat } from "@/lib/currency"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"

export function AutoNotificationManager() {
  const { isSignedIn } = useAuth()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const userSettings = useQuery(api.userSettings.get, isSignedIn ? {} : "skip")
  const { primaryCurrency, rates } = usePrimaryCurrency()
  const checkedRef = useRef(false)

  useEffect(() => {
    registerServiceWorker()
  }, [])

  useEffect(() => {
    if (!isSignedIn || !subscriptions || !userSettings) return
    if (!userSettings.webPushEnabled) return
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission !== "granted") return
    if (checkedRef.current) return

    checkedRef.current = true
    const thresholdDays = userSettings.reminderDays ?? 3
    const reminders = findUpcomingReminders(subscriptions, thresholdDays)

    const todayStr = new Date().toISOString().split("T")[0]

    for (const item of reminders) {
      const storageKey = `subkeep_notif_${item._id}_${item.nextBilling}_${todayStr}`
      if (localStorage.getItem(storageKey)) continue

      const isTrial = item.type === "trial"
      const priceFormatted = convertAndFormat(item.price, item.currency, primaryCurrency, rates)
      const title = isTrial
        ? `Trial Ending Soon: ${item.name}`
        : `Billing Due: ${item.name}`
      const body = isTrial
        ? `Your free trial for ${item.name} ends in ${item.daysLeft === 0 ? "today" : `${item.daysLeft} day(s)`}. Cancel before auto-renewal!`
        : `Payment of ${priceFormatted} for ${item.name} is due in ${item.daysLeft === 0 ? "today" : `${item.daysLeft} day(s)`}.`

      sendWebPushNotification(title, body, "/icon-192.png", `/subscriptions/${item._id}`)
      localStorage.setItem(storageKey, "1")
    }
  }, [isSignedIn, subscriptions, userSettings, primaryCurrency, rates])

  return null
}

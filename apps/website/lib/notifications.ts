export interface ReminderItem {
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
  daysLeft: number
  type: "billing" | "trial"
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
    return reg
  } catch (e) {
    console.warn("Service worker registration failed:", e)
    return null
  }
}

export async function requestWebPushPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false
  }

  // Register service worker if supported
  await registerServiceWorker()

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return false
}

export async function sendWebPushNotification(
  title: string,
  body: string,
  iconUrl?: string,
  targetUrl: string = "/"
) {
  if (typeof window === "undefined" || !("Notification" in window)) return
  if (Notification.permission !== "granted") return

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: iconUrl || "/icon-192.png",
          badge: "/favicon.ico",
          data: { url: targetUrl },
        })
        return
      }
    }
  } catch (e) {
    console.warn("Service worker notification failed, falling back to desktop Notification:", e)
  }

  try {
    new Notification(title, {
      body,
      icon: iconUrl || "/favicon.ico",
      badge: "/favicon.ico",
    })
  } catch (e) {
    console.warn("Notification error:", e)
  }
}

export function findUpcomingReminders(
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
  }>,
  targetDays: number = 3
): ReminderItem[] {
  if (!subscriptions || subscriptions.length === 0) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const items: ReminderItem[] = []

  for (const sub of subscriptions) {
    if (!sub.isActive) continue

    // Check Trial Expiration
    if (sub.isTrial && sub.trialEndDate) {
      const trialDate = new Date(sub.trialEndDate)
      trialDate.setHours(0, 0, 0, 0)
      const diffTime = trialDate.getTime() - today.getTime()
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (daysLeft >= 0 && daysLeft <= targetDays) {
        items.push({
          _id: sub._id,
          name: sub.name,
          icon: sub.icon,
          color: sub.color,
          price: sub.price,
          currency: sub.currency,
          cycle: sub.cycle,
          nextBilling: sub.trialEndDate,
          isTrial: true,
          trialEndDate: sub.trialEndDate,
          cancelUrl: sub.cancelUrl,
          daysLeft,
          type: "trial",
        })
        continue
      }
    }

    // Check Billing Due Date
    if (sub.nextBilling) {
      const billDate = new Date(sub.nextBilling)
      billDate.setHours(0, 0, 0, 0)
      const diffTime = billDate.getTime() - today.getTime()
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (daysLeft >= 0 && daysLeft <= targetDays) {
        items.push({
          _id: sub._id,
          name: sub.name,
          icon: sub.icon,
          color: sub.color,
          price: sub.price,
          currency: sub.currency,
          cycle: sub.cycle,
          nextBilling: sub.nextBilling,
          isTrial: false,
          cancelUrl: sub.cancelUrl,
          daysLeft,
          type: "billing",
        })
      }
    }
  }

  return items.sort((a, b) => a.daysLeft - b.daysLeft)
}

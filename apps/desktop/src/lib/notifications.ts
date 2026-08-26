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

export async function requestWebPushPermission(): Promise<boolean> {
  if (window.electronAPI?.isElectron) return true
  if (typeof window === "undefined" || !("Notification" in window)) return false

  if (Notification.permission === "granted") return true
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }
  return false
}

export function sendDesktopNotification(title: string, body: string) {
  if (window.electronAPI?.showNotification) {
    window.electronAPI.showNotification(title, body)
    return
  }

  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body })
    } catch (e) {
      console.warn("Notification error:", e)
    }
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
    isActive?: boolean
  }>,
  targetDays: number = 3
): ReminderItem[] {
  if (!subscriptions || subscriptions.length === 0) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const items: ReminderItem[] = []

  for (const sub of subscriptions) {
    if (sub.isActive === false) continue

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

import { differenceInDays } from "date-fns"

export interface ReminderItem {
  _id: string
  name: string
  icon: string
  color: string
  price: number
  currency: string
  cycle: string
  date: string
  type: "billing" | "trial"
  daysLeft: number
  cancelUrl?: string
  isTrial?: boolean
}

export function findUpcomingReminders(
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
    isActive: boolean
  }[],
  withinDays: number = 7
): ReminderItem[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const reminders: ReminderItem[] = []

  subscriptions.forEach((sub) => {
    if (sub.isActive === false) return

    // 1. Free Trial ending soon
    if (sub.isTrial && sub.trialEndDate) {
      const trialDate = new Date(sub.trialEndDate)
      trialDate.setHours(0, 0, 0, 0)
      const diff = differenceInDays(trialDate, today)

      if (diff >= 0 && diff <= withinDays) {
        reminders.push({
          _id: sub._id,
          name: sub.name,
          icon: sub.icon,
          color: sub.color,
          price: sub.price,
          currency: sub.currency,
          cycle: sub.cycle,
          date: sub.trialEndDate,
          type: "trial",
          daysLeft: diff,
          cancelUrl: sub.cancelUrl,
          isTrial: true,
        })
        return
      }
    }

    // 2. Next Billing due soon
    if (sub.nextBilling) {
      const billingDate = new Date(sub.nextBilling)
      billingDate.setHours(0, 0, 0, 0)
      const diff = differenceInDays(billingDate, today)

      if (diff >= 0 && diff <= withinDays) {
        reminders.push({
          _id: sub._id,
          name: sub.name,
          icon: sub.icon,
          color: sub.color,
          price: sub.price,
          currency: sub.currency,
          cycle: sub.cycle,
          date: sub.nextBilling,
          type: "billing",
          daysLeft: diff,
          cancelUrl: sub.cancelUrl,
          isTrial: false,
        })
      }
    }
  })

  return reminders.sort((a, b) => a.daysLeft - b.daysLeft)
}

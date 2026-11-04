import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

crons.interval(
  "daily-billing-reminders",
  { hours: 24 },
  internal.reminders.checkAndSendDueReminders,
  {}
)

crons.interval(
  "daily-exchange-rates-sync",
  { hours: 24 },
  internal.exchangeRates.syncRates,
  {}
)

export default crons

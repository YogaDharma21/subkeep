import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

crons.interval(
  "daily-billing-reminders",
  { hours: 24 },
  internal.reminders.checkAndSendDueReminders,
  {}
)

export default crons

import { cronJobs } from "convex/server"
import type { FunctionReference } from "convex/server"
import { internal as baseInternal } from "./_generated/api"

const internal = baseInternal as typeof baseInternal & {
  recurringTransactions: {
    processDueRecurringTransactions: FunctionReference<
      "mutation",
      "internal",
      Record<string, never>,
      any
    >
  }
}

const crons = cronJobs()

crons.interval(
  "daily-billing-reminders",
  { hours: 24 },
  internal.reminders.checkAndSendDueReminders,
  {}
)

crons.interval(
  "daily-recurring-transactions",
  { hours: 24 },
  internal.recurringTransactions.processDueRecurringTransactions,
  {}
)

export default crons

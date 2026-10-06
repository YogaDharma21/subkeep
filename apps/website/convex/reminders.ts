import { internalMutation } from "./_generated/server"

export const checkAndSendDueReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split("T")[0]

    // Fetch all active subscriptions
    const subs = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()

    // Fetch all user settings
    const allSettings = await ctx.db.query("userSettings").collect()
    const settingsByUser = new Map(allSettings.map((s) => [s.userId, s]))

    for (const sub of subs) {
      const userSetting = settingsByUser.get(sub.userId)
      const thresholdDays = sub.reminderDays ?? userSetting?.reminderDays ?? 3

      const targetDate = sub.isTrial && sub.trialEndDate ? sub.trialEndDate : sub.nextBilling
      if (!targetDate) continue

      const due = new Date(targetDate)
      due.setHours(0, 0, 0, 0)
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays >= 0 && diffDays <= thresholdDays) {
        // Check if telegram alert is configured
        if (
          userSetting?.telegramEnabled &&
          userSetting.telegramBotToken &&
          userSetting.telegramChatId
        ) {
          try {
            const text = sub.isTrial
              ? `Trial Ending Soon: ${sub.name} ends in ${diffDays} day(s).`
              : `Upcoming Billing: ${sub.name} is due in ${diffDays} day(s) (${sub.currency} ${sub.price}).`
            // Best effort telegram webhook notification
            await fetch(
              `https://api.telegram.org/bot${userSetting.telegramBotToken}/sendMessage`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: userSetting.telegramChatId,
                  text,
                }),
              }
            )
          } catch {
            // best effort notification
          }
        }
      }
    }

    return { checkedAt: todayStr, count: subs.length }
  },
})

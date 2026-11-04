import { internal } from "./_generated/api"
import { internalAction, internalMutation } from "./_generated/server"
import { v } from "convex/values"

export const sendTelegramReminder = internalAction({
  args: {
    botToken: v.string(),
    chatId: v.string(),
    text: v.string(),
  },
  handler: async (_ctx, args) => {
    try {
      await fetch(
        `https://api.telegram.org/bot${args.botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: args.chatId,
            text: args.text,
          }),
        }
      )
    } catch {
      // Best effort notification
    }
  },
})

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
        // Skip if payment was already recorded today or for this cycle
        if (sub.lastPaymentDate) {
          if (sub.lastPaymentDate === todayStr || sub.lastPaymentDate >= targetDate) {
            continue
          }
          if (sub.cycle && sub.cycle.toLowerCase() === "none") {
            continue
          }
        }

        // Check if telegram alert is configured
        if (
          userSetting?.telegramEnabled &&
          userSetting.telegramBotToken &&
          userSetting.telegramChatId
        ) {
          const text = sub.isTrial
            ? `Trial Ending Soon: ${sub.name} ends in ${diffDays} day(s).`
            : `Upcoming Billing: ${sub.name} is due in ${diffDays} day(s) (${sub.currency} ${sub.price}).`
          await ctx.scheduler.runAfter(0, internal.reminders.sendTelegramReminder, {
            botToken: userSetting.telegramBotToken,
            chatId: userSetting.telegramChatId,
            text,
          })
        }
      }
    }

    return { checkedAt: todayStr, count: subs.length }
  },
})

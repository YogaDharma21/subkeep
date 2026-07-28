import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first()

    if (!settings) {
      return {
        primaryCurrency: "IDR",
        reminderDays: 3,
        webPushEnabled: false,
        emailEnabled: false,
        emailAddress: identity.email || "",
        telegramEnabled: false,
        telegramBotToken: "",
        telegramChatId: "",
      }
    }
    return settings
  },
})

export const update = mutation({
  args: {
    primaryCurrency: v.optional(v.string()),
    reminderDays: v.optional(v.number()),
    webPushEnabled: v.optional(v.boolean()),
    emailEnabled: v.optional(v.boolean()),
    emailAddress: v.optional(v.string()),
    telegramEnabled: v.optional(v.boolean()),
    telegramBotToken: v.optional(v.string()),
    telegramChatId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, args)
    } else {
      await ctx.db.insert("userSettings", {
        userId: identity.subject,
        primaryCurrency: args.primaryCurrency || "IDR",
        reminderDays: args.reminderDays ?? 3,
        webPushEnabled: args.webPushEnabled ?? false,
        emailEnabled: args.emailEnabled ?? false,
        emailAddress: args.emailAddress || identity.email || "",
        telegramEnabled: args.telegramEnabled ?? false,
        telegramBotToken: args.telegramBotToken || "",
        telegramChatId: args.telegramChatId || "",
      })
    }
  },
})

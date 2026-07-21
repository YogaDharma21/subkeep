import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    return await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect()
  },
})

export const create = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    amount: v.number(),
    currency: v.string(),
    category: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const sub = await ctx.db.get(args.subscriptionId)
    if (!sub) throw new Error("Subscription not found")
    if (sub.userId !== identity.subject) throw new Error("Unauthorized")

    return await ctx.db.insert("payments", {
      userId: identity.subject,
      subscriptionId: args.subscriptionId,
      name: args.name,
      icon: args.icon,
      color: args.color,
      amount: args.amount,
      currency: args.currency,
      category: args.category,
      date: args.date,
    })
  },
})

export const remove = mutation({
  args: { id: v.id("payments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const payment = await ctx.db.get(args.id)
    if (!payment) throw new Error("Payment not found")
    if (payment.userId !== identity.subject) throw new Error("Unauthorized")
    await ctx.db.delete(args.id)
  },
})

export const restoreAll = mutation({
  args: {
    payments: v.array(
      v.object({
        name: v.string(),
        icon: v.string(),
        color: v.string(),
        amount: v.number(),
        currency: v.string(),
        category: v.string(),
        date: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()
    for (const p of existing) {
      await ctx.db.delete(p._id)
    }
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()
    const subMap = new Map(subs.map((s) => [s.name, s._id]))
    for (const p of args.payments) {
      const subId = subMap.get(p.name)
      if (subId) {
        await ctx.db.insert("payments", {
          userId: identity.subject,
          subscriptionId: subId,
          ...p,
        })
      }
    }
  },
})

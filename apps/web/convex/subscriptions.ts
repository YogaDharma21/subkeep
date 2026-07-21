import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect()
  },
})

export const get = query({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const sub = await ctx.db.get(args.id)
    if (!sub) throw new Error("Subscription not found")
    if (sub.userId !== identity.subject) throw new Error("Unauthorized")
    return sub
  },
})

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_and_active", (q) =>
        q.eq("userId", identity.subject).eq("isActive", true)
      )
      .collect()

    const count = subs.length
    const monthlyTotal = subs.reduce((sum, s) => {
      if (s.cycle === "monthly") return sum + s.price
      if (s.cycle === "yearly") return sum + s.price / 12
      if (s.cycle === "weekly") return sum + s.price * 4.33
      if (s.cycle === "daily") return sum + s.price * 30
      return sum + s.price
    }, 0)
    const yearlyTotal = monthlyTotal * 12

    return { count, monthlyTotal, yearlyTotal }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    price: v.number(),
    currency: v.string(),
    cycle: v.string(),
    category: v.string(),
    startDate: v.string(),
    nextBilling: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    return await ctx.db.insert("subscriptions", {
      userId: identity.subject,
      name: args.name,
      icon: args.icon,
      color: args.color,
      price: args.price,
      currency: args.currency,
      cycle: args.cycle,
      category: args.category,
      startDate: args.startDate,
      nextBilling: args.nextBilling,
      isActive: true,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("subscriptions"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    cycle: v.optional(v.string()),
    category: v.optional(v.string()),
    startDate: v.optional(v.string()),
    nextBilling: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const sub = await ctx.db.get(args.id)
    if (!sub) throw new Error("Subscription not found")
    if (sub.userId !== identity.subject) throw new Error("Unauthorized")

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updates } = args
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    )
    await ctx.db.patch(args.id, filtered)
  },
})

export const suspend = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const sub = await ctx.db.get(args.id)
    if (!sub) throw new Error("Subscription not found")
    if (sub.userId !== identity.subject) throw new Error("Unauthorized")
    await ctx.db.patch(args.id, { isActive: !sub.isActive })
  },
})

export const clone = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const sub = await ctx.db.get(args.id)
    if (!sub) throw new Error("Subscription not found")
    if (sub.userId !== identity.subject) throw new Error("Unauthorized")

    return await ctx.db.insert("subscriptions", {
      userId: identity.subject,
      name: sub.name + " (Copy)",
      icon: sub.icon,
      color: sub.color,
      price: sub.price,
      currency: sub.currency,
      cycle: sub.cycle,
      category: sub.category,
      startDate: new Date().toISOString().split("T")[0],
      nextBilling: new Date().toISOString().split("T")[0],
      isActive: true,
    })
  },
})

export const remove = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const sub = await ctx.db.get(args.id)
    if (!sub) throw new Error("Subscription not found")
    if (sub.userId !== identity.subject) throw new Error("Unauthorized")
    await ctx.db.delete(args.id)
  },
})

export const removeAll = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()
    for (const sub of subs) {
      await ctx.db.delete(sub._id)
    }
  },
})

export const restoreAll = mutation({
  args: {
    subscriptions: v.array(
      v.object({
        name: v.string(),
        icon: v.string(),
        color: v.string(),
        price: v.number(),
        currency: v.string(),
        cycle: v.string(),
        category: v.string(),
        startDate: v.string(),
        nextBilling: v.string(),
        isActive: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()
    for (const sub of existing) {
      await ctx.db.delete(sub._id)
    }
    for (const sub of args.subscriptions) {
      await ctx.db.insert("subscriptions", {
        userId: identity.subject,
        ...sub,
      })
    }
  },
})

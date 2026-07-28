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
    if (!sub || sub.userId !== identity.subject) return null
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
      const cycle = (s.cycle || "monthly").toLowerCase()
      if (cycle === "monthly") return sum + s.price
      if (cycle === "quarterly") return sum + s.price / 3
      if (cycle === "semi-annual") return sum + s.price / 6
      if (cycle === "yearly") return sum + s.price / 12
      if (cycle === "weekly") return sum + s.price * 4.33
      if (cycle === "daily") return sum + s.price * 30
      if (cycle === "none") return sum
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
    endDate: v.optional(v.string()),
    account: v.optional(v.string()),
    website: v.optional(v.string()),
    isTrial: v.optional(v.boolean()),
    trialEndDate: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
    reminderDays: v.optional(v.number()),
    isShared: v.optional(v.boolean()),
    totalPlanPrice: v.optional(v.number()),
    totalMembers: v.optional(v.number()),
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
      endDate: args.endDate || undefined,
      account: args.account || undefined,
      website: args.website || undefined,
      isTrial: args.isTrial || undefined,
      trialEndDate: args.trialEndDate || undefined,
      cancelUrl: args.cancelUrl || undefined,
      reminderDays: args.reminderDays || undefined,
      isShared: args.isShared || undefined,
      totalPlanPrice: args.totalPlanPrice || undefined,
      totalMembers: args.totalMembers || undefined,
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
    endDate: v.optional(v.string()),
    account: v.optional(v.string()),
    website: v.optional(v.string()),
    isTrial: v.optional(v.boolean()),
    trialEndDate: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
    reminderDays: v.optional(v.number()),
    isShared: v.optional(v.boolean()),
    totalPlanPrice: v.optional(v.number()),
    totalMembers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const sub = await ctx.db.get(args.id)
    if (!sub) throw new Error("Subscription not found")
    if (sub.userId !== identity.subject) throw new Error("Unauthorized")

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updates } = args
    const patchObj: Record<string, string | number | boolean | undefined> = {}
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) {
        if ((k === "endDate" || k === "account" || k === "website" || k === "trialEndDate" || k === "cancelUrl") && v === "") {
          patchObj[k] = undefined
        } else {
          patchObj[k] = v
        }
      }
    }
    await ctx.db.patch(args.id, patchObj)
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
      endDate: sub.endDate,
      account: sub.account,
      website: sub.website,
      isTrial: sub.isTrial,
      trialEndDate: sub.trialEndDate,
      cancelUrl: sub.cancelUrl,
      reminderDays: sub.reminderDays,
      isShared: sub.isShared,
      totalPlanPrice: sub.totalPlanPrice,
      totalMembers: sub.totalMembers,
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
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()
    for (const p of payments) {
      await ctx.db.delete(p._id)
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
        endDate: v.optional(v.string()),
        account: v.optional(v.string()),
        website: v.optional(v.string()),
        isTrial: v.optional(v.boolean()),
        trialEndDate: v.optional(v.string()),
        cancelUrl: v.optional(v.string()),
        reminderDays: v.optional(v.number()),
        isShared: v.optional(v.boolean()),
        totalPlanPrice: v.optional(v.number()),
        totalMembers: v.optional(v.number()),
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

import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const list = query({
  args: { month: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    if (args.month) {
      const month = args.month
      return await ctx.db
        .query("budgets")
        .withIndex("by_user_and_month", (q) =>
          q.eq("userId", identity.subject).eq("month", month)
        )
        .collect()
    }
    return await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect()
  },
})

export const upsert = mutation({
  args: {
    category: v.string(),
    amount: v.number(),
    currency: v.string(),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", identity.subject).eq("month", args.month)
      )
      .collect()
    const match = existing.find((b) => b.category === args.category)
    if (match) {
      await ctx.db.patch(match._id, { amount: args.amount, currency: args.currency })
      return match._id
    }
    return await ctx.db.insert("budgets", {
      userId: identity.subject,
      category: args.category,
      amount: args.amount,
      currency: args.currency,
      month: args.month,
    })
  },
})

export const remove = mutation({
  args: { id: v.id("budgets") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const budget = await ctx.db.get(args.id)
    if (!budget) throw new Error("Budget not found")
    if (budget.userId !== identity.subject) throw new Error("Unauthorized")
    await ctx.db.delete(args.id)
  },
})

export const copyFromPreviousMonth = mutation({
  args: { month: v.string(), fromMonth: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const source = await ctx.db
      .query("budgets")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", identity.subject).eq("month", args.fromMonth)
      )
      .collect()
    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", identity.subject).eq("month", args.month)
      )
      .collect()
    const existingCats = new Set(existing.map((b) => b.category))
    let copied = 0
    for (const b of source) {
      if (existingCats.has(b.category)) continue
      await ctx.db.insert("budgets", {
        userId: identity.subject,
        category: b.category,
        amount: b.amount,
        currency: b.currency,
        month: args.month,
      })
      copied += 1
    }
    return copied
  },
})

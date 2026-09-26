import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

function monthOf(date: string): string {
  return date.slice(0, 7)
}

export const list = query({
  args: {
    month: v.optional(v.string()),
    type: v.optional(v.string()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    let txns = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect()
    if (args.month) {
      txns = txns.filter((t) => monthOf(t.date) === args.month)
    }
    if (args.type) {
      txns = txns.filter((t) => t.type === args.type)
    }
    if (args.category) {
      txns = txns.filter((t) => t.category === args.category)
    }
    txns.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    if (args.limit) return txns.slice(0, args.limit)
    return txns
  },
})

export const monthlySummary = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const txns = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()

    let income = 0
    let expense = 0
    const byCategory: Record<string, number> = {}
    let count = 0
    for (const t of txns) {
      if (monthOf(t.date) !== args.month) continue
      if (t.currency !== undefined && t.amount === undefined) continue
      count += 1
      if (t.type === "income") {
        income += t.amount
      } else if (t.type === "expense") {
        expense += t.amount
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
      }
    }
    return { income, expense, net: income - expense, count, byCategory }
  },
})

export const create = mutation({
  args: {
    type: v.string(),
    amount: v.number(),
    currency: v.string(),
    category: v.string(),
    date: v.string(),
    note: v.optional(v.string()),
    accountId: v.optional(v.id("accounts")),
    toAccountId: v.optional(v.id("accounts")),
    subscriptionId: v.optional(v.id("subscriptions")),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    if (args.accountId) {
      const account = await ctx.db.get(args.accountId)
      if (!account || account.userId !== identity.subject) {
        throw new Error("Account not found")
      }
    }
    if (args.toAccountId) {
      const toAccount = await ctx.db.get(args.toAccountId)
      if (!toAccount || toAccount.userId !== identity.subject) {
        throw new Error("Destination account not found")
      }
    }

    return await ctx.db.insert("transactions", {
      userId: identity.subject,
      type: args.type,
      amount: args.amount,
      currency: args.currency,
      category: args.category,
      date: args.date,
      note: args.note || undefined,
      accountId: args.accountId,
      toAccountId: args.toAccountId,
      subscriptionId: args.subscriptionId,
      icon: args.icon || undefined,
      color: args.color || undefined,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("transactions"),
    type: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    category: v.optional(v.string()),
    date: v.optional(v.string()),
    note: v.optional(v.string()),
    accountId: v.optional(v.id("accounts")),
    toAccountId: v.optional(v.id("accounts")),
    subscriptionId: v.optional(v.id("subscriptions")),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const txn = await ctx.db.get(args.id)
    if (!txn) throw new Error("Transaction not found")
    if (txn.userId !== identity.subject) throw new Error("Unauthorized")

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updates } = args
    const patchObj: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(updates)) {
      if (val !== undefined) {
        patchObj[k] = val === "" && (k === "note" || k === "icon" || k === "color") ? undefined : val
      }
    }
    await ctx.db.patch(args.id, patchObj)
  },
})

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const txn = await ctx.db.get(args.id)
    if (!txn) throw new Error("Transaction not found")
    if (txn.userId !== identity.subject) throw new Error("Unauthorized")
    await ctx.db.delete(args.id)
  },
})

export const removeAll = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const txns = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()
    for (const t of txns) {
      await ctx.db.delete(t._id)
    }
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()
    for (const a of accounts) {
      await ctx.db.delete(a._id)
    }
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()
    for (const b of budgets) {
      await ctx.db.delete(b._id)
    }
  },
})

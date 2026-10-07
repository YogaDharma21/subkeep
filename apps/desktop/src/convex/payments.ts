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

export const listBySubscription = query({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const sub = await ctx.db.get(args.subscriptionId)
    if (!sub || sub.userId !== identity.subject) return []
    return await ctx.db
      .query("payments")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", args.subscriptionId))
      .order("desc")
      .collect()
  },
})

const fallbackRatesConvex: Record<string, number> = {
  USD: 1,
  IDR: 16200,
  EUR: 0.92,
  GBP: 0.79,
  SGD: 1.35,
  MYR: 4.7,
  AUD: 1.52,
  CAD: 1.36,
  JPY: 155,
  CNY: 7.23,
}

function convertCurrencyConvex(amount: number, fromCurr: string, toCurr: string): number {
  if (!amount || isNaN(amount)) return 0
  const from = (fromCurr || "USD").toUpperCase()
  const to = (toCurr || "IDR").toUpperCase()
  if (from === to) return amount
  const fromRate = fallbackRatesConvex[from] ?? 1
  const toRate = fallbackRatesConvex[to] ?? 1
  const inUSD = amount / fromRate
  return Math.round(inUSD * toRate * 100) / 100
}

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
    transactionId: v.optional(v.id("transactions")),
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
      transactionId: args.transactionId,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("payments"),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    date: v.optional(v.string()),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    transactionId: v.optional(v.id("transactions")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const payment = await ctx.db.get(args.id)
    if (!payment) throw new Error("Payment not found")
    if (payment.userId !== identity.subject) throw new Error("Unauthorized")

    const updates: Partial<{
      amount: number
      currency: string
      date: string
      name: string
      category: string
      transactionId: typeof args.transactionId
    }> = {}

    if (args.amount !== undefined) updates.amount = args.amount
    if (args.currency !== undefined) updates.currency = args.currency
    if (args.date !== undefined) updates.date = args.date
    if (args.name !== undefined) updates.name = args.name
    if (args.category !== undefined) updates.category = args.category
    if (args.transactionId !== undefined) updates.transactionId = args.transactionId

    await ctx.db.patch(args.id, updates)

    const txnId = payment.transactionId || args.transactionId
    if (txnId) {
      const txn = await ctx.db.get(txnId)
      if (txn && txn.userId === identity.subject) {
        const txnUpdates: Record<string, unknown> = {}
        if (args.date !== undefined) txnUpdates.date = args.date
        if (args.category !== undefined) txnUpdates.category = args.category
        if (args.name !== undefined) txnUpdates.note = `${args.name} subscription payment`
        if (args.currency !== undefined) txnUpdates.currency = args.currency
        if (args.amount !== undefined && args.amount !== txn.amount) {
          txnUpdates.amount = args.amount
          if (txn.accountId) {
            const account = await ctx.db.get(txn.accountId)
            if (account && account.userId === identity.subject) {
              const oldDeduct =
                account.currency !== txn.currency
                  ? convertCurrencyConvex(txn.amount, txn.currency, account.currency)
                  : txn.amount
              const newDeduct =
                account.currency !== (args.currency || txn.currency)
                  ? convertCurrencyConvex(args.amount, args.currency || txn.currency, account.currency)
                  : args.amount
              const balanceDelta = oldDeduct - newDeduct
              await ctx.db.patch(account._id, {
                balance: account.balance + balanceDelta,
              })
            }
          }
        }
        if (Object.keys(txnUpdates).length > 0) {
          await ctx.db.patch(txnId, txnUpdates)
        }
      }
    }
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

    // Find linked transaction if any
    let linkedTxn = payment.transactionId ? await ctx.db.get(payment.transactionId) : null
    if (!linkedTxn && payment.subscriptionId) {
      linkedTxn = await ctx.db
        .query("transactions")
        .withIndex("by_subscription", (q) => q.eq("subscriptionId", payment.subscriptionId))
        .filter((q) =>
          q.and(
            q.eq(q.field("date"), payment.date),
            q.eq(q.field("amount"), payment.amount),
            q.eq(q.field("type"), "expense")
          )
        )
        .first()
    }

    if (linkedTxn && linkedTxn.userId === identity.subject) {
      // Reverse account balance effect
      if (linkedTxn.accountId) {
        const account = await ctx.db.get(linkedTxn.accountId)
        if (account && account.userId === identity.subject) {
          let refundAmount = linkedTxn.amount
          if (account.currency !== linkedTxn.currency) {
            refundAmount = convertCurrencyConvex(linkedTxn.amount, linkedTxn.currency, account.currency)
          }
          await ctx.db.patch(account._id, {
            balance: account.balance + refundAmount,
          })
        }
      }
      await ctx.db.delete(linkedTxn._id)
    }

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

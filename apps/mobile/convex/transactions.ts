import { query, mutation } from "./_generated/server"
import type { MutationCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { v } from "convex/values"

function monthOf(date: string): string {
  return date.slice(0, 7)
}

function assertValidTransaction(type: string, amount: number) {
  if (type !== "expense" && type !== "income" && type !== "transfer") {
    throw new Error("Invalid transaction type")
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid amount")
  }
}

async function adjustBalance(
  ctx: MutationCtx,
  accountId: Id<"accounts">,
  userId: string,
  delta: number,
  opts?: { lenient?: boolean }
) {
  const account = await ctx.db.get(accountId)
  if (!account || account.userId !== userId) {
    if (opts?.lenient) return
    throw new Error("Account not found")
  }
  await ctx.db.patch(accountId, { balance: account.balance + delta })
}

// Applies the balance effect of a transaction (sign = +1).
// Reverts it when sign = -1 (tolerates deleted accounts so edits/deletes
// of old transactions never get stuck).
async function applyBalanceEffect(
  ctx: MutationCtx,
  userId: string,
  txn: {
    type: string
    amount: number
    accountId?: Id<"accounts"> | undefined
    toAccountId?: Id<"accounts"> | undefined
  },
  sign: 1 | -1,
  opts?: { lenient?: boolean }
) {
  const amount = txn.amount * sign
  if (txn.type === "expense") {
    if (txn.accountId) {
      await adjustBalance(ctx, txn.accountId, userId, -amount, opts)
    }
  } else if (txn.type === "income") {
    if (txn.accountId) {
      await adjustBalance(ctx, txn.accountId, userId, amount, opts)
    }
  } else if (txn.type === "transfer") {
    if (txn.accountId) {
      await adjustBalance(ctx, txn.accountId, userId, -amount, opts)
    }
    if (txn.toAccountId) {
      await adjustBalance(ctx, txn.toAccountId, userId, amount, opts)
    }
  }
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
    paymentId: v.optional(v.id("payments")),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    assertValidTransaction(args.type, args.amount)

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
    if (
      args.type === "transfer" &&
      args.accountId &&
      args.toAccountId &&
      args.accountId === args.toAccountId
    ) {
      throw new Error("Transfer accounts must be different")
    }

    const txnId = await ctx.db.insert("transactions", {
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
      paymentId: args.paymentId,
      icon: args.icon || undefined,
      color: args.color || undefined,
    })

    await applyBalanceEffect(
      ctx,
      identity.subject,
      {
        type: args.type,
        amount: args.amount,
        accountId: args.accountId,
        toAccountId: args.toAccountId,
      },
      1
    )

    return txnId
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
    paymentId: v.optional(v.id("payments")),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const txn = await ctx.db.get(args.id)
    if (!txn) throw new Error("Transaction not found")
    if (txn.userId !== identity.subject) throw new Error("Unauthorized")

    const newType = args.type ?? txn.type
    const newAmount = args.amount ?? txn.amount
    const newAccountId = args.accountId ?? txn.accountId
    const newToAccountId = args.toAccountId ?? txn.toAccountId

    assertValidTransaction(newType, newAmount)

    // Validate newly-assigned accounts (old ones were validated at creation).
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
    if (
      newType === "transfer" &&
      newAccountId &&
      newToAccountId &&
      newAccountId === newToAccountId
    ) {
      throw new Error("Transfer accounts must be different")
    }

    const balanceAffectingChange =
      newType !== txn.type ||
      newAmount !== txn.amount ||
      newAccountId !== txn.accountId ||
      newToAccountId !== txn.toAccountId

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updates } = args
    const patchObj: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(updates)) {
      if (val !== undefined) {
        patchObj[k] = val === "" && (k === "note" || k === "icon" || k === "color") ? undefined : val
      }
    }

    if (!balanceAffectingChange) {
      if (Object.keys(patchObj).length > 0) {
        await ctx.db.patch(args.id, patchObj)
      }
      if (txn.paymentId) {
        const payment = await ctx.db.get(txn.paymentId)
        if (payment && payment.userId === identity.subject) {
          const payUpdates: Record<string, unknown> = {}
          if (args.date !== undefined) payUpdates.date = args.date
          if (args.category !== undefined) payUpdates.category = args.category
          if (Object.keys(payUpdates).length > 0) await ctx.db.patch(txn.paymentId, payUpdates)
        }
      }
      return
    }

    // Reverse the old effect first (lenient: old account may be deleted),
    // then apply the new effect so the net delta is always correct.
    await applyBalanceEffect(
      ctx,
      identity.subject,
      {
        type: txn.type,
        amount: txn.amount,
        accountId: txn.accountId,
        toAccountId: txn.toAccountId,
      },
      -1,
      { lenient: true }
    )

    if (Object.keys(patchObj).length > 0) {
      await ctx.db.patch(args.id, patchObj)
    }

    await applyBalanceEffect(
      ctx,
      identity.subject,
      {
        type: newType,
        amount: newAmount,
        accountId: newAccountId,
        toAccountId: newToAccountId,
      },
      1
    )

    if (txn.paymentId) {
      const payment = await ctx.db.get(txn.paymentId)
      if (payment && payment.userId === identity.subject) {
        const payUpdates: Record<string, unknown> = {}
        if (args.amount !== undefined) payUpdates.amount = args.amount
        if (args.currency !== undefined) payUpdates.currency = args.currency
        if (args.date !== undefined) payUpdates.date = args.date
        if (args.category !== undefined) payUpdates.category = args.category
        if (Object.keys(payUpdates).length > 0) await ctx.db.patch(txn.paymentId, payUpdates)
      }
    }
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
    // Reverse the balance effect before deleting (lenient: account may be gone).
    await applyBalanceEffect(
      ctx,
      identity.subject,
      {
        type: txn.type,
        amount: txn.amount,
        accountId: txn.accountId,
        toAccountId: txn.toAccountId,
      },
      -1,
      { lenient: true }
    )

    // Delete associated payment if this transaction was linked to a payment
    if (txn.paymentId) {
      const payment = await ctx.db.get(txn.paymentId)
      if (payment && payment.userId === identity.subject) {
        await ctx.db.delete(txn.paymentId)
      }
    } else if (txn.subscriptionId) {
      // Fallback for older transactions that didn't have paymentId stored
      const matchingPayment = await ctx.db
        .query("payments")
        .withIndex("by_subscription", (q) => q.eq("subscriptionId", txn.subscriptionId!))
        .filter((q) =>
          q.and(
            q.eq(q.field("date"), txn.date),
            q.eq(q.field("amount"), txn.amount)
          )
        )
        .first()
      if (matchingPayment && matchingPayment.userId === identity.subject) {
        await ctx.db.delete(matchingPayment._id)
      }
    }

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

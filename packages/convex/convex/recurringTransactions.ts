import { query, mutation, internalMutation } from "./_generated/server"
import type { Doc } from "./_generated/dataModel"
import { v } from "convex/values"

const VALID_TYPES = ["expense", "income", "transfer"] as const
const VALID_FREQUENCIES = [
  "daily",
  "weekly",
  "bi-weekly",
  "monthly",
  "yearly",
] as const

function assertValidType(type: string) {
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    throw new Error("Invalid transaction type")
  }
}

function assertValidAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid amount")
  }
}

function assertValidFrequency(frequency: string) {
  if (!VALID_FREQUENCIES.includes(frequency as (typeof VALID_FREQUENCIES)[number])) {
    throw new Error("Invalid frequency")
  }
}

export const list = query({
  args: {
    type: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    let recurring: Doc<"recurringTransactions">[]
    if (args.isActive !== undefined) {
      recurring = await ctx.db
        .query("recurringTransactions")
        .withIndex("by_user_and_active", (q) =>
          q.eq("userId", identity.subject).eq("isActive", args.isActive!)
        )
        .order("desc")
        .collect()
    } else {
      recurring = await ctx.db
        .query("recurringTransactions")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .order("desc")
        .collect()
    }

    if (args.type !== undefined) {
      recurring = recurring.filter((r) => r.type === args.type)
    }

    return recurring
  },
})

export const get = query({
  args: { id: v.id("recurringTransactions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const item = await ctx.db.get(args.id)
    if (!item || item.userId !== identity.subject) return null
    return item
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    amount: v.number(),
    currency: v.string(),
    category: v.string(),
    frequency: v.string(),
    startDate: v.string(),
    nextDueDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    accountId: v.optional(v.id("accounts")),
    toAccountId: v.optional(v.id("accounts")),
    isActive: v.optional(v.boolean()),
    note: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    lastProcessedDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    assertValidType(args.type)
    assertValidAmount(args.amount)
    assertValidFrequency(args.frequency)

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

    const nextDueDate = args.nextDueDate || args.startDate

    return await ctx.db.insert("recurringTransactions", {
      userId: identity.subject,
      name: args.name,
      type: args.type,
      amount: args.amount,
      currency: args.currency,
      category: args.category,
      frequency: args.frequency,
      startDate: args.startDate,
      nextDueDate,
      endDate: args.endDate || undefined,
      accountId: args.accountId,
      toAccountId: args.toAccountId,
      isActive: args.isActive ?? true,
      note: args.note || undefined,
      icon: args.icon || undefined,
      color: args.color || undefined,
      lastProcessedDate: args.lastProcessedDate || undefined,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("recurringTransactions"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    category: v.optional(v.string()),
    frequency: v.optional(v.string()),
    startDate: v.optional(v.string()),
    nextDueDate: v.optional(v.string()),
    endDate: v.optional(v.union(v.string(), v.null())),
    accountId: v.optional(v.union(v.id("accounts"), v.null())),
    toAccountId: v.optional(v.union(v.id("accounts"), v.null())),
    isActive: v.optional(v.boolean()),
    note: v.optional(v.union(v.string(), v.null())),
    icon: v.optional(v.union(v.string(), v.null())),
    color: v.optional(v.union(v.string(), v.null())),
    lastProcessedDate: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const existing = await ctx.db.get(args.id)
    if (!existing) throw new Error("Recurring transaction not found")
    if (existing.userId !== identity.subject) throw new Error("Unauthorized")

    if (args.type !== undefined) assertValidType(args.type)
    if (args.amount !== undefined) assertValidAmount(args.amount)
    if (args.frequency !== undefined) assertValidFrequency(args.frequency)

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

    const finalType = args.type ?? existing.type
    const finalAccountId =
      args.accountId !== undefined ? (args.accountId ?? undefined) : existing.accountId
    const finalToAccountId =
      args.toAccountId !== undefined ? (args.toAccountId ?? undefined) : existing.toAccountId

    if (
      finalType === "transfer" &&
      finalAccountId &&
      finalToAccountId &&
      finalAccountId === finalToAccountId
    ) {
      throw new Error("Transfer accounts must be different")
    }

    const patch: Partial<Doc<"recurringTransactions">> = {}
    if (args.name !== undefined) patch.name = args.name
    if (args.type !== undefined) patch.type = args.type
    if (args.amount !== undefined) patch.amount = args.amount
    if (args.currency !== undefined) patch.currency = args.currency
    if (args.category !== undefined) patch.category = args.category
    if (args.frequency !== undefined) patch.frequency = args.frequency
    if (args.startDate !== undefined) patch.startDate = args.startDate
    if (args.nextDueDate !== undefined) patch.nextDueDate = args.nextDueDate
    if (args.endDate !== undefined) patch.endDate = args.endDate ?? undefined
    if (args.accountId !== undefined) patch.accountId = args.accountId ?? undefined
    if (args.toAccountId !== undefined) patch.toAccountId = args.toAccountId ?? undefined
    if (args.isActive !== undefined) patch.isActive = args.isActive
    if (args.note !== undefined) patch.note = args.note ?? undefined
    if (args.icon !== undefined) patch.icon = args.icon ?? undefined
    if (args.color !== undefined) patch.color = args.color ?? undefined
    if (args.lastProcessedDate !== undefined) {
      patch.lastProcessedDate = args.lastProcessedDate ?? undefined
    }

    await ctx.db.patch(args.id, patch)
  },
})

export const remove = mutation({
  args: { id: v.id("recurringTransactions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const existing = await ctx.db.get(args.id)
    if (!existing) throw new Error("Recurring transaction not found")
    if (existing.userId !== identity.subject) throw new Error("Unauthorized")

    await ctx.db.delete(args.id)
  },
})

export const toggleActive = mutation({
  args: { id: v.id("recurringTransactions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const existing = await ctx.db.get(args.id)
    if (!existing) throw new Error("Recurring transaction not found")
    if (existing.userId !== identity.subject) throw new Error("Unauthorized")

    const nextState = !existing.isActive
    await ctx.db.patch(args.id, { isActive: nextState })
    return nextState
  },
})

export function calculateNextDueDate(currentDateStr: string, frequency: string): string {
  const [yearStr, monthStr, dayStr] = currentDateStr.split("-")
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)

  if (frequency === "daily") {
    const d = new Date(Date.UTC(year, month - 1, day + 1))
    return d.toISOString().slice(0, 10)
  }
  if (frequency === "weekly") {
    const d = new Date(Date.UTC(year, month - 1, day + 7))
    return d.toISOString().slice(0, 10)
  }
  if (frequency === "bi-weekly") {
    const d = new Date(Date.UTC(year, month - 1, day + 14))
    return d.toISOString().slice(0, 10)
  }
  if (frequency === "monthly") {
    let targetYear = year
    let targetMonth = month + 1
    if (targetMonth > 12) {
      targetYear += 1
      targetMonth = 1
    }
    const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate()
    const targetDay = Math.min(day, daysInTargetMonth)
    return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`
  }
  if (frequency === "yearly") {
    const targetYear = year + 1
    const targetMonth = month
    const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate()
    const targetDay = Math.min(day, daysInTargetMonth)
    return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`
  }

  return currentDateStr
}

export const processDueRecurringTransactions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const todayStr = new Date().toISOString().slice(0, 10)

    const dueItems = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_next_due", (q) =>
        q.eq("isActive", true).lte("nextDueDate", todayStr)
      )
      .collect()

    let processedCount = 0

    for (const item of dueItems) {
      let nextDate = calculateNextDueDate(item.nextDueDate, item.frequency)
      let newIsActive = true
      if (item.endDate && nextDate > item.endDate) {
        newIsActive = false
        nextDate = item.endDate
      }

      // Idempotency: skip inserting transaction if already generated for this recurring id and due date
      const existingTx = await ctx.db
        .query("transactions")
        .withIndex("by_recurring", (q) => q.eq("recurringTransactionId", item._id))
        .filter((q) => q.eq(q.field("date"), item.nextDueDate))
        .first()

      if (existingTx) {
        await ctx.db.patch(item._id, {
          lastProcessedDate: todayStr,
          nextDueDate: nextDate,
          isActive: newIsActive,
        })
        continue
      }

      await ctx.db.insert("transactions", {
        userId: item.userId,
        type: item.type,
        amount: item.amount,
        currency: item.currency,
        category: item.category,
        date: item.nextDueDate,
        note: item.note ? `${item.name}: ${item.note}` : `${item.name} (Recurring)`,
        accountId: item.accountId,
        toAccountId: item.toAccountId,
        recurringTransactionId: item._id,
        icon: item.icon,
        color: item.color,
      })

      if (item.type === "expense") {
        if (item.accountId) {
          const account = await ctx.db.get(item.accountId)
          if (account) {
            await ctx.db.patch(item.accountId, { balance: account.balance - item.amount })
          }
        }
      } else if (item.type === "income") {
        if (item.accountId) {
          const account = await ctx.db.get(item.accountId)
          if (account) {
            await ctx.db.patch(item.accountId, { balance: account.balance + item.amount })
          }
        }
      } else if (item.type === "transfer") {
        if (item.accountId) {
          const account = await ctx.db.get(item.accountId)
          if (account) {
            await ctx.db.patch(item.accountId, { balance: account.balance - item.amount })
          }
        }
        if (item.toAccountId) {
          const toAccount = await ctx.db.get(item.toAccountId)
          if (toAccount) {
            await ctx.db.patch(item.toAccountId, { balance: toAccount.balance + item.amount })
          }
        }
      }

      await ctx.db.patch(item._id, {
        lastProcessedDate: todayStr,
        nextDueDate: nextDate,
        isActive: newIsActive,
      })

      processedCount++
    }

    return { processedCount, date: todayStr }
  },
})

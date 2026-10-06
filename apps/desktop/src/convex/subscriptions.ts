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

    let receiptUrl: string | null = null
    if (sub.receiptStorageId) {
      receiptUrl = await ctx.storage.getUrl(sub.receiptStorageId)
    }

    return {
      ...sub,
      receiptUrl,
    }
  },
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    return await ctx.storage.generateUploadUrl()
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

function addMonths(year: number, month: number, day: number, count: number): string {
  const totalMonths = month - 1 + count
  const targetYear = year + Math.floor(totalMonths / 12)
  const targetMonth = (totalMonths % 12) + 1
  const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate()
  const targetDay = Math.min(day, daysInTargetMonth)

  const yStr = String(targetYear)
  const mStr = String(targetMonth).padStart(2, "0")
  const dStr = String(targetDay).padStart(2, "0")
  return `${yStr}-${mStr}-${dStr}`
}

function formatDate(d: Date): string {
  const yStr = String(d.getFullYear())
  const mStr = String(d.getMonth() + 1).padStart(2, "0")
  const dStr = String(d.getDate()).padStart(2, "0")
  return `${yStr}-${mStr}-${dStr}`
}

export function calculateNextBilling(dateStr: string, cycle: string): string {
  const parts = dateStr.split("-").map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return formatDate(d)
  }

  const [year, month, day] = parts
  const c = (cycle || "monthly").toLowerCase()

  if (c === "daily") {
    const d = new Date(year, month - 1, day)
    d.setDate(d.getDate() + 1)
    return formatDate(d)
  }
  if (c === "weekly") {
    const d = new Date(year, month - 1, day)
    d.setDate(d.getDate() + 7)
    return formatDate(d)
  }
  if (c === "monthly") {
    return addMonths(year, month, day, 1)
  }
  if (c === "quarterly") {
    return addMonths(year, month, day, 3)
  }
  if (c === "semi-annual") {
    return addMonths(year, month, day, 6)
  }
  if (c === "yearly") {
    return addMonths(year, month, day, 12)
  }
  return dateStr
}

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
    accountId: v.optional(v.id("accounts")),
    autoRecordPayment: v.optional(v.boolean()),
    website: v.optional(v.string()),
    isTrial: v.optional(v.boolean()),
    trialEndDate: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
    reminderDays: v.optional(v.number()),
    isShared: v.optional(v.boolean()),
    totalPlanPrice: v.optional(v.number()),
    totalMembers: v.optional(v.number()),
    paymentMethodId: v.optional(v.string()),
    splitMembers: v.optional(
      v.array(
        v.object({
          name: v.string(),
          shareAmount: v.number(),
          isPaid: v.optional(v.boolean()),
        })
      )
    ),
    receiptStorageId: v.optional(v.id("_storage")),
    receiptFileName: v.optional(v.string()),
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
      accountId: args.accountId || undefined,
      autoRecordPayment: args.autoRecordPayment || undefined,
      website: args.website || undefined,
      isTrial: args.isTrial || undefined,
      trialEndDate: args.trialEndDate || undefined,
      cancelUrl: args.cancelUrl || undefined,
      reminderDays: args.reminderDays || undefined,
      isShared: args.isShared || undefined,
      totalPlanPrice: args.totalPlanPrice || undefined,
      totalMembers: args.totalMembers || undefined,
      paymentMethodId: args.paymentMethodId || undefined,
      splitMembers: args.splitMembers || undefined,
      priceHistory: [
        {
          price: args.price,
          currency: args.currency,
          changedAt: new Date().toISOString().split("T")[0],
        },
      ],
      receiptStorageId: args.receiptStorageId || undefined,
      receiptFileName: args.receiptFileName || undefined,
      isActive: true,
      pendingCancel: undefined,
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
    accountId: v.optional(v.union(v.id("accounts"), v.null())),
    autoRecordPayment: v.optional(v.boolean()),
    lastPaymentDate: v.optional(v.string()),
    website: v.optional(v.string()),
    isTrial: v.optional(v.boolean()),
    trialEndDate: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
    reminderDays: v.optional(v.number()),
    isShared: v.optional(v.boolean()),
    totalPlanPrice: v.optional(v.number()),
    totalMembers: v.optional(v.number()),
    paymentMethodId: v.optional(v.string()),
    splitMembers: v.optional(
      v.array(
        v.object({
          name: v.string(),
          shareAmount: v.number(),
          isPaid: v.optional(v.boolean()),
        })
      )
    ),
    receiptStorageId: v.optional(v.id("_storage")),
    receiptFileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const sub = await ctx.db.get(args.id)
    if (!sub) throw new Error("Subscription not found")
    if (sub.userId !== identity.subject) throw new Error("Unauthorized")

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updates } = args
    const patchObj: Record<string, unknown> = {}

    // Price change tracking
    if (args.price !== undefined && args.price !== sub.price) {
      const history = sub.priceHistory ? [...sub.priceHistory] : []
      history.push({
        price: args.price,
        currency: args.currency || sub.currency,
        changedAt: new Date().toISOString().split("T")[0],
      })
      patchObj.priceHistory = history
    }

    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) {
        if (
          (k === "endDate" ||
            k === "account" ||
            k === "website" ||
            k === "trialEndDate" ||
            k === "cancelUrl" ||
            k === "paymentMethodId" ||
            k === "receiptFileName") &&
          v === ""
        ) {
          patchObj[k] = undefined
        } else if (k === "accountId" && (v === null || v === "")) {
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

export const startCancel = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const sub = await ctx.db.get(args.id)
    if (!sub) throw new Error("Subscription not found")
    if (sub.userId !== identity.subject) throw new Error("Unauthorized")
    await ctx.db.patch(args.id, { pendingCancel: true })
  },
})

export const confirmCancel = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const sub = await ctx.db.get(args.id)
    if (!sub) throw new Error("Subscription not found")
    if (sub.userId !== identity.subject) throw new Error("Unauthorized")
    await ctx.db.patch(args.id, { isActive: false, pendingCancel: false })
  },
})

export const resume = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const sub = await ctx.db.get(args.id)
    if (!sub) throw new Error("Subscription not found")
    if (sub.userId !== identity.subject) throw new Error("Unauthorized")
    await ctx.db.patch(args.id, { isActive: true, pendingCancel: false })
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
      accountId: sub.accountId,
      autoRecordPayment: sub.autoRecordPayment,
      website: sub.website,
      isTrial: sub.isTrial,
      trialEndDate: sub.trialEndDate,
      cancelUrl: sub.cancelUrl,
      reminderDays: sub.reminderDays,
      isShared: sub.isShared,
      totalPlanPrice: sub.totalPlanPrice,
      totalMembers: sub.totalMembers,
      paymentMethodId: sub.paymentMethodId,
      splitMembers: sub.splitMembers,
      priceHistory: [
        {
          price: sub.price,
          currency: sub.currency,
          changedAt: new Date().toISOString().split("T")[0],
        },
      ],
      isActive: true,
      pendingCancel: undefined,
    })
  },
})

export const recordPayment = mutation({
  args: {
    id: v.id("subscriptions"),
    amount: v.optional(v.number()),
    date: v.optional(v.string()),
    accountId: v.optional(v.id("accounts")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const sub = await ctx.db.get(args.id)
    if (!sub) throw new Error("Subscription not found")
    if (sub.userId !== identity.subject) throw new Error("Unauthorized")

    const paymentDate = args.date || new Date().toISOString().split("T")[0]
    const amount = args.amount ?? sub.price
    const targetAccountId = args.accountId ?? sub.accountId

    // 1. Insert into payments table
    const paymentId = await ctx.db.insert("payments", {
      userId: identity.subject,
      subscriptionId: sub._id,
      name: sub.name,
      icon: sub.icon,
      color: sub.color,
      amount,
      currency: sub.currency,
      category: sub.category,
      date: paymentDate,
    })

    // 2. Insert into transactions table and adjust account balance
    const txnId = await ctx.db.insert("transactions", {
      userId: identity.subject,
      type: "expense",
      amount,
      currency: sub.currency,
      category: sub.category,
      date: paymentDate,
      note: `${sub.name} subscription payment`,
      accountId: targetAccountId,
      subscriptionId: sub._id,
      icon: sub.icon,
      color: sub.color,
    })

    if (targetAccountId) {
      const account = await ctx.db.get(targetAccountId)
      if (account && account.userId === identity.subject) {
        await ctx.db.patch(targetAccountId, {
          balance: account.balance - amount,
        })
      }
    }

    // 3. Advance nextBilling date
    let baseDate = sub.nextBilling || paymentDate
    if (baseDate < paymentDate) {
      baseDate = paymentDate
    }
    const nextDate = calculateNextBilling(baseDate, sub.cycle)
    const patchObj: Record<string, unknown> = {
      lastPaymentDate: paymentDate,
    }

    if (sub.isTrial) {
      patchObj.isTrial = false
      patchObj.trialEndDate = undefined
    }

    if (sub.endDate && nextDate > sub.endDate) {
      patchObj.isActive = false
      patchObj.nextBilling = nextDate
    } else if (sub.cycle && sub.cycle.toLowerCase() !== "none") {
      patchObj.nextBilling = nextDate
    }

    await ctx.db.patch(sub._id, patchObj)

    return {
      paymentId,
      transactionId: txnId,
      nextBilling: (patchObj.nextBilling as string) ?? sub.nextBilling,
      isActive: (patchObj.isActive as boolean) ?? sub.isActive,
    }
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

    // Delete associated receipt storage file if present
    if (sub.receiptStorageId) {
      try {
        await ctx.storage.delete(sub.receiptStorageId)
      } catch {
        // ignore delete failure
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
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()
    for (const sub of subs) {
      if (sub.receiptStorageId) {
        try {
          await ctx.storage.delete(sub.receiptStorageId)
        } catch {
          // ignore
        }
      }
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
        accountId: v.optional(v.id("accounts")),
        autoRecordPayment: v.optional(v.boolean()),
        lastPaymentDate: v.optional(v.string()),
        website: v.optional(v.string()),
        isTrial: v.optional(v.boolean()),
        trialEndDate: v.optional(v.string()),
        cancelUrl: v.optional(v.string()),
        reminderDays: v.optional(v.number()),
        isShared: v.optional(v.boolean()),
        totalPlanPrice: v.optional(v.number()),
        totalMembers: v.optional(v.number()),
        paymentMethodId: v.optional(v.string()),
        splitMembers: v.optional(
          v.array(
            v.object({
              name: v.string(),
              shareAmount: v.number(),
              isPaid: v.optional(v.boolean()),
            })
          )
        ),
        priceHistory: v.optional(
          v.array(
            v.object({
              price: v.number(),
              currency: v.string(),
              changedAt: v.string(),
            })
          )
        ),
        isActive: v.boolean(),
        pendingCancel: v.optional(v.boolean()),
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

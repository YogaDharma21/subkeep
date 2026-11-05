import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export function validateCardExpiry(
  expiryMonth?: number,
  expiryYear?: number,
  now: Date = new Date(),
) {
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  if (expiryMonth !== undefined) {
    if (!Number.isInteger(expiryMonth) || expiryMonth < 1 || expiryMonth > 12) {
      throw new Error("Invalid expiry month: must be 1-12")
    }
  }

  if (expiryYear !== undefined) {
    if (
      !Number.isInteger(expiryYear) ||
      expiryYear < currentYear ||
      expiryYear > currentYear + 50
    ) {
      throw new Error("Invalid expiry year")
    }
  }

  if (expiryMonth !== undefined && expiryYear !== undefined) {
    if (expiryYear === currentYear && expiryMonth < currentMonth) {
      throw new Error("Card has already expired")
    }
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    return await ctx.db
      .query("paymentMethods")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    last4: v.optional(v.string()),
    color: v.string(),
    expiryMonth: v.optional(v.number()),
    expiryYear: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    validateCardExpiry(args.expiryMonth, args.expiryYear)

    return await ctx.db.insert("paymentMethods", {
      userId: identity.subject,
      name: args.name,
      type: args.type,
      last4: args.last4,
      color: args.color,
      expiryMonth: args.expiryMonth,
      expiryYear: args.expiryYear,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("paymentMethods"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    last4: v.optional(v.string()),
    color: v.optional(v.string()),
    expiryMonth: v.optional(v.number()),
    expiryYear: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const card = await ctx.db.get(args.id)
    if (!card || card.userId !== identity.subject) throw new Error("Unauthorized")

    if (args.expiryMonth !== undefined || args.expiryYear !== undefined) {
      validateCardExpiry(
        args.expiryMonth ?? card.expiryMonth,
        args.expiryYear ?? card.expiryYear,
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updates } = args
    await ctx.db.patch(args.id, updates)
  },
})

export const remove = mutation({
  args: { id: v.id("paymentMethods") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const card = await ctx.db.get(args.id)
    if (!card || card.userId !== identity.subject) throw new Error("Unauthorized")
    await ctx.db.delete(args.id)
  },
})

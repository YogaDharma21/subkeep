import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    expirationTime: v.optional(v.union(v.number(), v.null())),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: identity.subject,
        expirationTime: args.expirationTime,
        keys: args.keys,
      })
      return existing._id
    }

    return await ctx.db.insert("pushSubscriptions", {
      userId: identity.subject,
      endpoint: args.endpoint,
      expirationTime: args.expirationTime,
      keys: args.keys,
      createdAt: new Date().toISOString(),
    })
  },
})

export const unsubscribe = mutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first()

    if (existing && existing.userId === identity.subject) {
      await ctx.db.delete(existing._id)
    }
  },
})

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()
  },
})

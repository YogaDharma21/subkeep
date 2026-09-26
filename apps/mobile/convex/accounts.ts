import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const list = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect()
    if (args.includeArchived) return accounts
    return accounts.filter((a) => !a.isArchived)
  },
})

export const get = query({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const account = await ctx.db.get(args.id)
    if (!account || account.userId !== identity.subject) return null
    return account
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    balance: v.number(),
    currency: v.string(),
    icon: v.string(),
    color: v.string(),
    last4: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    return await ctx.db.insert("accounts", {
      userId: identity.subject,
      name: args.name,
      type: args.type,
      balance: args.balance,
      currency: args.currency,
      icon: args.icon,
      color: args.color,
      last4: args.last4 || undefined,
      isArchived: false,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("accounts"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    balance: v.optional(v.number()),
    currency: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    last4: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const account = await ctx.db.get(args.id)
    if (!account) throw new Error("Account not found")
    if (account.userId !== identity.subject) throw new Error("Unauthorized")

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updates } = args
    const patchObj: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(updates)) {
      if (val !== undefined) {
        patchObj[k] = val === "" && (k === "last4" || k === "icon") ? undefined : val
      }
    }
    await ctx.db.patch(args.id, patchObj)
  },
})

export const archive = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const account = await ctx.db.get(args.id)
    if (!account) throw new Error("Account not found")
    if (account.userId !== identity.subject) throw new Error("Unauthorized")
    await ctx.db.patch(args.id, { isArchived: !account.isArchived })
  },
})

export const remove = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const account = await ctx.db.get(args.id)
    if (!account) throw new Error("Account not found")
    if (account.userId !== identity.subject) throw new Error("Unauthorized")

    // Detach transactions linked to this account instead of deleting history
    const linked = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", args.id))
      .collect()
    for (const t of linked) {
      await ctx.db.patch(t._id, { accountId: undefined })
    }
    const linkedTo = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("toAccountId"), args.id))
      .collect()
    for (const t of linkedTo) {
      if (t.userId === identity.subject) {
        await ctx.db.patch(t._id, { toAccountId: undefined })
      }
    }

    await ctx.db.delete(args.id)
  },
})

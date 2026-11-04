import { query, action, internalMutation, internalAction, type ActionCtx } from "./_generated/server"
import { internal } from "./_generated/api"
import { v } from "convex/values"

export const getLatest = query({
  args: {
    baseCurrency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const base = args.baseCurrency ?? "USD"
    return await ctx.db
      .query("exchangeRates")
      .withIndex("by_base_currency", (q) => q.eq("baseCurrency", base))
      .first()
  },
})

export const storeRates = internalMutation({
  args: {
    baseCurrency: v.string(),
    rates: v.record(v.string(), v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("exchangeRates")
      .withIndex("by_base_currency", (q) => q.eq("baseCurrency", args.baseCurrency))
      .first()

    const now = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, {
        rates: args.rates,
        updatedAt: now,
      })
      return existing._id
    }

    return await ctx.db.insert("exchangeRates", {
      baseCurrency: args.baseCurrency,
      rates: args.rates,
      updatedAt: now,
    })
  },
})

async function performSyncRates(
  ctx: ActionCtx,
  baseCurrency?: string
): Promise<{ baseCurrency: string; rates: Record<string, number> }> {
  const base = baseCurrency ?? "USD"
  let rawRates: Record<string, unknown> | null = null

  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`)
    if (response.ok) {
      const data = (await response.json()) as { rates?: Record<string, unknown> }
      if (data.rates && typeof data.rates === "object") {
        rawRates = data.rates
      }
    }
  } catch {
    // Primary fetch failed, fallback below
  }

  if (!rawRates) {
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`)
      if (response.ok) {
        const data = (await response.json()) as { rates?: Record<string, unknown> }
        if (data.rates && typeof data.rates === "object") {
          rawRates = data.rates
        }
      }
    } catch {
      // Fallback failed
    }
  }

  if (!rawRates) {
    throw new Error(`Failed to fetch exchange rates for ${base}`)
  }

  const rates: Record<string, number> = {}
  for (const [key, value] of Object.entries(rawRates)) {
    if (
      typeof key === "string" &&
      key.length > 0 &&
      !key.startsWith("$") &&
      !key.startsWith("_") &&
      typeof value === "number" &&
      !Number.isNaN(value)
    ) {
      rates[key] = value
    }
  }

  await ctx.runMutation(internal.exchangeRates.storeRates, {
    baseCurrency: base,
    rates,
  })

  return { baseCurrency: base, rates }
}

export const syncRates = internalAction({
  args: {
    baseCurrency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await performSyncRates(ctx, args.baseCurrency)
  },
})

export const sync = action({
  args: {
    baseCurrency: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ baseCurrency: string; rates: Record<string, number> }> => {
    return await performSyncRates(ctx, args.baseCurrency)
  },
})

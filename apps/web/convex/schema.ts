import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  subscriptions: defineTable({
    userId: v.string(),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    price: v.number(),
    currency: v.string(),
    cycle: v.string(),
    category: v.string(),
    startDate: v.string(),
    nextBilling: v.string(),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_active", ["userId", "isActive"]),

  templates: defineTable({
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    category: v.string(),
    defaultPrice: v.number(),
    defaultCurrency: v.string(),
  }).index("by_category", ["category"]),

  payments: defineTable({
    userId: v.string(),
    subscriptionId: v.id("subscriptions"),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    amount: v.number(),
    currency: v.string(),
    category: v.string(),
    date: v.string(),
  }).index("by_user", ["userId"]),
})

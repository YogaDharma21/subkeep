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
    endDate: v.optional(v.string()),
    account: v.optional(v.string()),
    website: v.optional(v.string()),
    isActive: v.boolean(),
    isTrial: v.optional(v.boolean()),
    trialEndDate: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
    reminderDays: v.optional(v.number()),
    isShared: v.optional(v.boolean()),
    totalPlanPrice: v.optional(v.number()),
    totalMembers: v.optional(v.number()),
    // Card Vault / Payment Method link
    paymentMethodId: v.optional(v.string()),
    // SplitKeep member-by-member tracking
    splitMembers: v.optional(
      v.array(
        v.object({
          name: v.string(),
          shareAmount: v.number(),
          isPaid: v.optional(v.boolean()),
        })
      )
    ),
    // Subscription price hike history
    priceHistory: v.optional(
      v.array(
        v.object({
          price: v.number(),
          currency: v.string(),
          changedAt: v.string(),
        })
      )
    ),
    // Invoice and receipt attachment file storage
    receiptStorageId: v.optional(v.id("_storage")),
    receiptFileName: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_active", ["userId", "isActive"]),

  paymentMethods: defineTable({
    userId: v.string(),
    name: v.string(),
    type: v.string(), // "visa" | "mastercard" | "amex" | "paypal" | "applepay" | "bank" | "other"
    last4: v.optional(v.string()),
    color: v.string(),
    expiryMonth: v.optional(v.number()),
    expiryYear: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  templates: defineTable({
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    category: v.string(),
    defaultPrice: v.number(),
    defaultCurrency: v.string(),
    cancelUrl: v.optional(v.string()),
    cancellationSteps: v.optional(v.array(v.string())),
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

  userSettings: defineTable({
    userId: v.string(),
    primaryCurrency: v.string(),
    reminderDays: v.number(),
    webPushEnabled: v.boolean(),
    monthlyBudgetCap: v.optional(v.number()),
    emailEnabled: v.optional(v.boolean()),
    emailAddress: v.optional(v.string()),
    telegramEnabled: v.optional(v.boolean()),
    telegramBotToken: v.optional(v.string()),
    telegramChatId: v.optional(v.string()),
  }).index("by_user", ["userId"]),
})

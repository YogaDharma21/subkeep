import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"

export const exportData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const userId = identity.subject

    const [
      subscriptions,
      paymentMethods,
      payments,
      userSettings,
      accounts,
      transactions,
      budgets,
    ] = await Promise.all([
      ctx.db.query("subscriptions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("paymentMethods").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("payments").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("userSettings").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("accounts").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("transactions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("budgets").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ])

    return {
      version: 3,
      exportedAt: new Date().toISOString(),
      data: {
        subscriptions,
        paymentMethods,
        payments,
        userSettings,
        accounts,
        transactions,
        budgets,
      },
    }
  },
})

export const restoreData = mutation({
  args: {
    version: v.number(),
    exportedAt: v.optional(v.string()),
    data: v.object({
      subscriptions: v.optional(v.array(v.any())),
      paymentMethods: v.optional(v.array(v.any())),
      payments: v.optional(v.array(v.any())),
      userSettings: v.optional(v.any()),
      accounts: v.optional(v.array(v.any())),
      transactions: v.optional(v.array(v.any())),
      budgets: v.optional(v.array(v.any())),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const userId = identity.subject

    // Fetch existing records for user across all 7 tables
    const [
      existingSubscriptions,
      existingPaymentMethods,
      existingPayments,
      existingUserSettings,
      existingAccounts,
      existingTransactions,
      existingBudgets,
    ] = await Promise.all([
      ctx.db.query("subscriptions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("paymentMethods").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("payments").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("userSettings").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("accounts").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("transactions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("budgets").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ])

    // Clean up existing user records in child and parent tables
    for (const doc of existingTransactions) await ctx.db.delete(doc._id)
    for (const doc of existingPayments) await ctx.db.delete(doc._id)
    for (const doc of existingSubscriptions) await ctx.db.delete(doc._id)
    for (const doc of existingBudgets) await ctx.db.delete(doc._id)
    for (const doc of existingAccounts) await ctx.db.delete(doc._id)
    for (const doc of existingPaymentMethods) await ctx.db.delete(doc._id)
    for (let i = 1; i < existingUserSettings.length; i++) {
      await ctx.db.delete(existingUserSettings[i]._id)
    }

    // ID remapping tables
    const paymentMethodIdMap = new Map<string, string>()
    const accountIdMap = new Map<string, Id<"accounts">>()
    const subscriptionIdMap = new Map<string, Id<"subscriptions">>()
    const subscriptionNameMap = new Map<string, Id<"subscriptions">>()
    const paymentIdMap = new Map<string, Id<"payments">>()

    // a. paymentMethods: insert new records, map oldId -> newId
    let paymentMethodsCount = 0
    for (const item of args.data.paymentMethods ?? []) {
      const oldId = item._id ?? item.id
      const newId = await ctx.db.insert("paymentMethods", {
        userId,
        name: item.name ?? "Payment Method",
        type: item.type ?? "other",
        last4: item.last4,
        color: item.color ?? "#6366f1",
        expiryMonth: item.expiryMonth,
        expiryYear: item.expiryYear,
      })
      if (oldId) {
        paymentMethodIdMap.set(String(oldId), newId)
      }
      paymentMethodsCount++
    }

    // b. accounts: insert new records, map oldId -> newId
    let accountsCount = 0
    for (const item of args.data.accounts ?? []) {
      const oldId = item._id ?? item.id
      const newId = await ctx.db.insert("accounts", {
        userId,
        name: item.name ?? "Account",
        type: item.type ?? "checking",
        balance: typeof item.balance === "number" ? item.balance : 0,
        currency: item.currency ?? "USD",
        icon: item.icon ?? "wallet",
        color: item.color ?? "#6366f1",
        last4: item.last4,
        isArchived: item.isArchived,
      })
      if (oldId) {
        accountIdMap.set(String(oldId), newId)
      }
      accountsCount++
    }

    // c. subscriptions:
    //    - remap accountId if in accountIdMap
    //    - remap paymentMethodId if in paymentMethodIdMap
    //    - insert record, map oldId -> newId
    let subscriptionsCount = 0
    for (const item of args.data.subscriptions ?? []) {
      const oldId = item._id ?? item.id
      const remappedAccountId = item.accountId ? accountIdMap.get(String(item.accountId)) : undefined
      const remappedPaymentMethodId = item.paymentMethodId
        ? paymentMethodIdMap.get(String(item.paymentMethodId))
        : undefined

      const newSubId = await ctx.db.insert("subscriptions", {
        userId,
        name: item.name ?? "Subscription",
        icon: item.icon ?? "default",
        color: item.color,
        price: typeof item.price === "number" ? item.price : 0,
        currency: item.currency ?? "USD",
        cycle: item.cycle ?? "monthly",
        category: item.category ?? "General",
        startDate: item.startDate ?? new Date().toISOString().split("T")[0],
        nextBilling: item.nextBilling ?? item.startDate ?? new Date().toISOString().split("T")[0],
        endDate: item.endDate,
        account: item.account,
        website: item.website,
        isActive: typeof item.isActive === "boolean" ? item.isActive : true,
        pendingCancel: item.pendingCancel,
        isTrial: item.isTrial,
        trialEndDate: item.trialEndDate,
        cancelUrl: item.cancelUrl,
        reminderDays: item.reminderDays,
        isShared: item.isShared,
        totalPlanPrice: item.totalPlanPrice,
        totalMembers: item.totalMembers,
        accountId: remappedAccountId,
        autoRecordPayment: item.autoRecordPayment,
        lastPaymentDate: item.lastPaymentDate,
        paymentMethodId: remappedPaymentMethodId,
        splitMembers: item.splitMembers,
        priceHistory: item.priceHistory,
        receiptStorageId: undefined,
        receiptFileName: item.receiptFileName,
      })

      if (oldId) {
        subscriptionIdMap.set(String(oldId), newSubId)
      }
      if (item.name) {
        subscriptionNameMap.set(item.name, newSubId)
      }
      subscriptionsCount++
    }

    // d. payments:
    //    - remap subscriptionId using subscriptionIdMap (skip or handle gracefully if subscription missing)
    //    - insert record, map oldId -> newId
    let paymentsCount = 0
    for (const item of args.data.payments ?? []) {
      const oldId = item._id ?? item.id
      const targetSubId =
        (item.subscriptionId ? subscriptionIdMap.get(String(item.subscriptionId)) : undefined) ??
        (item.name ? subscriptionNameMap.get(item.name) : undefined)

      if (!targetSubId) {
        continue
      }

      const newPaymentId = await ctx.db.insert("payments", {
        userId,
        subscriptionId: targetSubId,
        name: item.name ?? "Payment",
        icon: item.icon ?? "default",
        color: item.color,
        amount: typeof item.amount === "number" ? item.amount : 0,
        currency: item.currency ?? "USD",
        category: item.category ?? "General",
        date: item.date ?? new Date().toISOString().split("T")[0],
        transactionId: undefined,
      })

      if (oldId) {
        paymentIdMap.set(String(oldId), newPaymentId)
      }
      paymentsCount++
    }

    // e. transactions:
    //    - remap accountId using accountIdMap
    //    - remap toAccountId using accountIdMap
    //    - remap subscriptionId using subscriptionIdMap
    //    - remap paymentId using paymentIdMap
    //    - insert record
    let transactionsCount = 0
    for (const item of args.data.transactions ?? []) {
      const remappedAccountId = item.accountId ? accountIdMap.get(String(item.accountId)) : undefined
      const remappedToAccountId = item.toAccountId ? accountIdMap.get(String(item.toAccountId)) : undefined
      const remappedSubId = item.subscriptionId ? subscriptionIdMap.get(String(item.subscriptionId)) : undefined
      const remappedPaymentId = item.paymentId ? paymentIdMap.get(String(item.paymentId)) : undefined

      const newTxnId = await ctx.db.insert("transactions", {
        userId,
        type: item.type ?? "expense",
        amount: typeof item.amount === "number" ? item.amount : 0,
        currency: item.currency ?? "USD",
        category: item.category ?? "General",
        date: item.date ?? new Date().toISOString().split("T")[0],
        note: item.note,
        accountId: remappedAccountId,
        toAccountId: remappedToAccountId,
        subscriptionId: remappedSubId,
        paymentId: remappedPaymentId,
        icon: item.icon,
        color: item.color,
      })

      if (remappedPaymentId) {
        await ctx.db.patch(remappedPaymentId, { transactionId: newTxnId })
      }

      transactionsCount++
    }

    // f. budgets: insert records
    let budgetsCount = 0
    for (const item of args.data.budgets ?? []) {
      await ctx.db.insert("budgets", {
        userId,
        category: item.category ?? "General",
        amount: typeof item.amount === "number" ? item.amount : 0,
        currency: item.currency ?? "USD",
        month: item.month ?? new Date().toISOString().slice(0, 7),
      })
      budgetsCount++
    }

    // g. userSettings: insert or update userSettings
    let userSettingsCount = 0
    const rawSettings = args.data.userSettings
    const settingsItem = Array.isArray(rawSettings)
      ? (rawSettings.length > 0 ? rawSettings[0] : null)
      : rawSettings

    if (settingsItem && typeof settingsItem === "object") {
      const settingsPayload = {
        primaryCurrency: settingsItem.primaryCurrency || "IDR",
        reminderDays: typeof settingsItem.reminderDays === "number" ? settingsItem.reminderDays : 3,
        webPushEnabled: Boolean(settingsItem.webPushEnabled),
        monthlyBudgetCap: typeof settingsItem.monthlyBudgetCap === "number" ? settingsItem.monthlyBudgetCap : undefined,
        lastNotifiedDate: settingsItem.lastNotifiedDate,
        emailEnabled: settingsItem.emailEnabled,
        emailAddress: settingsItem.emailAddress,
        telegramEnabled: settingsItem.telegramEnabled,
        telegramBotToken: settingsItem.telegramBotToken,
        telegramChatId: settingsItem.telegramChatId,
      }

      const existingSettings = await ctx.db
        .query("userSettings")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first()

      if (existingSettings) {
        await ctx.db.patch(existingSettings._id, settingsPayload)
      } else {
        await ctx.db.insert("userSettings", {
          userId,
          ...settingsPayload,
        })
      }
      userSettingsCount = 1
    }

    return {
      success: true,
      counts: {
        subscriptions: subscriptionsCount,
        paymentMethods: paymentMethodsCount,
        payments: paymentsCount,
        userSettings: userSettingsCount,
        accounts: accountsCount,
        transactions: transactionsCount,
        budgets: budgetsCount,
      },
    }
  },
})

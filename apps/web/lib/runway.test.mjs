import assert from "node:assert/strict"
import {
  calculateLiquidCash,
  calculateTotalDebt,
  calculateNetWorth,
  normalizeSubscriptionToMonthly,
  calculateMonthlyRecurringExpense,
  calculateMonthlyTransactions,
  calculateRunwayProjection,
  calculateRunway,
  convertCurrency,
} from "./runway.ts"

const rates = { USD: 1, IDR: 16200 }

// 1. Pure liquid cash and net worth calculations with multiple currencies
{
  const accounts = [
    { type: "checking", balance: 5000, currency: "USD" },
    { type: "savings", balance: 16200000, currency: "IDR" }, // 1000 USD
    { type: "cash", balance: 500, currency: "USD", isArchived: true }, // ignored
    { type: "investment", balance: 20000, currency: "USD" },
    { type: "credit", balance: 3000, currency: "USD" }, // debt liability
    { type: "ewallet", balance: 500, currency: "USD" }, // asset in net worth, not liquid
  ]

  const liquidCash = calculateLiquidCash(accounts, "USD", rates)
  const totalDebt = calculateTotalDebt(accounts, "USD", rates)
  const netWorth = calculateNetWorth(accounts, "USD", rates)

  assert.equal(liquidCash, 6000, "Liquid cash must sum non-archived checking and savings")
  assert.equal(totalDebt, 3000, "Total debt must sum credit account balances")
  assert.equal(netWorth, 23500, "Net worth must equal assets minus debt")

  // IDR primary currency conversion test
  const liquidCashIDR = calculateLiquidCash(accounts, "IDR", rates)
  const totalDebtIDR = calculateTotalDebt(accounts, "IDR", rates)
  const netWorthIDR = calculateNetWorth(accounts, "IDR", rates)

  assert.equal(liquidCashIDR, 97200000, "Liquid cash in IDR must convert correctly")
  assert.equal(totalDebtIDR, 48600000, "Total debt in IDR must convert correctly")
  assert.equal(netWorthIDR, 380700000, "Net worth in IDR must convert correctly")
}

// 2. Active vs inactive subscriptions normalization
{
  const subs = [
    { price: 120, currency: "USD", cycle: "yearly", isActive: true }, // 10
    { price: 25, currency: "USD", cycle: "monthly", isActive: true }, // 25
    { price: 60, currency: "USD", cycle: "quarterly", isActive: true }, // 20
    { price: 60, currency: "USD", cycle: "semi-annual", isActive: true }, // 10
    { price: 10, currency: "USD", cycle: "weekly", isActive: true }, // (10 * 52) / 12 = 43.33
    { price: 1, currency: "USD", cycle: "daily", isActive: true }, // (1 * 365) / 12 = 30.42
    { price: 500, currency: "USD", cycle: "monthly", isActive: false }, // inactive -> 0
    { price: 1200, currency: "USD", cycle: "yearly", isActive: false }, // inactive -> 0
    { price: 324000, currency: "IDR", cycle: "monthly", isActive: true }, // 20 USD
    { price: 99, currency: "USD", cycle: "none", isActive: true }, // none -> 0
  ]

  const monthlyRecurring = calculateMonthlyRecurringExpense(subs, "USD", rates)
  // 10 + 25 + 20 + 10 + 43.333... + 30.4166... + 20 = 158.75
  assert.equal(monthlyRecurring, 158.75, "Active subscriptions must normalize correctly and skip inactive")

  assert.equal(normalizeSubscriptionToMonthly(120, "yearly"), 10)
  assert.equal(normalizeSubscriptionToMonthly(60, "quarterly"), 20)
  assert.equal(normalizeSubscriptionToMonthly(60, "semi-annual"), 10)
  assert.equal(normalizeSubscriptionToMonthly(0, "monthly"), 0)
}

// 3. Positive cash flow (net savings) sets isNetPositive: true, runwayMonths: null
{
  const accounts = [{ type: "checking", balance: 8000, currency: "USD" }]
  const subs = [{ price: 500, currency: "USD", cycle: "monthly", isActive: true }]
  const transactions = [
    { type: "income", amount: 4000, currency: "USD", date: "2026-10-01" },
    { type: "expense", amount: 1500, currency: "USD", date: "2026-10-05" },
    { type: "transfer", amount: 9999, currency: "USD", date: "2026-10-10" }, // ignored
  ]

  const metrics = calculateRunway({
    accounts,
    subscriptions: subs,
    transactions,
    primaryCurrency: "USD",
    rates,
    startDate: "2026-11-01",
  })

  assert.equal(metrics.isNetPositive, true, "Surplus cash flow must set isNetPositive to true")
  assert.equal(metrics.runwayMonths, null, "Surplus cash flow must set runwayMonths to null")
  assert.equal(metrics.netMonthlyBurn, -2000, "Net monthly burn must be negative on surplus")
  assert.equal(metrics.monthlyIncome, 4000)
  assert.equal(metrics.monthlyVariableExpense, 1500)
  assert.equal(metrics.monthlyRecurringExpense, 500)
  assert.equal(metrics.projection.length, 12)
  assert.equal(metrics.projection[0].liquidCash, 8000)
  assert.equal(metrics.projection[1].liquidCash, 10000)
  assert.equal(metrics.projection[11].liquidCash, 30000)
}

// 4. Cash burn scenarios computing correct runway months and declining 12-month curve
{
  const accounts = [{ type: "checking", balance: 15000, currency: "USD" }]
  const subs = [{ price: 500, currency: "USD", cycle: "monthly", isActive: true }]
  const transactions = [
    { type: "expense", amount: 2000, currency: "USD", date: "2026-10-01" },
    { type: "income", amount: 1000, currency: "USD", date: "2026-10-05" },
  ]

  const metrics = calculateRunway({
    accounts,
    subscriptions: subs,
    transactions,
    primaryCurrency: "USD",
    rates,
    startDate: "2026-11-01",
  })

  // burn = (500 + 2000) - 1000 = 1500
  // runway = 15000 / 1500 = 10.0
  assert.equal(metrics.isNetPositive, false)
  assert.equal(metrics.netMonthlyBurn, 1500)
  assert.equal(metrics.runwayMonths, 10)
  assert.equal(metrics.projection.length, 12)
  assert.equal(metrics.projection[0].liquidCash, 15000)
  assert.equal(metrics.projection[1].liquidCash, 13500)
  assert.equal(metrics.projection[2].liquidCash, 12000)
  assert.equal(metrics.projection[9].liquidCash, 1500)
  assert.equal(metrics.projection[10].liquidCash, 0)
  assert.equal(metrics.projection[11].liquidCash, 0, "Liquid cash must floor at zero")
  assert.equal(metrics.projection[11].netWorth, 15000 - 11 * 1500, "Net worth can decline past zero")
}

// 5. Zero accounts / zero data graceful fallback
{
  const metrics = calculateRunway({
    accounts: [],
    subscriptions: [],
    transactions: [],
  })

  assert.equal(metrics.liquidCash, 0)
  assert.equal(metrics.totalDebt, 0)
  assert.equal(metrics.netWorth, 0)
  assert.equal(metrics.monthlyIncome, 0)
  assert.equal(metrics.monthlyRecurringExpense, 0)
  assert.equal(metrics.monthlyVariableExpense, 0)
  assert.equal(metrics.netMonthlyBurn, 0)
  assert.equal(metrics.isNetPositive, true)
  assert.equal(metrics.runwayMonths, null)
  assert.equal(metrics.projection.length, 12)
  assert.equal(metrics.projection[0].liquidCash, 0)
  assert.equal(metrics.projection[0].netWorth, 0)

  // Null inputs test
  const nullMetrics = calculateRunway(null, null, null)
  assert.equal(nullMetrics.liquidCash, 0)
  assert.equal(nullMetrics.runwayMonths, null)
  assert.equal(nullMetrics.projection.length, 12)
}

// 6. Spend adjustment delta handling
{
  const accounts = [{ type: "checking", balance: 10000, currency: "USD" }]
  const subs = [{ price: 300, currency: "USD", cycle: "monthly", isActive: true }]
  const transactions = [{ type: "expense", amount: 700, currency: "USD", date: "2026-10-01" }]
  // Base burn = 300 + 700 = 1000

  // Case A: Increased spending (+500)
  const adjustedHigh = calculateRunway({
    accounts,
    subscriptions: subs,
    transactions,
    spendAdjustment: 500,
    startDate: "2026-11-01",
  })
  assert.equal(adjustedHigh.netMonthlyBurn, 1500)
  assert.equal(adjustedHigh.runwayMonths, 6.6) // 10000 / 1500 = 6.666 -> floored to 6.6
  assert.equal(adjustedHigh.projection[1].liquidCash, 8500)

  // Case B: Reduced spending (-400)
  const adjustedLow = calculateRunway({
    accounts,
    subscriptions: subs,
    transactions,
    spendAdjustment: -400,
    startDate: "2026-11-01",
  })
  assert.equal(adjustedLow.netMonthlyBurn, 600)
  assert.equal(adjustedLow.runwayMonths, 16.6) // 10000 / 600 = 16.666 -> floored to 16.6
  assert.equal(adjustedLow.projection[1].liquidCash, 9400)

  // Case C: Severe spending cut into net surplus (-1200)
  const adjustedSurplus = calculateRunway({
    accounts,
    subscriptions: subs,
    transactions,
    spendAdjustment: -1200,
    startDate: "2026-11-01",
  })
  assert.equal(adjustedSurplus.netMonthlyBurn, -200)
  assert.equal(adjustedSurplus.isNetPositive, true)
  assert.equal(adjustedSurplus.runwayMonths, null)
}

// 7. Multi-month transaction averaging and fallback to subscriptions
{
  // Transaction history over 3 distinct months
  const txns = [
    { type: "income", amount: 3000, currency: "USD", date: "2026-08-15" },
    { type: "expense", amount: 1000, currency: "USD", date: "2026-08-20" },
    { type: "income", amount: 3000, currency: "USD", date: "2026-09-10" },
    { type: "expense", amount: 1400, currency: "USD", date: "2026-09-15" },
    { type: "income", amount: 3000, currency: "USD", date: "2026-10-05" },
    { type: "expense", amount: 1200, currency: "USD", date: "2026-10-25" },
    { type: "transfer", amount: 5000, currency: "USD", date: "2026-10-26" }, // ignored
  ]

  const { monthlyIncome, monthlyVariableExpense } = calculateMonthlyTransactions(txns, "USD", rates, 3)
  assert.equal(monthlyIncome, 3000)
  assert.equal(monthlyVariableExpense, 1200) // (1000 + 1400 + 1200) / 3 = 1200

  // Fallback to subscriptions when no transactions
  const fallback = calculateRunway({
    accounts: [{ type: "checking", balance: 5000, currency: "USD" }],
    subscriptions: [{ price: 250, currency: "USD", cycle: "monthly", isActive: true }],
    transactions: [],
  })
  assert.equal(fallback.monthlyIncome, 0)
  assert.equal(fallback.monthlyVariableExpense, 0)
  assert.equal(fallback.monthlyRecurringExpense, 250)
  assert.equal(fallback.netMonthlyBurn, 250)
  assert.equal(fallback.runwayMonths, 20)
}

console.log("All runway calculation tests passed successfully.")

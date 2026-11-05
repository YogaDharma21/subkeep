import assert from "node:assert/strict"
import {
  calculateMonthDiff,
  calculateSinkingFunds,
  getCycleMonths,
  isSinkingFundSubscription,
} from "./sinking-funds"

// 1. Cycle normalization
assert.equal(getCycleMonths("yearly"), 12)
assert.equal(getCycleMonths("annual"), 12)
assert.equal(getCycleMonths("Annual"), 12)
assert.equal(getCycleMonths("YEARLY"), 12)
assert.equal(getCycleMonths("semi-annual"), 6)
assert.equal(getCycleMonths("semiannual"), 6)
assert.equal(getCycleMonths("quarterly"), 3)
assert.equal(getCycleMonths("monthly"), null)
assert.equal(getCycleMonths("weekly"), null)
assert.equal(getCycleMonths("daily"), null)
assert.equal(getCycleMonths("none"), null)
assert.equal(getCycleMonths(""), null)
assert.equal(getCycleMonths(undefined), null)

// 2. Active non-monthly filter
assert.equal(
  isSinkingFundSubscription({
    name: "Amazon Prime",
    price: 139,
    currency: "USD",
    cycle: "yearly",
    isActive: true,
  }),
  true
)
assert.equal(
  isSinkingFundSubscription({
    name: "Gym",
    price: 300,
    currency: "USD",
    cycle: "semi-annual",
    isActive: true,
  }),
  true
)
assert.equal(
  isSinkingFundSubscription({
    name: "Software quarterly",
    price: 60,
    currency: "USD",
    cycle: "quarterly",
    isActive: true,
  }),
  true
)
assert.equal(
  isSinkingFundSubscription({
    name: "Netflix",
    price: 15.99,
    currency: "USD",
    cycle: "monthly",
    isActive: true,
  }),
  false
)
assert.equal(
  isSinkingFundSubscription({
    name: "Inactive Annual",
    price: 100,
    currency: "USD",
    cycle: "annual",
    isActive: false,
  }),
  false
)
assert.equal(
  isSinkingFundSubscription({
    name: "Undefined Active",
    price: 100,
    currency: "USD",
    cycle: "yearly",
  }),
  false
)

// 3. calculateMonthDiff
assert.equal(calculateMonthDiff("2026-11", "2026-11-20"), 0)
assert.equal(calculateMonthDiff("2026-11", "2026-10-15"), -1)
assert.equal(calculateMonthDiff("2026-11", "2026-12-01"), 1)
assert.equal(calculateMonthDiff("2026-11", "2027-02-15"), 3)
assert.equal(calculateMonthDiff("2026-11", "2027-11-15"), 12)

// 4. Calculations: current/past renewal (diffMonths <= 0)
const currentMonthSubs = [
  {
    id: "sub-1",
    name: "Prime",
    price: 120,
    currency: "USD",
    cycle: "yearly",
    isActive: true,
    nextBilling: "2026-11-20",
  },
]
const currentRes = calculateSinkingFunds(currentMonthSubs, "2026-11", "USD")
assert.equal(currentRes.items.length, 1)
assert.equal(currentRes.items[0].cycleMonths, 12)
assert.equal(currentRes.items[0].cost, 120)
assert.equal(currentRes.items[0].monthlyReserve, 10)
assert.equal(currentRes.items[0].diffMonths, 0)
assert.equal(currentRes.items[0].accruedMonths, 12)
assert.equal(currentRes.items[0].pct, 100)
assert.equal(currentRes.items[0].accruedAmount, 120)
assert.equal(currentRes.totalMonthlyReserve, 10)
assert.equal(currentRes.totalAccruedTarget, 120)
assert.equal(currentRes.totalCommitment, 120)
assert.equal(currentRes.count, 1)

// 5. Calculations: diffMonths >= cycleMonths (0% accrued)
const fullCycleSubs = [
  {
    id: "sub-2",
    name: "Domain",
    price: 240,
    currency: "USD",
    cycle: "yearly",
    isActive: true,
    nextBilling: "2027-11-15",
  },
]
const fullRes = calculateSinkingFunds(fullCycleSubs, "2026-11", "USD")
assert.equal(fullRes.items[0].diffMonths, 12)
assert.equal(fullRes.items[0].accruedMonths, 0)
assert.equal(fullRes.items[0].pct, 0)
assert.equal(fullRes.items[0].accruedAmount, 0)

// 6. Calculations: partial accrual in-between
const partialSubs = [
  {
    id: "sub-yearly",
    name: "Annual License",
    price: 120,
    currency: "USD",
    cycle: "yearly",
    isActive: true,
    nextBilling: "2027-02-15", // 3 months away
  },
  {
    id: "sub-quarterly",
    name: "Quarterly Tool",
    price: 30,
    currency: "USD",
    cycle: "quarterly",
    isActive: true,
    nextBilling: "2026-12-10", // 1 month away
  },
  {
    id: "sub-semi",
    name: "Semi Gym",
    price: 60,
    currency: "USD",
    cycle: "semi-annual",
    isActive: true,
    nextBilling: "2027-01-05", // 2 months away
  },
]
const partialRes = calculateSinkingFunds(partialSubs, "2026-11", "USD")
assert.equal(partialRes.count, 3)

// sub-yearly: 12 - 3 = 9 months accrued
const itemYearly = partialRes.items[0]
assert.equal(itemYearly.cycleMonths, 12)
assert.equal(itemYearly.cost, 120)
assert.equal(itemYearly.monthlyReserve, 10)
assert.equal(itemYearly.diffMonths, 3)
assert.equal(itemYearly.accruedMonths, 9)
assert.equal(itemYearly.accruedAmount, 90)
assert.equal(itemYearly.pct, 75) // Math.round((9 / 12) * 100)

// sub-quarterly: 3 - 1 = 2 months accrued
const itemQuarterly = partialRes.items[1]
assert.equal(itemQuarterly.cycleMonths, 3)
assert.equal(itemQuarterly.cost, 30)
assert.equal(itemQuarterly.monthlyReserve, 10)
assert.equal(itemQuarterly.diffMonths, 1)
assert.equal(itemQuarterly.accruedMonths, 2)
assert.equal(itemQuarterly.accruedAmount, 20)
assert.equal(itemQuarterly.pct, 67) // Math.round((2 / 3) * 100)

// sub-semi: 6 - 2 = 4 months accrued
const itemSemi = partialRes.items[2]
assert.equal(itemSemi.cycleMonths, 6)
assert.equal(itemSemi.cost, 60)
assert.equal(itemSemi.monthlyReserve, 10)
assert.equal(itemSemi.diffMonths, 2)
assert.equal(itemSemi.accruedMonths, 4)
assert.equal(itemSemi.accruedAmount, 40)
assert.equal(itemSemi.pct, 67) // Math.round((4 / 6) * 100)

// Aggregates
assert.equal(partialRes.totalMonthlyReserve, 30)
assert.equal(partialRes.totalAccruedTarget, 150)
assert.equal(partialRes.totalCommitment, 210)
assert.equal(partialRes.count, 3)

// 7. Currency conversion
const customRates = { USD: 1, IDR: 16000 }
const idrSubs = [
  {
    name: "Hosting IDR",
    price: 160000,
    currency: "IDR",
    cycle: "yearly",
    isActive: true,
    nextBilling: "2026-11-01",
  },
]
const convertedRes = calculateSinkingFunds(
  idrSubs,
  { selectedMonth: "2026-11", targetCurrency: "USD", rates: customRates }
)
assert.equal(convertedRes.items[0].cost, 10) // 160000 / 16000
assert.equal(convertedRes.items[0].monthlyReserve, 10 / 12)
assert.equal(convertedRes.items[0].accruedAmount, 10)
assert.equal(convertedRes.items[0].pct, 100)
assert.equal(convertedRes.totalCommitment, 10)

// 8. Empty input
const emptyRes = calculateSinkingFunds([])
assert.equal(emptyRes.count, 0)
assert.equal(emptyRes.totalMonthlyReserve, 0)
assert.equal(emptyRes.totalAccruedTarget, 0)
assert.equal(emptyRes.totalCommitment, 0)
assert.deepEqual(emptyRes.items, [])

console.log("All sinking funds test assertions passed.")

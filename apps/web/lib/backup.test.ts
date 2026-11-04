import assert from "node:assert/strict"
// @ts-expect-error Node strip-types requires file extension
import { parseAndNormalizeBackup, downloadBackupJson } from "./backup.ts"

// Test 1: v1 format (array of subscriptions)
{
  const v1Data = [
    { name: "Netflix", price: 15, currency: "USD", cycle: "monthly" },
    { name: "Spotify", price: 10, currency: "USD", cycle: "monthly" },
  ]
  const parsed = parseAndNormalizeBackup(v1Data)

  assert.strictEqual(parsed.version, 1)
  assert.strictEqual(parsed.exportedAt, undefined)
  assert.strictEqual(parsed.data.subscriptions.length, 2)
  assert.strictEqual(parsed.data.paymentMethods.length, 0)
  assert.strictEqual(parsed.data.payments.length, 0)
  assert.strictEqual(parsed.data.userSettings, null)
  assert.strictEqual(parsed.data.accounts.length, 0)
  assert.strictEqual(parsed.data.transactions.length, 0)
  assert.strictEqual(parsed.data.budgets.length, 0)
  assert.strictEqual(parsed.summary.totalRecords, 2)
  assert.strictEqual(parsed.summary.counts.subscriptions, 2)
  assert.strictEqual(parsed.summary.counts.userSettings, 0)

  // v1 as JSON string
  const parsedString = parseAndNormalizeBackup(JSON.stringify(v1Data))
  assert.strictEqual(parsedString.version, 1)
  assert.strictEqual(parsedString.summary.totalRecords, 2)
}

// Test 2: v2 format (object with subscriptions and payments)
{
  const v2Data = {
    exportedAt: "2026-01-01T00:00:00.000Z",
    subscriptions: [{ name: "GitHub", price: 4, currency: "USD" }],
    payments: [{ name: "GitHub", amount: 4, date: "2026-01-01" }],
  }
  const parsed = parseAndNormalizeBackup(v2Data)

  assert.strictEqual(parsed.version, 2)
  assert.strictEqual(parsed.exportedAt, "2026-01-01T00:00:00.000Z")
  assert.strictEqual(parsed.data.subscriptions.length, 1)
  assert.strictEqual(parsed.data.payments.length, 1)
  assert.strictEqual(parsed.data.paymentMethods.length, 0)
  assert.strictEqual(parsed.data.userSettings, null)
  assert.strictEqual(parsed.summary.totalRecords, 2)
  assert.strictEqual(parsed.summary.counts.subscriptions, 1)
  assert.strictEqual(parsed.summary.counts.payments, 1)
}

// Test 3: v3 format (standard full backup)
{
  const v3Data = {
    version: 3,
    exportedAt: "2026-11-04T12:00:00.000Z",
    data: {
      subscriptions: [{ name: "AWS", price: 50 }],
      paymentMethods: [{ name: "Visa", last4: "4242" }],
      payments: [{ name: "AWS", amount: 50 }],
      userSettings: [{ primaryCurrency: "IDR", reminderDays: 5 }],
      accounts: [{ name: "Main Bank", balance: 1000 }],
      transactions: [{ amount: 50, type: "expense" }],
      budgets: [{ category: "Cloud", amount: 100 }],
    },
  }
  const parsed = parseAndNormalizeBackup(v3Data)

  assert.strictEqual(parsed.version, 3)
  assert.strictEqual(parsed.exportedAt, "2026-11-04T12:00:00.000Z")
  assert.strictEqual(parsed.data.subscriptions.length, 1)
  assert.strictEqual(parsed.data.paymentMethods.length, 1)
  assert.strictEqual(parsed.data.payments.length, 1)
  assert.deepStrictEqual(parsed.data.userSettings, { primaryCurrency: "IDR", reminderDays: 5 })
  assert.strictEqual(parsed.data.accounts.length, 1)
  assert.strictEqual(parsed.data.transactions.length, 1)
  assert.strictEqual(parsed.data.budgets.length, 1)
  assert.strictEqual(parsed.summary.counts.subscriptions, 1)
  assert.strictEqual(parsed.summary.counts.userSettings, 1)
  assert.strictEqual(parsed.summary.totalRecords, 7)
}

// Test 4: v3 format with single userSettings object (not array)
{
  const v3SingleSettings = {
    version: 3,
    data: {
      subscriptions: [],
      paymentMethods: [],
      payments: [],
      userSettings: { primaryCurrency: "EUR" },
      accounts: [],
      transactions: [],
      budgets: [],
    },
  }
  const parsed = parseAndNormalizeBackup(v3SingleSettings)
  assert.strictEqual(parsed.version, 3)
  assert.deepStrictEqual(parsed.data.userSettings, { primaryCurrency: "EUR" })
  assert.strictEqual(parsed.summary.counts.userSettings, 1)
  assert.strictEqual(parsed.summary.totalRecords, 1)
}

// Test 5: Empty valid backups
{
  // Empty v1
  const emptyV1 = parseAndNormalizeBackup([])
  assert.strictEqual(emptyV1.version, 1)
  assert.strictEqual(emptyV1.summary.totalRecords, 0)

  // Empty v2
  const emptyV2 = parseAndNormalizeBackup({ subscriptions: [] })
  assert.strictEqual(emptyV2.version, 2)
  assert.strictEqual(emptyV2.summary.totalRecords, 0)

  // Empty v3
  const emptyV3 = parseAndNormalizeBackup({ version: 3, data: {} })
  assert.strictEqual(emptyV3.version, 3)
  assert.strictEqual(emptyV3.summary.totalRecords, 0)
}

// Test 6: Invalid formats throw expected error
{
  const expectedMsg = "Unrecognized backup format. Expected SubKeep v1, v2, or v3 JSON."

  assert.throws(() => parseAndNormalizeBackup(null), { message: expectedMsg })
  assert.throws(() => parseAndNormalizeBackup(undefined), { message: expectedMsg })
  assert.throws(() => parseAndNormalizeBackup(123), { message: expectedMsg })
  assert.throws(() => parseAndNormalizeBackup({}), { message: expectedMsg })
  assert.throws(() => parseAndNormalizeBackup({ random: "data" }), { message: expectedMsg })
  assert.throws(() => parseAndNormalizeBackup("{ invalid json"), { message: expectedMsg })
  assert.throws(() => parseAndNormalizeBackup([1, 2, 3]), { message: expectedMsg })
  assert.throws(() => parseAndNormalizeBackup({ subscriptions: "not an array" }), {
    message: expectedMsg,
  })
  assert.throws(() => parseAndNormalizeBackup({ version: 3, data: "string" }), {
    message: expectedMsg,
  })
  assert.throws(() => parseAndNormalizeBackup({ version: 3, data: { unrelated: "data" } }), {
    message: expectedMsg,
  })
}

// Test 7: downloadBackupJson in SSR environment (no-op)
{
  assert.doesNotThrow(() => downloadBackupJson({ version: 3 }))
}

console.log("All backup tests passed successfully.")

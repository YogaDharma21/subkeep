import assert from "node:assert/strict"

function calculatePriceHike(sub) {
  const priceHistory = sub.priceHistory || []
  const originalPriceEntry = priceHistory[0]
  const sameCurrency =
    !sub.currency ||
    !originalPriceEntry?.currency ||
    sub.currency === originalPriceEntry.currency

  const hasPriceHike = Boolean(
    originalPriceEntry &&
      priceHistory.length > 1 &&
      originalPriceEntry.price > 0 &&
      sameCurrency &&
      sub.price > originalPriceEntry.price
  )
  const priceHikeDiff = hasPriceHike
    ? Math.round(((sub.price - originalPriceEntry.price) / originalPriceEntry.price) * 100)
    : 0

  return { hasPriceHike, priceHikeDiff }
}

// Empty price history
{
  const subWithEmpty = { price: 100, priceHistory: [] }
  const resEmpty = calculatePriceHike(subWithEmpty)
  assert.equal(resEmpty.hasPriceHike, false)
  assert.equal(resEmpty.priceHikeDiff, 0)

  const subWithoutHistory = { price: 100 }
  const resNone = calculatePriceHike(subWithoutHistory)
  assert.equal(resNone.hasPriceHike, false)
  assert.equal(resNone.priceHikeDiff, 0)
}

// Single price history entry
{
  const subSingle = {
    price: 150,
    priceHistory: [{ price: 100, currency: "USD", changedAt: "2026-01-01" }],
  }
  const resSingle = calculatePriceHike(subSingle)
  assert.equal(resSingle.hasPriceHike, false)
  assert.equal(resSingle.priceHikeDiff, 0)
}

// Price decreased or unchanged
{
  const subDecreased = {
    price: 80,
    priceHistory: [
      { price: 100, currency: "USD", changedAt: "2026-01-01" },
      { price: 80, currency: "USD", changedAt: "2026-02-01" },
    ],
  }
  const resDecreased = calculatePriceHike(subDecreased)
  assert.equal(resDecreased.hasPriceHike, false)
  assert.equal(resDecreased.priceHikeDiff, 0)

  const subUnchanged = {
    price: 100,
    priceHistory: [
      { price: 100, currency: "USD", changedAt: "2026-01-01" },
      { price: 100, currency: "USD", changedAt: "2026-02-01" },
    ],
  }
  const resUnchanged = calculatePriceHike(subUnchanged)
  assert.equal(resUnchanged.hasPriceHike, false)
  assert.equal(resUnchanged.priceHikeDiff, 0)
}

// Price increased (+12% etc.)
{
  const subIncreased = {
    price: 112,
    priceHistory: [
      { price: 100, currency: "USD", changedAt: "2026-01-01" },
      { price: 112, currency: "USD", changedAt: "2026-03-01" },
    ],
  }
  const resIncreased = calculatePriceHike(subIncreased)
  assert.equal(resIncreased.hasPriceHike, true)
  assert.equal(resIncreased.priceHikeDiff, 12)

  const subIncreasedMultiple = {
    price: 150,
    priceHistory: [
      { price: 100, currency: "USD", changedAt: "2026-01-01" },
      { price: 120, currency: "USD", changedAt: "2026-02-01" },
      { price: 150, currency: "USD", changedAt: "2026-03-01" },
    ],
  }
  const resIncreasedMultiple = calculatePriceHike(subIncreasedMultiple)
  assert.equal(resIncreasedMultiple.hasPriceHike, true)
  assert.equal(resIncreasedMultiple.priceHikeDiff, 50)
}

// Zero original price (safe guard against division by zero)
{
  const subZeroOrig = {
    price: 15,
    currency: "USD",
    priceHistory: [
      { price: 0, currency: "USD", changedAt: "2026-01-01" },
      { price: 15, currency: "USD", changedAt: "2026-02-01" },
    ],
  }
  const resZero = calculatePriceHike(subZeroOrig)
  assert.equal(resZero.hasPriceHike, false)
  assert.equal(resZero.priceHikeDiff, 0)
}

// Currency mismatch (prevents cross-currency false hike calculation)
{
  const subCurrencyMismatch = {
    price: 150000,
    currency: "IDR",
    priceHistory: [
      { price: 10, currency: "USD", changedAt: "2026-01-01" },
      { price: 150000, currency: "IDR", changedAt: "2026-02-01" },
    ],
  }
  const resMismatch = calculatePriceHike(subCurrencyMismatch)
  assert.equal(resMismatch.hasPriceHike, false)
  assert.equal(resMismatch.priceHikeDiff, 0)
}

console.log("All price hike tests passed.")

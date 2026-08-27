import { getSymbol } from "./constants"

// Fallback rates relative to USD (1 USD = X target currency)
export const fallbackRates: Record<string, number> = {
  USD: 1,
  IDR: 16200.0,
}

let cachedRates: Record<string, number> = { ...fallbackRates }
let lastFetchTime = 0

export async function fetchExchangeRates(): Promise<Record<string, number>> {
  if (typeof window === "undefined") return fallbackRates

  // Use localStorage cache if updated within the last 12 hours
  const cached = localStorage.getItem("subkeep_exchange_rates")
  if (cached) {
    try {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000 && parsed.rates) {
        cachedRates = { ...fallbackRates, ...parsed.rates }
        lastFetchTime = parsed.timestamp
        return cachedRates
      }
    } catch {
      // ignore parse error
    }
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD")
    if (res.ok) {
      const data = await res.json()
      if (data && data.rates) {
        cachedRates = { ...fallbackRates, ...data.rates }
        lastFetchTime = Date.now()
        localStorage.setItem(
          "subkeep_exchange_rates",
          JSON.stringify({ rates: cachedRates, timestamp: lastFetchTime })
        )
        return cachedRates
      }
    }
  } catch {
    // try backup endpoint
  }

  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD")
    if (res.ok) {
      const data = await res.json()
      if (data && data.rates) {
        cachedRates = { ...fallbackRates, ...data.rates }
        lastFetchTime = Date.now()
        localStorage.setItem(
          "subkeep_exchange_rates",
          JSON.stringify({ rates: cachedRates, timestamp: lastFetchTime })
        )
        return cachedRates
      }
    }
  } catch (e) {
    console.warn("Failed to fetch live exchange rates, using cached/fallback:", e)
  }

  return cachedRates
}

export function getExchangeRates(): Record<string, number> {
  return cachedRates
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = cachedRates
): number {
  if (!amount || isNaN(amount)) return 0
  const from = (fromCurrency || "USD").toUpperCase()
  const to = (toCurrency || "IDR").toUpperCase()

  if (from === to) return amount

  const fromRate = rates[from] || fallbackRates[from] || 1
  const toRate = rates[to] || fallbackRates[to] || 1

  // Convert to USD first, then to target currency
  const amountInUSD = amount / fromRate
  return amountInUSD * toRate
}

export function formatCurrencyAmount(
  amount: number,
  currency: string
): string {
  const symbol = getSymbol(currency)
  const curr = (currency || "USD").toUpperCase()

  if (curr === "IDR" || curr === "VND" || curr === "KRW" || curr === "JPY") {
    // Whole number style formatting for currencies like IDR / JPY
    return `${symbol}${Math.round(amount).toLocaleString("id-ID")}`
  }

  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function convertAndFormat(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = cachedRates
): string {
  const converted = convertCurrency(amount, fromCurrency, toCurrency, rates)
  return formatCurrencyAmount(converted, toCurrency)
}

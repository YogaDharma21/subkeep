import AsyncStorage from "@react-native-async-storage/async-storage"
import { getSymbol } from "@/constants/currencies"

// Fallback rates relative to USD (1 USD = X target currency)
export const fallbackRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  JPY: 155.0,
  AUD: 1.52,
  CAD: 1.36,
  INR: 83.5,
  KRW: 1380.0,
  SGD: 1.35,
  BRL: 5.45,
  MXN: 18.2,
  THB: 36.5,
  IDR: 16200.0,
  MYR: 4.7,
  PHP: 58.5,
  VND: 25400.0,
  NZD: 1.66,
  SEK: 10.6,
  NOK: 10.8,
  DKK: 6.9,
  PLN: 3.95,
  CZK: 23.2,
  HUF: 360.0,
  TRY: 32.8,
  ZAR: 18.4,
  AED: 3.67,
  SAR: 3.75,
  TWD: 32.5,
}

let cachedRates: Record<string, number> = { ...fallbackRates }
let lastFetchTime = 0

export async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    const cached = await AsyncStorage.getItem("subkeep_exchange_rates")
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000 && parsed.rates) {
        cachedRates = { ...fallbackRates, ...parsed.rates }
        lastFetchTime = parsed.timestamp
        return cachedRates
      }
    }
  } catch {
    // Ignore AsyncStorage read errors
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD")
    if (res.ok) {
      const data = await res.json()
      if (data && data.rates) {
        cachedRates = { ...fallbackRates, ...data.rates }
        lastFetchTime = Date.now()
        await AsyncStorage.setItem(
          "subkeep_exchange_rates",
          JSON.stringify({ rates: cachedRates, timestamp: lastFetchTime })
        )
        return cachedRates
      }
    }
  } catch {
    // Try secondary endpoint
  }

  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD")
    if (res.ok) {
      const data = await res.json()
      if (data && data.rates) {
        cachedRates = { ...fallbackRates, ...data.rates }
        lastFetchTime = Date.now()
        await AsyncStorage.setItem(
          "subkeep_exchange_rates",
          JSON.stringify({ rates: cachedRates, timestamp: lastFetchTime })
        )
        return cachedRates
      }
    }
  } catch {
    // Fallback to static rates
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

export function formatCycleLabel(cycle?: string): string {
  const c = (cycle || "").toLowerCase()
  if (c === "monthly" || c === "month") return "per month"
  if (c === "yearly" || c === "year") return "per year"
  if (c === "weekly" || c === "week") return "per week"
  if (c === "daily" || c === "day") return "per day"
  if (c === "quarterly") return "per quarter"
  if (c === "semi-annual") return "per 6 mo"
  if (c === "none" || !c) return "one-time"
  return `per ${c}`
}


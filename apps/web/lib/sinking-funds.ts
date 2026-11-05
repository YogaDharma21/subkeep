import { convertCurrency } from "./currency"

export type SinkingFundCycle = "yearly" | "annual" | "semi-annual" | "quarterly"

export interface SinkingFundSubscriptionInput {
  name?: string
  price: number
  currency: string
  cycle: string
  isActive?: boolean
  nextBilling?: string
  cycleMonths?: number
  [key: string]: unknown
}

export interface SinkingFundItem<
  T extends SinkingFundSubscriptionInput = SinkingFundSubscriptionInput,
> {
  subscription: T
  id?: string
  name?: string
  icon?: string
  category?: string
  cycle?: string
  nextBilling?: string
  cycleMonths: number
  cost: number
  totalCost?: number
  monthlyReserve: number
  diffMonths: number
  accruedMonths: number
  accruedAmount: number
  pct: number
  currency: string
  isOverdue?: boolean
}

export interface SinkingFundsTotals {
  totalMonthlyReserve: number
  totalAccruedTarget: number
  totalCommitment?: number
  count: number
  currency?: string
}

export interface SinkingFundsSummary<
  T extends SinkingFundSubscriptionInput = SinkingFundSubscriptionInput,
> extends SinkingFundsTotals {
  items: SinkingFundItem<T>[]
  totals: SinkingFundsTotals
  totalMonthlyReserve: number
  totalAccruedTarget: number
  totalCommitment: number
  count: number
  currency: string
}

export interface CalculateSinkingFundsOptions {
  selectedMonth?: string
  targetCurrency?: string
  rates?: Record<string, number>
}

export function getCycleMonths(
  cycle: string | null | undefined,
  fallbackMonths?: number
): number | null {
  if (
    typeof fallbackMonths === "number" &&
    !isNaN(fallbackMonths) &&
    fallbackMonths > 1
  ) {
    return Math.round(fallbackMonths)
  }
  if (!cycle) return null
  const normalized = cycle.toLowerCase().trim()
  if (
    normalized === "yearly" ||
    normalized === "annual" ||
    normalized === "annually" ||
    normalized === "1 year" ||
    normalized === "12 months" ||
    normalized === "12 mo"
  ) {
    return 12
  }
  if (
    normalized === "semi-annual" ||
    normalized === "semiannual" ||
    normalized === "semi_annual" ||
    normalized === "biannual" ||
    normalized === "bi-annual" ||
    normalized === "half-yearly" ||
    normalized === "6 months" ||
    normalized === "6 mo"
  ) {
    return 6
  }
  if (
    normalized === "quarterly" ||
    normalized === "quarter" ||
    normalized === "3 months" ||
    normalized === "3 mo"
  ) {
    return 3
  }

  const monthMatch = normalized.match(/^(\d+)\s*(months?|mos?)$/)
  if (monthMatch) {
    const m = parseInt(monthMatch[1], 10)
    if (!isNaN(m) && m > 1) return m
  }

  const yearMatch = normalized.match(/^(\d+)\s*(years?|yrs?)$/)
  if (yearMatch) {
    const y = parseInt(yearMatch[1], 10)
    if (!isNaN(y) && y >= 1) return y * 12
  }

  return null
}

export function isSinkingFundSubscription(
  sub: SinkingFundSubscriptionInput | null | undefined
): boolean {
  if (!sub || typeof sub !== "object" || sub.isActive !== true) return false
  const fallback =
    typeof sub.cycleMonths === "number" ? sub.cycleMonths : undefined
  return getCycleMonths(sub.cycle, fallback) !== null
}

export function calculateMonthDiff(
  selectedMonth: string,
  nextBilling: string
): number {
  if (!selectedMonth || !nextBilling) return 0
  const sTrimmed = selectedMonth.trim()
  const rTrimmed = nextBilling.trim()
  if (!sTrimmed || !rTrimmed) return 0

  let sYear = NaN
  let sMonth = NaN
  const sParts = sTrimmed.slice(0, 7).replace(/\//g, "-").split("-").map(Number)
  if (sParts.length >= 2) {
    sYear = sParts[0]
    sMonth = sParts[1]
  }

  let rYear = NaN
  let rMonth = NaN
  const rParts = rTrimmed.slice(0, 7).replace(/\//g, "-").split("-").map(Number)
  if (rParts.length >= 2) {
    rYear = rParts[0]
    rMonth = rParts[1]
  }

  if (isNaN(sYear) || isNaN(sMonth) || sMonth < 1 || sMonth > 12) {
    const sDate = new Date(sTrimmed)
    if (!isNaN(sDate.getTime())) {
      sYear = sDate.getFullYear()
      sMonth = sDate.getMonth() + 1
    }
  }

  if (isNaN(rYear) || isNaN(rMonth) || rMonth < 1 || rMonth > 12) {
    const rDate = new Date(rTrimmed)
    if (!isNaN(rDate.getTime())) {
      rYear = rDate.getFullYear()
      rMonth = rDate.getMonth() + 1
    }
  }

  if (
    isNaN(sYear) ||
    isNaN(sMonth) ||
    isNaN(rYear) ||
    isNaN(rMonth) ||
    sMonth < 1 ||
    sMonth > 12 ||
    rMonth < 1 ||
    rMonth > 12
  ) {
    return 0
  }

  return (rYear - sYear) * 12 + (rMonth - sMonth)
}

function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export function calculateSinkingFunds<
  T extends SinkingFundSubscriptionInput = SinkingFundSubscriptionInput,
>(
  subscriptions: T[] | null | undefined,
  selectedMonthOrOptions?: string | CalculateSinkingFundsOptions,
  targetCurrencyParam?: string,
  ratesParam?: Record<string, number>
): SinkingFundsSummary<T> {
  const isOptionsObject =
    typeof selectedMonthOrOptions === "object" &&
    selectedMonthOrOptions !== null

  const selectedMonth =
    (isOptionsObject
      ? selectedMonthOrOptions.selectedMonth
      : (selectedMonthOrOptions as string | undefined)) || getCurrentMonth()

  const targetCurrency =
    (isOptionsObject
      ? selectedMonthOrOptions.targetCurrency
      : targetCurrencyParam) || "USD"

  const rates = isOptionsObject ? selectedMonthOrOptions.rates : ratesParam

  if (!subscriptions || !Array.isArray(subscriptions)) {
    const emptyTotals: SinkingFundsTotals = {
      totalMonthlyReserve: 0,
      totalAccruedTarget: 0,
      totalCommitment: 0,
      count: 0,
      currency: targetCurrency,
    }
    return {
      items: [],
      totals: emptyTotals,
      totalMonthlyReserve: 0,
      totalAccruedTarget: 0,
      totalCommitment: 0,
      count: 0,
      currency: targetCurrency,
    }
  }

  const items: SinkingFundItem<T>[] = []

  for (const sub of subscriptions) {
    if (!sub || typeof sub !== "object") continue
    if (!isSinkingFundSubscription(sub)) continue

    const fallbackMonths =
      typeof sub.cycleMonths === "number" ? sub.cycleMonths : undefined
    const cycleMonths = getCycleMonths(sub.cycle, fallbackMonths)
    if (!cycleMonths || cycleMonths <= 0) continue

    const rawPrice =
      typeof sub.price === "number" && !isNaN(sub.price)
        ? Math.max(0, sub.price)
        : 0
    const cost = convertCurrency(
      rawPrice,
      sub.currency || targetCurrency,
      targetCurrency,
      rates
    )
    const monthlyReserve = cost / cycleMonths
    const diffMonths = calculateMonthDiff(selectedMonth, sub.nextBilling || "")

    let accruedMonths = 0
    let accruedAmount = 0
    let pct = 0

    if (diffMonths <= 0) {
      accruedMonths = cycleMonths
      pct = 100
      accruedAmount = cost
    } else if (diffMonths >= cycleMonths) {
      accruedMonths = 0
      pct = 0
      accruedAmount = 0
    } else {
      accruedMonths = cycleMonths - diffMonths
      accruedAmount = accruedMonths * monthlyReserve
      pct = Math.round((accruedMonths / cycleMonths) * 100)
    }

    const isOverdue =
      diffMonths < 0 && Boolean(sub.nextBilling && sub.nextBilling.trim())

    items.push({
      subscription: sub,
      id:
        ((sub as Record<string, unknown>)._id as string | undefined) ??
        ((sub as Record<string, unknown>).id as string | undefined),
      name: sub.name,
      icon: (sub as Record<string, unknown>).icon as string | undefined,
      category: (sub as Record<string, unknown>).category as string | undefined,
      cycle: sub.cycle,
      nextBilling: sub.nextBilling,
      cycleMonths,
      cost,
      totalCost: cost,
      monthlyReserve,
      diffMonths,
      accruedMonths,
      accruedAmount,
      pct,
      currency: targetCurrency,
      isOverdue,
    })
  }

  const totalMonthlyReserve = items.reduce(
    (sum, item) => sum + item.monthlyReserve,
    0
  )
  const totalAccruedTarget = items.reduce(
    (sum, item) => sum + item.accruedAmount,
    0
  )
  const totalCommitment = items.reduce((sum, item) => sum + item.cost, 0)

  const totals: SinkingFundsTotals = {
    totalMonthlyReserve,
    totalAccruedTarget,
    totalCommitment,
    count: items.length,
    currency: targetCurrency,
  }

  return {
    items,
    totals,
    totalMonthlyReserve,
    totalAccruedTarget,
    totalCommitment,
    count: items.length,
    currency: targetCurrency,
  }
}

import { convertCurrency } from "./currency"

export type SinkingFundCycle = "yearly" | "annual" | "semi-annual" | "quarterly"

export interface SinkingFundSubscriptionInput {
  name?: string
  price: number
  currency: string
  cycle: string
  isActive?: boolean
  nextBilling?: string
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

export function getCycleMonths(cycle: string | null | undefined): number | null {
  if (!cycle) return null
  const normalized = cycle.toLowerCase().trim()
  if (normalized === "yearly" || normalized === "annual") return 12
  if (
    normalized === "semi-annual" ||
    normalized === "semiannual" ||
    normalized === "semi_annual" ||
    normalized === "6 months"
  ) {
    return 6
  }
  if (normalized === "quarterly" || normalized === "3 months") return 3
  return null
}

export function isSinkingFundSubscription(
  sub: SinkingFundSubscriptionInput | null | undefined
): boolean {
  if (!sub || sub.isActive !== true) return false
  return getCycleMonths(sub.cycle) !== null
}

export function calculateMonthDiff(selectedMonth: string, nextBilling: string): number {
  if (!selectedMonth || !nextBilling) return 0
  const sParts = selectedMonth.split("-").map(Number)
  const rParts = nextBilling.slice(0, 7).split("-").map(Number)

  const sYear = sParts[0]
  const sMonth = sParts[1]
  const rYear = rParts[0]
  const rMonth = rParts[1]

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
    typeof selectedMonthOrOptions === "object" && selectedMonthOrOptions !== null

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
    return {
      items: [],
      totalMonthlyReserve: 0,
      totalAccruedTarget: 0,
      totalCommitment: 0,
      count: 0,
      currency: targetCurrency,
    }
  }

  const items: SinkingFundItem<T>[] = []

  for (const sub of subscriptions) {
    if (!isSinkingFundSubscription(sub)) continue

    const cycleMonths = getCycleMonths(sub.cycle)
    if (!cycleMonths) continue

    const cost = convertCurrency(sub.price, sub.currency, targetCurrency, rates)
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
    })
  }

  const totalMonthlyReserve = items.reduce((sum, item) => sum + item.monthlyReserve, 0)
  const totalAccruedTarget = items.reduce((sum, item) => sum + item.accruedAmount, 0)
  const totalCommitment = items.reduce((sum, item) => sum + item.cost, 0)

  return {
    items,
    totalMonthlyReserve,
    totalAccruedTarget,
    totalCommitment,
    count: items.length,
    currency: targetCurrency,
  }
}

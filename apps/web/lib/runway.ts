// Cash runway simulation and 12-month net worth projection engine

export interface AccountInput {
  type: string
  balance: number
  currency: string
  isArchived?: boolean
}

export interface SubscriptionInput {
  price: number
  currency: string
  cycle: string
  isActive?: boolean
}

export interface TransactionInput {
  type: string
  amount: number
  currency: string
  date: string
}

export interface ProjectionPoint {
  month: string
  label: string
  liquidCash: number
  netWorth: number
}

export interface RunwayMetrics {
  liquidCash: number
  totalDebt: number
  netWorth: number
  monthlyIncome: number
  monthlyRecurringExpense: number
  monthlyVariableExpense: number
  netMonthlyBurn: number
  runwayMonths: number | null
  isNetPositive: boolean
  projection: ProjectionPoint[]
}

export interface RunwayOptions {
  primaryCurrency?: string
  rates?: Record<string, number>
  lookbackMonths?: number
  spendAdjustment?: number
  startDate?: Date | string
}

export interface RunwayCalculationParams extends RunwayOptions {
  accounts?: AccountInput[] | null
  subscriptions?: SubscriptionInput[] | null
  transactions?: TransactionInput[] | null
}

export const fallbackRates: Record<string, number> = {
  USD: 1,
  IDR: 16200.0,
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = fallbackRates
): number {
  if (!amount || isNaN(amount)) return 0
  const from = (fromCurrency || "USD").toUpperCase()
  const to = (toCurrency || "USD").toUpperCase()

  if (from === to) return amount

  const fromRate = rates[from] || fallbackRates[from] || 1
  const toRate = rates[to] || fallbackRates[to] || 1

  const amountInUSD = amount / fromRate
  return amountInUSD * toRate
}

export function isLiquidAccountType(type: string): boolean {
  const t = (type || "").toLowerCase().trim()
  return t === "checking" || t === "savings" || t === "cash"
}

export function isDebtAccountType(type: string): boolean {
  const t = (type || "").toLowerCase().trim()
  return t === "credit"
}

export function isInvestmentAccountType(type: string): boolean {
  const t = (type || "").toLowerCase().trim()
  return t === "investment"
}

export function calculateLiquidCash(
  accounts?: AccountInput[] | null,
  primaryCurrency = "USD",
  rates: Record<string, number> = fallbackRates
): number {
  if (!accounts || !Array.isArray(accounts)) return 0
  let total = 0
  for (const acc of accounts) {
    if (acc.isArchived) continue
    if (isLiquidAccountType(acc.type)) {
      const converted = convertCurrency(acc.balance || 0, acc.currency, primaryCurrency, rates)
      total += converted
    }
  }
  return Math.round(total * 100) / 100
}

export function calculateTotalDebt(
  accounts?: AccountInput[] | null,
  primaryCurrency = "USD",
  rates: Record<string, number> = fallbackRates
): number {
  if (!accounts || !Array.isArray(accounts)) return 0
  let total = 0
  for (const acc of accounts) {
    if (acc.isArchived) continue
    if (isDebtAccountType(acc.type)) {
      const converted = convertCurrency(acc.balance || 0, acc.currency, primaryCurrency, rates)
      total += Math.abs(converted)
    }
  }
  return Math.round(total * 100) / 100
}

export function calculateNetWorth(
  accounts?: AccountInput[] | null,
  primaryCurrency = "USD",
  rates: Record<string, number> = fallbackRates
): number {
  if (!accounts || !Array.isArray(accounts)) return 0
  let total = 0
  for (const acc of accounts) {
    if (acc.isArchived) continue
    const converted = convertCurrency(acc.balance || 0, acc.currency, primaryCurrency, rates)
    if (isDebtAccountType(acc.type)) {
      total -= Math.abs(converted)
    } else {
      total += converted
    }
  }
  return Math.round(total * 100) / 100
}

export function normalizeSubscriptionToMonthly(price: number, cycle: string): number {
  if (!price || isNaN(price) || price <= 0) return 0
  const c = (cycle || "monthly").toLowerCase().trim()
  if (c === "monthly") return price
  if (c === "yearly" || c === "annual") return price / 12
  if (c === "quarterly") return price / 3
  if (c === "semi-annual" || c === "semiannual" || c === "semi-annually") return price / 6
  if (c === "weekly") return (price * 52) / 12
  if (c === "daily") return (price * 365) / 12
  if (c === "none") return 0
  return price
}

export function calculateMonthlyRecurringExpense(
  subscriptions?: SubscriptionInput[] | null,
  primaryCurrency = "USD",
  rates: Record<string, number> = fallbackRates
): number {
  if (!subscriptions || !Array.isArray(subscriptions)) return 0
  let total = 0
  for (const sub of subscriptions) {
    if (sub.isActive === false) continue
    const monthlyPrice = normalizeSubscriptionToMonthly(sub.price, sub.cycle)
    const converted = convertCurrency(monthlyPrice, sub.currency, primaryCurrency, rates)
    total += converted
  }
  return Math.round(total * 100) / 100
}

export function calculateMonthlyTransactions(
  transactions?: TransactionInput[] | null,
  primaryCurrency = "USD",
  rates: Record<string, number> = fallbackRates,
  lookbackMonths = 6
): { monthlyIncome: number; monthlyVariableExpense: number } {
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return { monthlyIncome: 0, monthlyVariableExpense: 0 }
  }

  const validTxns = transactions.filter(
    (t) =>
      (t.type === "income" || t.type === "expense") &&
      Number.isFinite(t.amount) &&
      t.amount > 0 &&
      typeof t.date === "string" &&
      t.date.length >= 7
  )

  if (validTxns.length === 0) {
    return { monthlyIncome: 0, monthlyVariableExpense: 0 }
  }

  const monthsSet = new Set<string>()
  for (const t of validTxns) {
    monthsSet.add(t.date.slice(0, 7))
  }

  const activeMonths = Array.from(monthsSet).sort().reverse().slice(0, Math.max(1, lookbackMonths))
  const activeMonthsSet = new Set(activeMonths)

  let totalIncome = 0
  let totalVariableExpense = 0

  for (const t of validTxns) {
    const m = t.date.slice(0, 7)
    if (!activeMonthsSet.has(m)) continue
    const converted = convertCurrency(t.amount, t.currency, primaryCurrency, rates)
    if (t.type === "income") {
      totalIncome += converted
    } else if (t.type === "expense") {
      totalVariableExpense += converted
    }
  }

  const count = activeMonths.length || 1
  return {
    monthlyIncome: Math.round((totalIncome / count) * 100) / 100,
    monthlyVariableExpense: Math.round((totalVariableExpense / count) * 100) / 100,
  }
}

export function calculateRunwayProjection(
  startingLiquidCash: number,
  startingNetWorth: number,
  netMonthlyBurn: number,
  startDate?: Date | string,
  projectionMonths = 12
): ProjectionPoint[] {
  const points: ProjectionPoint[] = []
  let baseDate = new Date()
  if (startDate) {
    if (typeof startDate === "string" && startDate.length === 7) {
      const [y, m] = startDate.split("-").map(Number)
      baseDate = new Date(y, (m || 1) - 1, 1)
    } else {
      baseDate = new Date(startDate)
    }
    if (isNaN(baseDate.getTime())) {
      baseDate = new Date()
    }
  }

  const startYear = baseDate.getFullYear()
  const startMonth = baseDate.getMonth()

  for (let i = 0; i < projectionMonths; i++) {
    const d = new Date(startYear, startMonth + i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const monthKey = `${y}-${m}`
    const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" })

    const rawLiquid = startingLiquidCash - i * netMonthlyBurn
    const rawNetWorth = startingNetWorth - i * netMonthlyBurn

    points.push({
      month: monthKey,
      label,
      liquidCash: Math.max(0, Math.round(rawLiquid * 100) / 100),
      netWorth: Math.round(rawNetWorth * 100) / 100,
    })
  }

  return points
}

export function calculateRunway(
  paramsOrAccounts?: RunwayCalculationParams | AccountInput[] | null,
  subscriptionsArg?: SubscriptionInput[] | null,
  transactionsArg?: TransactionInput[] | null,
  optionsArg?: RunwayOptions
): RunwayMetrics {
  let accounts: AccountInput[] | null | undefined
  let subscriptions: SubscriptionInput[] | null | undefined
  let transactions: TransactionInput[] | null | undefined
  let primaryCurrency = "USD"
  let rates: Record<string, number> = fallbackRates
  let lookbackMonths = 6
  let spendAdjustment = 0
  let startDate: Date | string | undefined

  if (paramsOrAccounts && !Array.isArray(paramsOrAccounts) && typeof paramsOrAccounts === "object") {
    const params = paramsOrAccounts as RunwayCalculationParams
    accounts = params.accounts
    subscriptions = params.subscriptions
    transactions = params.transactions
    if (params.primaryCurrency) primaryCurrency = params.primaryCurrency
    if (params.rates) rates = params.rates
    if (typeof params.lookbackMonths === "number") lookbackMonths = params.lookbackMonths
    if (typeof params.spendAdjustment === "number") spendAdjustment = params.spendAdjustment
    if (params.startDate) startDate = params.startDate
  } else {
    accounts = paramsOrAccounts as AccountInput[] | null | undefined
    subscriptions = subscriptionsArg
    transactions = transactionsArg
    if (optionsArg?.primaryCurrency) primaryCurrency = optionsArg.primaryCurrency
    if (optionsArg?.rates) rates = optionsArg.rates
    if (typeof optionsArg?.lookbackMonths === "number") lookbackMonths = optionsArg.lookbackMonths
    if (typeof optionsArg?.spendAdjustment === "number") spendAdjustment = optionsArg.spendAdjustment
    if (optionsArg?.startDate) startDate = optionsArg.startDate
  }

  const liquidCash = calculateLiquidCash(accounts, primaryCurrency, rates)
  const totalDebt = calculateTotalDebt(accounts, primaryCurrency, rates)
  const netWorth = calculateNetWorth(accounts, primaryCurrency, rates)
  const monthlyRecurringExpense = calculateMonthlyRecurringExpense(subscriptions, primaryCurrency, rates)
  const { monthlyIncome, monthlyVariableExpense } = calculateMonthlyTransactions(
    transactions,
    primaryCurrency,
    rates,
    lookbackMonths
  )

  const rawBurn = monthlyRecurringExpense + monthlyVariableExpense + spendAdjustment - monthlyIncome
  const netMonthlyBurn = Math.round(rawBurn * 100) / 100
  const isNetPositive = netMonthlyBurn <= 0

  let runwayMonths: number | null = null
  if (!isNetPositive) {
    const raw = liquidCash / netMonthlyBurn
    runwayMonths = Math.max(0, Math.floor(raw * 10) / 10)
  }

  const projection = calculateRunwayProjection(
    liquidCash,
    netWorth,
    netMonthlyBurn,
    startDate,
    12
  )

  return {
    liquidCash,
    totalDebt,
    netWorth,
    monthlyIncome,
    monthlyRecurringExpense,
    monthlyVariableExpense,
    netMonthlyBurn,
    runwayMonths,
    isNetPositive,
    projection,
  }
}

export const calculateRunwayMetrics = calculateRunway

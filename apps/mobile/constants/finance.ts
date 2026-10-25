export type TransactionType = "expense" | "income" | "transfer"

export interface FinanceCategory {
  value: string
  label: string
  kind: "expense" | "income" | "transfer"
  color: string
  icon: string
}

export const financeCategories: FinanceCategory[] = [
  { value: "food", label: "Food & Dining", kind: "expense", color: "#b49a72", icon: "Utensils" },
  { value: "groceries", label: "Groceries", kind: "expense", color: "#9fae8a", icon: "ShoppingCart" },
  { value: "transport", label: "Transport", kind: "expense", color: "#8d9bab", icon: "Car" },
  { value: "housing", label: "Housing & Rent", kind: "expense", color: "#9c93ab", icon: "Store" },
  { value: "utilities", label: "Utilities & Bills", kind: "expense", color: "#8fa4a8", icon: "Zap" },
  { value: "health", label: "Health", kind: "expense", color: "#b1929b", icon: "HeartPulse" },
  { value: "shopping", label: "Shopping", kind: "expense", color: "#b08f8f", icon: "ShoppingBag" },
  { value: "entertainment", label: "Entertainment", kind: "expense", color: "#9492ab", icon: "Clapperboard" },
  { value: "travel", label: "Travel", kind: "expense", color: "#8fa8a0", icon: "Plane" },
  { value: "education", label: "Education", kind: "expense", color: "#b3a77e", icon: "GraduationCap" },
  { value: "personal", label: "Personal Care", kind: "expense", color: "#a892a6", icon: "Sparkles" },
  { value: "pets", label: "Pets", kind: "expense", color: "#b59b86", icon: "PawPrint" },
  { value: "gifts", label: "Gifts & Donations", kind: "expense", color: "#a395ae", icon: "Gift" },
  { value: "subscriptions", label: "Subscriptions", kind: "expense", color: "#8b8d92", icon: "RefreshCw" },
  { value: "finance", label: "Fees & Finance", kind: "expense", color: "#8fa0ad", icon: "Landmark" },
  { value: "other-expense", label: "Other Expense", kind: "expense", color: "#7f8186", icon: "Receipt" },
  { value: "other", label: "Other", kind: "expense", color: "#7f8186", icon: "Receipt" },
  { value: "salary", label: "Salary", kind: "income", color: "#a9bfa9", icon: "Briefcase" },
  { value: "freelance", label: "Freelance & Side Gigs", kind: "income", color: "#9db79f", icon: "Laptop" },
  { value: "business", label: "Business", kind: "income", color: "#93ad95", icon: "Store" },
  { value: "investment", label: "Investments & Dividends", kind: "income", color: "#a9bfa9", icon: "TrendingUp" },
  { value: "refund", label: "Refunds", kind: "income", color: "#a3bda5", icon: "Upload" },
  { value: "gift-income", label: "Gifts Received", kind: "income", color: "#b3c8b4", icon: "Gift" },
  { value: "other-income", label: "Other Income", kind: "income", color: "#9fbaa1", icon: "Plus" },
  { value: "transfer", label: "Transfer", kind: "transfer", color: "#8b8d92", icon: "ArrowLeftRight" },
]

export const expenseCategories = financeCategories.filter((c) => c.kind === "expense")
export const incomeCategories = financeCategories.filter((c) => c.kind === "income")

export function financeCategoryMeta(value: string): FinanceCategory {
  const normalized = value === "other" ? "subscriptions" : value
  return (
    financeCategories.find((c) => c.value === normalized || c.value === value) ?? {
      value,
      label: value === "other" ? "Subscriptions" : value.charAt(0).toUpperCase() + value.slice(1),
      kind: "expense" as const,
      color: "#8b8d92",
      icon: "RefreshCw",
    }
  )
}

export function mapSubscriptionCategoryToFinanceCategory(subCategory: string): string {
  const normalized = (subCategory || "").toLowerCase().trim()
  const map: Record<string, string> = {
    entertainment: "entertainment",
    music: "entertainment",
    gaming: "entertainment",
    news: "entertainment",
    productivity: "subscriptions",
    cloud: "utilities",
    fitness: "health",
    education: "education",
    finance: "finance",
    other: "subscriptions",
    subscriptions: "subscriptions",
  }
  return map[normalized] || "subscriptions"
}

export interface AccountType {
  value: string
  label: string
  icon: string
}

export const accountTypes: AccountType[] = [
  { value: "checking", label: "Checking", icon: "Landmark" },
  { value: "savings", label: "Savings", icon: "PiggyBank" },
  { value: "cash", label: "Cash", icon: "Banknote" },
  { value: "ewallet", label: "E-Wallet", icon: "Wallet" },
  { value: "credit", label: "Credit Card", icon: "CreditCard" },
  { value: "investment", label: "Investment", icon: "TrendingUp" },
  { value: "other", label: "Other", icon: "Coins" },
]

export function accountTypeMeta(value: string): AccountType {
  return (
    accountTypes.find((t) => t.value === value) ?? {
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1),
      icon: "Wallet",
    }
  )
}

export function currentMonthKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${d.getFullYear()}-${m}`
}

export function monthKeyOf(dateStr: string): string {
  return dateStr.slice(0, 7)
}

export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number)
  if (!y || !m) return monthKey
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number)
  const d = new Date(y, (m || 1) - 1 + delta, 1)
  return currentMonthKey(d)
}

export function todayKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

export function lastMonths(count: number, end = new Date()): string[] {
  const keys: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1)
    keys.push(currentMonthKey(d))
  }
  return keys
}

export function shortMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number)
  if (!y || !m) return monthKey
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" })
}

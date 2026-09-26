export type TransactionType = "expense" | "income" | "transfer"

export interface FinanceCategory {
  value: string
  label: string
  kind: "expense" | "income" | "transfer"
  color: string
  icon: string
}

export const financeCategories: FinanceCategory[] = [
  { value: "food", label: "Food & Dining", kind: "expense", color: "#f59e0b", icon: "Utensils" },
  { value: "groceries", label: "Groceries", kind: "expense", color: "#84cc16", icon: "ShoppingCart" },
  { value: "transport", label: "Transport", kind: "expense", color: "#3b82f6", icon: "Car" },
  { value: "housing", label: "Housing & Rent", kind: "expense", color: "#8b5cf6", icon: "Store" },
  { value: "utilities", label: "Utilities & Bills", kind: "expense", color: "#06b6d4", icon: "Zap" },
  { value: "health", label: "Health", kind: "expense", color: "#ec4899", icon: "HeartPulse" },
  { value: "shopping", label: "Shopping", kind: "expense", color: "#f43f5e", icon: "ShoppingBag" },
  { value: "entertainment", label: "Entertainment", kind: "expense", color: "#6366f1", icon: "Clapperboard" },
  { value: "travel", label: "Travel", kind: "expense", color: "#14b8a6", icon: "Plane" },
  { value: "education", label: "Education", kind: "expense", color: "#eab308", icon: "GraduationCap" },
  { value: "personal", label: "Personal Care", kind: "expense", color: "#d946ef", icon: "Sparkles" },
  { value: "pets", label: "Pets", kind: "expense", color: "#fb923c", icon: "PawPrint" },
  { value: "gifts", label: "Gifts & Donations", kind: "expense", color: "#a855f7", icon: "Gift" },
  { value: "subscriptions", label: "Subscriptions", kind: "expense", color: "#64748b", icon: "RefreshCw" },
  { value: "finance", label: "Fees & Finance", kind: "expense", color: "#0ea5e9", icon: "Landmark" },
  { value: "other-expense", label: "Other Expense", kind: "expense", color: "#71717a", icon: "Receipt" },
  { value: "salary", label: "Salary", kind: "income", color: "#10b981", icon: "Briefcase" },
  { value: "freelance", label: "Freelance & Side Gigs", kind: "income", color: "#22c55e", icon: "Laptop" },
  { value: "business", label: "Business", kind: "income", color: "#16a34a", icon: "Store" },
  { value: "investment", label: "Investments & Dividends", kind: "income", color: "#059669", icon: "TrendingUp" },
  { value: "refund", label: "Refunds", kind: "income", color: "#34d399", icon: "Upload" },
  { value: "gift-income", label: "Gifts Received", kind: "income", color: "#6ee7b7", icon: "Gift" },
  { value: "other-income", label: "Other Income", kind: "income", color: "#4ade80", icon: "Plus" },
  { value: "transfer", label: "Transfer", kind: "transfer", color: "#64748b", icon: "ArrowLeftRight" },
]

export const expenseCategories = financeCategories.filter((c) => c.kind === "expense")
export const incomeCategories = financeCategories.filter((c) => c.kind === "income")

export function financeCategoryMeta(value: string): FinanceCategory {
  return (
    financeCategories.find((c) => c.value === value) ?? {
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1),
      kind: "expense" as const,
      color: "#71717a",
      icon: "Receipt",
    }
  )
}

export const financeCategoryColors: Record<string, string> = Object.fromEntries(
  financeCategories.map((c) => [c.value, c.color])
)

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

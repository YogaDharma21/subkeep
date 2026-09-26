import { useMemo } from "react"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/clerk-react"
import { api } from "@/convex/_generated/api"
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Wallet,
  Repeat,
  Target,
  ChevronRight,
  PiggyBank,
} from "lucide-react"
import { DynamicIcon } from "@/components/dynamic-icon"
import { UpcomingReminders } from "@/components/upcoming-reminders"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { currentMonthKey, monthLabel, financeCategoryMeta } from "@/lib/finance"
import { cn } from "@/lib/utils"

interface FinanceDashboardViewProps {
  onNavigate: (view: string) => void
  onSelectSubscription?: (id: string) => void
}

export function FinanceDashboardView({ onNavigate }: FinanceDashboardViewProps) {
  const { isSignedIn } = useAuth()
  const month = currentMonthKey()

  const accounts = useQuery(api.accounts.list, isSignedIn ? {} : "skip")
  const transactions = useQuery(api.transactions.list, isSignedIn ? { month } : "skip")
  const budgets = useQuery(api.budgets.list, isSignedIn ? { month } : "skip")
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const userSettings = useQuery(api.userSettings.get, isSignedIn ? {} : "skip")

  const { primaryCurrency, rates } = usePrimaryCurrency()

  const stats = useMemo(() => {
    let income = 0
    let expense = 0
    const byCategory: Record<string, number> = {}
    for (const t of transactions || []) {
      const converted = convertCurrency(t.amount, t.currency, primaryCurrency, rates)
      if (t.type === "income") income += converted
      else if (t.type === "expense") {
        expense += converted
        byCategory[t.category] = (byCategory[t.category] || 0) + converted
      }
    }
    return { income, expense, net: income - expense, byCategory }
  }, [transactions, primaryCurrency, rates])

  const netWorth = useMemo(() => {
    if (!accounts) return 0
    return accounts.reduce(
      (sum, a) => sum + convertCurrency(a.balance, a.currency, primaryCurrency, rates),
      0
    )
  }, [accounts, primaryCurrency, rates])

  const subscriptionMonthly = useMemo(() => {
    if (!subscriptions) return 0
    return subscriptions
      .filter((s) => s.isActive !== false)
      .reduce((sum, s) => {
        const cycle = (s.cycle || "monthly").toLowerCase()
        let nativeMonthly = s.price
        if (cycle === "quarterly") nativeMonthly = s.price / 3
        else if (cycle === "semi-annual") nativeMonthly = s.price / 6
        else if (cycle === "yearly") nativeMonthly = s.price / 12
        else if (cycle === "weekly") nativeMonthly = s.price * 4.33
        else if (cycle === "daily") nativeMonthly = s.price * 30
        else if (cycle === "none") nativeMonthly = 0
        return sum + convertCurrency(nativeMonthly, s.currency, primaryCurrency, rates)
      }, 0)
  }, [subscriptions, primaryCurrency, rates])

  const activeSubCount = subscriptions?.filter((s) => s.isActive !== false).length ?? 0

  const budgetCap = userSettings?.monthlyBudgetCap
  const monthlySpend = stats.expense + subscriptionMonthly
  const budgetUsedPct = budgetCap && budgetCap > 0 ? Math.round((monthlySpend / budgetCap) * 100) : null
  const isBudgetExceeded = !!budgetCap && monthlySpend > budgetCap

  const topCategories = useMemo(() => {
    const entries = Object.entries(stats.byCategory)
    const total = stats.expense || 1
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([cat, amt]) => ({ ...financeCategoryMeta(cat), amount: amt, pct: Math.round((amt / total) * 100) }))
  }, [stats])

  const recentTransactions = useMemo(() => {
    return [...(transactions || [])]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, 5)
  }, [transactions])

  const loading = accounts === undefined || transactions === undefined
  const monthShort = monthLabel(month).split(" ")[0]

  const quickLinks = [
    { label: "Transactions", icon: ArrowLeftRight, view: "transactions" },
    { label: "Accounts", icon: Wallet, view: "accounts" },
    { label: "Budgets", icon: PiggyBank, view: "budgets" },
    { label: activeSubCount > 0 ? `Subs (${activeSubCount})` : "Subs", icon: Repeat, view: "subscriptions" },
  ]

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Net Worth + Cash Flow Hero */}
      <div className="rounded-lg border border-border bg-background p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Wallet className="size-3.5 text-primary" />
            <span>Money Overview · {monthLabel(month)}</span>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {primaryCurrency}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="h-10 rounded-md bg-muted animate-pulse" />
            <div className="h-10 rounded-md bg-muted animate-pulse" />
            <div className="h-10 rounded-md bg-muted animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-3 divide-x divide-border/60 text-center items-center">
            <div className="flex flex-col items-center gap-0.5 px-2">
              <span className="text-xl font-extrabold text-foreground truncate max-w-full">
                {formatCurrencyAmount(netWorth, primaryCurrency)}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Net Worth
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-0 px-2">
              <span className="flex items-center gap-1 text-xl font-extrabold text-emerald-500">
                <ArrowDownRight className="size-4 shrink-0" />
                <span className="truncate">{formatCurrencyAmount(stats.income, primaryCurrency)}</span>
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                In · {monthShort}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-0 px-2">
              <span className="flex items-center gap-1 text-xl font-extrabold text-red-500">
                <ArrowUpRight className="size-4 shrink-0" />
                <span className="truncate">{formatCurrencyAmount(stats.expense, primaryCurrency)}</span>
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Out · {monthShort}
              </span>
            </div>
          </div>
        )}

        {budgetCap && budgetCap > 0 && !loading && (
          <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Target className="size-3.5 text-primary" />
                <span>Total Monthly Spend vs Cap</span>
              </div>
              <span className={cn("font-semibold", isBudgetExceeded ? "text-red-500" : "text-muted-foreground")}>
                {formatCurrencyAmount(monthlySpend, primaryCurrency)} / {formatCurrencyAmount(budgetCap, primaryCurrency)} ({budgetUsedPct}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isBudgetExceeded ? "bg-red-500" : (budgetUsedPct || 0) >= 85 ? "bg-amber-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(100, budgetUsedPct || 0)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {quickLinks.map((q) => {
          const Icon = q.icon
          return (
            <button
              key={q.label}
              onClick={() => onNavigate(q.view)}
              className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 transition-colors hover:border-foreground/40 cursor-pointer text-left"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                <Icon className="size-4" />
              </span>
              <span className="text-xs font-semibold">{q.label}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Recent Transactions */}
        <div className="rounded-lg border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Recent Transactions</h3>
            </div>
            <button
              onClick={() => onNavigate("transactions")}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
            >
              View all <ChevronRight className="size-3.5" />
            </button>
          </div>
          {transactions === undefined ? (
            <div className="space-y-2 p-4">
              <div className="h-12 rounded-md bg-muted animate-pulse" />
              <div className="h-12 rounded-md bg-muted animate-pulse" />
              <div className="h-12 rounded-md bg-muted animate-pulse" />
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm font-medium text-muted-foreground">No transactions this month</p>
              <p className="mt-1 text-xs text-muted-foreground/60">Add your first expense or income</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {recentTransactions.map((t) => {
                const meta = financeCategoryMeta(t.category)
                return (
                  <button
                    key={t._id}
                    onClick={() => onNavigate("transactions")}
                    className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 cursor-pointer text-left"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                      <DynamicIcon name={t.icon || meta.icon} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{t.note || meta.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{meta.label} · {t.date}</span>
                    </span>
                    <span className={cn(
                      "shrink-0 text-sm font-bold",
                      t.type === "income" ? "text-emerald-500" : t.type === "transfer" ? "text-blue-500" : "text-red-500"
                    )}>
                      {t.type === "income" ? "+" : t.type === "transfer" ? "" : "-"}
                      {formatCurrencyAmount(convertCurrency(t.amount, t.currency, primaryCurrency, rates), primaryCurrency)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Top Spending */}
          {topCategories.length > 0 && (
            <div className="rounded-lg border border-border bg-background">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="text-sm font-semibold">Top Spending · {monthShort}</h3>
                <button
                  onClick={() => onNavigate("stats")}
                  className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Analytics <ChevronRight className="size-3.5" />
                </button>
              </div>
              <div className="space-y-3 p-4">
                {topCategories.map((cat) => (
                  <div key={cat.value} className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                      <DynamicIcon name={cat.icon} className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">{cat.label}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatCurrencyAmount(cat.amount, primaryCurrency)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full transition-all" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                    <div className="w-10 text-right text-xs font-semibold text-muted-foreground">{cat.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscriptions preview */}
          <div className="rounded-lg border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <Repeat className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Subscriptions</h3>
              </div>
              <button
                onClick={() => onNavigate("subscriptions")}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Manage <ChevronRight className="size-3.5" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  <span className="text-sm font-bold text-foreground">{activeSubCount}</span> active ·{" "}
                  <span className="text-sm font-bold text-foreground">
                    {formatCurrencyAmount(subscriptionMonthly, primaryCurrency)}
                  </span>/mo
                </div>
                <button
                  onClick={() => onNavigate("subscriptions")}
                  className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold hover:bg-muted/70 cursor-pointer"
                >
                  Open tracker
                </button>
              </div>
            </div>
          </div>

          {/* Budget snapshot */}
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
              <h3 className="text-xs font-semibold uppercase tracking-wider">Budgets · {monthShort}</h3>
              <button onClick={() => onNavigate("budgets")} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer">
                View
              </button>
            </div>
            {budgets === undefined || transactions === undefined ? (
              <div className="h-16 rounded-md bg-muted animate-pulse" />
            ) : budgets.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No budgets set for {monthShort}. Set per-category limits to stay on track.
              </p>
            ) : (
              <div className="space-y-2.5">
                {budgets.slice(0, 4).map((b) => {
                  const spentNative = (transactions || [])
                    .filter((t) => t.type === "expense" && t.category === b.category)
                    .reduce((s, t) => s + t.amount, 0)
                  const spent = convertCurrency(spentNative, b.currency, primaryCurrency, rates)
                  const cap = convertCurrency(b.amount, b.currency, primaryCurrency, rates)
                  const pct = cap > 0 ? Math.min(100, Math.round((spent / cap) * 100)) : 0
                  const meta = financeCategoryMeta(b.category)
                  return (
                    <div key={b._id}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{meta.label}</span>
                        <span className={cn("font-semibold", spent > cap ? "text-red-500" : "text-muted-foreground")}>{pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", spent > cap ? "bg-red-500" : pct >= 85 ? "bg-amber-500" : "bg-emerald-500")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <UpcomingReminders
        subscriptions={subscriptions || []}
        primaryCurrency={primaryCurrency}
        rates={rates}
      />
    </div>
  )
}

import { useMemo } from "react"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/clerk-react"
import { api } from "@/convex/_generated/api"
import {
  ArrowLeftRight,
  Wallet,
  Repeat,
  ChevronRight,
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

function localDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function shortDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function Ring({ pct }: { pct: number }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, pct))

  return (
    <div className="relative flex size-[118px] shrink-0 items-center justify-center sm:size-[130px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="2.5"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (clamped / 100) * circumference}
        />
      </svg>
      <div className="text-center">
        <div className="numeral text-2xl font-medium text-foreground">{Math.round(pct)}%</div>
        <div className="label mt-1">used</div>
      </div>
    </div>
  )
}

function MetricCard({
  hint,
  value,
  label,
  onClick,
}: {
  hint: string
  value: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="surface surface-interactive group relative flex min-h-[130px] cursor-pointer flex-col justify-end p-4 text-left"
    >
      <span className="absolute right-4 top-4 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
        {hint}
      </span>
      <span className="numeral text-[1.6rem] leading-none text-foreground">{value}</span>
      <span className="mt-2 text-xs text-muted-foreground">{label}</span>
    </button>
  )
}

function PanelHead({
  title,
  hint,
  linkLabel,
  onClick,
}: {
  title: string
  hint?: string
  linkLabel: string
  onClick: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-medium tracking-tight text-foreground">{title}</h2>
        {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
      </div>
      <button
        type="button"
        onClick={onClick}
        className="flex shrink-0 cursor-pointer items-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {linkLabel}
        <ChevronRight className="size-3" />
      </button>
    </div>
  )
}

export function FinanceDashboardView({ onNavigate }: FinanceDashboardViewProps) {
  const { isSignedIn } = useAuth()
  const month = currentMonthKey()

  const accounts = useQuery(api.accounts.list, isSignedIn ? {} : "skip")
  const transactions = useQuery(
    api.transactions.list,
    isSignedIn ? { month } : "skip"
  )
  const allTransactions = useQuery(
    api.transactions.list,
    isSignedIn ? { limit: 300 } : "skip"
  )
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

  const nextRenewal = useMemo(() => {
    const active = (subscriptions || []).filter((s) => s.isActive !== false)
    const dates = active
      .map((s) => (s.isTrial && s.trialEndDate ? s.trialEndDate : s.nextBilling))
      .filter((value): value is string => !!value)
      .sort()
    return dates[0] ?? null
  }, [subscriptions])

  const budgetCap = userSettings?.monthlyBudgetCap
  const monthlySpend = stats.expense + subscriptionMonthly
  const budgetUsedPct = budgetCap && budgetCap > 0 ? Math.round((monthlySpend / budgetCap) * 100) : null
  const isBudgetExceeded = !!budgetCap && monthlySpend > budgetCap
  const leftToSpend = budgetCap ? budgetCap - monthlySpend : stats.net

  const topCategories = useMemo(() => {
    const entries = Object.entries(stats.byCategory)
    const total = stats.expense || 1
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([cat, amt]) => ({
        ...financeCategoryMeta(cat),
        amount: amt,
        pct: Math.round((amt / total) * 100),
      }))
  }, [stats])

  const recentTransactions = useMemo(() => {
    return [...(transactions || [])]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, 6)
  }, [transactions])

  const activity = useMemo(() => {
    const spendByDate: Record<string, number> = {}
    for (const t of allTransactions || []) {
      if (t.type !== "expense") continue
      spendByDate[t.date] =
        (spendByDate[t.date] || 0) +
        convertCurrency(t.amount, t.currency, primaryCurrency, rates)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(today)
    start.setDate(start.getDate() - 90)
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))

    const weeks: { key: string; amount: number; future: boolean }[][] = []
    const cursor = new Date(start)
    let activeDays = 0
    let peak = 0

    while (cursor <= today) {
      const week: { key: string; amount: number; future: boolean }[] = []
      for (let i = 0; i < 7; i++) {
        const key = localDateKey(cursor)
        const amount = spendByDate[key] || 0
        const future = cursor > today
        week.push({ key, amount, future })
        if (!future && amount > 0) activeDays++
        if (amount > peak) peak = amount
        cursor.setDate(cursor.getDate() + 1)
      }
      weeks.push(week)
    }

    return { weeks, activeDays, peak }
  }, [allTransactions, primaryCurrency, rates])

  const loading = accounts === undefined || transactions === undefined
  const monthShort = monthLabel(month).split(" ")[0]
  const hasUpcoming =
    (subscriptions || []).some((s) => {
      if (s.isActive === false) return false
      const date = s.isTrial && s.trialEndDate ? s.trialEndDate : s.nextBilling
      if (!date) return false
      const diff = Math.ceil(
        (new Date(`${date}T12:00:00`).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      return diff <= 7
    })

  return (
    <div className="mx-auto max-w-6xl space-y-3 pb-16">
      <div className="flex items-end justify-between gap-4 px-1 pb-2">
        <div>
          <p className="label">Overview</p>
          <h1 className="page-title mt-2">{monthLabel(month)}</h1>
        </div>
        <p className="hidden text-[11px] text-muted-foreground sm:block">
          {primaryCurrency} · {activeSubCount} active recurring
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <section className="surface relative overflow-hidden p-5 sm:p-6 lg:col-span-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label">Net worth</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Across {accounts?.length || 0} accounts
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("accounts")}
              className="flex shrink-0 cursor-pointer items-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Accounts
              <ChevronRight className="size-3" />
            </button>
          </div>

          {loading ? (
            <div className="mt-8 space-y-3">
              <div className="h-9 w-48 animate-pulse rounded-xl bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
            </div>
          ) : (
            <>
              <p className="numeral mt-8 text-[2.4rem] leading-none text-foreground">
                {formatCurrencyAmount(netWorth, primaryCurrency)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {stats.net >= 0 ? "Up" : "Down"}{" "}
                {formatCurrencyAmount(Math.abs(stats.net), primaryCurrency)} this month
              </p>
            </>
          )}

          <div className="mt-7 grid grid-cols-3 gap-4 border-t border-border pt-4">
            <div>
              <p className="label">In</p>
              <p className="numeral mt-1.5 text-[1.05rem] text-positive">
                +{formatCurrencyAmount(stats.income, primaryCurrency)}
              </p>
            </div>
            <div>
              <p className="label">Out</p>
              <p className="numeral mt-1.5 text-[1.05rem] text-foreground">
                -{formatCurrencyAmount(stats.expense, primaryCurrency)}
              </p>
            </div>
            <div>
              <p className="label">Kept</p>
              <p className="numeral mt-1.5 text-[1.05rem] text-foreground">
                {formatCurrencyAmount(stats.net, primaryCurrency)}
              </p>
            </div>
          </div>
        </section>

        <section className="surface relative overflow-hidden p-5 sm:p-6 lg:col-span-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label">{budgetCap ? "Monthly cap" : "Cash flow"}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{monthLabel(month)}</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("budgets")}
              className="flex shrink-0 cursor-pointer items-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Budgets
              <ChevronRight className="size-3" />
            </button>
          </div>

          {loading ? (
            <div className="mt-6 flex items-center gap-6">
              <div className="size-[130px] animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-7 w-32 animate-pulse rounded-xl bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          ) : budgetCap ? (
            <div className="mt-4 flex items-center gap-6">
              <Ring pct={budgetUsedPct || 0} />
              <div className="min-w-0">
                <p className="numeral text-[1.55rem] leading-none text-foreground">
                  {formatCurrencyAmount(Math.abs(leftToSpend), primaryCurrency)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {isBudgetExceeded ? "over the cap" : "left to spend"}
                </p>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/80">
                  {formatCurrencyAmount(monthlySpend, primaryCurrency)} of{" "}
                  {formatCurrencyAmount(budgetCap, primaryCurrency)}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <p className="numeral text-[1.9rem] leading-none text-foreground">
                  {formatCurrencyAmount(stats.net, primaryCurrency)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">kept this month</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("budgets")}
                className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Set a cap
              </button>
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          hint="In"
          value={`+${formatCurrencyAmount(stats.income, primaryCurrency)}`}
          label="This month"
          onClick={() => onNavigate("transactions")}
        />
        <MetricCard
          hint="Out"
          value={`-${formatCurrencyAmount(stats.expense, primaryCurrency)}`}
          label="This month"
          onClick={() => onNavigate("transactions")}
        />
        <MetricCard
          hint="Fixed"
          value={formatCurrencyAmount(subscriptionMonthly, primaryCurrency)}
          label={`${activeSubCount} recurring · per month`}
          onClick={() => onNavigate("subscriptions")}
        />
        <MetricCard
          hint="Next"
          value={nextRenewal ? shortDate(nextRenewal) : "—"}
          label="Next renewal"
          onClick={() => onNavigate("subscriptions")}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <section
          className={cn(
            "surface relative overflow-hidden p-5 sm:p-6",
            hasUpcoming ? "lg:col-span-8" : "lg:col-span-12"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-medium tracking-tight">Activity</h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Daily spending, last 13 weeks
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {activity.activeDays} active days
            </span>
          </div>

          <div className="quiet-scroll mt-7 flex gap-1.5 overflow-x-auto pb-1">
            {activity.weeks.map((week, index) => (
              <div key={index} className="flex flex-col gap-1.5">
                {week.map((day) => {
                  const intensity =
                    day.amount <= 0 || activity.peak <= 0
                      ? 0
                      : 0.18 + 0.82 * Math.sqrt(day.amount / activity.peak)
                  return (
                    <span
                      key={day.key}
                      title={
                        day.future
                          ? undefined
                          : `${shortDate(day.key)}${
                              day.amount > 0
                                ? ` · ${formatCurrencyAmount(day.amount, primaryCurrency)}`
                                : ""
                            }`
                      }
                      className={cn("size-[5px] rounded-full bg-foreground", day.future && "opacity-0")}
                      style={{ opacity: day.future ? 0 : Math.max(0.07, intensity) }}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted-foreground">
            <span>Peak day</span>
            <span className="numeral text-foreground">
              {activity.peak > 0
                ? formatCurrencyAmount(activity.peak, primaryCurrency)
                : "No spend yet"}
            </span>
          </div>
        </section>

        {hasUpcoming ? (
          <div className="lg:col-span-4">
            <UpcomingReminders
              subscriptions={subscriptions || []}
              primaryCurrency={primaryCurrency}
              rates={rates}
              compact
            />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <section className="surface p-5 sm:p-6 lg:col-span-7">
          <PanelHead
            title="Recent"
            hint={`${monthLabel(month)} · latest first`}
            linkLabel="All"
            onClick={() => onNavigate("transactions")}
          />

          {transactions === undefined ? (
            <div className="mt-5 space-y-3">
              <div className="h-11 w-full animate-pulse rounded-2xl bg-muted" />
              <div className="h-11 w-full animate-pulse rounded-2xl bg-muted" />
              <div className="h-11 w-full animate-pulse rounded-2xl bg-muted" />
            </div>
          ) : recentTransactions.length === 0 ? (
            <p className="mt-8 pb-2 text-center text-sm text-muted-foreground">
              No transactions yet this month.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-border/70">
              {recentTransactions.map((t) => {
                const meta = financeCategoryMeta(t.category)
                const isIncome = t.type === "income"
                const isTransfer = t.type === "transfer"
                return (
                  <button
                    key={t._id}
                    type="button"
                    onClick={() => onNavigate("transactions")}
                    className="flex w-full cursor-pointer items-center gap-3 py-3 text-left transition-opacity hover:opacity-75"
                  >
                    <span className="surface-inset flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground">
                      <DynamicIcon name={t.icon || meta.icon} className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-foreground">
                        {t.note || meta.label}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {meta.label} · {shortDate(t.date)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "numeral shrink-0 text-[13px]",
                        isIncome ? "text-positive" : isTransfer ? "text-muted-foreground" : "text-foreground"
                      )}
                    >
                      {isIncome ? "+" : isTransfer ? "" : "-"}
                      {formatCurrencyAmount(
                        convertCurrency(t.amount, t.currency, primaryCurrency, rates),
                        primaryCurrency
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <div className="space-y-3 lg:col-span-5">
          <section className="surface p-5 sm:p-6">
            <PanelHead
              title="Budgets"
              hint={monthShort}
              linkLabel="Manage"
              onClick={() => onNavigate("budgets")}
            />
            {budgets === undefined ? (
              <div className="mt-5 h-16 animate-pulse rounded-2xl bg-muted" />
            ) : budgets.length === 0 ? (
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                No budgets set for {monthShort}. Set per-category limits to stay on track.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
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
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-foreground">{meta.label}</span>
                        <span
                          className={cn(
                            "numeral",
                            spent > cap ? "text-negative" : "text-muted-foreground"
                          )}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)]">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            spent > cap
                              ? "bg-negative"
                              : pct >= 85
                                ? "bg-warning"
                                : "bg-foreground"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="surface p-5 sm:p-6">
            <PanelHead
              title="Top spending"
              hint={monthShort}
              linkLabel="Analytics"
              onClick={() => onNavigate("stats")}
            />
            {topCategories.length === 0 ? (
              <p className="mt-5 text-xs text-muted-foreground">
                No expenses logged this month.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {topCategories.map((cat) => (
                  <div key={cat.value} className="flex items-center gap-3">
                    <span className="surface-inset flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground">
                      <DynamicIcon name={cat.icon} className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="truncate text-foreground">{cat.label}</span>
                        <span className="numeral shrink-0 text-muted-foreground">
                          {formatCurrencyAmount(cat.amount, primaryCurrency)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)]">
                        <div
                          className="h-full rounded-full bg-foreground/60"
                          style={{ width: `${cat.pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="numeral w-8 text-right text-[11px] text-muted-foreground">
                      {cat.pct}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <button
            type="button"
            onClick={() => onNavigate("subscriptions")}
            className="surface surface-interactive flex w-full cursor-pointer items-center justify-between gap-3 p-5 text-left sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="surface-inset flex size-9 items-center justify-center rounded-full text-foreground">
                <Repeat className="size-4" />
              </span>
              <div>
                <p className="text-[13px] text-foreground">Subscriptions</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {activeSubCount} active · {formatCurrencyAmount(subscriptionMonthly, primaryCurrency)}/mo
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-1 pt-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Wallet className="size-3.5" />
          {primaryCurrency} · all values converted
        </span>
        <span className="flex items-center gap-1.5">
          <ArrowLeftRight className="size-3.5" />
          {transactions?.length || 0} entries this month
        </span>
      </div>
    </div>
  )
}

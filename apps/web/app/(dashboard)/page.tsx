"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { DynamicIcon } from "@/components/dynamic-icon"
import { UpcomingReminders } from "@/components/upcoming-reminders"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { findUpcomingReminders } from "@/lib/notifications"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import {
  currentMonthKey,
  monthLabel,
  financeCategoryMeta,
} from "@/lib/finance"
import { cn } from "@/lib/utils"

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
          strokeDashoffset={
            circumference - (clamped / 100) * circumference
          }
        />
      </svg>
      <div className="text-center">
        <div className="numeral text-2xl font-semibold text-foreground">
          {Math.round(pct)}%
        </div>
        <div className="label mt-1">used</div>
      </div>
    </div>
  )
}

function MetricCard({
  href,
  hint,
  value,
  label,
}: {
  href: string
  hint: string
  value: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="surface surface-interactive group relative flex min-h-[130px] flex-col justify-end p-4"
    >
      <span className="absolute right-4 top-4 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
        {hint}
      </span>
      <span className="numeral text-[1.6rem] leading-none text-foreground">
        {value}
      </span>
      <span className="mt-2 text-xs text-muted-foreground">{label}</span>
    </Link>
  )
}

function PanelHead({
  title,
  hint,
  href,
  linkLabel,
}: {
  title: string
  hint?: string
  href: string
  linkLabel: string
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-medium tracking-tight text-foreground">
          {title}
        </h2>
        {hint ? (
          <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      <Link
        href={href}
        className="flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {linkLabel}
        <ChevronRight className="size-3" />
      </Link>
    </div>
  )
}

export default function HomePage() {
  useDocumentTitle("Dashboard")
  const { isSignedIn } = useAuth()
  const month = currentMonthKey()

  const accounts = useQuery(api.accounts.list, isSignedIn ? {} : "skip")
  const transactions = useQuery(
    api.transactions.list,
    isSignedIn ? { month } : "skip"
  )
  const allTransactions = useQuery(
    api.transactions.list,
    isSignedIn ? { limit: 600 } : "skip"
  )
  const budgets = useQuery(
    api.budgets.list,
    isSignedIn ? { month } : "skip"
  )
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const userSettings = useQuery(api.userSettings.get, isSignedIn ? {} : "skip")

  const { primaryCurrency, rates } = usePrimaryCurrency()

  const stats = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of transactions || []) {
      const converted = convertCurrency(t.amount, t.currency, primaryCurrency, rates)
      if (t.type === "income") income += converted
      else if (t.type === "expense") expense += converted
    }
    return { income, expense, saved: income - expense }
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
      .filter((s) => s.isActive)
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

  const activeSubCount = subscriptions?.filter((s) => s.isActive).length ?? 0

  const nextRenewal = useMemo(() => {
    const active = (subscriptions || []).filter((s) => s.isActive)
    const dates = active
      .map((s) => (s.isTrial && s.trialEndDate ? s.trialEndDate : s.nextBilling))
      .filter((value): value is string => !!value)
      .sort()
    return dates[0] ?? null
  }, [subscriptions])

  const budgetCap = userSettings?.monthlyBudgetCap
  const monthlySpend = stats.expense + subscriptionMonthly
  const isBudgetExceeded = !!budgetCap && monthlySpend > budgetCap
  const leftToSpend = budgetCap ? budgetCap - monthlySpend : stats.saved
  const ringPct = budgetCap && budgetCap > 0 ? (monthlySpend / budgetCap) * 100 : 0

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
    start.setDate(start.getDate() - 364)
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))

    const weeks: Array<{
      monthLabel?: string
      days: Array<{ key: string; amount: number; future: boolean }>
    }> = []
    const cursor = new Date(start)
    let activeDays = 0
    let peak = 0
    let totalSpend = 0
    let lastMonth = -1

    while (cursor <= today) {
      const days: Array<{ key: string; amount: number; future: boolean }> = []
      let monthLabel: string | undefined = undefined

      for (let i = 0; i < 7; i++) {
        const day = new Date(cursor)
        const key = localDateKey(day)
        const amount = spendByDate[key] || 0
        const future = day > today

        if (!future && amount > 0) {
          activeDays++
          totalSpend += amount
          if (amount > peak) peak = amount
        }

        days.push({ key, amount, future })

        if (day.getMonth() !== lastMonth && (days.length === 1 || day.getDate() <= 7)) {
          monthLabel = day.toLocaleDateString("en-US", { month: "short" })
          lastMonth = day.getMonth()
        }

        cursor.setDate(cursor.getDate() + 1)
      }
      weeks.push({ monthLabel, days })
    }

    return { weeks, activeDays, peak, totalSpend }
  }, [allTransactions, primaryCurrency, rates])

  const loading =
    accounts === undefined ||
    transactions === undefined ||
    userSettings === undefined

  const hasUpcoming = useMemo(
    () => findUpcomingReminders(subscriptions || [], 3).length > 0,
    [subscriptions]
  )

  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-1">
        <div className="space-y-2">
          <p className="label">{monthLabel(month)}</p>
          <h1 className="page-title text-foreground">Overview</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* Net worth */}
        <section className="surface p-5 sm:p-7 lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <p className="label">Net worth</p>
            <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-medium tracking-[0.12em] text-muted-foreground">
              {primaryCurrency}
            </span>
          </div>

          {loading ? (
            <Skeleton className="mt-6 h-14 w-3/4 rounded-2xl" />
          ) : (
            <p className="display-number mt-6 text-[clamp(2.4rem,5.4vw,3.8rem)] text-foreground">
              {formatCurrencyAmount(netWorth, primaryCurrency)}
            </p>
          )}

          <p className="mt-3 text-[11px] text-muted-foreground">
            {accounts?.length ?? 0} accounts · live balances
          </p>

          <div className="mt-7 grid grid-cols-3 gap-3 border-t border-border pt-4">
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
                {formatCurrencyAmount(stats.saved, primaryCurrency)}
              </p>
            </div>
          </div>
        </section>

        {/* Budget ring */}
        <section className="surface relative overflow-hidden p-5 sm:p-6 lg:col-span-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label">
                {budgetCap ? "Monthly cap" : "Cash flow"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {monthLabel(month)}
              </p>
            </div>
            <Link
              href="/budgets"
              className="flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Budgets
              <ChevronRight className="size-3" />
            </Link>
          </div>

          {loading ? (
            budgetCap ? (
              <div className="mt-4 flex items-center gap-6">
                <Skeleton className="size-[118px] shrink-0 rounded-full sm:size-[130px]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-7 w-32 rounded-lg" />
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="mt-1 h-3 w-36 rounded" />
                </div>
              </div>
            ) : (
              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <Skeleton className="h-8 w-40 rounded-lg" />
                  <Skeleton className="mt-2 h-3.5 w-24 rounded" />
                </div>
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            )
          ) : budgetCap ? (
            <div className="mt-4 flex items-center gap-6">
              <Ring pct={ringPct} />
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
                  {formatCurrencyAmount(stats.saved, primaryCurrency)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  kept this month
                </p>
              </div>
              <Link
                href="/budgets"
                className="rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Set a cap
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Folder metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          href="/transactions"
          hint="In"
          value={`+${formatCurrencyAmount(stats.income, primaryCurrency)}`}
          label="This month"
        />
        <MetricCard
          href="/transactions"
          hint="Out"
          value={`-${formatCurrencyAmount(stats.expense, primaryCurrency)}`}
          label="This month"
        />
        <MetricCard
          href="/subscriptions"
          hint="Fixed"
          value={formatCurrencyAmount(subscriptionMonthly, primaryCurrency)}
          label={`${activeSubCount} recurring · per month`}
        />
        <MetricCard
          href="/subscriptions"
          hint="Next"
          value={nextRenewal ? shortDate(nextRenewal) : "—"}
          label="Next renewal"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* Activity */}
        <section
          className={cn(
            "surface relative overflow-hidden p-5 sm:p-6 lg:col-span-8",
            !hasUpcoming && "lg:col-span-12"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-medium tracking-tight">Activity</h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Daily spending, past 52 weeks
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {activity.activeDays} active {activity.activeDays === 1 ? "day" : "days"}
            </span>
          </div>

          <div className="quiet-scroll mt-6 overflow-x-auto pb-1">
            <div className="flex min-w-max items-start gap-2">
              {/* Weekday labels */}
              <div className="flex flex-col gap-[3px] select-none text-[9px] font-medium text-muted-foreground">
                <div className="h-4" />
                <span className="flex h-[10px] items-center">Mon</span>
                <span className="h-[10px]" />
                <span className="flex h-[10px] items-center">Wed</span>
                <span className="h-[10px]" />
                <span className="flex h-[10px] items-center">Fri</span>
                <span className="h-[10px]" />
                <span className="h-[10px]" />
              </div>

              {/* 52-53 weeks */}
              <div className="flex gap-[3px]">
                {activity.weeks.map((week, index) => (
                  <div key={index} className="flex flex-col gap-[3px]">
                    <div className="relative h-4 w-[10px]">
                      {week.monthLabel ? (
                        <span className="absolute left-0 top-0 select-none whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                          {week.monthLabel}
                        </span>
                      ) : null}
                    </div>

                    {week.days.map((day) => {
                      const intensity =
                        day.amount <= 0 || activity.peak <= 0
                          ? 0
                          : 0.22 + 0.78 * Math.sqrt(day.amount / activity.peak)
                      return (
                        <span
                          key={day.key}
                          title={
                            day.future
                              ? undefined
                              : `${shortDate(day.key)}${
                                  day.amount > 0
                                    ? ` · ${formatCurrencyAmount(day.amount, primaryCurrency)}`
                                    : " · No spend"
                                }`
                          }
                          className={cn(
                            "size-[10px] rounded-[2px] transition-colors",
                            day.future
                              ? "opacity-0 pointer-events-none"
                              : day.amount > 0
                                ? "bg-foreground"
                                : "bg-muted/40 hover:bg-muted/70"
                          )}
                          style={
                            day.future || day.amount <= 0
                              ? undefined
                              : { opacity: Math.max(0.18, intensity) }
                          }
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                Peak day:{" "}
                <span className="numeral font-medium text-foreground">
                  {activity.peak > 0
                    ? formatCurrencyAmount(activity.peak, primaryCurrency)
                    : "—"}
                </span>
              </span>
              {activity.activeDays > 0 ? (
                <span>
                  Avg active:{" "}
                  <span className="numeral font-medium text-foreground">
                    {formatCurrencyAmount(
                      Math.round(activity.totalSpend / activity.activeDays),
                      primaryCurrency
                    )}
                  </span>
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5 text-[10px]">
              <span>Less</span>
              <span className="size-[10px] rounded-[2px] bg-muted/40" />
              <span className="size-[10px] rounded-[2px] bg-foreground opacity-25" />
              <span className="size-[10px] rounded-[2px] bg-foreground opacity-50" />
              <span className="size-[10px] rounded-[2px] bg-foreground opacity-75" />
              <span className="size-[10px] rounded-[2px] bg-foreground opacity-100" />
              <span>More</span>
            </div>
          </div>
        </section>

        {/* Upcoming */}
        {hasUpcoming ? (
          <div className="surface relative overflow-hidden p-5 sm:p-6 lg:col-span-4">
            <UpcomingReminders
              subscriptions={subscriptions || []}
              primaryCurrency={primaryCurrency}
              rates={rates}
              onMarkCanceled={async () => {}}
            />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* Recent */}
        <section className="surface p-5 sm:p-6 lg:col-span-7">
          <PanelHead
            title="Recent"
            hint={`${monthLabel(month)} · latest first`}
            href="/transactions"
            linkLabel="All"
          />

          {transactions === undefined ? (
            <div className="mt-5 space-y-3">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
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
                  <Link
                    key={t._id}
                    href="/transactions"
                    className="flex items-center gap-3 py-3 transition-opacity hover:opacity-75"
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
                        isIncome
                          ? "text-positive"
                          : isTransfer
                            ? "text-muted-foreground"
                            : "text-foreground"
                      )}
                    >
                      {isIncome ? "+" : isTransfer ? "" : "-"}
                      {formatCurrencyAmount(
                        convertCurrency(t.amount, t.currency, primaryCurrency, rates),
                        primaryCurrency
                      )}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Budgets */}
        <section className="surface p-5 sm:p-6 lg:col-span-5">
          <PanelHead
            title="Budgets"
            hint={monthLabel(month).split(" ")[0]}
            href="/budgets"
            linkLabel="Manage"
          />

          {budgets === undefined || transactions === undefined ? (
            <div className="mt-5 space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : budgets.length === 0 ? (
            <p className="mt-8 pb-2 text-center text-sm text-muted-foreground">
              No limits set for this month.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {budgets.slice(0, 4).map((b) => {
                const spentNative = (transactions || [])
                  .filter((t) => t.type === "expense" && t.category === b.category)
                  .reduce((s, t) => s + t.amount, 0)
                const spent = convertCurrency(spentNative, b.currency, primaryCurrency, rates)
                const cap = convertCurrency(b.amount, b.currency, primaryCurrency, rates)
                const pct = cap > 0 ? Math.min(100, Math.round((spent / cap) * 100)) : 0
                const meta = financeCategoryMeta(b.category)
                const over = spent > cap
                return (
                  <div key={b._id}>
                    <div className="flex items-baseline justify-between gap-3 text-xs">
                      <span className="truncate text-foreground">{meta.label}</span>
                      <span className="numeral shrink-0 text-muted-foreground">
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/10">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          over
                            ? "bg-negative"
                            : pct >= 85
                              ? "bg-warning"
                              : "bg-foreground/70"
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
      </div>
    </div>
  )
}

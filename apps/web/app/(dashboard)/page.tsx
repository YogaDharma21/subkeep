"use client"

import { useState, useEffect, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { ArrowUpDown, Globe, SlidersHorizontal, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SubscriptionCard } from "@/components/subscription-card"
import { Skeleton } from "@/components/ui/skeleton"
import { convertCurrency, formatCurrencyAmount, fetchExchangeRates, fallbackRates } from "@/lib/currency"
import { currencies } from "@/lib/constants"
import { UpcomingReminders } from "@/components/upcoming-reminders"
import { SmartInsights } from "@/components/smart-insights"

export default function HomePage() {
  const { isSignedIn } = useAuth()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  
  const hasUserSettings = !!(api as Record<string, any>).userSettings?.get
  const userSettings = useQuery(
    hasUserSettings ? (api as Record<string, any>).userSettings.get : "skip",
    isSignedIn && hasUserSettings ? {} : "skip"
  )
  
  const hasUpdateSettings = !!(api as Record<string, any>).userSettings?.update
  const updateSettingsMutation = hasUpdateSettings
    ? (api as Record<string, any>).userSettings.update
    : api.subscriptions.suspend

  const updateSettings = useMutation(updateSettingsMutation)
  const suspendMutation = useMutation(api.subscriptions.suspend)

  const [sortAsc, setSortAsc] = useState(true)
  const [filterTrial, setFilterTrial] = useState<"all" | "trial" | "regular">("all")
  const [rates, setRates] = useState<Record<string, number>>(fallbackRates)
  const [primaryCurrency, setPrimaryCurrency] = useState("IDR")

  useEffect(() => {
    fetchExchangeRates().then(setRates)
  }, [])

  useEffect(() => {
    if (userSettings?.primaryCurrency) {
      setPrimaryCurrency(userSettings.primaryCurrency)
    }
  }, [userSettings?.primaryCurrency])

  const handleCurrencyChange = async (newCurr: string) => {
    setPrimaryCurrency(newCurr)
    if (isSignedIn && hasUpdateSettings) {
      try {
        await updateSettings({ primaryCurrency: newCurr })
      } catch (err) {
        console.warn("Could not save settings to Convex backend:", err)
      }
    }
  }

  const handleMarkCanceled = async (id: string) => {
    await suspendMutation({ id: id as never })
  }

  // Multi-Currency Converted Monthly & Yearly Totals
  const { count, monthlyTotalConverted, yearlyTotalConverted } = useMemo(() => {
    if (!subscriptions) return { count: 0, monthlyTotalConverted: 0, yearlyTotalConverted: 0 }

    const activeSubs = subscriptions.filter((s) => s.isActive)
    const count = activeSubs.length

    const monthlyTotalConverted = activeSubs.reduce((sum, s) => {
      // Calculate normalized monthly price in subscription's native currency
      const cycle = (s.cycle || "monthly").toLowerCase()
      let nativeMonthly = s.price
      if (cycle === "quarterly") nativeMonthly = s.price / 3
      else if (cycle === "semi-annual") nativeMonthly = s.price / 6
      else if (cycle === "yearly") nativeMonthly = s.price / 12
      else if (cycle === "weekly") nativeMonthly = s.price * 4.33
      else if (cycle === "daily") nativeMonthly = s.price * 30
      else if (cycle === "none") nativeMonthly = 0

      // Convert to selected primary currency using live exchange rates
      const converted = convertCurrency(nativeMonthly, s.currency, primaryCurrency, rates)
      return sum + converted
    }, 0)

    const yearlyTotalConverted = monthlyTotalConverted * 12

    return { count, monthlyTotalConverted, yearlyTotalConverted }
  }, [subscriptions, primaryCurrency, rates])

  const filteredSubs = useMemo(() => {
    if (!subscriptions) return []
    let list = [...subscriptions]
    if (filterTrial === "trial") {
      list = list.filter((s) => s.isTrial)
    } else if (filterTrial === "regular") {
      list = list.filter((s) => !s.isTrial)
    }
    return list.sort((a, b) => {
      const pA = convertCurrency(a.price, a.currency, primaryCurrency, rates)
      const pB = convertCurrency(b.price, b.currency, primaryCurrency, rates)
      return sortAsc ? pA - pB : pB - pA
    })
  }, [subscriptions, filterTrial, sortAsc, primaryCurrency, rates])

  return (
    <div className="p-4">
      {/* Dynamic Summary Banner with Currency Converter */}
      <div className="mb-4 rounded-2xl border border-border bg-background p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Globe className="size-3.5 text-primary" />
            <span>Primary Currency Summary</span>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={primaryCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="h-7 rounded-lg border border-border bg-muted/50 px-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {currencies.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {subscriptions ? (
          <div className="flex items-center justify-around text-center">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-extrabold">{count}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Active Subs
              </span>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div className="flex flex-col items-center gap-0.5 min-w-0 px-1">
              <span className="text-base font-extrabold text-foreground truncate max-w-[130px]">
                {formatCurrencyAmount(monthlyTotalConverted, primaryCurrency)}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Per Month ({primaryCurrency})
              </span>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div className="flex flex-col items-center gap-0.5 min-w-0 px-1">
              <span className="text-base font-extrabold text-foreground truncate max-w-[130px]">
                {formatCurrencyAmount(yearlyTotalConverted, primaryCurrency)}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Per Year ({primaryCurrency})
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-around">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        )}
      </div>

      {/* Upcoming Reminders Alert Banner */}
      {subscriptions && (
        <UpcomingReminders
          subscriptions={subscriptions}
          primaryCurrency={primaryCurrency}
          telegramBotToken={userSettings?.telegramBotToken}
          telegramChatId={userSettings?.telegramChatId}
          onMarkCanceled={handleMarkCanceled}
        />
      )}

      {/* Smart Insights & Savings Recommendations */}
      {subscriptions && (
        <SmartInsights
          subscriptions={subscriptions}
          primaryCurrency={primaryCurrency}
        />
      )}

      {/* Filter and Sort Toolbar */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterTrial("all")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              filterTrial === "all"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterTrial("trial")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
              filterTrial === "trial"
                ? "bg-emerald-500 text-white"
                : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            }`}
          >
            <Sparkles className="size-3" />
            Trials
          </button>
          <button
            onClick={() => setFilterTrial("regular")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              filterTrial === "regular"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Regular
          </button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortAsc(!sortAsc)}
          className="h-7 text-xs gap-1"
        >
          <ArrowUpDown className="size-3.5" />
          {sortAsc ? "Price: Low to High" : "Price: High to Low"}
        </Button>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-2">
        {subscriptions ? (
          filteredSubs.length > 0 ? (
            filteredSubs.map((sub) => (
              <SubscriptionCard
                key={sub._id}
                sub={sub}
                primaryCurrency={primaryCurrency}
              />
            ))
          ) : (
            <div className="rounded-xl border border-border bg-background py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {filterTrial === "trial"
                  ? "No active trial subscriptions"
                  : "No subscriptions yet"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tap + to add your first subscription
              </p>
            </div>
          )
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-xl" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

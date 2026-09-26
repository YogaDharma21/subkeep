"use client"

import { useMemo } from "react"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { StatsCharts } from "@/components/stats-charts"
import { FinanceAnalytics } from "@/components/finance-analytics"
import { Skeleton } from "@/components/ui/skeleton"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { currentMonthKey, lastMonths } from "@/lib/finance"

export default function StatsPage() {
  useDocumentTitle("Stats")
  const { isSignedIn } = useAuth()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const payments = useQuery(api.payments.list, isSignedIn ? {} : "skip")
  const transactions = useQuery(
    api.transactions.list,
    isSignedIn ? {} : "skip"
  )

  const { primaryCurrency, rates } = usePrimaryCurrency()

  const months = useMemo(() => lastMonths(6), [])

  return (
    <div className="space-y-4 sm:space-y-6">
      {transactions && (
        <FinanceAnalytics
          transactions={transactions}
          months={months}
          currentMonth={currentMonthKey()}
          primaryCurrency={primaryCurrency}
          rates={rates}
        />
      )}

      {subscriptions ? (
        <StatsCharts
          subscriptions={subscriptions}
          payments={payments || []}
          primaryCurrency={primaryCurrency}
          rates={rates}
        />
      ) : (
        <div className="space-y-4">
          <Skeleton className="h-[250px] rounded-lg" />
          <Skeleton className="h-[150px] rounded-lg" />
          <Skeleton className="h-[250px] rounded-lg" />
        </div>
      )}
    </div>
  )
}

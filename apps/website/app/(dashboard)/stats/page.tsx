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

  const isLoading =
    subscriptions === undefined ||
    transactions === undefined ||
    payments === undefined

  return (
    <div className="space-y-4 sm:space-y-6">
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[340px] rounded-lg" />
            <Skeleton className="h-[340px] rounded-lg" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[340px] rounded-lg" />
            <Skeleton className="h-[340px] rounded-lg" />
          </div>
          <Skeleton className="h-[260px] rounded-lg" />
        </div>
      ) : (
        <>
          <FinanceAnalytics
            transactions={transactions}
            months={months}
            currentMonth={currentMonthKey()}
            primaryCurrency={primaryCurrency}
            rates={rates}
          />
          <StatsCharts
            subscriptions={subscriptions}
            payments={payments || []}
            primaryCurrency={primaryCurrency}
            rates={rates}
          />
        </>
      )}
    </div>
  )
}

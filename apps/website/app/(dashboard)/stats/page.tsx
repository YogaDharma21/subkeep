"use client"

import { useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { StatsCharts } from "@/components/stats-charts"
import { SmartInsights } from "@/components/smart-insights"
import { Skeleton } from "@/components/ui/skeleton"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"

export default function StatsPage() {
  const { isSignedIn } = useAuth()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const payments = useQuery(api.payments.list, isSignedIn ? {} : "skip")

  const { primaryCurrency, rates } = usePrimaryCurrency()

  return (
    <div className="space-y-4 sm:space-y-6">
      {subscriptions && (
        <SmartInsights
          subscriptions={subscriptions}
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
          <Skeleton className="h-[250px] rounded-xl" />
          <Skeleton className="h-[150px] rounded-xl" />
          <Skeleton className="h-[250px] rounded-xl" />
        </div>
      )}
    </div>
  )
}

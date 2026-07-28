"use client"

import { useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { StatsCharts } from "@/components/stats-charts"
import { SmartInsights } from "@/components/smart-insights"
import { Skeleton } from "@/components/ui/skeleton"

export default function StatsPage() {
  const { isSignedIn } = useAuth()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const payments = useQuery(api.payments.list, isSignedIn ? {} : "skip")
  
  const hasUserSettings = !!(api as Record<string, any>).userSettings?.get
  const userSettings = useQuery(
    hasUserSettings ? (api as Record<string, any>).userSettings.get : "skip",
    isSignedIn && hasUserSettings ? {} : "skip"
  )

  const primaryCurrency = userSettings?.primaryCurrency || "IDR"

  return (
    <div className="p-4 space-y-4">
      {subscriptions && (
        <SmartInsights
          subscriptions={subscriptions}
          primaryCurrency={primaryCurrency}
        />
      )}

      {subscriptions ? (
        <StatsCharts
          subscriptions={subscriptions}
          payments={payments || []}
          primaryCurrency={primaryCurrency}
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

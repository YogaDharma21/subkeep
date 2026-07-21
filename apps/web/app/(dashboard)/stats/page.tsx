"use client"

import { useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { StatsCharts } from "@/components/stats-charts"
import { Skeleton } from "@/components/ui/skeleton"

export default function StatsPage() {
  const { isSignedIn } = useAuth()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")

  return (
    <div className="p-4">
      {subscriptions ? (
        <StatsCharts subscriptions={subscriptions} />
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

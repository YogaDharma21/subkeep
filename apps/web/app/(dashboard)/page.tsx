"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SubscriptionCard } from "@/components/subscription-card"
import { Skeleton } from "@/components/ui/skeleton"

export default function HomePage() {
  const { isSignedIn } = useAuth()
  const stats = useQuery(api.subscriptions.getStats, isSignedIn ? {} : "skip")
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const [sortAsc, setSortAsc] = useState(true)

  const sortedSubs = subscriptions
    ? [...subscriptions].sort((a, b) =>
        sortAsc ? a.price - b.price : b.price - a.price
      )
    : []

  return (
    <div className="p-4">
      <div className="mb-4 rounded-xl border border-border bg-background p-5">
        {stats ? (
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-bold">{stats.count}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Subscriptions
              </span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-bold">
                ${stats.monthlyTotal.toFixed(2)}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Per Month
              </span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-bold">
                ${stats.yearlyTotal.toFixed(2)}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Per Year
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-around">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
          </div>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">My Subscriptions</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortAsc(!sortAsc)}
        >
          <ArrowUpDown className="size-3.5" />
          Sort
        </Button>
      </div>

      <div className="space-y-2">
        {subscriptions ? (
          sortedSubs.length > 0 ? (
            sortedSubs.map((sub) => (
              <SubscriptionCard key={sub._id} sub={sub} />
            ))
          ) : (
            <div className="rounded-xl border border-border bg-background py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No subscriptions yet
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

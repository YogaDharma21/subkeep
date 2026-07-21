"use client"

import { useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { CalendarGrid } from "@/components/calendar-grid"
import { Skeleton } from "@/components/ui/skeleton"

export default function CalendarPage() {
  const { isSignedIn } = useAuth()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")

  return (
    <div className="p-4">
      {subscriptions ? (
        <CalendarGrid subscriptions={subscriptions} />
      ) : (
        <div className="space-y-4">
          <Skeleton className="h-[350px] rounded-xl" />
          <Skeleton className="h-[100px] rounded-xl" />
        </div>
      )}
    </div>
  )
}

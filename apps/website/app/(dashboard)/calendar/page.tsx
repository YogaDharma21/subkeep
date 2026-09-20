"use client"

import { useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { CalendarGrid } from "@/components/calendar-grid"
import { TransactionCalendar } from "@/components/transaction-calendar"
import { Skeleton } from "@/components/ui/skeleton"
import { useDocumentTitle } from "@/hooks/use-document-title"

export default function CalendarPage() {
  useDocumentTitle("Calendar")
  const { isSignedIn } = useAuth()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const transactions = useQuery(
    api.transactions.list,
    isSignedIn ? {} : "skip"
  )

  return (
    <div className="space-y-4">
      {subscriptions && transactions ? (
        <>
          <CalendarGrid subscriptions={subscriptions} />
          <TransactionCalendar transactions={transactions} />
        </>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            <Skeleton className="h-[350px] rounded-lg" />
            <Skeleton className="h-[100px] rounded-lg" />
          </div>
        </div>
      )}
    </div>
  )
}

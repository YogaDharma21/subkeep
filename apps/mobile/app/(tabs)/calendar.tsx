import React from "react"
import { ScrollView, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/expo"
import { api } from "@/convex/_generated/api"
import { CalendarGrid } from "@/components/calendar-grid"
import { TransactionCalendar } from "@/components/transaction-calendar"
import { useThemeColor } from "@/hooks/use-theme-color"

export default function CalendarScreen() {
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const transactions = useQuery(api.transactions.list, isSignedIn ? {} : "skip")

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }}>
        {subscriptions && transactions ? (
          <>
            <CalendarGrid subscriptions={subscriptions} />
            <TransactionCalendar transactions={transactions} />
          </>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

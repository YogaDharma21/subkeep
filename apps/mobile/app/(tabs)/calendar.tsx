import React from "react"
import { ScrollView, SafeAreaView, ActivityIndicator } from "react-native"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import { CalendarGrid } from "@/components/calendar-grid"
import { useThemeColor } from "@/hooks/use-theme-color"

export default function CalendarScreen() {
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {subscriptions ? (
          <CalendarGrid subscriptions={subscriptions} />
        ) : (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

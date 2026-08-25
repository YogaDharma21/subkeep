import React from "react"
import { ScrollView, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import { CalendarGrid } from "@/components/calendar-grid"
import { SearchBar } from "@/components/search-bar"
import { useAlert } from "@/components/custom-alert-provider"
import { useThemeColor } from "@/hooks/use-theme-color"

export default function CalendarScreen() {
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const { showSearchModal } = useAlert()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <SearchBar onPress={showSearchModal} placeholder="Search subscriptions, renewal dates..." />

        {subscriptions ? (
          <CalendarGrid subscriptions={subscriptions} />
        ) : (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

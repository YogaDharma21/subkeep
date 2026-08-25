import React from "react"
import { ScrollView, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import { StatsCharts } from "@/components/stats-charts"
import { SmartInsights } from "@/components/smart-insights"
import { SearchBar } from "@/components/search-bar"
import { useAlert } from "@/components/custom-alert-provider"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"

export default function StatsScreen() {
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const { showSearchModal } = useAlert()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const payments = useQuery(api.payments.list, isSignedIn ? {} : "skip")

  const { primaryCurrency, rates } = usePrimaryCurrency()

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <SearchBar onPress={showSearchModal} placeholder="Search statistics, insights..." />

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
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

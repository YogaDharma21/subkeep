import React from "react"
import { ScrollView, SafeAreaView, ActivityIndicator } from "react-native"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import { StatsCharts } from "@/components/stats-charts"
import { SmartInsights } from "@/components/smart-insights"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"

export default function StatsScreen() {
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const payments = useQuery(api.payments.list, isSignedIn ? {} : "skip")

  const { primaryCurrency, rates } = usePrimaryCurrency()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
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

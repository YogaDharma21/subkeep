import React from "react"
import { ScrollView, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/expo"
import { api } from "@/convex/_generated/api"
import { StatsCharts } from "@/components/stats-charts"
import { FinanceAnalytics } from "@/components/finance-analytics"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { currentMonthKey, lastMonths } from "@/constants/finance"

const MONTHS = lastMonths(6)

export default function StatsScreen() {
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const payments = useQuery(api.payments.list, isSignedIn ? {} : "skip")
  const transactions = useQuery(api.transactions.list, isSignedIn ? {} : "skip")

  const { primaryCurrency, rates } = usePrimaryCurrency()

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }}>
        {transactions ? (
          <FinanceAnalytics
            transactions={transactions}
            months={MONTHS}
            currentMonth={currentMonthKey()}
            primaryCurrency={primaryCurrency}
            rates={rates}
          />
        ) : (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
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

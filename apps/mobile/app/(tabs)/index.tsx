import React, { useState, useMemo } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import {
  Search,
  Globe,
  Plus,
  Clock,
  Sparkles,
  ArrowUpDown,
  AlertTriangle,
  Target,
  ChevronDown,
  Check,
  X,
} from "lucide-react-native"
import { SubscriptionCard } from "@/components/subscription-card"
import { UpcomingReminders } from "@/components/upcoming-reminders"
import { SmartInsights } from "@/components/smart-insights"
import { CommandPalette } from "@/components/command-palette"
import { currencies } from "@/constants/currencies"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { differenceInDays } from "date-fns"

export type FilterType = "all" | "due_soon" | "trial" | "regular"

export type SortOption =
  | "billing-asc"
  | "billing-desc"
  | "price-asc"
  | "price-desc"
  | "start-desc"
  | "name-asc"

export default function DashboardScreen() {
  const router = useRouter()
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()

  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const userSettings = useQuery(api.userSettings.get, isSignedIn ? {} : "skip")
  const suspendMutation = useMutation(api.subscriptions.suspend)

  const { primaryCurrency, setPrimaryCurrency, rates } = usePrimaryCurrency()
  const [filter, setFilter] = useState<FilterType>("all")
  const [sortBy, setSortBy] = useState<SortOption>("billing-asc")
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)
  const [sortModalOpen, setSortModalOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  const handleMarkCanceled = async (id: string) => {
    try {
      await suspendMutation({ id: id as never })
    } catch (e) {
      console.error(e)
    }
  }

  // Multi-Currency Converted Monthly & Yearly Totals
  const { count, monthlyTotalConverted, yearlyTotalConverted } = useMemo(() => {
    if (!subscriptions) return { count: 0, monthlyTotalConverted: 0, yearlyTotalConverted: 0 }

    const activeSubs = subscriptions.filter((s) => s.isActive !== false)
    const count = activeSubs.length

    const monthlyTotalConverted = activeSubs.reduce((sum, s) => {
      const cycle = (s.cycle || "monthly").toLowerCase()
      let nativeMonthly = s.price
      if (cycle === "quarterly") nativeMonthly = s.price / 3
      else if (cycle === "semi-annual") nativeMonthly = s.price / 6
      else if (cycle === "yearly") nativeMonthly = s.price / 12
      else if (cycle === "weekly") nativeMonthly = s.price * 4.33
      else if (cycle === "daily") nativeMonthly = s.price * 30
      else if (cycle === "none") nativeMonthly = 0

      const converted = convertCurrency(nativeMonthly, s.currency, primaryCurrency, rates)
      return sum + converted
    }, 0)

    const yearlyTotalConverted = monthlyTotalConverted * 12

    return { count, monthlyTotalConverted, yearlyTotalConverted }
  }, [subscriptions, primaryCurrency, rates])

  // Budget calculations
  const budgetCap = userSettings?.monthlyBudgetCap
  const budgetUsedPct =
    budgetCap && budgetCap > 0
      ? Math.round((monthlyTotalConverted / budgetCap) * 100)
      : null
  const isBudgetExceeded = budgetCap && monthlyTotalConverted > budgetCap

  // Filtered and Sorted Subscriptions
  const filteredSubs = useMemo(() => {
    if (!subscriptions) return []
    let list = [...subscriptions]

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Filter logic
    if (filter === "trial") {
      list = list.filter((s) => s.isTrial)
    } else if (filter === "regular") {
      list = list.filter((s) => !s.isTrial)
    } else if (filter === "due_soon") {
      list = list.filter((s) => {
        const dateStr = s.isTrial && s.trialEndDate ? s.trialEndDate : s.nextBilling
        if (!dateStr) return false
        const targetDate = new Date(dateStr)
        targetDate.setHours(0, 0, 0, 0)
        const diffDays = differenceInDays(targetDate, today)
        return diffDays >= 0 && diffDays <= 7
      })
    }

    // Sort logic
    return list.sort((a, b) => {
      switch (sortBy) {
        case "billing-asc": {
          const dateA = new Date(a.isTrial && a.trialEndDate ? a.trialEndDate : a.nextBilling || "9999-12-31").getTime()
          const dateB = new Date(b.isTrial && b.trialEndDate ? b.trialEndDate : b.nextBilling || "9999-12-31").getTime()
          return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB)
        }
        case "billing-desc": {
          const dateA = new Date(a.isTrial && a.trialEndDate ? a.trialEndDate : a.nextBilling || "1970-01-01").getTime()
          const dateB = new Date(b.isTrial && b.trialEndDate ? b.trialEndDate : b.nextBilling || "1970-01-01").getTime()
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA)
        }
        case "start-desc": {
          const dateA = new Date(a.startDate || "1970-01-01").getTime()
          const dateB = new Date(b.startDate || "1970-01-01").getTime()
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA)
        }
        case "price-asc": {
          const pA = convertCurrency(a.price, a.currency, primaryCurrency, rates)
          const pB = convertCurrency(b.price, b.currency, primaryCurrency, rates)
          return pA - pB
        }
        case "price-desc": {
          const pA = convertCurrency(a.price, a.currency, primaryCurrency, rates)
          const pB = convertCurrency(b.price, b.currency, primaryCurrency, rates)
          return pB - pA
        }
        case "name-asc":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })
  }, [subscriptions, filter, sortBy, primaryCurrency, rates])

  const sortLabels: Record<SortOption, string> = {
    "billing-asc": "Next Billing",
    "billing-desc": "Furthest Billing",
    "price-asc": "Price: Low to High",
    "price-desc": "Price: High to Low",
    "start-desc": "Start: Newest",
    "name-asc": "Name: A to Z",
  }

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 16,
          paddingBottom: 90,
        }}
      >
        {/* Search & Command Bar */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setCommandPaletteOpen(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 11,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Search size={16} color={colors.mutedText} />
            <Text style={{ fontSize: 13, color: colors.mutedText }}>
              Search or type a command...
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: colors.mutedText,
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
              }}
            >
              ⌘K
            </Text>
          </View>
        </TouchableOpacity>

        {/* Dynamic Summary Banner */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 16,
            gap: 12,
          }}
        >
          {/* Header Row with Currency Selector */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingBottom: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Globe size={14} color={colors.primary} />
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.mutedText, textTransform: "uppercase" }}>
                Primary Currency Summary
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setCurrencyModalOpen(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: colors.surface,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text }}>
                {primaryCurrency}
              </Text>
              <ChevronDown size={12} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          {/* 3 Metric Columns */}
          {subscriptions ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
                <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>
                  {count}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: "600", color: colors.mutedText, textTransform: "uppercase" }}>
                  Active Subs
                </Text>
              </View>

              <View style={{ width: 1, height: 32, backgroundColor: colors.border }} />

              <View style={{ flex: 1.3, alignItems: "center", gap: 2, paddingHorizontal: 4 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 16, fontWeight: "900", color: colors.text }}
                >
                  {formatCurrencyAmount(monthlyTotalConverted, primaryCurrency)}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: "600", color: colors.mutedText, textTransform: "uppercase" }}>
                  / Month
                </Text>
              </View>

              <View style={{ width: 1, height: 32, backgroundColor: colors.border }} />

              <View style={{ flex: 1.3, alignItems: "center", gap: 2, paddingHorizontal: 4 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 16, fontWeight: "900", color: colors.text }}
                >
                  {formatCurrencyAmount(yearlyTotalConverted, primaryCurrency)}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: "600", color: colors.mutedText, textTransform: "uppercase" }}>
                  / Year
                </Text>
              </View>
            </View>
          ) : (
            <ActivityIndicator size="small" color={colors.primary} />
          )}

          {/* Monthly Budget Cap Progress Bar */}
          {budgetCap && budgetCap > 0 ? (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: 10,
                gap: 6,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Target size={14} color={colors.primary} />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>
                    Budget Cap
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: isBudgetExceeded ? colors.destructive : colors.mutedText,
                  }}
                >
                  {formatCurrencyAmount(monthlyTotalConverted, primaryCurrency)} / {formatCurrencyAmount(budgetCap, primaryCurrency)} ({budgetUsedPct}%)
                </Text>
              </View>

              <View
                style={{
                  height: 6,
                  width: "100%",
                  backgroundColor: colors.surface,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${Math.min(100, budgetUsedPct || 0)}%`,
                    backgroundColor: isBudgetExceeded
                      ? colors.destructive
                      : (budgetUsedPct || 0) >= 85
                      ? colors.amber
                      : colors.emerald,
                  }}
                />
              </View>

              {isBudgetExceeded ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <AlertTriangle size={12} color={colors.destructive} />
                  <Text style={{ fontSize: 10, fontWeight: "600", color: colors.destructive }}>
                    Budget exceeded by {formatCurrencyAmount(monthlyTotalConverted - budgetCap, primaryCurrency)}!
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Savings Recommendations & Insights */}
        <SmartInsights
          subscriptions={subscriptions || []}
          primaryCurrency={primaryCurrency}
          rates={rates}
        />

        {/* Upcoming Reminders Banner */}
        <UpcomingReminders
          subscriptions={subscriptions || []}
          primaryCurrency={primaryCurrency}
          rates={rates}
          onMarkCanceled={handleMarkCanceled}
        />

        {/* Filter and Sort Toolbar */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1, height: 36 }}
            contentContainerStyle={{ gap: 6, alignItems: "center" }}
          >
            <TouchableOpacity
              onPress={() => setFilter("all")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: filter === "all" ? colors.primary : colors.surface,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: filter === "all" ? colors.primaryForeground : colors.mutedText,
                }}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilter("due_soon")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: filter === "due_soon" ? colors.primary : colors.surface,
              }}
            >
              <Clock size={12} color={filter === "due_soon" ? colors.primaryForeground : colors.mutedText} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: filter === "due_soon" ? colors.primaryForeground : colors.mutedText,
                }}
              >
                Due Soon
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilter("trial")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: filter === "trial" ? colors.emerald : colors.emeraldBackground,
              }}
            >
              <Sparkles size={12} color={filter === "trial" ? "#ffffff" : colors.emerald} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: filter === "trial" ? "#ffffff" : colors.emerald,
                }}
              >
                Trials
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilter("regular")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: filter === "regular" ? colors.primary : colors.surface,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: filter === "regular" ? colors.primaryForeground : colors.mutedText,
                }}
              >
                Regular
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Sort button */}
          <TouchableOpacity
            onPress={() => setSortModalOpen(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: colors.surface,
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <ArrowUpDown size={12} color={colors.mutedText} />
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text }}>
              {sortLabels[sortBy]}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subscriptions List */}
        {subscriptions === undefined ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : filteredSubs.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: "dashed",
              borderRadius: 14,
              padding: 24,
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
              No subscriptions found
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedText, textAlign: "center" }}>
              Tap + below to add your recurring subscriptions.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {filteredSubs.map((sub) => (
              <SubscriptionCard
                key={sub._id}
                sub={sub}
                primaryCurrency={primaryCurrency}
                rates={rates}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button for Add Subscription */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push("/modal/add" as never)}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          elevation: 5,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
        }}
      >
        <Plus size={24} color={colors.primaryForeground} />
      </TouchableOpacity>

      {/* Currency Modal */}
      {currencyModalOpen && (
        <Modal
          visible={currencyModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCurrencyModalOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setCurrencyModalOpen(false)}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: "70%",
                paddingBottom: 24,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                  Select Primary Currency
                </Text>
                <TouchableOpacity onPress={() => setCurrencyModalOpen(false)}>
                  <X size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: 12, gap: 4 }}>
                {currencies.map((c) => {
                  const isSelected = primaryCurrency === c.value
                  return (
                    <TouchableOpacity
                      key={c.value}
                      onPress={async () => {
                        await setPrimaryCurrency(c.value)
                        setCurrencyModalOpen(false)
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderRadius: 10,
                        backgroundColor: isSelected ? colors.surfaceHover : "transparent",
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                        {c.label}
                      </Text>
                      {isSelected ? <Check size={16} color={colors.primary} /> : null}
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Sort Options Modal */}
      {sortModalOpen && (
        <Modal
          visible={sortModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setSortModalOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setSortModalOpen(false)}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: 24,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                  Sort Subscriptions
                </Text>
                <TouchableOpacity onPress={() => setSortModalOpen(false)}>
                  <X size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={{ padding: 12, gap: 4 }}>
                {(
                  [
                    "billing-asc",
                    "billing-desc",
                    "price-asc",
                    "price-desc",
                    "start-desc",
                    "name-asc",
                  ] as SortOption[]
                ).map((opt) => {
                  const isSelected = sortBy === opt
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => {
                        setSortBy(opt)
                        setSortModalOpen(false)
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderRadius: 10,
                        backgroundColor: isSelected ? colors.surfaceHover : "transparent",
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                        {sortLabels[opt]}
                      </Text>
                      {isSelected ? <Check size={16} color={colors.primary} /> : null}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
      {/* Command Palette Modal */}
      <CommandPalette
        visible={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onAddSubscription={() => router.push("/modal/add" as never)}
      />
    </SafeAreaView>
  )
}

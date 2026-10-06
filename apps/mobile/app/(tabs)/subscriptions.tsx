import React, { useState, useMemo } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/expo"
import { api } from "@/convex/_generated/api"
import {
  Globe,
  Clock,
  Sparkles,
  ArrowUpDown,
  AlertTriangle,
  Target,
  ChevronDown,
  Check,
  X,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Receipt,
} from "lucide-react-native"
import { SubscriptionCard } from "@/components/subscription-card"
import { UpcomingReminders } from "@/components/upcoming-reminders"
import { currencies } from "@/constants/currencies"
import { categories, billingCycles } from "@/constants/categories"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { differenceInDays } from "date-fns"

export type StatusFilter = "active" | "due_soon" | "trial" | "canceled" | "all"

export type SortOption =
  | "billing-asc"
  | "billing-desc"
  | "price-asc"
  | "price-desc"
  | "start-desc"
  | "name-asc"

export default function SubscriptionsScreen() {
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()

  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const userSettings = useQuery(api.userSettings.get, isSignedIn ? {} : "skip")
  const suspendMutation = useMutation(api.subscriptions.suspend)

  const { primaryCurrency, setPrimaryCurrency, rates } = usePrimaryCurrency()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedCycle, setSelectedCycle] = useState("all")
  const [sortBy, setSortBy] = useState<SortOption>("billing-asc")

  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)
  const [sortModalOpen, setSortModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [cycleModalOpen, setCycleModalOpen] = useState(false)

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

  // Status Counts for Badges
  const statusCounts = useMemo(() => {
    if (!subscriptions) return { active: 0, due_soon: 0, trial: 0, canceled: 0, all: 0 }
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let active = 0
    let due_soon = 0
    let trial = 0
    let canceled = 0

    for (const sub of subscriptions) {
      const isActive = sub.isActive !== false
      if (isActive) {
        active++
        if (sub.isTrial) trial++
        const dateStr = sub.isTrial && sub.trialEndDate ? sub.trialEndDate : sub.nextBilling
        if (dateStr) {
          const targetDate = new Date(dateStr)
          targetDate.setHours(0, 0, 0, 0)
          const diff = differenceInDays(targetDate, today)
          if (diff >= 0 && diff <= 7) {
            due_soon++
          }
        }
      } else {
        canceled++
      }
    }

    return {
      active,
      due_soon,
      trial,
      canceled,
      all: subscriptions.length,
    }
  }, [subscriptions])

  // Filtered and Sorted Subscriptions
  const filteredSubs = useMemo(() => {
    if (!subscriptions) return []
    let list = [...subscriptions]

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 1. Status Filter
    if (statusFilter === "active") {
      list = list.filter((s) => s.isActive !== false)
    } else if (statusFilter === "due_soon") {
      list = list.filter((s) => {
        if (s.isActive === false) return false
        const dateStr = s.isTrial && s.trialEndDate ? s.trialEndDate : s.nextBilling
        if (!dateStr) return false
        const targetDate = new Date(dateStr)
        targetDate.setHours(0, 0, 0, 0)
        const diffDays = differenceInDays(targetDate, today)
        return diffDays >= 0 && diffDays <= 7
      })
    } else if (statusFilter === "trial") {
      list = list.filter((s) => s.isActive !== false && !!s.isTrial)
    } else if (statusFilter === "canceled") {
      list = list.filter((s) => s.isActive === false)
    }

    // 2. Search query
    const q = searchQuery.toLowerCase().trim()
    if (q) {
      list = list.filter((s) => {
        const matchesName = s.name.toLowerCase().includes(q)
        const matchesCat = s.category.toLowerCase().includes(q)
        const matchesAccount = s.account ? s.account.toLowerCase().includes(q) : false
        const matchesWebsite = s.website ? s.website.toLowerCase().includes(q) : false
        return matchesName || matchesCat || matchesAccount || matchesWebsite
      })
    }

    // 3. Category
    if (selectedCategory !== "all") {
      list = list.filter((s) => s.category.toLowerCase() === selectedCategory.toLowerCase())
    }

    // 4. Cycle
    if (selectedCycle !== "all") {
      list = list.filter((s) => (s.cycle || "monthly").toLowerCase() === selectedCycle.toLowerCase())
    }

    // 5. Sort logic
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
  }, [subscriptions, statusFilter, searchQuery, selectedCategory, selectedCycle, sortBy, primaryCurrency, rates])

  const sortLabels: Record<SortOption, string> = {
    "billing-asc": "Next Billing",
    "billing-desc": "Furthest Billing",
    "price-asc": "Price: Low to High",
    "price-desc": "Price: High to Low",
    "start-desc": "Start: Newest",
    "name-asc": "Name: A to Z",
  }

  const selectedCategoryLabel =
    categories.find((c) => c.value === selectedCategory)?.label || "Category"
  const selectedCycleLabel =
    billingCycles.find((bc) => bc.value === selectedCycle)?.label || "Cycle"

  const isFiltered =
    statusFilter !== "active" ||
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedCycle !== "all"

  const handleClearFilters = () => {
    setStatusFilter("active")
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedCycle("all")
  }

  const getEmptyMessage = () => {
    if (searchQuery.trim() !== "" || selectedCategory !== "all" || selectedCycle !== "all") {
      return {
        title: "No subscriptions match your filters",
        subtitle: "Try adjusting your search query, category, or billing cycle filters.",
      }
    }
    switch (statusFilter) {
      case "due_soon":
        return {
          title: "No subscriptions due in the next 7 days",
          subtitle: "All your upcoming payments are further out.",
        }
      case "trial":
        return {
          title: "No active trial subscriptions",
          subtitle: "You have no subscriptions currently in a trial period.",
        }
      case "canceled":
        return {
          title: "No canceled subscriptions",
          subtitle: "All your subscriptions are currently active.",
        }
      default:
        return {
          title: "No subscriptions yet",
          subtitle: "Tap + below to add your recurring subscriptions.",
        }
    }
  }

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 14,
          paddingBottom: 110,
        }}
      >
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
                  Per Month
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
                  Per Year
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

        {/* Upcoming Reminders Banner */}
        <UpcomingReminders
          subscriptions={subscriptions || []}
          primaryCurrency={primaryCurrency}
          rates={rates}
          onMarkCanceled={handleMarkCanceled}
        />

        {/* Reimagined Filter Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            padding: 12,
            gap: 10,
          }}
        >
          {/* Search Input */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 10,
              gap: 8,
              height: 38,
            }}
          >
            <Search size={14} color={colors.mutedText} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, category, account..."
              placeholderTextColor={colors.mutedText}
              style={{
                flex: 1,
                fontSize: 12,
                color: colors.text,
                paddingVertical: 0,
              }}
              autoCapitalize="none"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={14} color={colors.mutedText} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Status Tabs ScrollView with Badges */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, alignItems: "center" }}
          >
            {/* Active */}
            <TouchableOpacity
              onPress={() => setStatusFilter("active")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: statusFilter === "active" ? colors.primary : colors.surface,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: statusFilter === "active" ? colors.primaryForeground : colors.mutedText,
                }}
              >
                Active
              </Text>
              <View
                style={{
                  backgroundColor: statusFilter === "active" ? "rgba(255,255,255,0.25)" : colors.border,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "700",
                    color: statusFilter === "active" ? colors.primaryForeground : colors.mutedText,
                  }}
                >
                  {statusCounts.active}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Due Soon */}
            <TouchableOpacity
              onPress={() => setStatusFilter("due_soon")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: statusFilter === "due_soon" ? colors.amber : colors.surface,
              }}
            >
              <Clock size={11} color={statusFilter === "due_soon" ? "#ffffff" : colors.amber} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: statusFilter === "due_soon" ? "#ffffff" : colors.mutedText,
                }}
              >
                Due Soon
              </Text>
              <View
                style={{
                  backgroundColor: statusFilter === "due_soon" ? "rgba(255,255,255,0.3)" : colors.border,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "700",
                    color: statusFilter === "due_soon" ? "#ffffff" : colors.amber,
                  }}
                >
                  {statusCounts.due_soon}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Trials */}
            <TouchableOpacity
              onPress={() => setStatusFilter("trial")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: statusFilter === "trial" ? colors.emerald : colors.surface,
              }}
            >
              <Sparkles size={11} color={statusFilter === "trial" ? "#ffffff" : colors.emerald} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: statusFilter === "trial" ? "#ffffff" : colors.mutedText,
                }}
              >
                Trials
              </Text>
              <View
                style={{
                  backgroundColor: statusFilter === "trial" ? "rgba(255,255,255,0.3)" : colors.border,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "700",
                    color: statusFilter === "trial" ? "#ffffff" : colors.emerald,
                  }}
                >
                  {statusCounts.trial}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Canceled */}
            <TouchableOpacity
              onPress={() => setStatusFilter("canceled")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: statusFilter === "canceled" ? colors.destructive : colors.surface,
              }}
            >
              <X size={11} color={statusFilter === "canceled" ? "#ffffff" : colors.destructive} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: statusFilter === "canceled" ? "#ffffff" : colors.mutedText,
                }}
              >
                Canceled
              </Text>
              <View
                style={{
                  backgroundColor: statusFilter === "canceled" ? "rgba(255,255,255,0.3)" : colors.border,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "700",
                    color: statusFilter === "canceled" ? "#ffffff" : colors.destructive,
                  }}
                >
                  {statusCounts.canceled}
                </Text>
              </View>
            </TouchableOpacity>

            {/* All */}
            <TouchableOpacity
              onPress={() => setStatusFilter("all")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: statusFilter === "all" ? colors.primary : colors.surface,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: statusFilter === "all" ? colors.primaryForeground : colors.mutedText,
                }}
              >
                All
              </Text>
              <View
                style={{
                  backgroundColor: statusFilter === "all" ? "rgba(255,255,255,0.25)" : colors.border,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "700",
                    color: statusFilter === "all" ? colors.primaryForeground : colors.mutedText,
                  }}
                >
                  {statusCounts.all}
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Secondary Filter Action Buttons (Category, Cycle, Sort) */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {/* Category Button */}
            <TouchableOpacity
              onPress={() => setCategoryModalOpen(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: selectedCategory !== "all" ? colors.surfaceHover : colors.surface,
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: selectedCategory !== "all" ? colors.primary : colors.border,
              }}
            >
              <SlidersHorizontal size={11} color={selectedCategory !== "all" ? colors.primary : colors.mutedText} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: selectedCategory !== "all" ? "700" : "500",
                  color: selectedCategory !== "all" ? colors.primary : colors.text,
                }}
              >
                {selectedCategory === "all" ? "Category" : selectedCategoryLabel}
              </Text>
              <ChevronDown size={10} color={colors.mutedText} />
            </TouchableOpacity>

            {/* Cycle Button */}
            <TouchableOpacity
              onPress={() => setCycleModalOpen(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: selectedCycle !== "all" ? colors.surfaceHover : colors.surface,
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: selectedCycle !== "all" ? colors.primary : colors.border,
              }}
            >
              <Clock size={11} color={selectedCycle !== "all" ? colors.primary : colors.mutedText} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: selectedCycle !== "all" ? "700" : "500",
                  color: selectedCycle !== "all" ? colors.primary : colors.text,
                }}
              >
                {selectedCycle === "all" ? "Cycle" : selectedCycleLabel}
              </Text>
              <ChevronDown size={10} color={colors.mutedText} />
            </TouchableOpacity>

            {/* Sort Button */}
            <TouchableOpacity
              onPress={() => setSortModalOpen(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: colors.surface,
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                marginLeft: "auto",
              }}
            >
              <ArrowUpDown size={11} color={colors.mutedText} />
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text }}>
                {sortLabels[sortBy]}
              </Text>
              <ChevronDown size={10} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          {/* Active Filter Summary Bar */}
          {isFiltered && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "500", color: colors.mutedText }}>
                Showing {filteredSubs.length} of {subscriptions?.length ?? 0}
              </Text>
              <TouchableOpacity
                onPress={handleClearFilters}
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <RotateCcw size={11} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.primary }}>
                  Reset filters
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
              }}
            >
              <Receipt size={18} color={colors.mutedText} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
              {getEmptyMessage().title}
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedText, textAlign: "center", maxWidth: 280 }}>
              {getEmptyMessage().subtitle}
            </Text>
            {isFiltered && (
              <TouchableOpacity
                onPress={handleClearFilters}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 6,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 8,
                }}
              >
                <RotateCcw size={12} color={colors.text} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>
                  Clear all filters
                </Text>
              </TouchableOpacity>
            )}
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

      {/* Category Modal */}
      {categoryModalOpen && (
        <Modal
          visible={categoryModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCategoryModalOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setCategoryModalOpen(false)}
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
                  Filter by Category
                </Text>
                <TouchableOpacity onPress={() => setCategoryModalOpen(false)}>
                  <X size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: 12, gap: 4 }}>
                {categories.map((c) => {
                  const isSelected = selectedCategory === c.value
                  return (
                    <TouchableOpacity
                      key={c.value}
                      onPress={() => {
                        setSelectedCategory(c.value)
                        setCategoryModalOpen(false)
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
                        {c.value === "all" ? "All Categories" : c.label}
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

      {/* Billing Cycle Modal */}
      {cycleModalOpen && (
        <Modal
          visible={cycleModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCycleModalOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setCycleModalOpen(false)}
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
                  Filter by Billing Cycle
                </Text>
                <TouchableOpacity onPress={() => setCycleModalOpen(false)}>
                  <X size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: 12, gap: 4 }}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCycle("all")
                    setCycleModalOpen(false)
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: selectedCycle === "all" ? colors.surfaceHover : "transparent",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                    All Cycles
                  </Text>
                  {selectedCycle === "all" ? <Check size={16} color={colors.primary} /> : null}
                </TouchableOpacity>

                {billingCycles.map((bc) => {
                  const isSelected = selectedCycle === bc.value
                  return (
                    <TouchableOpacity
                      key={bc.value}
                      onPress={() => {
                        setSelectedCycle(bc.value)
                        setCycleModalOpen(false)
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
                        {bc.label}
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
    </SafeAreaView>
  )
}


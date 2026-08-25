import React, { useState, useMemo, useRef, useEffect } from "react"
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import {
  Search,
  Plus,
  Calendar,
  BarChart3,
  Settings,
  CreditCard,
  Globe,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { convertAndFormat } from "@/lib/currency"
import { currencies } from "@/constants/currencies"
import { useThemeColor } from "@/hooks/use-theme-color"

export interface SearchModalProps {
  visible: boolean
  onClose: () => void
  onAddSubscription?: () => void
}

export function SearchModal({
  visible,
  onClose,
  onAddSubscription,
}: SearchModalProps) {
  const router = useRouter()
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const { primaryCurrency, setPrimaryCurrency, rates } = usePrimaryCurrency()
  const subscriptions = useQuery(
    api.subscriptions.list,
    isSignedIn ? {} : "skip"
  )

  const [query, setQuery] = useState("")
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      setQuery("")
    }
  }, [visible])

  // Filter subscriptions
  const filteredSubs = useMemo(() => {
    if (!subscriptions) return []
    const q = query.trim().toLowerCase()
    if (!q) return subscriptions.slice(0, 6)
    return subscriptions
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.account && s.account.toLowerCase().includes(q))
      )
      .slice(0, 10)
  }, [subscriptions, query])

  // Quick Navigation & Feature Actions
  const quickActions = useMemo(() => {
    const q = query.trim().toLowerCase()
    const actions = [
      {
        id: "add",
        label: "Add New Subscription",
        detail: "Create a custom or template subscription",
        icon: Plus,
        category: "Actions",
        run: () => {
          onClose()
          if (onAddSubscription) {
            onAddSubscription()
          } else {
            router.push("/modal/add" as never)
          }
        },
      },
      {
        id: "cards",
        label: "Payment Methods & Cards",
        detail: "View credit cards, spend breakdown & expiry",
        icon: CreditCard,
        category: "Actions",
        run: () => {
          onClose()
          router.push("/modal/cards" as never)
        },
      },
      {
        id: "nav-calendar",
        label: "Calendar",
        detail: "View billing projections and renewal dates",
        icon: Calendar,
        category: "Navigation",
        run: () => {
          onClose()
          router.push("/(tabs)/calendar" as never)
        },
      },
      {
        id: "nav-stats",
        label: "Statistics",
        detail: "View charts, category breakdown & insights",
        icon: BarChart3,
        category: "Navigation",
        run: () => {
          onClose()
          router.push("/(tabs)/stats" as never)
        },
      },
      {
        id: "nav-settings",
        label: "Settings",
        detail: "Export, restore, currency & preferences",
        icon: Settings,
        category: "Navigation",
        run: () => {
          onClose()
          router.push("/(tabs)/settings" as never)
        },
      },
    ]

    if (!q) return actions
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.detail.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    )
  }, [query, router, onClose, onAddSubscription])

  // Currency search shortcuts
  const currencyActions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (
      !q.startsWith("curr") &&
      !q.includes("usd") &&
      !q.includes("eur") &&
      !q.includes("idr") &&
      !q.includes("gbp") &&
      !q.includes("sgd") &&
      !q.includes("aud")
    ) {
      return []
    }
    return currencies
      .filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.value.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((c) => ({
        id: `currency-${c.value}`,
        label: `Set Primary Currency to ${c.label}`,
        detail: `Convert all totals to ${c.value}`,
        icon: Globe,
        category: "Currency",
        run: async () => {
          await setPrimaryCurrency(c.value)
          onClose()
        },
      }))
  }, [query, setPrimaryCurrency, onClose])

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          justifyContent: "flex-start",
          paddingTop: Platform.OS === "ios" ? 48 : 24,
          paddingHorizontal: 16,
        }}
      >
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              overflow: "hidden",
              maxHeight: "85%",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Search Bar Input */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                gap: 10,
              }}
            >
              <Search size={18} color={colors.mutedText} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Search..."
                placeholderTextColor={colors.mutedText}
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: colors.text,
                  padding: 0,
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query ? (
                <TouchableOpacity onPress={() => setQuery("")} style={{ padding: 4 }}>
                  <X size={16} color={colors.mutedText} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={onClose}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>

            {/* Results Scrollable Area */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 10, gap: 14, paddingBottom: 20 }}
            >
              {/* Subscriptions Section */}
              {filteredSubs.length > 0 && (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 6 }}>
                    SUBSCRIPTIONS ({filteredSubs.length})
                  </Text>
                  <View style={{ gap: 4 }}>
                    {filteredSubs.map((sub) => (
                      <TouchableOpacity
                        key={sub._id}
                        activeOpacity={0.7}
                        onPress={() => {
                          onClose()
                          router.push(`/subscriptions/${sub._id}` as never)
                        }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 10,
                          borderRadius: 10,
                          backgroundColor: colors.surface,
                          gap: 10,
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: sub.color,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <DynamicIcon name={sub.icon} size={16} color="#ffffff" />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                            {sub.name}
                          </Text>
                          <Text numberOfLines={1} style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                            <Text style={{ textTransform: "capitalize" }}>{sub.category}</Text> · Next: {sub.nextBilling}
                            {sub.account ? ` · ${sub.account}` : ""}
                          </Text>
                        </View>

                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>
                            {convertAndFormat(sub.price, sub.currency, primaryCurrency, rates)}
                          </Text>
                          <Text style={{ fontSize: 10, color: colors.mutedText }}>
                            per {sub.cycle === "monthly" ? "month" : sub.cycle === "yearly" ? "year" : sub.cycle}
                          </Text>
                        </View>

                        <ArrowRight size={14} color={colors.mutedText} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Actions & Navigation Section */}
              {quickActions.length > 0 && (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 6 }}>
                    ACTIONS & NAVIGATION
                  </Text>
                  <View style={{ gap: 4 }}>
                    {quickActions.map((action) => {
                      const Icon = action.icon
                      return (
                        <TouchableOpacity
                          key={action.id}
                          activeOpacity={0.7}
                          onPress={action.run}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            padding: 10,
                            borderRadius: 10,
                            backgroundColor: colors.surface,
                            gap: 10,
                          }}
                        >
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              backgroundColor: colors.surfaceHover,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Icon size={16} color={colors.text} />
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                              {action.label}
                            </Text>
                            <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                              {action.detail}
                            </Text>
                          </View>

                          <ArrowRight size={14} color={colors.mutedText} />
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              )}

              {/* Currency Actions Section */}
              {currencyActions.length > 0 && (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 6 }}>
                    CURRENCIES
                  </Text>
                  <View style={{ gap: 4 }}>
                    {currencyActions.map((action) => (
                      <TouchableOpacity
                        key={action.id}
                        activeOpacity={0.7}
                        onPress={action.run}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 10,
                          borderRadius: 10,
                          backgroundColor: colors.surface,
                          gap: 10,
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: colors.surfaceHover,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Globe size={16} color={colors.text} />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                            {action.label}
                          </Text>
                          <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                            {action.detail}
                          </Text>
                        </View>

                        <ArrowRight size={14} color={colors.mutedText} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {filteredSubs.length === 0 && quickActions.length === 0 && (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: colors.mutedText }}>
                    No matching subscriptions found for &quot;{query}&quot;
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Sparkles size={13} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text }}>
                  SubKeep Search
                </Text>
              </View>
              <Text style={{ fontSize: 10, color: colors.mutedText }}>
                Tap item to open
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export const CommandPalette = SearchModal

import React, { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import { Globe, Bell, Target, X, Check } from "lucide-react-native"
import { currencies, getSymbol } from "@/constants/currencies"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/components/custom-alert-provider"

export default function SettingsModal() {
  const router = useRouter()
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const { showToast } = useAlert()

  const userSettings = useQuery(api.userSettings.get, isSignedIn ? {} : "skip")
  const updateSettings = useMutation(api.userSettings.update)

  const { primaryCurrency, setPrimaryCurrency } = usePrimaryCurrency()
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)
  const [localReminderDays, setLocalReminderDays] = useState<number | null>(null)
  const [budgetCapInput, setBudgetCapInput] = useState<string>(
    userSettings?.monthlyBudgetCap !== undefined ? String(userSettings.monthlyBudgetCap) : ""
  )
  const [savingBudget, setSavingBudget] = useState(false)

  const reminderDays = localReminderDays ?? userSettings?.reminderDays ?? 3

  const handleReminderDaysChange = async (days: number) => {
    setLocalReminderDays(days)
    if (isSignedIn) {
      try {
        await updateSettings({ reminderDays: days })
        showToast(`Reminders set to ${days === 0 ? "due date" : `${days} days before`}`, "success")
      } catch {
        showToast("Failed to update reminder settings", "error")
      }
    }
  }

  const handleSaveBudgetCap = async () => {
    setSavingBudget(true)
    const val = budgetCapInput.trim() ? parseFloat(budgetCapInput.trim()) : undefined
    if (isSignedIn) {
      try {
        await updateSettings({ monthlyBudgetCap: val })
        showToast(val ? `Monthly budget cap set to ${getSymbol(primaryCurrency)}${val}` : "Budget cap removed", "success")
      } catch {
        showToast("Failed to save budget cap", "error")
      } finally {
        setSavingBudget(false)
      }
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
          Settings & Preferences
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={16} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* General & Display */}
        <View style={{ gap: 10 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: colors.mutedText,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            General & Display
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
              gap: 14,
            }}
          >
            {/* Primary Currency */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Globe size={18} color={colors.mutedText} />
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                    Primary Currency
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.mutedText }}>
                    All spending converts to this currency
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setCurrencyModalOpen(true)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                  {primaryCurrency} ({getSymbol(primaryCurrency)})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Reminders & Notifications */}
        <View style={{ gap: 10 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: colors.mutedText,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Alerts & Reminders
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Bell size={18} color={colors.mutedText} />
              <View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                  Reminder Timing
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText }}>
                  How many days in advance to highlight upcoming bills
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 6, paddingTop: 4 }}>
              {[0, 1, 3, 5, 7].map((days) => {
                const isSelected = reminderDays === days
                return (
                  <TouchableOpacity
                    key={days}
                    onPress={() => handleReminderDaysChange(days)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: isSelected ? colors.primaryForeground : colors.mutedText,
                      }}
                    >
                      {days === 0 ? "Same Day" : `${days}d`}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </View>

        {/* Monthly Budget Cap */}
        <View style={{ gap: 10 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: colors.mutedText,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Monthly Budget Cap
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Target size={18} color={colors.primary} />
              <View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                  Budget Limit ({primaryCurrency})
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText }}>
                  Shows visual warning progress bar on dashboard
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder={`e.g. 200 (${getSymbol(primaryCurrency)})`}
                  value={budgetCapInput}
                  onChangeText={setBudgetCapInput}
                  keyboardType="numeric"
                />
              </View>
              <Button
                onPress={handleSaveBudgetCap}
                loading={savingBudget}
                style={{ height: 44, paddingHorizontal: 16 }}
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Currency Selector Modal */}
      {currencyModalOpen && (
        <View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "75%",
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

            <ScrollView contentContainerStyle={{ padding: 12, gap: 6 }}>
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
        </View>
      )}
    </SafeAreaView>
  )
}

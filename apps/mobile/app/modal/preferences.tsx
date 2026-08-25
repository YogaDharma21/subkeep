import React, { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import {
  Moon,
  Sun,
  Laptop,
  Globe,
  Bell,
  Target,
  X,
  Check,
  Search,
  SlidersHorizontal,
  BellRing,
} from "lucide-react-native"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { currencies, getSymbol } from "@/constants/currencies"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor, ThemeMode } from "@/hooks/use-theme-color"
import { useAlert } from "@/components/custom-alert-provider"

export default function PreferencesModal() {
  const router = useRouter()
  const { colors, themeMode, setThemeMode } = useThemeColor()
  const { isSignedIn } = useAuth()
  const { primaryCurrency, setPrimaryCurrency } = usePrimaryCurrency()
  const { showAlert, showToast } = useAlert()

  const userSettings = useQuery(api.userSettings.get, isSignedIn ? {} : "skip")
  const updateSettings = useMutation(api.userSettings.update)

  const [localReminderDays, setLocalReminderDays] = useState<number | null>(null)
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)
  const [currencySearch, setCurrencySearch] = useState("")
  const [budgetCapInput, setBudgetCapInput] = useState("")
  const [savingBudget, setSavingBudget] = useState(false)

  const reminderDays = localReminderDays ?? userSettings?.reminderDays ?? 3

  React.useEffect(() => {
    if (userSettings?.monthlyBudgetCap !== undefined && userSettings.monthlyBudgetCap !== null) {
      setBudgetCapInput(String(userSettings.monthlyBudgetCap))
    }
  }, [userSettings?.monthlyBudgetCap])

  const handleThemeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode)
    showToast(
      `Theme set to ${mode === "system" ? "System default" : mode === "dark" ? "Dark Mode" : "Light Mode"}`,
      "success"
    )
  }

  const handleCurrencyChange = async (curr: string) => {
    await setPrimaryCurrency(curr)
    setCurrencyModalOpen(false)
    showToast(`Primary currency updated to ${curr} (${getSymbol(curr)})`, "success")
  }

  const handleReminderDaysChange = async (days: number) => {
    setLocalReminderDays(days)
    try {
      await updateSettings({ reminderDays: days })
      showToast(
        `Alert timing set to ${days === 0 ? "Same day" : `${days} days before`}`,
        "success"
      )
    } catch {
      showAlert({
        title: "Error",
        message: "Failed to update reminder settings.",
        icon: "error",
      })
    }
  }

  const handleSaveBudgetCap = async () => {
    setSavingBudget(true)
    const val = budgetCapInput.trim() ? parseFloat(budgetCapInput.trim()) : undefined
    try {
      await updateSettings({ monthlyBudgetCap: val })
      showToast(
        val
          ? `Budget cap set to ${getSymbol(primaryCurrency)}${val.toLocaleString()}`
          : "Budget cap cleared",
        "success"
      )
    } catch {
      showAlert({
        title: "Error",
        message: "Failed to save monthly budget cap.",
        icon: "error",
      })
    } finally {
      setSavingBudget(false)
    }
  }

  const handleTestNotification = () => {
    showAlert({
      title: "SubKeep Alert Preview",
      message: `Sample renewal alert: Payment of ${getSymbol(primaryCurrency)}14.99 is scheduled in ${reminderDays === 0 ? "today" : `${reminderDays} day(s)`}.`,
      icon: "info",
    })
  }

  const filteredCurrencies = currencies.filter(
    (c) =>
      c.label.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.value.toLowerCase().includes(currencySearch.toLowerCase())
  )

  return (
    <SafeAreaView edges={["top", "bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SlidersHorizontal size={18} color={colors.text} />
          </View>
          <View>
            <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text }}>
              Preferences
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedText }}>
              Theme, currency, and alert controls
            </Text>
          </View>
        </View>

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
          <X size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 50 }}>
        {/* 1. Theme & Appearance */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4 }}>
            APPEARANCE & THEME
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 14,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Moon size={18} color={colors.text} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                  Dark Mode & Interface Theme
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Select light, dark, or follow device system
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8, paddingTop: 4 }}>
              {[
                { mode: "system" as ThemeMode, label: "System", icon: Laptop },
                { mode: "light" as ThemeMode, label: "Light", icon: Sun },
                { mode: "dark" as ThemeMode, label: "Dark", icon: Moon },
              ].map(({ mode, label, icon: IconComponent }) => {
                const isSelected = themeMode === mode
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => handleThemeChange(mode)}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                  >
                    <IconComponent
                      size={14}
                      color={isSelected ? colors.primaryForeground : colors.mutedText}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: isSelected ? colors.primaryForeground : colors.mutedText,
                      }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </View>

        {/* 2. Primary Currency */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4 }}>
            PRIMARY CONVERSION CURRENCY
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCurrencyModalOpen(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 14,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Globe size={18} color={colors.text} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                  Primary Currency
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Convert dashboard, totals, and stats to {primaryCurrency}
                </Text>
              </View>

              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.text }}>
                  {primaryCurrency} ({getSymbol(primaryCurrency)})
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Alerts & Reminders */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4 }}>
            ALERTS & REMINDER TIMING
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 14,
              gap: 14,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Bell size={18} color={colors.text} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                  Renewal & Trial Alerts
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  How many days in advance to notify before billing occurs
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 6 }}>
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

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleTestNotification}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: 10,
                borderRadius: 10,
              }}
            >
              <BellRing size={14} color={colors.text} />
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>
                Send Test Alert Notification
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Monthly Spending Budget Cap */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4 }}>
            MONTHLY SPENDING BUDGET CAP
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 14,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Target size={18} color={colors.text} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                  Monthly Budget Limit
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
                disabled={savingBudget}
                style={{ height: 42, paddingHorizontal: 16 }}
              >
                Save Cap
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Currency Selection Modal */}
      {currencyModalOpen && (
        <Modal
          visible={currencyModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCurrencyModalOpen(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.65)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 360,
                maxHeight: "80%",
                backgroundColor: colors.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
                  Select Primary Currency
                </Text>
                <TouchableOpacity onPress={() => setCurrencyModalOpen(false)}>
                  <X size={18} color={colors.mutedText} />
                </TouchableOpacity>
              </View>

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
                }}
              >
                <Search size={14} color={colors.mutedText} />
                <TextInput
                  placeholder="Search currencies..."
                  placeholderTextColor={colors.mutedText}
                  value={currencySearch}
                  onChangeText={setCurrencySearch}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    fontSize: 13,
                    color: colors.text,
                  }}
                />
              </View>

              <ScrollView style={{ maxHeight: 300 }}>
                <View style={{ gap: 4 }}>
                  {filteredCurrencies.map((c) => {
                    const isSelected = primaryCurrency === c.value
                    return (
                      <TouchableOpacity
                        key={c.value}
                        onPress={() => handleCurrencyChange(c.value)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          backgroundColor: isSelected ? colors.surface : "transparent",
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                            {c.value}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.mutedText }}>
                            ({getSymbol(c.value)}) · {c.label.split(" - ")[1] || c.label}
                          </Text>
                        </View>
                        {isSelected ? <Check size={16} color={colors.primary} /> : null}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  )
}

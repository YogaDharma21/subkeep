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
import { useAuth, useUser } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import {
  Globe,
  Bell,
  Target,
  CreditCard,
  FileSpreadsheet,
  Upload,
  Download,
  FileJson,
  Info,
  LogOut,
  Trash2,
  ChevronRight,
  Check,
  X,
} from "lucide-react-native"
import * as DocumentPicker from "expo-document-picker"
import * as FileSystem from "expo-file-system/legacy"
import * as Sharing from "expo-sharing"
import { currencies, getSymbol } from "@/constants/currencies"
import { exportSubscriptionsToCSV, parseCSVToSubscriptions } from "@/lib/csv"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/components/custom-alert-provider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SettingsScreen() {
  const router = useRouter()
  const { colors } = useThemeColor()
  const { isSignedIn, signOut } = useAuth()
  const { user } = useUser()
  const { showAlert, showToast, showAboutModal } = useAlert()

  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const payments = useQuery(api.payments.list, isSignedIn ? {} : "skip")
  const userSettings = useQuery(api.userSettings.get, isSignedIn ? {} : "skip")

  const updateSettings = useMutation(api.userSettings.update)
  const removeAll = useMutation(api.subscriptions.removeAll)
  const restoreSubscriptions = useMutation(api.subscriptions.restoreAll)
  const restorePayments = useMutation(api.payments.restoreAll)

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
        showToast("Failed to update reminder timing", "error")
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

  const handleExportCSV = async () => {
    if (!subscriptions || subscriptions.length === 0) {
      showAlert({ title: "Export", message: "No subscriptions available to export.", icon: "info" })
      return
    }

    try {
      const csvContent = exportSubscriptionsToCSV(subscriptions)
      const date = new Date().toISOString().split("T")[0]
      const fileUri = `${FileSystem.cacheDirectory}subkeep-subscriptions-${date}.csv`

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      })

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Export Subscriptions CSV",
        })
      } else {
        showToast("CSV generated successfully", "success")
      }
    } catch (e) {
      console.error(e)
      showToast("Failed to export CSV", "error")
    }
  }

  const handleExportJSON = async () => {
    if (!subscriptions || subscriptions.length === 0) {
      showAlert({ title: "Export", message: "No subscriptions available to export.", icon: "info" })
      return
    }

    try {
      const data = subscriptions.map((s) => ({
        name: s.name,
        icon: s.icon,
        color: s.color,
        price: s.price,
        currency: s.currency,
        cycle: s.cycle,
        category: s.category,
        startDate: s.startDate,
        nextBilling: s.nextBilling,
        isActive: s.isActive,
        isTrial: s.isTrial,
        trialEndDate: s.trialEndDate,
        cancelUrl: s.cancelUrl,
        isShared: s.isShared,
        totalPlanPrice: s.totalPlanPrice,
        totalMembers: s.totalMembers,
      }))

      const date = new Date().toISOString().split("T")[0]
      const fileUri = `${FileSystem.cacheDirectory}subkeep-export-${date}.json`

      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify({ subscriptions: data }, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 }
      )

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "Export Subscriptions JSON",
        })
      }
    } catch (e) {
      console.error(e)
      showToast("Failed to export JSON", "error")
    }
  }

  const handleFullBackup = async () => {
    if (!subscriptions || !payments) return

    try {
      const data = {
        version: 1,
        exportDate: new Date().toISOString(),
        subscriptions: subscriptions.map((s) => ({
          name: s.name,
          icon: s.icon,
          color: s.color,
          price: s.price,
          currency: s.currency,
          cycle: s.cycle,
          category: s.category,
          startDate: s.startDate,
          nextBilling: s.nextBilling,
          isActive: s.isActive,
          isTrial: s.isTrial,
          trialEndDate: s.trialEndDate,
          cancelUrl: s.cancelUrl,
          isShared: s.isShared,
          totalPlanPrice: s.totalPlanPrice,
          totalMembers: s.totalMembers,
        })),
        payments: payments.map((p) => ({
          name: p.name,
          icon: p.icon,
          color: p.color,
          amount: p.amount,
          currency: p.currency,
          category: p.category,
          date: p.date,
        })),
      }

      const date = new Date().toISOString().split("T")[0]
      const fileUri = `${FileSystem.cacheDirectory}subkeep-backup-${date}.json`

      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(data, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 }
      )

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "Export Full Backup JSON",
        })
      }
    } catch (e) {
      console.error(e)
      showToast("Failed to create full backup", "error")
    }
  }

  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "*/*"],
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets || result.assets.length === 0) return

      const fileUri = result.assets[0].uri
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      })

      const rows = parseCSVToSubscriptions(content)
      if (rows.length === 0) {
        showAlert({
          title: "Import Failed",
          message: "No valid subscription records found in CSV file.",
          icon: "warning",
        })
        return
      }

      showAlert({
        title: "Restore Subscriptions?",
        message: `Found ${rows.length} subscriptions in CSV. This will import them to your SubKeep account.`,
        icon: "info",
        buttons: [
          { text: "Cancel", style: "cancel" },
          {
            text: "Import",
            onPress: async () => {
              try {
                await restoreSubscriptions({ subscriptions: rows as never[] })
                showToast(`Successfully imported ${rows.length} subscriptions!`, "success")
              } catch {
                showToast("Failed to import CSV records", "error")
              }
            },
          },
        ],
      })
    } catch (e) {
      console.error(e)
      showToast("Failed to read CSV file", "error")
    }
  }

  const handleImportJSON = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "*/*"],
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets || result.assets.length === 0) return

      const fileUri = result.assets[0].uri
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      })

      const data = JSON.parse(content)
      if (!data.subscriptions || !Array.isArray(data.subscriptions)) {
        showAlert({
          title: "Invalid Backup",
          message: "The JSON file does not contain a valid subscription list.",
          icon: "error",
        })
        return
      }

      const count = data.subscriptions.length
      const payCount = data.payments?.length || 0

      showAlert({
        title: "Restore Backup?",
        message: `Ready to restore ${count} subscriptions${payCount > 0 ? ` and ${payCount} payments` : ""}.`,
        icon: "info",
        buttons: [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restore",
            onPress: async () => {
              try {
                await restoreSubscriptions({ subscriptions: data.subscriptions })
                if (data.payments && data.payments.length > 0) {
                  await restorePayments({ payments: data.payments })
                }
                showToast(`Successfully restored ${count} subscriptions!`, "success")
              } catch {
                showToast("Failed to restore backup", "error")
              }
            },
          },
        ],
      })
    } catch (e) {
      console.error(e)
      showToast("Invalid JSON backup file", "error")
    }
  }

  const handleDeleteAll = () => {
    showAlert({
      title: "Delete All Data?",
      message: "This will permanently delete all your subscriptions and payment logs. This action cannot be undone.",
      icon: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await removeAll()
              showToast("All subscription records have been deleted.", "info")
            } catch {
              showToast("Failed to delete data", "error")
            }
          },
        },
      ],
    })
  }

  const handleSignOut = () => {
    showAlert({
      title: "Log Out",
      message: "Are you sure you want to sign out?",
      icon: "info",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await signOut()
          },
        },
      ],
    })
  }

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        {/* User profile card */}
        {user ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 14,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.primaryForeground }}>
                {(user.fullName || user.primaryEmailAddress?.emailAddress || "U").charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
                {user.fullName || "SubKeep User"}
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedText }}>
                {user.primaryEmailAddress?.emailAddress}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Preferences Section */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4 }}>
            GENERAL & PREFERENCES
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
            {/* Primary Currency Row */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCurrencyModalOpen(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 14,
                gap: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
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
                  Convert dashboard & stats to {primaryCurrency}
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>
                    {primaryCurrency} ({getSymbol(primaryCurrency)})
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.mutedText} />
              </View>
            </TouchableOpacity>

            {/* Payment Methods & Card Vault */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/modal/cards" as never)}
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
                <CreditCard size={18} color={colors.text} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                  Payment Methods & Card Vault
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Track cards, expiration alerts & spend breakdown
                </Text>
              </View>

              <ChevronRight size={16} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Alerts & Reminders */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4 }}>
            ALERTS & REMINDERS
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
              gap: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Target size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                  Monthly Budget Limit
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText }}>
                  Shows visual warning progress bar on dashboard
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8, alignItems: "center", paddingTop: 4 }}>
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

        {/* Data & Backup Management */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4 }}>
            DATA & BACKUP
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
              onPress={handleExportCSV}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 14,
                gap: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
                <FileSpreadsheet size={18} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Export as CSV</Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>Download spreadsheet for Excel / Sheets</Text>
              </View>
              <ChevronRight size={16} color={colors.mutedText} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleImportCSV}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 14,
                gap: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
                <Upload size={18} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Import from CSV</Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>Upload spreadsheet to restore subscriptions</Text>
              </View>
              <ChevronRight size={16} color={colors.mutedText} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleExportJSON}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 14,
                gap: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
                <Download size={18} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Export JSON</Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>Download raw JSON subscription records</Text>
              </View>
              <ChevronRight size={16} color={colors.mutedText} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleFullBackup}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 14,
                gap: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
                <FileJson size={18} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Full Backup</Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>Export full backup including payment history</Text>
              </View>
              <ChevronRight size={16} color={colors.mutedText} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleImportJSON}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 14,
                gap: 12,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
                <Upload size={18} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Restore JSON Backup</Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>Import from previous SubKeep JSON backup</Text>
              </View>
              <ChevronRight size={16} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* About App */}
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
            onPress={showAboutModal}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 14,
              gap: 12,
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
              <Info size={18} color={colors.text} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>About SubKeep</Text>
              <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>Version 0.0.1</Text>
            </View>

            <ChevronRight size={16} color={colors.mutedText} />
          </TouchableOpacity>
        </View>

        {/* Sign out and Delete Data Group */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          {isSignedIn && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSignOut}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 14,
                gap: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
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
                <LogOut size={18} color={colors.text} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                  Sign Out
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Log out of this device
                </Text>
              </View>

              <ChevronRight size={16} color={colors.mutedText} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDeleteAll}
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
                backgroundColor: colors.destructiveBackground,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={18} color={colors.destructive} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.destructive }}>
                Delete All Data
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                Permanently erase all subscriptions and payments
              </Text>
            </View>

            <ChevronRight size={16} color={colors.mutedText} />
          </TouchableOpacity>
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

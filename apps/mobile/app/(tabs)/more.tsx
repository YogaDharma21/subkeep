import React from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useQuery, useMutation } from "convex/react"
import { useAuth, useUser } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import {
  Settings,
  CreditCard,
  FileSpreadsheet,
  Upload,
  Download,
  FileJson,
  Info,
  LogOut,
  Trash2,
  ChevronRight,
} from "lucide-react-native"
import * as DocumentPicker from "expo-document-picker"
import * as FileSystem from "expo-file-system/legacy"
import * as Sharing from "expo-sharing"
import { exportSubscriptionsToCSV, parseCSVToSubscriptions } from "@/lib/csv"
import { useThemeColor } from "@/hooks/use-theme-color"

export default function MoreScreen() {
  const router = useRouter()
  const { colors } = useThemeColor()
  const { isSignedIn, signOut } = useAuth()
  const { user } = useUser()

  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const payments = useQuery(api.payments.list, isSignedIn ? {} : "skip")

  const removeAll = useMutation(api.subscriptions.removeAll)
  const restoreSubscriptions = useMutation(api.subscriptions.restoreAll)
  const restorePayments = useMutation(api.payments.restoreAll)

  const handleExportCSV = async () => {
    if (!subscriptions || subscriptions.length === 0) {
      Alert.alert("Export", "No subscriptions available to export.")
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
        Alert.alert("Success", "CSV generated at " + fileUri)
      }
    } catch (e) {
      console.error(e)
      Alert.alert("Error", "Failed to export CSV")
    }
  }

  const handleExportJSON = async () => {
    if (!subscriptions || subscriptions.length === 0) {
      Alert.alert("Export", "No subscriptions available to export.")
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
      Alert.alert("Error", "Failed to export JSON")
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
      Alert.alert("Error", "Failed to create full backup")
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
        Alert.alert("Import Failed", "No valid subscription records found in CSV file.")
        return
      }

      Alert.alert(
        "Restore Subscriptions?",
        `Found ${rows.length} subscriptions in CSV. This will import them to your SubKeep account.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Import",
            onPress: async () => {
              try {
                await restoreSubscriptions({ subscriptions: rows as never[] })
                Alert.alert("Success", `Successfully imported ${rows.length} subscriptions!`)
              } catch {
                Alert.alert("Error", "Failed to import CSV records")
              }
            },
          },
        ]
      )
    } catch (e) {
      console.error(e)
      Alert.alert("Error", "Failed to read CSV file")
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
        Alert.alert("Invalid Backup", "The JSON file does not contain a valid subscription list.")
        return
      }

      const count = data.subscriptions.length
      const payCount = data.payments?.length || 0

      Alert.alert(
        "Restore Backup?",
        `Ready to restore ${count} subscriptions${payCount > 0 ? ` and ${payCount} payments` : ""}.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restore",
            onPress: async () => {
              try {
                await restoreSubscriptions({ subscriptions: data.subscriptions })
                if (data.payments && data.payments.length > 0) {
                  await restorePayments({ payments: data.payments })
                }
                Alert.alert("Success", `Successfully restored ${count} subscriptions!`)
              } catch {
                Alert.alert("Error", "Failed to restore backup")
              }
            },
          },
        ]
      )
    } catch (e) {
      console.error(e)
      Alert.alert("Error", "Invalid JSON backup file")
    }
  }

  const handleDeleteAll = () => {
    Alert.alert(
      "Delete All Data?",
      "This will permanently delete all your subscriptions and payment logs. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await removeAll()
              Alert.alert("Deleted", "All your subscription records have been deleted.")
            } catch {
              Alert.alert("Error", "Failed to delete data")
            }
          },
        },
      ]
    )
  }

  const handleSignOut = () => {
    Alert.alert("Log Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await signOut()
        },
      },
    ])
  }

  const menuGroups = [
    [
      {
        id: "settings",
        icon: Settings,
        label: "Settings & Budget Cap",
        desc: "Dark mode, primary currency, budget limits",
        onPress: () => router.push("/modal/settings" as never),
      },
      {
        id: "cards",
        icon: CreditCard,
        label: "Payment Methods & Card Vault",
        desc: "Track cards, expiration alerts & spend breakdown",
        onPress: () => router.push("/modal/cards" as never),
      },
    ],
    [
      {
        id: "export-csv",
        icon: FileSpreadsheet,
        label: "Export as CSV",
        desc: "Download spreadsheet for Excel / Sheets",
        onPress: handleExportCSV,
      },
      {
        id: "import-csv",
        icon: Upload,
        label: "Import from CSV",
        desc: "Upload spreadsheet to restore subscriptions",
        onPress: handleImportCSV,
      },
      {
        id: "export-json",
        icon: Download,
        label: "Export JSON",
        desc: "Download raw JSON subscription records",
        onPress: handleExportJSON,
      },
      {
        id: "backup",
        icon: FileJson,
        label: "Full Backup",
        desc: "Export full backup including payment history",
        onPress: handleFullBackup,
      },
      {
        id: "restore",
        icon: Upload,
        label: "Restore JSON Backup",
        desc: "Import from previous SubKeep JSON backup",
        onPress: handleImportJSON,
      },
    ],
    [
      {
        id: "about",
        icon: Info,
        label: "About SubKeep",
        desc: "Version 1.0.0 (Mobile)",
        onPress: () => {
          Alert.alert(
            "About SubKeep",
            "SubKeep is a sleek subscription management and analytics platform designed to keep recurring expenses organized.\n\nOpen Source on GitHub.",
            [
              { text: "Close", style: "cancel" },
              {
                text: "GitHub",
                onPress: () => Linking.openURL("https://github.com/YogaDharma21/subkeep"),
              },
            ]
          )
        },
      },
    ],
  ]

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
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

        {/* Menu Groups */}
        {menuGroups.map((group, gi) => (
          <View
            key={gi}
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {group.map((item, ii) => {
              const Icon = item.icon
              const isLast = ii === group.length - 1
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={item.onPress}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    gap: 12,
                    borderBottomWidth: isLast ? 0 : 1,
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
                    <Icon size={18} color={colors.text} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                      {item.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                      {item.desc}
                    </Text>
                  </View>

                  <ChevronRight size={16} color={colors.mutedText} />
                </TouchableOpacity>
              )
            })}
          </View>
        ))}

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
    </SafeAreaView>
  )
}

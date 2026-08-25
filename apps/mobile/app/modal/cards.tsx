import React, { useState, useMemo } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  CreditCard,
  Plus,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react-native"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { convertAndFormat } from "@/lib/currency"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"

const CARD_TYPES = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "amex", label: "Amex" },
  { value: "paypal", label: "PayPal" },
  { value: "applepay", label: "Apple Pay" },
  { value: "bank", label: "Bank" },
  { value: "other", label: "Other" },
]

const COLOR_OPTIONS = [
  "#1e293b", // Slate
  "#0f172a", // Dark
  "#1e40af", // Blue (Chase/Amex)
  "#b91c1c", // Red
  "#047857", // Emerald
  "#6b21a8", // Purple
  "#b45309", // Amber
]

export default function CardsModal() {
  const router = useRouter()
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const { primaryCurrency, rates } = usePrimaryCurrency()

  const paymentMethods = useQuery(
    api.paymentMethods.list,
    isSignedIn ? {} : "skip"
  )
  const subscriptions = useQuery(
    api.subscriptions.list,
    isSignedIn ? {} : "skip"
  )

  const createMutation = useMutation(api.paymentMethods.create)
  const removeMutation = useMutation(api.paymentMethods.remove)

  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState("visa")
  const [last4, setLast4] = useState("")
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [expiryMonth, setExpiryMonth] = useState("")
  const [expiryYear, setExpiryYear] = useState("")
  const [loading, setLoading] = useState(false)

  // Calculate monthly spending per card
  const cardSpendStats = useMemo(() => {
    const map: Record<string, { totalMonthly: number; subCount: number }> = {}
    if (!subscriptions) return map

    subscriptions.forEach((sub) => {
      if (sub.isActive === false || !sub.paymentMethodId) return
      if (!map[sub.paymentMethodId]) {
        map[sub.paymentMethodId] = { totalMonthly: 0, subCount: 0 }
      }
      const cycle = (sub.cycle || "monthly").toLowerCase()
      let m = sub.price
      if (cycle === "quarterly") m = sub.price / 3
      else if (cycle === "semi-annual") m = sub.price / 6
      else if (cycle === "yearly") m = sub.price / 12
      else if (cycle === "weekly") m = sub.price * 4.33
      else if (cycle === "daily") m = sub.price * 30
      else if (cycle === "none") m = 0

      map[sub.paymentMethodId].totalMonthly += m
      map[sub.paymentMethodId].subCount += 1
    })
    return map
  }, [subscriptions])

  // Expiry check
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const checkExpiryStatus = (month?: number, year?: number) => {
    if (!year || !month) return null
    const isExpired = year < currentYear || (year === currentYear && month < currentMonth)
    if (isExpired) return "expired"
    const monthsUntil = (year - currentYear) * 12 + (month - currentMonth)
    if (monthsUntil <= 2) return "expiring_soon"
    return null
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a name for the payment method")
      return
    }

    setLoading(true)
    try {
      await createMutation({
        name: name.trim(),
        type,
        last4: last4.trim() ? last4.trim().slice(-4) : undefined,
        color,
        expiryMonth: expiryMonth ? parseInt(expiryMonth) : undefined,
        expiryYear: expiryYear ? parseInt(expiryYear) : undefined,
      })
      setName("")
      setLast4("")
      setExpiryMonth("")
      setExpiryYear("")
      setIsAdding(false)
    } catch {
      Alert.alert("Error", "Failed to add payment method")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id: string, cardName: string) => {
    Alert.alert(
      "Delete Payment Method",
      `Are you sure you want to remove ${cardName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMutation({ id: id as Id<"paymentMethods"> })
            } catch {
              Alert.alert("Error", "Failed to delete payment method")
            }
          },
        },
      ]
    )
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
          Card Vault & Payment Methods
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

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Top Action Bar */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase" }}>
            Saved Cards & Accounts ({paymentMethods?.length || 0})
          </Text>
          <Button
            size="sm"
            variant={isAdding ? "secondary" : "primary"}
            onPress={() => setIsAdding(!isAdding)}
            icon={isAdding ? <X size={14} color={colors.secondaryForeground} /> : <Plus size={14} color={colors.primaryForeground} />}
          >
            {isAdding ? "Cancel" : "Add Card"}
          </Button>
        </View>

        {/* Add Card Form */}
        {isAdding && (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 16,
              gap: 14,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
              New Payment Method
            </Text>

            <Input
              label="Card or Account Name"
              placeholder="e.g. Chase Sapphire, Apple Card, BCA"
              value={name}
              onChangeText={setName}
            />

            {/* Type selector */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedText, textTransform: "uppercase" }}>
                Type
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {CARD_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setType(t.value)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: type === t.value ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: type === t.value ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: type === t.value ? colors.primaryForeground : colors.mutedText,
                      }}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Color Palette */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedText, textTransform: "uppercase" }}>
                Card Theme Color
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {COLOR_OPTIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: c,
                      borderWidth: color === c ? 2 : 0,
                      borderColor: "#ffffff",
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Last 4 digits */}
            <Input
              label="Last 4 Digits (Optional)"
              placeholder="e.g. 4242"
              value={last4}
              onChangeText={setLast4}
              maxLength={4}
              keyboardType="number-pad"
            />

            {/* Expiry date */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Exp Month (1-12)"
                  placeholder="MM"
                  value={expiryMonth}
                  onChangeText={setExpiryMonth}
                  maxLength={2}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Exp Year"
                  placeholder="YYYY"
                  value={expiryYear}
                  onChangeText={setExpiryYear}
                  maxLength={4}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <Button onPress={handleCreate} loading={loading} style={{ marginTop: 4 }}>
              Save Payment Method
            </Button>
          </View>
        )}

        {/* Cards List */}
        {paymentMethods === undefined ? (
          <Text style={{ fontSize: 13, color: colors.mutedText, textAlign: "center", paddingVertical: 20 }}>
            Loading cards...
          </Text>
        ) : paymentMethods.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 24,
              alignItems: "center",
              gap: 8,
            }}
          >
            <CreditCard size={32} color={colors.mutedText} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
              No payment methods saved
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedText, textAlign: "center" }}>
              Add your credit cards to track card expiration dates and see spending breakdowns per card.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {paymentMethods.map((card) => {
              const stats = cardSpendStats[card._id] || { totalMonthly: 0, subCount: 0 }
              const expiryStatus = checkExpiryStatus(card.expiryMonth, card.expiryYear)

              return (
                <View
                  key={card._id}
                  style={{
                    backgroundColor: card.color || "#1e293b",
                    borderRadius: 14,
                    padding: 16,
                    gap: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ gap: 2 }}>
                      <Text style={{ fontSize: 16, fontWeight: "800", color: "#ffffff" }}>
                        {card.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>
                        {card.type} {card.last4 ? `•••• ${card.last4}` : ""}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(card._id, card.name)}
                      style={{
                        padding: 6,
                        borderRadius: 6,
                        backgroundColor: "rgba(0,0,0,0.3)",
                      }}
                    >
                      <Trash2 size={14} color="#ffffff" />
                    </TouchableOpacity>
                  </View>

                  {/* Expiry alert */}
                  {expiryStatus && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor:
                          expiryStatus === "expired" ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.3)",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <AlertTriangle size={12} color="#ffffff" />
                      <Text style={{ fontSize: 10, fontWeight: "700", color: "#ffffff" }}>
                        {expiryStatus === "expired" ? "CARD EXPIRED" : "EXPIRING SOON"} (
                        {card.expiryMonth}/{card.expiryYear})
                      </Text>
                    </View>
                  )}

                  {/* Footer stats */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTopWidth: 1,
                      borderTopColor: "rgba(255,255,255,0.15)",
                      paddingTop: 8,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
                      {stats.subCount} active subscription{stats.subCount === 1 ? "" : "s"}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#ffffff" }}>
                      {convertAndFormat(stats.totalMonthly, "USD", primaryCurrency, rates)}/mo
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

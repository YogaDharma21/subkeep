import React, { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import { X } from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { Button } from "@/components/ui/button"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/components/custom-alert-provider"
import {
  TransactionType,
  expenseCategories,
  incomeCategories,
  financeCategoryMeta,
  todayKey,
} from "@/constants/finance"

export default function AddTransactionModal() {
  const router = useRouter()
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const { showToast } = useAlert()

  const create = useMutation(api.transactions.create)
  const accounts = useQuery(api.accounts.list, isSignedIn ? {} : "skip")

  const [type, setType] = useState<TransactionType>("expense")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("food")
  const [date, setDate] = useState(todayKey())
  const [note, setNote] = useState("")
  const [accountId, setAccountId] = useState("")
  const [toAccountId, setToAccountId] = useState("")
  const [loading, setLoading] = useState(false)

  const categoryOptions = type === "income" ? incomeCategories : expenseCategories
  const activeCategory = financeCategoryMeta(type === "transfer" ? "transfer" : category)

  const handleTypeChange = (next: TransactionType) => {
    setType(next)
    if (next === "income" && !incomeCategories.some((c) => c.value === category)) {
      setCategory("salary")
    }
    if (next === "expense" && !expenseCategories.some((c) => c.value === category)) {
      setCategory("food")
    }
  }

  const handleSave = async () => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      showToast("Please enter a valid amount", "error")
      return
    }
    if (!date) {
      showToast("Please enter a date (YYYY-MM-DD)", "error")
      return
    }
    if (type === "transfer" && (!accountId || !toAccountId || accountId === toAccountId)) {
      showToast("Pick two different accounts for a transfer", "error")
      return
    }
    setLoading(true)
    try {
      const accountCurrency =
        accounts?.find((a) => a._id === accountId)?.currency || "IDR"
      await create({
        type,
        amount: parsed,
        currency: accountCurrency,
        category: type === "transfer" ? "transfer" : category,
        date,
        note: note.trim() ? note.trim() : undefined,
        accountId: (accountId || undefined) as never,
        toAccountId: (type === "transfer" ? toAccountId || undefined : undefined) as never,
        icon: activeCategory.icon,
        color: activeCategory.color,
      })
      showToast(
        type === "income" ? "Income added" : type === "transfer" ? "Transfer recorded" : "Expense added",
        "success"
      )
      router.back()
    } catch (e) {
      console.error(e)
      showToast("Failed to save transaction", "error")
    } finally {
      setLoading(false)
    }
  }

  const typeTabs: Array<{ value: TransactionType; label: string }> = [
    { value: "expense", label: "Expense" },
    { value: "income", label: "Income" },
    { value: "transfer", label: "Transfer" },
  ]

  return (
    <SafeAreaView edges={["top", "bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
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
          Add Transaction
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

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}>
        {/* Type selector */}
        <View
          style={{
            flexDirection: "row",
            gap: 6,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 4,
          }}
        >
          {typeTabs.map((t) => (
            <TouchableOpacity
              key={t.value}
              onPress={() => handleTypeChange(t.value)}
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: 8,
                alignItems: "center",
                backgroundColor:
                  type === t.value
                    ? t.value === "income"
                      ? colors.emerald
                      : t.value === "transfer"
                      ? colors.blue
                      : colors.primary
                    : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color:
                    type === t.value
                      ? t.value === "expense"
                        ? colors.primaryForeground
                        : "#ffffff"
                      : colors.mutedText,
                }}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>AMOUNT</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.mutedText}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 20,
                fontWeight: "800",
                color: colors.text,
                backgroundColor: colors.surface,
              }}
            />
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.mutedText, width: 36 }}>
              {accounts?.find((a) => a._id === accountId)?.currency || "IDR"}
            </Text>
          </View>
        </View>

        {/* Categories */}
        {type !== "transfer" ? (
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>CATEGORY</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {categoryOptions.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  onPress={() => setCategory(c.value)}
                  style={{
                    width: "22%",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 4,
                    borderRadius: 12,
                    backgroundColor: category === c.value ? colors.surfaceHover : colors.surface,
                    borderWidth: category === c.value ? 1.5 : 0,
                    borderColor: colors.primary,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: c.color,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <DynamicIcon name={c.icon} size={15} color="#ffffff" />
                  </View>
                  <Text
                    numberOfLines={2}
                    style={{ fontSize: 9, fontWeight: "600", color: colors.text, textAlign: "center" }}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* Accounts */}
        <View style={{ flexDirection: type === "transfer" ? "row" : "column", gap: 10 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>
              {type === "transfer" ? "FROM ACCOUNT" : "ACCOUNT (OPTIONAL)"}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              <TouchableOpacity
                onPress={() => setAccountId("")}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: !accountId ? colors.primary : colors.surface,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: !accountId ? colors.primaryForeground : colors.mutedText,
                  }}
                >
                  None
                </Text>
              </TouchableOpacity>
              {(accounts || []).map((a) => (
                <TouchableOpacity
                  key={a._id}
                  onPress={() => setAccountId(a._id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: accountId === a._id ? colors.primary : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: accountId === a._id ? colors.primaryForeground : colors.text,
                    }}
                  >
                    {a.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {type === "transfer" ? (
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>TO ACCOUNT</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {(accounts || [])
                  .filter((a) => a._id !== accountId)
                  .map((a) => (
                    <TouchableOpacity
                      key={a._id}
                      onPress={() => setToAccountId(a._id)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: toAccountId === a._id ? colors.primary : colors.surface,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: toAccountId === a._id ? colors.primaryForeground : colors.text,
                        }}
                      >
                        {a.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          ) : null}
        </View>

        {/* Date & Note */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>DATE</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedText}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 9,
                fontSize: 14,
                color: colors.text,
                backgroundColor: colors.surface,
              }}
            />
          </View>
          <View style={{ flex: 1.4, gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>NOTE</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={type === "income" ? "e.g. March salary" : "e.g. Lunch with team"}
              placeholderTextColor={colors.mutedText}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 9,
                fontSize: 14,
                color: colors.text,
                backgroundColor: colors.surface,
              }}
            />
          </View>
        </View>

        <Button size="lg" onPress={handleSave} loading={loading} style={{ marginTop: 8 }}>
          {type === "income" ? "Add Income" : type === "transfer" ? "Record Transfer" : "Add Expense"}
        </Button>
      </ScrollView>
    </SafeAreaView>
  )
}

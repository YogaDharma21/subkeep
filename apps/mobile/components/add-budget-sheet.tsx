import React, { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/expo"
import { api } from "@/convex/_generated/api"
import { X } from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/hooks/use-alert"
import {
  expenseCategories,
  financeCategoryMeta,
  currentMonthKey,
} from "@/constants/finance"

interface AddBudgetSheetProps {
  visible: boolean
  onClose: () => void
}

export function AddBudgetSheet({ visible, onClose }: AddBudgetSheetProps) {
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const { showToast } = useAlert()
  const { primaryCurrency } = usePrimaryCurrency()

  const month = currentMonthKey()
  const budgets = useQuery(api.budgets.list, isSignedIn && visible ? { month } : "skip")
  const upsertMutation = useMutation(api.budgets.upsert)

  const [category, setCategory] = useState("food")
  const [amount, setAmount] = useState("")

  const usedCategories = new Set((budgets || []).map((b) => b.category))
  const availableCategories = expenseCategories.filter((c) => !usedCategories.has(c.value))
  const categoryOptions = availableCategories.length > 0 ? availableCategories : expenseCategories

  const resetForm = () => {
    setCategory("food")
    setAmount("")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSave = async () => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      showToast("Please enter a valid budget amount", "error")
      return
    }
    try {
      await upsertMutation({ category, amount: parsed, currency: primaryCurrency, month })
      const meta = financeCategoryMeta(category)
      showToast(`Budget set for ${meta.label}`, "success")
      handleClose()
    } catch {
      showToast("Failed to save budget", "error")
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <TouchableOpacity activeOpacity={1} onPress={handleClose} style={{ flex: 1 }} />
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "90%",
            paddingBottom: 28,
          }}
        >
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
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
              Set Budget
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={15} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>CATEGORY</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {categoryOptions.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    onPress={() => setCategory(c.value)}
                    style={{
                      width: "48.5%",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      borderRadius: 8,
                      backgroundColor: category === c.value ? colors.surfaceHover : colors.surface,
                      borderWidth: category === c.value ? 1.5 : 0,
                      borderColor: colors.primary,
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        backgroundColor: category === c.value ? colors.background : colors.surfaceHover,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <DynamicIcon name={c.icon} size={12} color={colors.text} />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 11, fontWeight: "600", color: colors.text, flex: 1 }}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>
                MONTHLY CAP ({primaryCurrency})
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder={`Monthly cap in ${primaryCurrency}`}
                  placeholderTextColor={colors.mutedText}
                  style={{
                    flex: 1,
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
                <TouchableOpacity
                  onPress={handleSave}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primaryForeground }}>
                    Set
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

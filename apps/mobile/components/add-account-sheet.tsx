import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { X } from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert, AccountEditing } from "@/hooks/use-alert"
import { accountTypeMeta, accountTypes } from "@/constants/finance"
import { colorPresets } from "@/constants/categories"
import { currencies } from "@/constants/currencies"

interface AddAccountSheetProps {
  visible: boolean
  onClose: () => void
  editing?: AccountEditing | null
}

export function AddAccountSheet({ visible, onClose, editing }: AddAccountSheetProps) {
  const { colors } = useThemeColor()
  const { showToast } = useAlert()
  const { primaryCurrency } = usePrimaryCurrency()

  const createMutation = useMutation(api.accounts.create)
  const updateMutation = useMutation(api.accounts.update)

  const [name, setName] = useState("")
  const [type, setType] = useState("checking")
  const [balance, setBalance] = useState("")
  const [currency, setCurrency] = useState("IDR")
  const [last4, setLast4] = useState("")
  const [selectedColor, setSelectedColor] = useState("#6366F1")

  // (Re)initialize fields every time the sheet opens.
  useEffect(() => {
    if (visible) {
      if (editing) {
        setName(editing.name)
        setType(editing.type)
        setBalance(String(editing.balance))
        setCurrency(editing.currency)
        setLast4(editing.last4 || "")
        setSelectedColor(editing.color)
      } else {
        setName("")
        setType("checking")
        setBalance("")
        setCurrency(primaryCurrency)
        setLast4("")
        setSelectedColor("#6366F1")
      }
    }
  }, [visible, editing, primaryCurrency])

  const handleSave = async () => {
    if (!name.trim()) {
      showToast("Please enter an account name", "error")
      return
    }
    const parsed = parseFloat(balance || "0")
    if (isNaN(parsed)) {
      showToast("Please enter a valid balance", "error")
      return
    }
    try {
      const meta = accountTypeMeta(type)
      if (editing) {
        await updateMutation({
          id: editing._id as never,
          name: name.trim(),
          type,
          balance: parsed,
          currency,
          icon: meta.icon,
          color: selectedColor,
          last4: last4 || undefined,
        })
        showToast("Account updated", "success")
      } else {
        await createMutation({
          name: name.trim(),
          type,
          balance: parsed,
          currency,
          icon: meta.icon,
          color: selectedColor,
          last4: last4 || undefined,
        })
        showToast("Account added", "success")
      }
      onClose()
    } catch {
      showToast("Failed to save account", "error")
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1 }} />
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
              {editing ? "Edit Account" : "Add Account"}
            </Text>
            <TouchableOpacity
              onPress={onClose}
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
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>TYPE</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {accountTypes.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setType(t.value)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      borderRadius: 8,
                      backgroundColor: type === t.value ? colors.primary : colors.surface,
                    }}
                  >
                    <DynamicIcon
                      name={t.icon}
                      size={13}
                      color={type === t.value ? colors.primaryForeground : colors.mutedText}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: type === t.value ? colors.primaryForeground : colors.mutedText,
                      }}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>NAME</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. BCA Checking, Cash Wallet"
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

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>BALANCE</Text>
                <TextInput
                  value={balance}
                  onChangeText={setBalance}
                  keyboardType="numeric"
                  placeholder="0.00"
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
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>CURRENCY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                  {currencies.map((c) => (
                    <TouchableOpacity
                      key={c.value}
                      onPress={() => setCurrency(c.value)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 9,
                        borderRadius: 8,
                        backgroundColor: currency === c.value ? colors.primary : colors.surface,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: currency === c.value ? colors.primaryForeground : colors.mutedText,
                        }}
                      >
                        {c.value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>COLOR</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {colorPresets.slice(0, 8).map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setSelectedColor(c)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: c,
                      borderWidth: selectedColor.toLowerCase() === c.toLowerCase() ? 2.5 : 0,
                      borderColor: colors.primary,
                    }}
                  />
                ))}
              </View>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>LAST 4 (OPTIONAL)</Text>
              <TextInput
                value={last4}
                onChangeText={(v) => setLast4(v.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 4242"
                placeholderTextColor={colors.mutedText}
                maxLength={4}
                keyboardType="number-pad"
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

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={onClose}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.surface, alignItems: "center" }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center" }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primaryForeground }}>
                  {editing ? "Save" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

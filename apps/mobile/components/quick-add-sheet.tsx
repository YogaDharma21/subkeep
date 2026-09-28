import React from "react"
import { Modal, View, Text, TouchableOpacity } from "react-native"
import {
  ArrowLeftRight,
  PiggyBank,
  Repeat,
  Wallet,
  X,
} from "lucide-react-native"
import { useThemeColor } from "@/hooks/use-theme-color"

export type QuickAddKind = "transaction" | "subscription" | "account" | "budget"

interface QuickAddSheetProps {
  visible: boolean
  onClose: () => void
  onSelect: (kind: QuickAddKind) => void
}

const options: Array<{
  kind: QuickAddKind
  label: string
  detail: string
  icon: typeof Wallet
}> = [
  {
    kind: "transaction",
    label: "Transaction",
    detail: "Expense, income, transfer",
    icon: ArrowLeftRight,
  },
  {
    kind: "subscription",
    label: "Subscription",
    detail: "Recurring bill or trial",
    icon: Repeat,
  },
  {
    kind: "account",
    label: "Account",
    detail: "Bank, cash, e-wallet",
    icon: Wallet,
  },
  {
    kind: "budget",
    label: "Budget",
    detail: "Monthly category cap",
    icon: PiggyBank,
  },
]

export function QuickAddSheet({ visible, onClose, onSelect }: QuickAddSheetProps) {
  const { colors } = useThemeColor()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "flex-end",
        }}
      >
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1 }} />
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: colors.border,
            padding: 16,
            paddingBottom: 32,
            gap: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
              Quick Add
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Close quick add"
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {options.map((opt) => {
              const Icon = opt.icon
              return (
                <TouchableOpacity
                  key={opt.kind}
                  activeOpacity={0.7}
                  onPress={() => onSelect(opt.kind)}
                  accessibilityLabel={`Add ${opt.label}`}
                  style={{
                    width: "48.5%",
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 14,
                    padding: 12,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: colors.surfaceHover,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={17} color={colors.text} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                      {opt.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 2 }}>
                      {opt.detail}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </View>
    </Modal>
  )
}

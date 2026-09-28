import React, { useEffect, useRef, useState } from "react"
import { Animated, Easing, Modal, Text, TouchableOpacity, View } from "react-native"
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

const SHEET_HIDDEN_Y = 500

export function QuickAddSheet({ visible, onClose, onSelect }: QuickAddSheetProps) {
  const { colors } = useThemeColor()
  const [mounted, setMounted] = useState(false)
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const sheetTranslate = useRef(new Animated.Value(SHEET_HIDDEN_Y)).current
  const exitAnim = useRef<Animated.CompositeAnimation | null>(null)

  // Mount on open, play the exit animation before unmounting on close so the
  // dim backdrop fades out instead of vanishing mid-slide.
  useEffect(() => {
    if (visible) {
      exitAnim.current?.stop()
      exitAnim.current = null
      setMounted(true)
    } else if (mounted) {
      exitAnim.current = Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslate, {
          toValue: SHEET_HIDDEN_Y,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
      exitAnim.current.start(() => {
        exitAnim.current = null
        setMounted(false)
      })
    }
  }, [visible, mounted, backdropOpacity, sheetTranslate])

  // Enter animation once mounted.
  useEffect(() => {
    if (mounted && visible) {
      backdropOpacity.setValue(0)
      sheetTranslate.setValue(SHEET_HIDDEN_Y)
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslate, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [mounted, visible, backdropOpacity, sheetTranslate])

  if (!mounted) return null

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            opacity: backdropOpacity,
          }}
        >
          <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1 }} />
        </Animated.View>
        <Animated.View
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
            transform: [{ translateY: sheetTranslate }],
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
        </Animated.View>
      </View>
    </Modal>
  )
}

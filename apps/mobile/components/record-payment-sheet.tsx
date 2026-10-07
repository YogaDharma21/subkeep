import React, { useState, useMemo } from "react"
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput } from "react-native"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/expo"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { DynamicIcon } from "@/components/dynamic-icon"
import { Button } from "@/components/ui/button"
import { formatCurrencyAmount, convertCurrency } from "@/lib/currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/hooks/use-alert"
import { Wallet, AlertCircle, Check, X } from "lucide-react-native"

export interface RecordPaymentTarget {
  _id: string
  name: string
  price: number
  currency: string
  cycle?: string
  accountId?: string
  icon?: string
  color?: string
  nextBilling?: string
  lastPaymentDate?: string
}

interface RecordPaymentSheetProps {
  visible: boolean
  onClose: () => void
  subscription: RecordPaymentTarget | null
  rates?: Record<string, number>
  onSuccess?: () => void
}

interface AccountItem {
  _id: string
  name: string
  type: string
  balance: number
  currency: string
  isArchived?: boolean
}

function RecordPaymentSheetForm({
  subscription,
  activeAccounts,
  rates,
  onClose,
  onSuccess,
}: {
  subscription: RecordPaymentTarget
  activeAccounts: AccountItem[]
  rates?: Record<string, number>
  onClose: () => void
  onSuccess?: () => void
}) {
  const { colors } = useThemeColor()
  const { showToast } = useAlert()
  const recordPaymentMutation = useMutation(api.subscriptions.recordPayment)

  const defaultAccountId = useMemo(() => {
    if (subscription.accountId && activeAccounts.some((a) => a._id === subscription.accountId)) {
      return subscription.accountId
    }
    return activeAccounts.length > 0 ? activeAccounts[0]._id : ""
  }, [subscription.accountId, activeAccounts])

  const [amount, setAmount] = useState(() => subscription.price.toString())
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [accountId, setAccountId] = useState(defaultAccountId)
  const [linkAccount, setLinkAccount] = useState(() =>
    Boolean(subscription.accountId && activeAccounts.some((a) => a._id === subscription.accountId))
  )
  const [loading, setLoading] = useState(false)

  const selectedAccount = activeAccounts.find((a) => a._id === accountId)
  const parsedAmount = parseFloat(amount || "0")
  const convertedAccountDeduction =
    selectedAccount && selectedAccount.currency !== subscription.currency
      ? convertCurrency(parsedAmount, subscription.currency, selectedAccount.currency, rates)
      : parsedAmount

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < 0) {
      showToast("Please enter a valid amount", "error")
      return
    }

    if (!date) {
      showToast("Please enter a valid date (YYYY-MM-DD)", "error")
      return
    }

    setLoading(true)
    try {
      const res = await recordPaymentMutation({
        id: subscription._id as Id<"subscriptions">,
        amount: numAmount,
        date,
        accountId: accountId ? (accountId as Id<"accounts">) : undefined,
        linkAccount: Boolean(accountId && linkAccount),
      })

      showToast(
        res.isActive
          ? `Recorded payment for ${subscription.name}! Next renewal: ${res.nextBilling}`
          : `Recorded final payment for ${subscription.name}! Term completed.`,
        "success"
      )

      onClose()
      onSuccess?.()
    } catch {
      showToast(`Failed to record payment for ${subscription.name}`, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
      {/* Account Selector */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Wallet size={13} color={colors.primary} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>
            PAY FROM ACCOUNT
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {activeAccounts.map((a) => {
            const isSelected = accountId === a._id
            return (
              <TouchableOpacity
                key={a._id}
                onPress={() => {
                  setAccountId(a._id)
                  if (a._id === subscription.accountId) {
                    setLinkAccount(true)
                  } else {
                    setLinkAccount(false)
                  }
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? `${colors.primary}15` : colors.surface,
                  minWidth: 110,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: isSelected ? colors.primary : colors.text,
                  }}
                >
                  {a.name}
                </Text>
                <Text style={{ fontSize: 10, color: colors.mutedText, textTransform: "capitalize" }}>
                  {a.type}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: isSelected ? colors.primary : colors.text,
                    marginTop: 2,
                  }}
                >
                  {formatCurrencyAmount(a.balance, a.currency)}
                </Text>
              </TouchableOpacity>
            )
          })}

          <TouchableOpacity
            onPress={() => {
              setAccountId("")
              setLinkAccount(false)
            }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: !accountId ? colors.primary : colors.border,
              backgroundColor: !accountId ? `${colors.primary}15` : colors.surface,
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: !accountId ? colors.primary : colors.text,
              }}
            >
              None
            </Text>
            <Text style={{ fontSize: 10, color: colors.mutedText }}>
              No deduction
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {selectedAccount && selectedAccount.currency !== subscription.currency && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <AlertCircle size={12} color="#f59e0b" />
            <Text style={{ fontSize: 11, color: colors.mutedText }}>
              Will deduct ~{formatCurrencyAmount(convertedAccountDeduction, selectedAccount.currency)} from {selectedAccount.name}
            </Text>
          </View>
        )}
      </View>

      {/* Amount & Date */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>
            AMOUNT ({subscription.currency})
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
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
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>
            PAYMENT DATE
          </Text>
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
      </View>

      {/* Link account toggle */}
      {Boolean(accountId) && (
        <TouchableOpacity
          onPress={() => setLinkAccount(!linkAccount)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: linkAccount ? colors.primary : colors.border,
              backgroundColor: linkAccount ? colors.primary : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {linkAccount && <Check size={14} color="#ffffff" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>
              Set as default account for future renewals
            </Text>
            <Text style={{ fontSize: 10, color: colors.mutedText, marginTop: 1 }}>
              Links this subscription to {selectedAccount?.name}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <Button size="lg" onPress={handleSubmit} loading={loading}>
        Confirm Payment
      </Button>
    </ScrollView>
  )
}

export function RecordPaymentSheet({
  visible,
  onClose,
  subscription,
  rates,
  onSuccess,
}: RecordPaymentSheetProps) {
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()

  const accounts = useQuery(api.accounts.list, isSignedIn && visible ? {} : "skip")
  const activeAccounts = (accounts?.filter((a) => !a.isArchived) || []) as AccountItem[]

  if (!subscription) return null

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "90%",
            paddingBottom: 28,
          }}
        >
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
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: subscription.color || colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DynamicIcon name={subscription.icon || "receipt"} size={16} color="#ffffff" />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
                  Record Payment
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText }}>
                  {subscription.name} · {subscription.currency} {subscription.price}
                </Text>
              </View>
            </View>
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

          {visible && (
            <RecordPaymentSheetForm
              key={`${subscription._id}-${visible}`}
              subscription={subscription}
              activeAccounts={activeAccounts}
              rates={rates}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          )}
        </View>
      </View>
    </Modal>
  )
}

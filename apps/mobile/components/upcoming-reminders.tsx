import React, { useState } from "react"
import { View, Text, TouchableOpacity, Linking } from "react-native"
import { Bell, Send, Check, ExternalLink, CreditCard } from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { convertAndFormat } from "@/lib/currency"
import { findUpcomingReminders, ReminderItem } from "@/lib/notifications"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/hooks/use-alert"
import { RecordPaymentSheet, RecordPaymentTarget } from "@/components/record-payment-sheet"
import { Label, Numeral, Surface } from "@/components/ui/surface"

interface UpcomingRemindersProps {
  subscriptions: {
    _id: string
    name: string
    icon: string
    color: string
    price: number
    currency: string
    cycle: string
    nextBilling: string
    isTrial?: boolean
    trialEndDate?: string
    cancelUrl?: string
    isActive: boolean
    accountId?: string
    lastPaymentDate?: string
    endDate?: string
  }[]
  primaryCurrency?: string
  rates?: Record<string, number>
  onMarkCanceled?: (id: string) => Promise<void>
}

export function UpcomingReminders({
  subscriptions,
  primaryCurrency = "USD",
  rates,
}: UpcomingRemindersProps) {
  const { colors } = useThemeColor()
  const { showAlert } = useAlert()
  const [sentAlerts, setSentAlerts] = useState<Record<string, boolean>>({})
  const [selectedReminder, setSelectedReminder] = useState<RecordPaymentTarget | null>(null)
  const [sheetVisible, setSheetVisible] = useState(false)

  const reminders = findUpcomingReminders(subscriptions, 7)

  if (reminders.length === 0) return null

  const handleOpenRecordPayment = (item: ReminderItem) => {
    setSelectedReminder(item)
    setSheetVisible(true)
  }

  const handleTestAlert = (item: ReminderItem) => {
    const isTrial = item.type === "trial"
    const priceFormatted = convertAndFormat(item.price, item.currency, primaryCurrency, rates)
    const title = isTrial ? `Trial Ending: ${item.name}` : `Billing Due: ${item.name}`
    const msg = isTrial
      ? `Your trial for ${item.name} ends in ${item.daysLeft === 0 ? "today" : `${item.daysLeft} day(s)`}. Cancel before auto-renewal!`
      : `Payment of ${priceFormatted} for ${item.name} is due in ${item.daysLeft === 0 ? "today" : `${item.daysLeft} day(s)`}.`

    showAlert({
      title,
      message: msg,
      icon: isTrial ? "warning" : "info",
    })
    setSentAlerts((prev) => ({ ...prev, [item._id]: true }))
  }

  return (
    <Surface folderTab style={{ padding: 18, paddingTop: 36, gap: 10 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Bell size={13} color={colors.mutedText} />
          <Label>Due soon</Label>
        </View>
        <Text style={{ fontSize: 11, color: colors.mutedText }}>
          {reminders.length} alert{reminders.length === 1 ? "" : "s"}
        </Text>
      </View>

      {reminders.map((item, index) => {
        const isSent = !!sentAlerts[item._id]
        const isTrial = item.type === "trial"
        const priceFormatted = convertAndFormat(item.price, item.currency, primaryCurrency, rates)

        return (
          <View
            key={item._id}
            style={{
              gap: 10,
              paddingTop: index === 0 ? 4 : 12,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: colors.borderLight,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  backgroundColor: colors.surfaceInset,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DynamicIcon name={item.icon} size={15} color={colors.text} />
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: colors.text,
                      flexShrink: 1,
                    }}
                  >
                    {item.name}
                  </Text>
                  {isTrial ? (
                    <View
                      style={{
                        backgroundColor: colors.surfaceInset,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: 999,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 8,
                          fontWeight: "500",
                          letterSpacing: 0.8,
                          color: colors.emerald,
                        }}
                      >
                        TRIAL
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text style={{ fontSize: 11, color: colors.mutedText }}>
                  {isTrial
                    ? `Trial ends ${item.daysLeft === 0 ? "today" : `in ${item.daysLeft}d`}`
                    : `Due ${item.daysLeft === 0 ? "today" : `in ${item.daysLeft}d`}`}
                </Text>
              </View>

              {!isTrial ? (
                <Numeral style={{ fontSize: 12 }}>{priceFormatted}</Numeral>
              ) : null}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 44 }}>
              {!isTrial ? (
                <TouchableOpacity
                  onPress={() => handleOpenRecordPayment(item)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                  }}
                >
                  <CreditCard size={11} color={colors.primaryForeground} />
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: colors.primaryForeground,
                    }}
                  >
                    Record payment
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                onPress={() => {
                  const url =
                    item.cancelUrl ||
                    `https://www.google.com/search?q=${encodeURIComponent(
                      `how to cancel ${item.name} subscription`
                    )}`
                  Linking.openURL(url)
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <ExternalLink size={11} color={colors.mutedText} />
                <Text style={{ fontSize: 10, fontWeight: "500", color: colors.mutedText }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityLabel="Send test alert"
                onPress={() => handleTestAlert(item)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: "auto",
                }}
              >
                {isSent ? (
                  <Check size={12} color={colors.emerald} />
                ) : (
                  <Send size={12} color={colors.mutedText} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )
      })}

      <RecordPaymentSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        subscription={selectedReminder}
        rates={rates}
      />
    </Surface>
  )
}

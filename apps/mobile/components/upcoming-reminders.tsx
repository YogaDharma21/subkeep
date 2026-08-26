import React, { useState } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Bell, Send, Check, ExternalLink } from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { convertAndFormat } from "@/lib/currency"
import { findUpcomingReminders, ReminderItem } from "@/lib/notifications"
import { CancellationGuideModal } from "@/components/cancellation-guide-modal"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/components/custom-alert-provider"

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
  }[]
  primaryCurrency?: string
  rates?: Record<string, number>
  onMarkCanceled?: (id: string) => Promise<void>
}

export function UpcomingReminders({
  subscriptions,
  primaryCurrency = "USD",
  rates,
  onMarkCanceled,
}: UpcomingRemindersProps) {
  const { colors } = useThemeColor()
  const { showAlert, showToast } = useAlert()
  const [selectedSubForCancel, setSelectedSubForCancel] = useState<ReminderItem | null>(null)
  const [sentAlerts, setSentAlerts] = useState<Record<string, boolean>>({})
  const updateMutation = useMutation(api.subscriptions.update)

  const reminders = findUpcomingReminders(subscriptions, 7)

  if (reminders.length === 0) return null

  const handleUpdateCancelUrl = async (id: string, url: string) => {
    try {
      await updateMutation({
        id: id as Id<"subscriptions">,
        cancelUrl: url.trim() || undefined,
      })
      showToast("Cancellation page URL updated", "success")
    } catch {
      showToast("Failed to update cancellation URL", "error")
    }
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
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4 }}>
        <Bell size={14} color={colors.amber} />
        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.amber }}>
          Upcoming Billing & Trial Alerts ({reminders.length})
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        {reminders.map((item) => {
          const isSent = !!sentAlerts[item._id]
          const isTrial = item.type === "trial"
          const priceFormatted = convertAndFormat(item.price, item.currency, primaryCurrency, rates)

          return (
            <View
              key={item._id}
              style={{
                backgroundColor: isTrial
                  ? colors.emeraldBackground
                  : colors.amberBackground,
                borderColor: isTrial
                  ? "rgba(16, 185, 129, 0.3)"
                  : "rgba(245, 158, 11, 0.3)",
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: item.color || "#000000",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DynamicIcon name={item.icon} size={18} color="#ffffff" />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 13, fontWeight: "700", color: colors.text, flexShrink: 1 }}
                    >
                      {item.name}
                    </Text>
                    {isTrial ? (
                      <View
                        style={{
                          backgroundColor: "rgba(16, 185, 129, 0.2)",
                          paddingHorizontal: 5,
                          paddingVertical: 1,
                          borderRadius: 4,
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: "800", color: colors.emerald }}>
                          TRIAL
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                    {isTrial
                      ? `Trial ends ${item.daysLeft === 0 ? "today" : `in ${item.daysLeft} d`}`
                      : `Due ${item.daysLeft === 0 ? "today" : `in ${item.daysLeft} d`} (${priceFormatted})`}
                  </Text>
                </View>
              </View>

              {/* Actions row */}
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setSelectedSubForCancel(item)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: 6,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <ExternalLink size={12} color={colors.text} />
                  <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text }}>
                    Cancel Guide
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleTestAlert(item)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: 6,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {isSent ? (
                    <Check size={12} color={colors.emerald} />
                  ) : (
                    <Send size={12} color={colors.amber} />
                  )}
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: isSent ? colors.emerald : colors.amber,
                    }}
                  >
                    {isSent ? "Alert Sent" : "Test Alert"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        })}
      </View>

      <CancellationGuideModal
        visible={!!selectedSubForCancel}
        onClose={() => setSelectedSubForCancel(null)}
        subscription={selectedSubForCancel}
        onMarkCanceled={onMarkCanceled}
        onUpdateCancelUrl={handleUpdateCancelUrl}
        primaryCurrency={primaryCurrency}
        rates={rates}
      />
    </View>
  )
}

import React, { useState } from "react"
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  ExternalLink,
  CheckSquare,
  Square,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { Button } from "@/components/ui/button"
import { convertAndFormat } from "@/lib/currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/components/custom-alert-provider"

export interface CancellationGuideSub {
  _id: string
  name: string
  icon: string
  color: string
  price: number
  currency: string
  cycle: string
  cancelUrl?: string
  isTrial?: boolean
  trialEndDate?: string
}

interface CancellationGuideModalProps {
  visible: boolean
  onClose: () => void
  subscription: CancellationGuideSub | null
  onMarkCanceled?: (id: string) => Promise<void>
  primaryCurrency?: string
  rates?: Record<string, number>
}

export function CancellationGuideModal({
  visible,
  onClose,
  subscription,
  onMarkCanceled,
  primaryCurrency = "USD",
  rates,
}: CancellationGuideModalProps) {
  const { colors } = useThemeColor()
  const { showToast } = useAlert()
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({})

  if (!subscription) return null

  const directUrl =
    subscription.cancelUrl ||
    `https://www.google.com/search?q=${encodeURIComponent(
      `how to cancel ${subscription.name} subscription`
    )}`

  const steps = [
    {
      title: "1. Access Cancellation Page",
      detail: `Tap the button below to open ${subscription.name}'s account management / cancellation page.`,
    },
    {
      title: "2. Sign In to Your Account",
      detail: "Log in with the credentials registered for this subscription.",
    },
    {
      title: "3. Locate Billing & Plans",
      detail: "Navigate to Account Settings → Membership / Billing / Subscriptions.",
    },
    {
      title: "4. Confirm Cancellation",
      detail: "Select 'Cancel Subscription' or 'Turn Off Auto-Renew' and complete all confirmation prompts.",
    },
    {
      title: "5. Mark as Canceled in SubKeep",
      detail: "Update SubKeep to keep your monthly expense stats accurate and stop recurring alerts.",
    },
  ]

  const toggleStep = (index: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const handleOpenLink = async () => {
    try {
      await Linking.openURL(directUrl)
      setCheckedSteps((prev) => ({ ...prev, 0: true }))
    } catch {
      showToast("Unable to open cancellation URL", "error")
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: subscription.color || "#000000",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DynamicIcon name={subscription.icon} size={18} color="#ffffff" />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                Cancel {subscription.name}
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedText }}>
                {subscription.isTrial ? (
                  <Text style={{ color: colors.amber, fontWeight: "600" }}>
                    Free Trial Guide
                  </Text>
                ) : (
                  `${convertAndFormat(
                    subscription.price,
                    subscription.currency,
                    primaryCurrency,
                    rates
                  )} / ${subscription.cycle}`
                )}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
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
          {/* Trial Warning */}
          {subscription.isTrial && (
            <View
              style={{
                flexDirection: "row",
                backgroundColor: colors.amberBackground,
                borderWidth: 1,
                borderColor: "rgba(245, 158, 11, 0.3)",
                borderRadius: 10,
                padding: 12,
                gap: 10,
              }}
            >
              <ShieldAlert size={18} color={colors.amber} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.amber }}>
                  Cancel before free trial ends!
                </Text>
                <Text style={{ fontSize: 11, color: colors.amber, opacity: 0.9, marginTop: 2 }}>
                  Cancel now to prevent auto-renewal charges while retaining access until your trial period expires.
                </Text>
              </View>
            </View>
          )}

          {/* Direct Link Button */}
          <View style={{ gap: 6 }}>
            <Button
              onPress={handleOpenLink}
              size="lg"
              icon={<ExternalLink size={16} color={colors.primaryForeground} />}
            >
              Open Direct Cancellation Page
            </Button>
            <Text
              numberOfLines={1}
              style={{ fontSize: 11, color: colors.mutedText, textAlign: "center" }}
            >
              {directUrl}
            </Text>
          </View>

          {/* Checklist */}
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
              gap: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                paddingBottom: 8,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Sparkles size={14} color={colors.primary} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>
                  Step-by-Step Checklist
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.mutedText }}>
                {Object.values(checkedSteps).filter(Boolean).length}/{steps.length} done
              </Text>
            </View>

            {steps.map((step, idx) => {
              const isChecked = !!checkedSteps[idx]
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => toggleStep(idx)}
                  style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}
                >
                  {isChecked ? (
                    <CheckSquare size={18} color={colors.emerald} style={{ marginTop: 2 }} />
                  ) : (
                    <Square size={18} color={colors.mutedText} style={{ marginTop: 2 }} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: isChecked ? colors.mutedText : colors.text,
                        textDecorationLine: isChecked ? "line-through" : "none",
                      }}
                    >
                      {step.title}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 2 }}>
                      {step.detail}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Mark Canceled Button */}
          {onMarkCanceled ? (
            <Button
              variant="outline"
              onPress={async () => {
                await onMarkCanceled(subscription._id)
                onClose()
              }}
              style={{ borderColor: "rgba(16, 185, 129, 0.4)" }}
              textStyle={{ color: colors.emerald }}
            >
              Mark as Canceled in SubKeep
            </Button>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

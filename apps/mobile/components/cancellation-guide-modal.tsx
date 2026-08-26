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
  ShieldAlert,
  Search,
  Pencil,
  Check,
  X,
  Link2,
} from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { convertAndFormat, formatCycleLabel } from "@/lib/currency"
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
  onUpdateCancelUrl?: (id: string, url: string) => Promise<void>
  primaryCurrency?: string
  rates?: Record<string, number>
}

export function CancellationGuideModal({
  visible,
  onClose,
  subscription,
  onMarkCanceled,
  onUpdateCancelUrl,
  primaryCurrency = "USD",
  rates,
}: CancellationGuideModalProps) {
  const { colors } = useThemeColor()
  const { showToast } = useAlert()
  const [isEditingUrl, setIsEditingUrl] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [savingUrl, setSavingUrl] = useState(false)

  if (!subscription) return null

  const hasCustomUrl = Boolean(subscription.cancelUrl && subscription.cancelUrl.trim().length > 0)
  const directUrl =
    subscription.cancelUrl ||
    `https://www.google.com/search?q=${encodeURIComponent(
      `how to cancel ${subscription.name} subscription`
    )}`

  const handleOpenLink = async () => {
    try {
      await Linking.openURL(directUrl)
    } catch {
      showToast("Unable to open cancellation URL", "error")
    }
  }

  const handleStartEditUrl = () => {
    setNewUrl(subscription.cancelUrl || "")
    setIsEditingUrl(true)
  }

  const handleSaveUrl = async () => {
    if (!onUpdateCancelUrl) return
    setSavingUrl(true)
    try {
      await onUpdateCancelUrl(subscription._id, newUrl.trim())
      setIsEditingUrl(false)
    } finally {
      setSavingUrl(false)
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 8 }}>
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
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
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
                  )} ${formatCycleLabel(subscription.cycle)}`
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

        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
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
                <Text style={{ fontSize: 11, color: colors.amber, opacity: 0.9, marginTop: 2, lineHeight: 16 }}>
                  Cancel now to prevent auto-renewal charges while retaining access until your trial period expires.
                </Text>
              </View>
            </View>
          )}

          {/* Direct Link Section */}
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 12,
              gap: 10,
            }}
          >
            {isEditingUrl ? (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Link2 size={14} color={colors.primary} />
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>
                      Edit Cancellation URL
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsEditingUrl(false)}>
                    <X size={14} color={colors.mutedText} />
                  </TouchableOpacity>
                </View>

                <Input
                  placeholder="https://service.com/account/cancel"
                  value={newUrl}
                  onChangeText={setNewUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                  autoFocus
                />

                <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 2 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => setIsEditingUrl(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onPress={handleSaveUrl}
                    disabled={savingUrl}
                    icon={<Check size={14} color={colors.primaryForeground} />}
                  >
                    {savingUrl ? "Saving..." : "Save URL"}
                  </Button>
                </View>
              </View>
            ) : (
              <>
                <Button
                  onPress={handleOpenLink}
                  size="md"
                  icon={
                    hasCustomUrl ? (
                      <ExternalLink size={15} color={colors.primaryForeground} />
                    ) : (
                      <Search size={15} color={colors.primaryForeground} />
                    )
                  }
                >
                  {hasCustomUrl ? "Open Direct Cancellation Page" : "Search Cancellation Guide (Google)"}
                </Button>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 6,
                    paddingHorizontal: 2,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 11,
                      color: colors.mutedText,
                      flex: 1,
                      fontFamily: hasCustomUrl ? "monospace" : undefined,
                    }}
                  >
                    {hasCustomUrl ? subscription.cancelUrl : "Default search query"}
                  </Text>

                  {onUpdateCancelUrl && (
                    <TouchableOpacity
                      onPress={handleStartEditUrl}
                      style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                    >
                      <Pencil size={11} color={colors.primary} />
                      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.primary }}>
                        {hasCustomUrl ? "Change" : "Set URL"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>

          {/* Mark Canceled / Suspended Button */}
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
              Mark as Canceled / Suspended in SubKeep
            </Button>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

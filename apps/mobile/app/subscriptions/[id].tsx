import React, { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Share,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  ArrowLeft,
  Pencil,
  Pause,
  Play,
  Copy,
  Trash2,
  ExternalLink,
  Link2,
  Users,
  Check,
  Share2,
} from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CancellationGuideModal } from "@/components/cancellation-guide-modal"
import { IconPickerModal } from "@/components/icon-picker-modal"
import { convertAndFormat, formatCurrencyAmount } from "@/lib/currency"
import { getSymbol } from "@/constants/currencies"
import { format } from "date-fns"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"

export default function SubscriptionDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const { primaryCurrency, rates } = usePrimaryCurrency()

  const [editing, setEditing] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)

  const sub = useQuery(
    api.subscriptions.get,
    id ? { id: id as Id<"subscriptions"> } : "skip"
  )
  const paymentMethods = useQuery(
    api.paymentMethods.list,
    isSignedIn ? {} : "skip"
  )

  const updateMutation = useMutation(api.subscriptions.update)
  const suspendMutation = useMutation(api.subscriptions.suspend)
  const cloneMutation = useMutation(api.subscriptions.clone)
  const removeMutation = useMutation(api.subscriptions.remove)

  // Edit form state
  const [editName, setEditName] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [editCurrency, setEditCurrency] = useState("USD")
  const [editCycle, setEditCycle] = useState("monthly")
  const [editCategory, setEditCategory] = useState("entertainment")
  const [editIcon, setEditIcon] = useState<string | null>(null)
  const [editColor, setEditColor] = useState("#000000")
  const [editEndDate, setEditEndDate] = useState("")
  const [editAccount, setEditAccount] = useState("")
  const [editWebsite, setEditWebsite] = useState("")
  const [editIsTrial, setEditIsTrial] = useState(false)
  const [editTrialEndDate, setEditTrialEndDate] = useState("")
  const [editCancelUrl, setEditCancelUrl] = useState("")
  const [editIsShared, setEditIsShared] = useState(false)
  const [editTotalPlanPrice, setEditTotalPlanPrice] = useState("")
  const [editTotalMembers, setEditTotalMembers] = useState("4")
  const [editPaymentMethodId, setEditPaymentMethodId] = useState("")
  const [editSplitMembers, setEditSplitMembers] = useState<
    { name: string; shareAmount: number; isPaid?: boolean }[]
  >([])

  const startEditing = () => {
    if (!sub) return
    setEditName(sub.name)
    setEditPrice(sub.price.toString())
    setEditCurrency(sub.currency)
    setEditCycle(sub.cycle)
    setEditCategory(sub.category)
    setEditIcon(sub.icon)
    setEditColor(sub.color)
    setEditEndDate(sub.endDate || "")
    setEditAccount(sub.account || "")
    setEditWebsite(sub.website || "")
    setEditIsTrial(!!sub.isTrial)
    setEditTrialEndDate(sub.trialEndDate || "")
    setEditCancelUrl(sub.cancelUrl || "")
    setEditIsShared(!!sub.isShared)
    setEditTotalPlanPrice(sub.totalPlanPrice?.toString() || "")
    setEditTotalMembers(sub.totalMembers?.toString() || "4")
    setEditPaymentMethodId(sub.paymentMethodId || "")
    setEditSplitMembers(sub.splitMembers ? [...sub.splitMembers] : [])
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!sub || !id) return
    try {
      await updateMutation({
        id: id as Id<"subscriptions">,
        name: editName,
        price: parseFloat(editPrice || "0"),
        currency: editCurrency,
        cycle: editCycle,
        category: editCategory,
        icon: editIcon || sub.icon,
        color: editColor,
        endDate: editEndDate,
        account: editAccount,
        website: editWebsite,
        isTrial: editIsTrial,
        trialEndDate: editTrialEndDate,
        cancelUrl: editCancelUrl,
        isShared: editIsShared,
        totalPlanPrice: editTotalPlanPrice ? parseFloat(editTotalPlanPrice) : undefined,
        totalMembers: editTotalMembers ? parseInt(editTotalMembers) : undefined,
        paymentMethodId: editPaymentMethodId || undefined,
        splitMembers: editIsShared && editSplitMembers.length > 0 ? editSplitMembers : undefined,
      })
      setEditing(false)
      Alert.alert("Success", "Subscription updated")
    } catch {
      Alert.alert("Error", "Failed to update subscription")
    }
  }

  const handleToggleActive = async () => {
    if (!id) return
    try {
      await suspendMutation({ id: id as Id<"subscriptions"> })
    } catch {
      Alert.alert("Error", "Failed to change status")
    }
  }

  const handleClone = async () => {
    if (!id) return
    try {
      await cloneMutation({ id: id as Id<"subscriptions"> })
      Alert.alert("Success", "Subscription cloned")
      router.back()
    } catch {
      Alert.alert("Error", "Failed to clone subscription")
    }
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Subscription",
      `Are you sure you want to permanently remove ${sub?.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!id) return
            try {
              await removeMutation({ id: id as Id<"subscriptions"> })
              router.back()
            } catch {
              Alert.alert("Error", "Failed to delete subscription")
            }
          },
        },
      ]
    )
  }

  const handleToggleMemberPaid = async (memberIndex: number) => {
    if (!sub || !id || !sub.splitMembers) return
    const updated = sub.splitMembers.map((m, i) =>
      i === memberIndex ? { ...m, isPaid: !m.isPaid } : m
    )
    try {
      await updateMutation({
        id: id as Id<"subscriptions">,
        splitMembers: updated,
      })
    } catch {
      Alert.alert("Error", "Failed to update member status")
    }
  }

  const handleShareSplitReminder = async (member: { name: string; shareAmount: number }) => {
    if (!sub) return
    const symbol = getSymbol(sub.currency)
    const text = `Hey ${member.name}! Friendly reminder for your share of our ${sub.name} subscription (${symbol}${member.shareAmount}/${sub.cycle}). Thanks!`
    try {
      await Share.share({ message: text })
    } catch (e) {
      console.error(e)
    }
  }

  if (sub === undefined) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.mutedText }}>Loading subscription details...</Text>
      </SafeAreaView>
    )
  }

  if (sub === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Subscription not found</Text>
        <Button onPress={() => router.back()} style={{ marginTop: 12 }}>Go Back</Button>
      </SafeAreaView>
    )
  }

  const isTrial = !!sub.isTrial
  const isShared = !!sub.isShared
  const matchedPaymentMethod = paymentMethods?.find((pm) => pm._id === sub.paymentMethodId)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flexDirection: "row", gap: 6 }}>
          {!editing ? (
            <>
              <TouchableOpacity
                onPress={startEditing}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Pencil size={14} color={colors.text} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleToggleActive}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {sub.isActive ? (
                  <>
                    <Pause size={14} color={colors.amber} />
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.amber }}>Suspend</Text>
                  </>
                ) : (
                  <>
                    <Play size={14} color={colors.emerald} />
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.emerald }}>Resume</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClone}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Copy size={14} color={colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDelete}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: colors.destructiveBackground,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 size={14} color={colors.destructive} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => setEditing(false)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {!editing ? (
          <>
            {/* Hero Card */}
            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 16,
                gap: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: sub.color || "#000000",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DynamicIcon name={sub.icon} size={28} color="#ffffff" />
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
                    {sub.name}
                  </Text>
                  {sub.account ? (
                    <Text style={{ fontSize: 12, color: colors.mutedText }}>
                      {sub.account}
                    </Text>
                  ) : null}

                  <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                    <Badge variant="secondary">{sub.category}</Badge>
                    {isTrial && <Badge variant="emerald">FREE TRIAL</Badge>}
                    {isShared && (
                      <Badge variant="blue">
                        SPLIT {sub.totalMembers ? `(1/${sub.totalMembers})` : ""}
                      </Badge>
                    )}
                    {!sub.isActive && <Badge variant="destructive">SUSPENDED</Badge>}
                  </View>
                </View>
              </View>

              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                }}
              >
                <View>
                  <Text style={{ fontSize: 11, color: colors.mutedText, textTransform: "uppercase" }}>
                    Recurring Cost
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>
                    {formatCurrencyAmount(sub.price, sub.currency)}
                    <Text style={{ fontSize: 12, color: colors.mutedText }}>/{sub.cycle}</Text>
                  </Text>
                </View>

                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedText }}>
                  ≈ {convertAndFormat(sub.price, sub.currency, primaryCurrency, rates)}/mo
                </Text>
              </View>
            </View>

            {/* Provider Website */}
            {sub.website ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(sub.website!)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Link2 size={16} color={colors.primary} />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                    {sub.website}
                  </Text>
                </View>
                <ExternalLink size={14} color={colors.mutedText} />
              </TouchableOpacity>
            ) : null}

            {/* Billing Details */}
            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 14,
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase" }}>
                Payment & Renewal Schedule
              </Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                <Text style={{ fontSize: 13, color: colors.mutedText }}>Billing Cycle</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, textTransform: "capitalize" }}>
                  {sub.cycle}
                </Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                <Text style={{ fontSize: 13, color: colors.mutedText }}>Next Billing Date</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                  {sub.nextBilling ? format(new Date(sub.nextBilling), "MMM d, yyyy") : "N/A"}
                </Text>
              </View>

              {sub.startDate ? (
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                  <Text style={{ fontSize: 13, color: colors.mutedText }}>Start Date</Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                    {format(new Date(sub.startDate), "MMM d, yyyy")}
                  </Text>
                </View>
              ) : null}

              {sub.endDate ? (
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                  <Text style={{ fontSize: 13, color: colors.mutedText }}>End Date</Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                    {format(new Date(sub.endDate), "MMM d, yyyy")}
                  </Text>
                </View>
              ) : null}

              {matchedPaymentMethod && (
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                  <Text style={{ fontSize: 13, color: colors.mutedText }}>Payment Card</Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                    {matchedPaymentMethod.name} {matchedPaymentMethod.last4 ? `(•• ${matchedPaymentMethod.last4})` : ""}
                  </Text>
                </View>
              )}
            </View>

            {/* SplitKeep Breakdown */}
            {isShared && (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  padding: 14,
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Users size={16} color={colors.blue} />
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                      SplitKeep Group Tracking
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: colors.mutedText }}>
                    Total: {formatCurrencyAmount(sub.totalPlanPrice || sub.price, sub.currency)}
                  </Text>
                </View>

                {sub.splitMembers && sub.splitMembers.length > 0 ? (
                  <View style={{ gap: 8 }}>
                    {sub.splitMembers.map((m, idx) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor: colors.surface,
                          borderRadius: 10,
                          padding: 10,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => handleToggleMemberPaid(idx)}
                          style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
                        >
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              backgroundColor: m.isPaid ? colors.emerald : colors.card,
                              borderWidth: 1,
                              borderColor: m.isPaid ? colors.emerald : colors.border,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {m.isPaid && <Check size={14} color="#ffffff" />}
                          </View>

                          <View>
                            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                              {m.name}
                            </Text>
                            <Text style={{ fontSize: 10, color: m.isPaid ? colors.emerald : colors.amber }}>
                              {m.isPaid ? "Paid" : "Pending Share"}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                            {formatCurrencyAmount(m.shareAmount, sub.currency)}
                          </Text>

                          <TouchableOpacity
                            onPress={() => handleShareSplitReminder(m)}
                            style={{
                              padding: 6,
                              borderRadius: 6,
                              backgroundColor: colors.card,
                              borderWidth: 1,
                              borderColor: colors.border,
                            }}
                          >
                            <Share2 size={12} color={colors.text} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ fontSize: 12, color: colors.mutedText }}>
                    {sub.totalMembers || 2} members split evenly.
                  </Text>
                )}
              </View>
            )}

            {/* Cancellation Guide CTA */}
            <Button
              variant="outline"
              size="lg"
              onPress={() => setCancelModalOpen(true)}
              icon={<ExternalLink size={16} color={colors.text} />}
            >
              How to Cancel / Cancellation Guide
            </Button>
          </>
        ) : (
          /* Edit Form */
          <View style={{ gap: 16 }}>
            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 14,
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
                Edit Subscription
              </Text>

              <Input label="Name" value={editName} onChangeText={setEditName} />
              <Input label="Price" value={editPrice} onChangeText={setEditPrice} keyboardType="numeric" />
              <Input label="Account" value={editAccount} onChangeText={setEditAccount} />
              <Input label="Website URL" value={editWebsite} onChangeText={setEditWebsite} />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Input label="End Date" value={editEndDate} onChangeText={setEditEndDate} />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="Trial End Date" value={editTrialEndDate} onChangeText={setEditTrialEndDate} />
                </View>
              </View>

              <Input label="Direct Cancel URL" value={editCancelUrl} onChangeText={setEditCancelUrl} />

              {/* Save / Cancel buttons */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                <Button variant="outline" onPress={() => setEditing(false)} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button onPress={saveEdit} style={{ flex: 1 }}>
                  Save Changes
                </Button>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Cancellation Guide Modal */}
      <CancellationGuideModal
        visible={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        subscription={sub}
        onMarkCanceled={async () => {
          await handleToggleActive()
        }}
        primaryCurrency={primaryCurrency}
        rates={rates}
      />

      <IconPickerModal
        visible={iconPickerOpen}
        selected={editIcon || sub?.icon || null}
        onSelect={(icon) => setEditIcon(icon)}
        onClose={() => setIconPickerOpen(false)}
      />
    </SafeAreaView>
  )
}

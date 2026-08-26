import React, { useState } from "react"
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import * as DocumentPicker from "expo-document-picker"
import {
  ArrowLeft,
  Pencil,
  Pause,
  Play,
  Copy,
  Trash2,
  ExternalLink,
  Users,
  Check,
  Sparkles,
  Paperclip,
  Upload,
  DollarSign,
  FileText,
  MessageSquare,
  X,
  Link2,
} from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CancellationGuideModal } from "@/components/cancellation-guide-modal"
import { IconPickerModal } from "@/components/icon-picker-modal"
import { convertAndFormat, formatCycleLabel } from "@/lib/currency"
import { getSymbol } from "@/constants/currencies"
import { categoryColors } from "@/constants/categories"
import { format, differenceInDays } from "date-fns"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/components/custom-alert-provider"
import { SubscriptionDetailSkeleton } from "@/components/subscription-detail-skeleton"

export default function SubscriptionDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const { primaryCurrency, rates } = usePrimaryCurrency()
  const { showAlert, showToast } = useAlert()

  const [editing, setEditing] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [cancelUrlModalOpen, setCancelUrlModalOpen] = useState(false)
  const [tempCancelUrl, setTempCancelUrl] = useState("")
  const [savingCancelUrl, setSavingCancelUrl] = useState(false)

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
  const recordPaymentMutation = useMutation(api.payments.create)
  const generateUploadUrl = useMutation(api.subscriptions.generateUploadUrl)

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

  const colorOptions = [
    "#000000", "#555555", "#E50914", "#1DB954", "#00A8E1",
    "#4285F4", "#0078D4", "#B535F6", "#F47D31", "#00C4CC",
    "#E60023", "#107C10", "#003087", "#58CC02", "#FF0000",
  ]

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
      showToast("Subscription updated successfully", "success")
    } catch {
      showToast("Failed to update subscription", "error")
    }
  }

  const handleToggleActive = async () => {
    if (!id || !sub) return
    try {
      await suspendMutation({ id: id as Id<"subscriptions"> })
      showToast(sub.isActive ? "Subscription suspended" : "Subscription resumed", "info")
    } catch {
      showToast("Failed to change subscription state", "error")
    }
  }

  const handleSuspend = async (subId: string) => {
    try {
      await suspendMutation({ id: subId as Id<"subscriptions"> })
      showToast("Subscription marked as canceled / suspended", "info")
    } catch {
      showToast("Failed to update subscription status", "error")
    }
  }

  const handleClone = async () => {
    if (!id) return
    try {
      const newId = await cloneMutation({ id: id as Id<"subscriptions"> })
      showToast("Subscription cloned", "success")
      router.push(`/subscriptions/${newId}` as never)
    } catch {
      showToast("Failed to clone subscription", "error")
    }
  }

  const handleDelete = () => {
    showAlert({
      title: "Delete Subscription",
      message: `Are you sure you want to permanently remove ${sub?.name}?`,
      icon: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!id) return
            try {
              await removeMutation({ id: id as Id<"subscriptions"> })
              showToast("Subscription deleted", "info")
              router.replace("/(tabs)" as never)
            } catch {
              showToast("Failed to delete subscription", "error")
            }
          },
        },
      ],
    })
  }

  const handleRecordPayment = async () => {
    if (!sub || !id) return
    try {
      await recordPaymentMutation({
        subscriptionId: id as Id<"subscriptions">,
        name: sub.name,
        icon: sub.icon,
        color: sub.color,
        amount: sub.price,
        currency: sub.currency,
        category: sub.category,
        date: new Date().toISOString().split("T")[0],
      })
      showToast(
        `Recorded payment of ${convertAndFormat(sub.price, sub.currency, primaryCurrency, rates)} for ${sub.name}`,
        "success"
      )
    } catch {
      showToast("Failed to record payment", "error")
    }
  }

  const handlePickReceipt = async () => {
    if (!id) return
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets || result.assets.length === 0) return

      const asset = result.assets[0]
      setUploadingReceipt(true)

      const postUrl = await generateUploadUrl()
      const response = await fetch(asset.uri)
      const blob = await response.blob()

      const uploadRes = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": asset.mimeType || "application/octet-stream" },
        body: blob,
      })
      const { storageId } = await uploadRes.json()

      await updateMutation({
        id: id as Id<"subscriptions">,
        receiptStorageId: storageId,
        receiptFileName: asset.name,
      })
      showToast("Receipt invoice uploaded successfully", "success")
    } catch (e) {
      console.error("Receipt upload error:", e)
      showToast("Failed to attach receipt", "error")
    } finally {
      setUploadingReceipt(false)
    }
  }

  const handleRemoveReceipt = async () => {
    if (!id) return
    try {
      await updateMutation({
        id: id as Id<"subscriptions">,
        receiptStorageId: undefined,
        receiptFileName: "",
      })
      showToast("Receipt invoice removed", "info")
    } catch {
      showToast("Failed to remove receipt", "error")
    }
  }

  const handleUpdateCancelUrl = async (subId: string, url: string) => {
    try {
      await updateMutation({
        id: subId as Id<"subscriptions">,
        cancelUrl: url.trim() || undefined,
      })
      showToast("Cancellation page URL updated", "success")
    } catch {
      showToast("Failed to update cancellation URL", "error")
    }
  }

  const handleOpenCancelUrlModal = () => {
    setTempCancelUrl(sub?.cancelUrl || "")
    setCancelUrlModalOpen(true)
  }

  const handleSaveCancelUrlModal = async () => {
    if (!sub || !id) return
    setSavingCancelUrl(true)
    try {
      await handleUpdateCancelUrl(id, tempCancelUrl)
      setCancelUrlModalOpen(false)
    } finally {
      setSavingCancelUrl(false)
    }
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
      showToast("Failed to update member status", "error")
    }
  }

  const handleShareSplitReminder = async (member: { name: string; shareAmount: number }) => {
    if (!sub) return
    const symbol = getSymbol(sub.currency)
    const text = `Hey ${member.name}! Friendly reminder for your share of our ${sub.name} subscription (${symbol}${member.shareAmount} ${formatCycleLabel(sub.cycle)}). Thanks!`
    try {
      await Share.share({ message: text })
    } catch (e) {
      console.error(e)
    }
  }

  if (sub === undefined) {
    return <SubscriptionDetailSkeleton />
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

  // Trial Days Left
  let trialDaysLeft: number | null = null
  if (sub.isTrial && sub.trialEndDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tEnd = new Date(sub.trialEndDate)
    tEnd.setHours(0, 0, 0, 0)
    trialDaysLeft = Math.max(0, differenceInDays(tEnd, today))
  }

  // Yearly Total Calculation
  const nativeYearlyCost =
    sub.cycle === "monthly"
      ? sub.price * 12
      : sub.cycle === "yearly"
      ? sub.price
      : sub.cycle === "weekly"
      ? sub.price * 52
      : sub.cycle === "quarterly"
      ? sub.price * 4
      : sub.cycle === "none"
      ? 0
      : sub.price * 365

  return (
    <SafeAreaView edges={["top", "bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>

        <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
          Subscription Details
        </Text>

        <TouchableOpacity
          onPress={editing ? () => setEditing(false) : startEditing}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Pencil size={16} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 14 }}>
        {/* Active Free Trial Banner */}
        {isTrial && (
          <View
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              borderWidth: 1,
              borderColor: "rgba(16, 185, 129, 0.3)",
              borderRadius: 12,
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <Sparkles size={18} color={colors.emerald} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.emerald }}>
                  Active Free Trial
                </Text>
                <Text style={{ fontSize: 11, color: colors.emerald, opacity: 0.9, marginTop: 1 }}>
                  {sub.trialEndDate
                    ? `Expires on ${format(new Date(sub.trialEndDate), "MMM d, yyyy")} (${trialDaysLeft ?? 0} days left)`
                    : "Trial subscription active"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setCancelModalOpen(true)}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.emerald,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <ExternalLink size={12} color="#ffffff" />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#ffffff" }}>
                Cancel Guide
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Hero Card Header */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          <TouchableOpacity
            onPress={() => editing && setIconPickerOpen(true)}
            disabled={!editing}
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              backgroundColor: editing ? editColor : sub.color,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DynamicIcon name={editing ? editIcon || sub.icon : sub.icon} size={26} color="#ffffff" />
          </TouchableOpacity>

          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
              {sub.name}
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
              {/* Category badge */}
              <View
                style={{
                  backgroundColor: (categoryColors[sub.category] || "#6b7280") + "20",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "600", color: categoryColors[sub.category] || colors.text }}>
                  {sub.category}
                </Text>
              </View>

              {/* Free trial badge */}
              {sub.isTrial && (
                <View
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    borderWidth: 1,
                    borderColor: "rgba(16, 185, 129, 0.3)",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "800", color: colors.emerald }}>
                    FREE TRIAL
                  </Text>
                </View>
              )}

              {/* Split plan badge */}
              {sub.isShared && (
                <View
                  style={{
                    backgroundColor: "rgba(59, 130, 246, 0.2)",
                    borderWidth: 1,
                    borderColor: "rgba(59, 130, 246, 0.3)",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "800", color: colors.blue }}>
                    SPLIT {sub.totalMembers ? `(1/${sub.totalMembers})` : ""}
                  </Text>
                </View>
              )}

              {/* Active / Suspended badge */}
              <View
                style={{
                  backgroundColor: sub.isActive ? colors.text : colors.destructive,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "800",
                    color: sub.isActive ? colors.background : "#ffffff",
                  }}
                >
                  {sub.isActive ? "Active" : "Suspended"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3 KPI Summary Cards */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 10,
              paddingVertical: 12,
              paddingHorizontal: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              numberOfLines={1}
              style={{ fontSize: 14, fontWeight: "800", color: colors.text, textAlign: "center" }}
            >
              {convertAndFormat(sub.price, sub.currency, primaryCurrency, rates)}
            </Text>
            <Text style={{ fontSize: 9, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", marginTop: 4 }}>
              PRICE ({primaryCurrency})
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 10,
              paddingVertical: 12,
              paddingHorizontal: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              numberOfLines={1}
              style={{ fontSize: 14, fontWeight: "800", color: colors.text, textAlign: "center" }}
            >
              {sub.cycle ? sub.cycle.charAt(0).toUpperCase() + sub.cycle.slice(1) : "None"}
            </Text>
            <Text style={{ fontSize: 9, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", marginTop: 4 }}>
              CYCLE
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 10,
              paddingVertical: 12,
              paddingHorizontal: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              numberOfLines={1}
              style={{ fontSize: 14, fontWeight: "800", color: colors.text, textAlign: "center" }}
            >
              {convertAndFormat(nativeYearlyCost, sub.currency, primaryCurrency, rates)}
            </Text>
            <Text style={{ fontSize: 9, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", marginTop: 4 }}>
              YEARLY TOTAL
            </Text>
          </View>
        </View>

        {/* Editing Mode Form */}
        {editing ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 16,
              gap: 14,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text }}>
              Edit Subscription
            </Text>

            <Input
              label="Service Name"
              value={editName}
              onChangeText={setEditName}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1.5 }}>
                <Input
                  label="Price"
                  value={editPrice}
                  onChangeText={setEditPrice}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase" }}>
                  Currency
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 4 }}>
                  {["USD", "EUR", "GBP", "IDR", "SGD", "AUD", "CAD"].map((curr) => (
                    <TouchableOpacity
                      key={curr}
                      onPress={() => setEditCurrency(curr)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: editCurrency === curr ? colors.primary : colors.surface,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: editCurrency === curr ? colors.primaryForeground : colors.mutedText,
                        }}
                      >
                        {curr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Input
              label="Account / Email"
              placeholder="e.g. user@gmail.com"
              value={editAccount}
              onChangeText={setEditAccount}
            />

            <Input
              label="Direct Cancellation Link"
              placeholder="https://service.com/account"
              value={editCancelUrl}
              onChangeText={setEditCancelUrl}
            />

            {/* Color Circles */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase" }}>
                Icon Color
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
                {colorOptions.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setEditColor(c)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: c,
                      borderWidth: editColor === c ? 2 : 0,
                      borderColor: colors.text,
                    }}
                  />
                ))}
              </ScrollView>
            </View>

            <Button onPress={saveEdit} style={{ marginTop: 6 }}>
              Save Changes
            </Button>
          </View>
        ) : (
          <>
            {/* SUBSCRIPTION INFORMATION Section Card */}
            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 16,
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", letterSpacing: 0.8 }}>
                SUBSCRIPTION INFORMATION
              </Text>

              <View style={{ gap: 10 }}>
                {/* Cancellation Guide */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}>
                  <Text style={{ fontSize: 13, color: colors.mutedText }}>
                    Cancellation Guide
                  </Text>
                  <TouchableOpacity
                    onPress={() => setCancelModalOpen(true)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      borderWidth: 1,
                      borderColor: "rgba(16, 185, 129, 0.3)",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <ExternalLink size={11} color={colors.emerald} />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.emerald }}>
                      Direct Cancel Link & Checklist
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border }} />

                {/* Original Price */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}>
                  <Text style={{ fontSize: 13, color: colors.mutedText }}>
                    Original Price
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                    {getSymbol(sub.currency)}{sub.price} ({sub.currency})
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border }} />

                {/* Payment Method */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}>
                  <Text style={{ fontSize: 13, color: colors.mutedText }}>
                    Payment Method
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: matchedPaymentMethod ? colors.text : colors.mutedText }}>
                    {matchedPaymentMethod ? matchedPaymentMethod.name : "None linked"}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border }} />

                {/* Next Billing */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}>
                  <Text style={{ fontSize: 13, color: colors.mutedText }}>
                    Next Billing
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                    {format(new Date(sub.nextBilling), "MMMM d, yyyy")}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border }} />

                {/* Account / Email */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}>
                  <Text style={{ fontSize: 13, color: colors.mutedText }}>
                    Account / Email
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                    {sub.account || "Not specified"}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border }} />

                {/* Direct Cancel Page */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}>
                  <Text style={{ fontSize: 13, color: colors.mutedText }}>
                    Direct Cancel Page
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {sub.cancelUrl ? (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(sub.cancelUrl!)}
                        style={{ flexDirection: "row", alignItems: "center", gap: 4, maxWidth: 140 }}
                      >
                        <ExternalLink size={12} color={colors.blue} />
                        <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "600", color: colors.blue }}>
                          Cancellation Page
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedText }}>
                        Standard Search
                      </Text>
                    )}
                    <TouchableOpacity
                      onPress={handleOpenCancelUrlModal}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 3,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: colors.surface,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Pencil size={11} color={colors.primary} />
                      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text }}>
                        {sub.cancelUrl ? "Change" : "Set URL"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* SplitKeep Section (if shared) */}
            {isShared && sub.splitMembers && sub.splitMembers.length > 0 && (
              <View
                style={{
                  backgroundColor: "rgba(59, 130, 246, 0.06)",
                  borderWidth: 1,
                  borderColor: "rgba(59, 130, 246, 0.2)",
                  borderRadius: 14,
                  padding: 16,
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Users size={16} color={colors.blue} />
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.blue, textTransform: "uppercase" }}>
                      SplitKeep Tracker
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.mutedText }}>
                    Total: {getSymbol(sub.currency)}{sub.totalPlanPrice || sub.price * (sub.totalMembers || 1)}
                  </Text>
                </View>

                <View style={{ gap: 8 }}>
                  {sub.splitMembers.map((member, idx) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: colors.surface,
                        borderRadius: 10,
                        padding: 10,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => handleToggleMemberPaid(idx)}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            backgroundColor: member.isPaid ? colors.emerald : "transparent",
                            borderWidth: 1,
                            borderColor: member.isPaid ? colors.emerald : colors.border,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {member.isPaid && <Check size={14} color="#ffffff" />}
                        </TouchableOpacity>
                        <View>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "600",
                              color: colors.text,
                              textDecorationLine: member.isPaid ? "line-through" : "none",
                              opacity: member.isPaid ? 0.6 : 1,
                            }}
                          >
                            {member.name}
                          </Text>
                          <Text style={{ fontSize: 10, color: colors.mutedText }}>
                            {getSymbol(sub.currency)}{member.shareAmount} · {member.isPaid ? "Paid this month" : "Pending transfer"}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleShareSplitReminder(member)}
                        style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4 }}
                      >
                        <MessageSquare size={12} color={colors.blue} />
                        <Text style={{ fontSize: 11, fontWeight: "600", color: colors.blue }}>
                          Reminder
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* INVOICE & WARRANTY RECEIPT Section Card */}
            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 16,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Paperclip size={14} color={colors.text} />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text, textTransform: "uppercase", letterSpacing: 0.8 }}>
                    INVOICE & WARRANTY RECEIPT
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handlePickReceipt}
                  disabled={uploadingReceipt}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Upload size={11} color={colors.text} />
                  <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text }}>
                    {uploadingReceipt ? "Uploading..." : sub.receiptStorageId ? "Replace File" : "Attach File"}
                  </Text>
                </TouchableOpacity>
              </View>

              {sub.receiptUrl ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: colors.surface,
                    borderRadius: 10,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <FileText size={18} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>
                        {sub.receiptFileName || "Attached Invoice"}
                      </Text>
                      <TouchableOpacity onPress={() => Linking.openURL(sub.receiptUrl!)}>
                        <Text style={{ fontSize: 11, color: colors.blue }}>
                          View / Download Document
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleRemoveReceipt} style={{ padding: 4 }}>
                    <Trash2 size={14} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={{ fontSize: 11, color: colors.mutedText, lineHeight: 16 }}>
                  No invoice attached yet. Upload a PDF or image receipt to keep tax and warranty records safe.
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 10, paddingTop: 4 }}>
              {/* Suspend & Clone Row */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={handleToggleActive}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    height: 44,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {sub.isActive ? (
                    <>
                      <Pause size={15} color={colors.text} />
                      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>Suspend</Text>
                    </>
                  ) : (
                    <>
                      <Play size={15} color={colors.text} />
                      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>Resume</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleClone}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    height: 44,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Copy size={15} color={colors.text} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>Clone</Text>
                </TouchableOpacity>
              </View>

              {/* Record Payment Button */}
              <TouchableOpacity
                onPress={handleRecordPayment}
                activeOpacity={0.7}
                style={{
                  height: 44,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <DollarSign size={15} color={colors.text} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                  Record Payment
                </Text>
              </TouchableOpacity>

              {/* Delete Subscription Button */}
              <TouchableOpacity
                onPress={handleDelete}
                activeOpacity={0.7}
                style={{
                  height: 44,
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Trash2 size={15} color={colors.destructive} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.destructive }}>
                  Delete Subscription
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Cancellation Guide Modal */}
      {sub && (
        <CancellationGuideModal
          visible={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          subscription={{
            _id: sub._id,
            name: sub.name,
            icon: sub.icon,
            color: sub.color,
            price: sub.price,
            currency: sub.currency,
            cycle: sub.cycle,
            cancelUrl: sub.cancelUrl,
            isTrial: sub.isTrial,
            trialEndDate: sub.trialEndDate,
          }}
          onMarkCanceled={handleSuspend}
          onUpdateCancelUrl={handleUpdateCancelUrl}
          primaryCurrency={primaryCurrency}
          rates={rates}
        />
      )}

      {/* Change Cancel URL Modal */}
      <Modal
        visible={cancelUrlModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelUrlModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 18, width: "100%", maxWidth: 360, gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                Change Cancellation Page
              </Text>
              <TouchableOpacity onPress={() => setCancelUrlModalOpen(false)}>
                <X size={18} color={colors.mutedText} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: colors.mutedText, lineHeight: 16 }}>
              Provide the direct account cancellation or subscription management URL for {sub?.name}.
            </Text>
            <Input
              placeholder="https://service.com/account/cancel"
              value={tempCancelUrl}
              onChangeText={setTempCancelUrl}
              autoCapitalize="none"
              keyboardType="url"
              autoFocus
            />
            <Text style={{ fontSize: 11, color: colors.mutedText }}>
              Leave empty to use the standard search guide.
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setCancelUrlModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onPress={handleSaveCancelUrlModal}
                disabled={savingCancelUrl}
              >
                {savingCancelUrl ? "Saving..." : "Save URL"}
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Icon Picker Modal for editing */}
      <IconPickerModal
        visible={iconPickerOpen}
        selected={editIcon || sub?.icon || null}
        onClose={() => setIconPickerOpen(false)}
        onSelect={(iconName) => setEditIcon(iconName)}
      />
    </SafeAreaView>
  )
}

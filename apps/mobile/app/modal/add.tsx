import React, { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import {
  ArrowLeft,
  X,
  Sparkles,
  Users,
  CreditCard,
  UserPlus,
  Trash2,
} from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TemplateList } from "@/components/template-list"
import { IconPickerModal } from "@/components/icon-picker-modal"
import { SubscriptionTemplate } from "@/constants/default-templates"
import { categories, billingCycles, colorOptions } from "@/constants/categories"
import { useThemeColor } from "@/hooks/use-theme-color"

export default function AddSubscriptionModal() {
  const router = useRouter()
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()

  const create = useMutation(api.subscriptions.create)
  const paymentMethods = useQuery(api.paymentMethods.list, isSignedIn ? {} : "skip")

  const [step, setStep] = useState<1 | 2>(1)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form State
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [cycle, setCycle] = useState("monthly")
  const [category, setCategory] = useState("entertainment")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState("")
  const [account, setAccount] = useState("")
  const [website, setWebsite] = useState("")
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>("")

  // Trial additions
  const [isTrial, setIsTrial] = useState(false)
  const [trialEndDate, setTrialEndDate] = useState("")
  const [cancelUrl, setCancelUrl] = useState("")

  // Shared / Split plan additions (SplitKeep)
  const [isShared, setIsShared] = useState(false)
  const [totalPlanPrice, setTotalPlanPrice] = useState("")
  const [totalMembers, setTotalMembers] = useState("4")
  const [splitMembersList, setSplitMembersList] = useState<{ name: string; shareAmount: number }[]>([])

  const handleTemplateSelect = (template: SubscriptionTemplate) => {
    setName(template.name)
    setPrice(template.defaultPrice.toString())
    setCurrency(template.defaultCurrency)
    setCategory(template.category)
    setSelectedIcon(template.icon)
    setSelectedColor(template.color)
    if (template.cancelUrl) setCancelUrl(template.cancelUrl)
    setStep(2)
  }

  const handleTotalPlanPriceChange = (val: string) => {
    setTotalPlanPrice(val)
    const total = parseFloat(val)
    const members = parseInt(totalMembers) || 1
    if (!isNaN(total) && members > 0) {
      const share = parseFloat((total / members).toFixed(2))
      setPrice(share.toString())
    }
  }

  const handleTotalMembersChange = (val: string) => {
    setTotalMembers(val)
    const total = parseFloat(totalPlanPrice)
    const members = parseInt(val) || 1
    if (!isNaN(total) && members > 0) {
      const share = parseFloat((total / members).toFixed(2))
      setPrice(share.toString())
    }
  }

  const addSplitMember = () => {
    const total = parseFloat(totalPlanPrice) || parseFloat(price) || 0
    const count = splitMembersList.length + 2
    const defShare = parseFloat((total / count).toFixed(2))
    setSplitMembersList([
      ...splitMembersList,
      { name: `Member ${splitMembersList.length + 1}`, shareAmount: defShare },
    ])
  }

  const removeSplitMember = (index: number) => {
    setSplitMembersList(splitMembersList.filter((_, i) => i !== index))
  }

  const updateSplitMemberName = (index: number, val: string) => {
    const updated = [...splitMembersList]
    updated[index].name = val
    setSplitMembersList(updated)
  }

  const updateSplitMemberShare = (index: number, val: string) => {
    const updated = [...splitMembersList]
    updated[index].shareAmount = parseFloat(val) || 0
    setSplitMembersList(updated)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a subscription name")
      return
    }

    setLoading(true)
    try {
      await create({
        name: name.trim(),
        price: parseFloat(price || "0"),
        currency,
        cycle,
        category,
        icon: selectedIcon || "Receipt",
        color: selectedColor,
        startDate: startDate || new Date().toISOString().split("T")[0],
        nextBilling: startDate || new Date().toISOString().split("T")[0],
        endDate: endDate.trim() ? endDate.trim() : undefined,
        account: account.trim() ? account.trim() : undefined,
        website: website.trim() ? website.trim() : undefined,
        isTrial,
        trialEndDate: isTrial && trialEndDate.trim() ? trialEndDate.trim() : undefined,
        cancelUrl: cancelUrl.trim() ? cancelUrl.trim() : undefined,
        isShared,
        totalPlanPrice: isShared && totalPlanPrice.trim() ? parseFloat(totalPlanPrice.trim()) : undefined,
        totalMembers: isShared && totalMembers.trim() ? parseInt(totalMembers.trim()) : undefined,
        paymentMethodId: selectedPaymentMethodId || undefined,
        splitMembers: isShared && splitMembersList.length > 0 ? splitMembersList : undefined,
      })

      router.back()
    } catch (e) {
      console.error("Failed to create subscription:", e)
      Alert.alert("Error", "Failed to create subscription")
    } finally {
      setLoading(false)
    }
  }

  return (
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
          {step === 2 ? (
            <TouchableOpacity onPress={() => setStep(1)} style={{ padding: 4 }}>
              <ArrowLeft size={18} color={colors.text} />
            </TouchableOpacity>
          ) : null}
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
            {step === 1 ? "Add Subscription" : "Subscription Details"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
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

      {step === 1 ? (
        <TemplateList
          onSelect={handleTemplateSelect}
          onCustomCreate={() => setStep(2)}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          {/* Icon & Color Header Box */}
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <TouchableOpacity
                onPress={() => setIconPickerOpen(true)}
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  backgroundColor: selectedColor,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DynamicIcon name={selectedIcon || "Receipt"} size={26} color="#ffffff" />
              </TouchableOpacity>

              <View style={{ flex: 1, gap: 4 }}>
                <TouchableOpacity onPress={() => setIconPickerOpen(true)}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>
                    Change Icon or Logo
                  </Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 11, color: colors.mutedText }}>
                  Choose from 100+ Lucide icons or company logo
                </Text>
              </View>
            </View>

            {/* Color circles */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase" }}>
                Brand Color
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {colorOptions.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setSelectedColor(c)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: c,
                      borderWidth: selectedColor === c ? 2 : 0,
                      borderColor: colors.text,
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Basic Info */}
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
            <Input
              label="Service Name"
              placeholder="e.g. Netflix, ChatGPT, Spotify"
              value={name}
              onChangeText={setName}
            />

            {/* Category selection */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase" }}>
                Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {categories.filter((c) => c.value !== "all").map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    onPress={() => setCategory(cat.value)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: category === cat.value ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: category === cat.value ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: category === cat.value ? colors.primaryForeground : colors.mutedText,
                      }}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Price & Currency */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1.5 }}>
                <Input
                  label="Price"
                  placeholder="9.99"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase" }}>
                  Currency
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                  {["USD", "EUR", "GBP", "IDR", "SGD", "AUD", "CAD"].map((curr) => (
                    <TouchableOpacity
                      key={curr}
                      onPress={() => setCurrency(curr)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor: currency === curr ? colors.primary : colors.surface,
                        borderWidth: 1,
                        borderColor: currency === curr ? colors.primary : colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: currency === curr ? colors.primaryForeground : colors.mutedText,
                        }}
                      >
                        {curr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Billing Cycle */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase" }}>
                Billing Cycle
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {billingCycles.map((bc) => (
                  <TouchableOpacity
                    key={bc.value}
                    onPress={() => setCycle(bc.value)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: cycle === bc.value ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: cycle === bc.value ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: cycle === bc.value ? colors.primaryForeground : colors.mutedText,
                      }}
                    >
                      {bc.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Start Date & End Date */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Start Date (YYYY-MM-DD)"
                  placeholder="2026-01-01"
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="End Date (Optional)"
                  placeholder="2026-12-31"
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
            </View>

            <Input
              label="Account Identifier / Email (Optional)"
              placeholder="e.g. personal@gmail.com"
              value={account}
              onChangeText={setAccount}
            />

            <Input
              label="Website URL (Optional)"
              placeholder="e.g. https://netflix.com"
              value={website}
              onChangeText={setWebsite}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Free Trial Toggle */}
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
                <Sparkles size={18} color={colors.emerald} />
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                    Free Trial Period
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.mutedText }}>
                    Track expiration and prevent auto-renew charges
                  </Text>
                </View>
              </View>
              <Switch value={isTrial} onValueChange={setIsTrial} />
            </View>

            {isTrial && (
              <View style={{ gap: 10, paddingTop: 4 }}>
                <Input
                  label="Trial End Date (YYYY-MM-DD)"
                  placeholder="2026-09-01"
                  value={trialEndDate}
                  onChangeText={setTrialEndDate}
                />
                <Input
                  label="Direct Cancellation Link (Optional)"
                  placeholder="https://service.com/account/cancel"
                  value={cancelUrl}
                  onChangeText={setCancelUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            )}
          </View>

          {/* SplitKeep (Shared Plan) */}
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
                <Users size={18} color={colors.blue} />
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                    SplitKeep (Shared Plan)
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.mutedText }}>
                    Split group costs and track member shares
                  </Text>
                </View>
              </View>
              <Switch value={isShared} onValueChange={setIsShared} />
            </View>

            {isShared && (
              <View style={{ gap: 10, paddingTop: 4 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Total Plan Cost"
                      placeholder="e.g. 19.99"
                      value={totalPlanPrice}
                      onChangeText={handleTotalPlanPriceChange}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Total Members"
                      placeholder="4"
                      value={totalMembers}
                      onChangeText={handleTotalMembersChange}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <Text style={{ fontSize: 11, color: colors.mutedText }}>
                  Your calculated share is {price} {currency} per {cycle}.
                </Text>

                {/* Member list */}
                <View style={{ gap: 8, marginTop: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>
                      Member Breakdown ({splitMembersList.length})
                    </Text>
                    <TouchableOpacity
                      onPress={addSplitMember}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: colors.surface,
                      }}
                    >
                      <UserPlus size={12} color={colors.primary} />
                      <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>
                        Add Member
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {splitMembersList.map((m, idx) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        backgroundColor: colors.surface,
                        borderRadius: 8,
                        padding: 8,
                      }}
                    >
                      <Input
                        placeholder="Name"
                        value={m.name}
                        onChangeText={(v) => updateSplitMemberName(idx, v)}
                        containerStyle={{ flex: 2 }}
                        style={{ height: 36, paddingVertical: 4 }}
                      />
                      <Input
                        placeholder="Amount"
                        value={m.shareAmount.toString()}
                        onChangeText={(v) => updateSplitMemberShare(idx, v)}
                        keyboardType="numeric"
                        containerStyle={{ flex: 1 }}
                        style={{ height: 36, paddingVertical: 4 }}
                      />
                      <TouchableOpacity onPress={() => removeSplitMember(idx)} style={{ padding: 4 }}>
                        <Trash2 size={16} color={colors.destructive} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Payment Method / Card Vault link */}
          {paymentMethods && paymentMethods.length > 0 && (
            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 14,
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase" }}>
                Linked Payment Card
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setSelectedPaymentMethodId("")}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: !selectedPaymentMethodId ? colors.primary : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: !selectedPaymentMethodId ? colors.primaryForeground : colors.mutedText,
                    }}
                  >
                    None / Other
                  </Text>
                </TouchableOpacity>

                {paymentMethods.map((pm) => {
                  const isSelected = selectedPaymentMethodId === pm._id
                  return (
                    <TouchableOpacity
                      key={pm._id}
                      onPress={() => setSelectedPaymentMethodId(pm._id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                      }}
                    >
                      <CreditCard size={14} color={isSelected ? colors.primaryForeground : colors.mutedText} />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: isSelected ? colors.primaryForeground : colors.text,
                        }}
                      >
                        {pm.name} {pm.last4 ? `(•• ${pm.last4})` : ""}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          )}

          {/* Submit */}
          <Button
            size="lg"
            onPress={handleSave}
            loading={loading}
            style={{ marginTop: 8, marginBottom: 24 }}
          >
            Save Subscription
          </Button>
        </ScrollView>
      )}

      <IconPickerModal
        visible={iconPickerOpen}
        selected={selectedIcon}
        onSelect={(icon) => setSelectedIcon(icon)}
        onClose={() => setIconPickerOpen(false)}
        defaultDomain={website}
      />
    </SafeAreaView>
  )
}

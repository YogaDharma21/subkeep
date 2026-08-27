import React from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { useRouter } from "expo-router"
import { DynamicIcon } from "@/components/dynamic-icon"
import { Badge } from "@/components/ui/badge"
import { convertAndFormat, formatCurrencyAmount, formatCycleLabel } from "@/lib/currency"
import { getSymbol } from "@/constants/currencies"
import { getContrastTextColor } from "@/constants/categories"
import { format, differenceInDays } from "date-fns"
import { useThemeColor } from "@/hooks/use-theme-color"

export interface SubscriptionItemProps {
  _id: string
  name: string
  icon: string
  color: string
  price: number
  currency: string
  cycle: string
  category: string
  startDate?: string
  nextBilling: string
  endDate?: string
  account?: string
  website?: string
  isActive?: boolean
  isTrial?: boolean
  trialEndDate?: string
  cancelUrl?: string
  isShared?: boolean
  totalPlanPrice?: number
  totalMembers?: number
}

interface SubscriptionCardProps {
  sub: SubscriptionItemProps
  primaryCurrency?: string
  rates?: Record<string, number>
}

export function SubscriptionCard({
  sub,
  primaryCurrency = "USD",
  rates,
}: SubscriptionCardProps) {
  const router = useRouter()
  const { colors } = useThemeColor()

  const isTrial = !!sub.isTrial
  const isShared = !!sub.isShared
  const showConverted = primaryCurrency && primaryCurrency !== sub.currency

  let trialDaysLeft: number | null = null
  if (isTrial && sub.trialEndDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tEnd = new Date(sub.trialEndDate)
    tEnd.setHours(0, 0, 0, 0)
    trialDaysLeft = Math.max(0, differenceInDays(tEnd, today))
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/subscriptions/${sub._id}` as never)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 12,
        gap: 12,
      }}
    >
      {/* Icon Box */}
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          backgroundColor: sub.color || "#6366F1",
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <DynamicIcon name={sub.icon} size={20} color={getContrastTextColor(sub.color)} />
      </View>

      {/* Info Column */}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        {/* Line 1: Name and Badges */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: colors.text,
              flexShrink: 1,
            }}
          >
            {sub.name}
          </Text>

          {isTrial ? (
            <Badge variant="emerald" style={{ paddingHorizontal: 5, paddingVertical: 2 }}>
              TRIAL
            </Badge>
          ) : null}

          {isShared ? (
            <Badge variant="blue" style={{ paddingHorizontal: 5, paddingVertical: 2 }}>
              SPLIT {sub.totalMembers ? `(1/${sub.totalMembers})` : ""}
            </Badge>
          ) : null}
        </View>

        {/* Line 2: Account or email identifier if present */}
        {sub.account ? (
          <Text
            numberOfLines={1}
            style={{ fontSize: 11, color: colors.mutedText }}
          >
            {sub.account}
          </Text>
        ) : null}

        {/* Line 3: Category & Billing status */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text
            style={{
              fontSize: 11,
              color: colors.mutedText,
              textTransform: "capitalize",
            }}
          >
            {sub.category}
          </Text>
          <Text style={{ fontSize: 11, color: colors.mutedText }}>•</Text>
          {isTrial && sub.trialEndDate ? (
            <Text style={{ fontSize: 11, color: colors.emerald, fontWeight: "600" }}>
              Ends {format(new Date(sub.trialEndDate), "MMM d")}
              {trialDaysLeft !== null ? ` (${trialDaysLeft}d)` : ""}
            </Text>
          ) : (
            <Text style={{ fontSize: 11, color: colors.mutedText }}>
              Next: {format(new Date(sub.nextBilling || new Date()), "MMM d")}
            </Text>
          )}

          {sub.endDate && !isTrial ? (
            <Text style={{ fontSize: 11, color: colors.subtleText }}>
              (Ends {format(new Date(sub.endDate), "MMM d")})
            </Text>
          ) : null}
        </View>
      </View>

      {/* Price Column */}
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text }}>
          {showConverted
            ? convertAndFormat(sub.price, sub.currency, primaryCurrency, rates)
            : formatCurrencyAmount(sub.price, sub.currency)}
        </Text>
        <Text style={{ fontSize: 10, color: colors.mutedText }}>
          {showConverted ? `(${getSymbol(sub.currency)}${sub.price}) ` : ""}
          {formatCycleLabel(sub.cycle)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

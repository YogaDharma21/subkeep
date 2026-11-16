import React, { useRef } from "react"
import { View, Text, TouchableOpacity, Platform } from "react-native"
import { useRouter } from "expo-router"
import { DynamicIcon } from "@/components/dynamic-icon"
import { Badge } from "@/components/ui/badge"
import { Numeral } from "@/components/ui/surface"
import { convertAndFormat, formatCurrencyAmount, formatCycleLabel } from "@/lib/currency"
import { getSymbol } from "@/constants/currencies"
import { format, differenceInDays } from "date-fns"
import { useThemeColor } from "@/hooks/use-theme-color"
import Swipeable from "react-native-gesture-handler/Swipeable"
import * as Haptics from "expo-haptics"
import { Check, Play, Pause } from "lucide-react-native"

export interface SubscriptionItemProps {
  _id: string
  name: string
  icon: string
  color?: string
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
  pendingCancel?: boolean
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
  onRecordPayment?: (sub: SubscriptionItemProps) => void
  onTogglePause?: (sub: SubscriptionItemProps) => void
}

export function SubscriptionCard({
  sub,
  primaryCurrency = "USD",
  rates,
  onRecordPayment,
  onTogglePause,
}: SubscriptionCardProps) {
  const router = useRouter()
  const { colors } = useThemeColor()
  const swipeableRef = useRef<Swipeable>(null)

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    }
  }

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

  const isPaused = sub.isActive === false
  const rightLabel = isPaused ? "Resume" : "Pause"
  const RightIcon = isPaused ? Play : Pause
  const rightColor = isPaused ? colors.amber : colors.destructive
  const rightBg = isPaused ? colors.amberBackground : colors.destructiveBackground

  const renderLeftActions = () => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          triggerHaptic()
          swipeableRef.current?.close()
          onRecordPayment?.(sub)
        }}
        style={{
          width: 96,
          height: "100%",
          backgroundColor: colors.emeraldBackground,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          paddingHorizontal: 8,
        }}
      >
        <Check size={18} color={colors.emerald} />
        <Text
          numberOfLines={1}
          style={{
            fontSize: 11,
            fontWeight: "500",
            color: colors.emerald,
            letterSpacing: -0.1,
          }}
        >
          Record Paid
        </Text>
      </TouchableOpacity>
    )
  }

  const renderRightActions = () => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          triggerHaptic()
          swipeableRef.current?.close()
          onTogglePause?.(sub)
        }}
        style={{
          width: 96,
          height: "100%",
          backgroundColor: rightBg,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          paddingHorizontal: 8,
        }}
      >
        <RightIcon size={18} color={rightColor} />
        <Text
          numberOfLines={1}
          style={{
            fontSize: 11,
            fontWeight: "500",
            color: rightColor,
            letterSpacing: -0.1,
          }}
        >
          {rightLabel}
        </Text>
      </TouchableOpacity>
    )
  }

  const cardContent = (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/subscriptions/${sub._id}` as never)}
      style={{
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 20,
        padding: 12,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colors.surfaceInset,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <DynamicIcon name={sub.icon} size={18} color={colors.text} />
      </View>

      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 13,
              fontWeight: "500",
              letterSpacing: -0.1,
              color: colors.text,
              flexShrink: 1,
            }}
          >
            {sub.name}
          </Text>

          {isTrial ? <Badge variant="secondary">TRIAL</Badge> : null}

          {isShared ? (
            <Badge variant="secondary">
              SPLIT {sub.totalMembers ? `(1/${sub.totalMembers})` : ""}
            </Badge>
          ) : null}

          {sub.pendingCancel && sub.isActive !== false ? (
            <Badge variant="secondary">CANCELING</Badge>
          ) : null}

          {sub.isActive === false ? (
            <Badge variant="outline">CANCELED</Badge>
          ) : null}
        </View>

        {sub.account ? (
          <Text numberOfLines={1} style={{ fontSize: 11, color: colors.mutedText }}>
            {sub.account}
          </Text>
        ) : null}

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
          <Text style={{ fontSize: 11, color: colors.subtleText }}>·</Text>
          {isTrial && sub.trialEndDate ? (
            <Text style={{ fontSize: 11, color: colors.emerald, fontWeight: "500" }}>
              Ends {format(new Date(sub.trialEndDate), "MMM d")}
              {trialDaysLeft !== null && trialDaysLeft > 0
                ? ` (${trialDaysLeft}d)`
                : trialDaysLeft === 0
                ? " (Expired)"
                : ""}
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

      <View style={{ alignItems: "flex-end" }}>
        <Numeral style={{ fontSize: 13, fontWeight: "500" }}>
          {showConverted
            ? convertAndFormat(sub.price, sub.currency, primaryCurrency, rates)
            : formatCurrencyAmount(sub.price, sub.currency)}
        </Numeral>
        <Text style={{ fontSize: 10, color: colors.mutedText }}>
          {showConverted ? `(${getSymbol(sub.currency)}${sub.price}) ` : ""}
          {formatCycleLabel(sub.cycle)}
        </Text>
      </View>
    </TouchableOpacity>
  )

  if (Platform.OS === "web") {
    return cardContent
  }

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      onSwipeableWillOpen={() => {
        triggerHaptic()
      }}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      containerStyle={{
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      {cardContent}
    </Swipeable>
  )
}

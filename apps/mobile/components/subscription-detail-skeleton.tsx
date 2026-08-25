import React from "react"
import { View, Text, ScrollView, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { ArrowLeft } from "lucide-react-native"
import { useThemeColor } from "@/hooks/use-theme-color"
import { Skeleton } from "@/components/ui/skeleton"

export function SubscriptionDetailSkeleton() {
  const router = useRouter()
  const { colors } = useThemeColor()

  return (
    <SafeAreaView edges={["top", "bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
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

        <Skeleton width={36} height={36} borderRadius={18} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 14 }}
      >
        {/* Trial / Notice Banner Skeleton */}
        <Skeleton width="100%" height={48} borderRadius={12} />

        {/* Hero Card Header Skeleton */}
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
          <Skeleton width={52} height={52} borderRadius={12} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="65%" height={18} borderRadius={4} />
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Skeleton width={60} height={20} borderRadius={6} />
              <Skeleton width={70} height={20} borderRadius={6} />
              <Skeleton width={50} height={20} borderRadius={6} />
            </View>
          </View>
        </View>

        {/* 3 KPI Summary Cards Skeleton */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 8,
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Skeleton width="70%" height={16} borderRadius={4} />
              <Skeleton width="50%" height={10} borderRadius={3} />
            </View>
          ))}
        </View>

        {/* Plan Information Card Skeleton */}
        <View style={{ gap: 8 }}>
          <Skeleton width={130} height={12} borderRadius={4} style={{ marginLeft: 4 }} />
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
            {[
              { w1: 90, w2: 120 },
              { w1: 100, w2: 90 },
              { w1: 75, w2: 140 },
              { w1: 110, w2: 80 },
              { w1: 85, w2: 100 },
            ].map((row, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: idx < 4 ? 12 : 0,
                  borderBottomWidth: idx < 4 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <Skeleton width={row.w1} height={13} borderRadius={4} />
                <Skeleton width={row.w2} height={13} borderRadius={4} />
              </View>
            ))}
          </View>
        </View>

        {/* Split / Payment Card Skeleton */}
        <View style={{ gap: 8 }}>
          <Skeleton width={150} height={12} borderRadius={4} style={{ marginLeft: 4 }} />
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Skeleton width={36} height={36} borderRadius={10} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="50%" height={14} borderRadius={4} />
                <Skeleton width="35%" height={11} borderRadius={3} />
              </View>
              <Skeleton width={50} height={14} borderRadius={4} />
            </View>
          </View>
        </View>

        {/* Action Buttons Skeleton */}
        <View style={{ gap: 10, marginTop: 4 }}>
          <Skeleton width="100%" height={44} borderRadius={10} />
          <Skeleton width="100%" height={44} borderRadius={10} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

import React from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import {
  Receipt,
  Sparkles,
  CreditCard,
  Users,
  Check,
  Mail,
} from "lucide-react-native"
import { GoogleOAuthButton } from "@/components/google-oauth-button"
import { useThemeColor } from "@/hooks/use-theme-color"

export function LandingScreen() {
  const router = useRouter()
  const { colors } = useThemeColor()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 24,
          gap: 24,
        }}
      >
        {/* Brand Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Receipt size={24} color={colors.primaryForeground} />
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "900",
              letterSpacing: 2,
              color: colors.text,
              textTransform: "uppercase",
            }}
          >
            SUBKEEP
          </Text>
        </View>

        {/* Pitch Headline */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              lineHeight: 32,
              color: colors.text,
            }}
          >
            Never lose track of your subscriptions and recurring bills again.
          </Text>
          <Text style={{ fontSize: 13, color: colors.mutedText, lineHeight: 19 }}>
            Take complete control of your monthly spend, free trial deadlines, card payment methods, and split group expenses in one unified, privacy-friendly mobile hub.
          </Text>
        </View>

        {/* 3 Feature Highlights */}
        <View style={{ gap: 10 }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={18} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                Smart Analytics
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 2 }}>
                MoM trends, price hike alerts & monthly budget caps
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CreditCard size={18} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                Card Vault
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 2 }}>
                Map renewal cards, track expiry & avoid surprise fees
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={18} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                SplitKeep
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 2 }}>
                Split costs with friends & generate 1-tap reminders
              </Text>
            </View>
          </View>
        </View>

        {/* Live Mockup Box */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 16,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase" }}>
              Monthly Billing Preview
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: colors.text }}>
                4 Active
              </Text>
            </View>
          </View>

          {/* Budget bar */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 10,
              padding: 10,
              gap: 6,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text }}>
                72% Monthly Budget Used
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedText }}>
                $144.00 / $200.00
              </Text>
            </View>
            <View
              style={{
                height: 6,
                backgroundColor: colors.border,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <View style={{ width: "72%", height: "100%", backgroundColor: colors.emerald }} />
            </View>
          </View>

          {/* Checklist items */}
          <View style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surface,
                borderRadius: 10,
                padding: 10,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  backgroundColor: colors.emeraldBackground,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check size={14} color={colors.emerald} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>
                  Netflix Premium
                </Text>
                <Text style={{ fontSize: 10, color: colors.mutedText }}>
                  $19.99 · Monthly
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surface,
                borderRadius: 10,
                padding: 10,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  backgroundColor: colors.emeraldBackground,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check size={14} color={colors.emerald} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>
                  Spotify Family Plan
                </Text>
                <Text style={{ fontSize: 10, color: colors.mutedText }}>
                  $16.99 · Shared (1/4)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action CTAs: 1-Tap Google Sign In */}
        <View style={{ gap: 12, paddingTop: 6, paddingBottom: 20 }}>
          <GoogleOAuthButton
            title="Continue with Google"
            onSuccess={() => router.replace("/(tabs)" as never)}
          />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(auth)/sign-in" as never)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 8,
            }}
          >
            <Mail size={14} color={colors.mutedText} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedText }}>
              Sign in with Email
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

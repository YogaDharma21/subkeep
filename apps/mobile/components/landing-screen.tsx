import React from "react"
import { View, Text, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { GoogleOAuthButton } from "@/components/google-oauth-button"
import { useThemeColor } from "@/hooks/use-theme-color"

export function LandingScreen() {
  const router = useRouter()
  const { colors } = useThemeColor()

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
      }}
    >
      <View style={{ width: "100%", maxWidth: 340, alignItems: "center" }}>
        {/* Brand Icon */}
        <Image
          source={require("@/assets/images/icon.png")}
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
          }}
          resizeMode="contain"
        />

        {/* Brand Name */}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 28 }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "900",
              letterSpacing: 2,
              color: colors.text,
            }}
          >
            SUB
          </Text>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "900",
              letterSpacing: 2,
              color: colors.mutedText,
            }}
          >
            KEEP
          </Text>
        </View>

        {/* Clean, Simple Tagline */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "500",
            color: colors.mutedText,
            textAlign: "center",
            lineHeight: 20,
            marginTop: 14,
            maxWidth: 300,
          }}
        >
          Double-check your subscriptions before they renew!{"\n"}
          Never forget a free trial, bill, or card charge again.
        </Text>

        {/* Action Button: Continue with Google */}
        <View style={{ width: "100%", marginTop: 34 }}>
          <GoogleOAuthButton
            title="CONTINUE WITH GOOGLE"
            onSuccess={() => router.replace("/(tabs)" as never)}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

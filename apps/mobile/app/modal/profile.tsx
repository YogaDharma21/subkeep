import React, { useEffect } from "react"
import { View, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useAuth } from "@clerk/expo"
import { UserProfileView } from "@clerk/expo/native"
import { useThemeColor } from "@/hooks/use-theme-color"

export default function ProfileModal() {
  const router = useRouter()
  const { colors } = useThemeColor()
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.back()
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return (
      <SafeAreaView
        edges={["top", "bottom", "left", "right"]}
        style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={["top", "bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <UserProfileView
          style={{ flex: 1 }}
          onDismiss={() => router.back()}
        />
      </View>
    </SafeAreaView>
  )
}

import { ClerkProvider, useAuth } from "@clerk/clerk-expo"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ConvexReactClient } from "convex/react"
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Stack, useRouter, useSegments } from "expo-router"
import { StatusBar } from "expo-status-bar"
import React, { useEffect } from "react"
import { View, ActivityIndicator } from "react-native"
import { tokenCache } from "@/lib/token-cache"
import { LandingScreen } from "@/components/landing-screen"
import { CustomAlertProvider } from "@/components/custom-alert-provider"
import { useThemeColor } from "@/hooks/use-theme-color"
import "react-native-reanimated"

const convexUrl =
  process.env.EXPO_PUBLIC_CONVEX_URL || "https://avid-fox-180.convex.cloud"
const clerkPublishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_ZW5nYWdpbmctbW9sZS0xMC5jbGVyay5hY2NvdW50cy5kZXYk"

const convex = new ConvexReactClient(convexUrl)

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const { colors } = useThemeColor()

  useEffect(() => {
    if (!isLoaded) return

    const inAuthGroup = segments[0] === "(auth)"

    if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)" as never)
    }
  }, [isLoaded, isSignedIn, segments, router])

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!isSignedIn && segments[0] !== "(auth)") {
    return <LandingScreen />
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal/add"
        options={{ presentation: "pageSheet", headerShown: false }}
      />
      <Stack.Screen
        name="modal/settings"
        options={{ presentation: "pageSheet", headerShown: false }}
      />
      <Stack.Screen
        name="modal/cards"
        options={{ presentation: "pageSheet", headerShown: false }}
      />
      <Stack.Screen
        name="subscriptions/[id]"
        options={{ headerShown: false }}
      />
    </Stack>
  )
}

export default function RootLayout() {
  const { isDark } = useThemeColor()

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <CustomAlertProvider>
            <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
              <InitialLayout />
              <StatusBar style={isDark ? "light" : "dark"} />
            </ThemeProvider>
          </CustomAlertProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </SafeAreaProvider>
  )
}

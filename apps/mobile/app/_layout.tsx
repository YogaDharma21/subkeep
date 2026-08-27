import { ClerkProvider, useAuth } from "@clerk/expo"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ConvexReactClient } from "convex/react"
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Stack, useRouter, useSegments } from "expo-router"
import { StatusBar } from "expo-status-bar"
import React, { useEffect, useMemo } from "react"
import { View, ActivityIndicator } from "react-native"
import { tokenCache } from "@clerk/expo/token-cache"
import { LandingScreen } from "@/components/landing-screen"
import { CustomAlertProvider } from "@/components/custom-alert-provider"
import { AppThemeProvider, useThemeColor } from "@/hooks/use-theme-color"
import { Colors } from "@/constants/theme"
import "react-native-reanimated"

const convexUrl =
  process.env.EXPO_PUBLIC_CONVEX_URL || "https://avid-fox-180.convex.cloud"
const clerkPublishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_ZW5nYWdpbmctbW9sZS0xMC5jbGVyay5hY2NvdW50cy5kZXYk"

const convex = new ConvexReactClient(convexUrl)

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
    primary: Colors.dark.primary,
    notification: Colors.dark.destructive,
  },
}

const customLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
    primary: Colors.light.primary,
    notification: Colors.light.destructive,
  },
}

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false })
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
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="(auth)"
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="modal/add"
        options={{
          presentation: "pageSheet",
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="modal/settings"
        options={{
          presentation: "pageSheet",
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="modal/cards"
        options={{
          presentation: "pageSheet",
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="modal/preferences"
        options={{
          presentation: "pageSheet",
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="modal/profile"
        options={{
          presentation: "pageSheet",
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="subscriptions/[id]"
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </Stack>
  )
}

function ThemedApp() {
  const { isDark, colors } = useThemeColor()

  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? customDarkTheme : customLightTheme),
      colors: {
        ...(isDark ? customDarkTheme.colors : customLightTheme.colors),
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
      },
    }),
    [isDark, colors]
  )

  return (
    <ThemeProvider value={navigationTheme}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <InitialLayout />
        <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.background} />
      </View>
    </ThemeProvider>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: Colors.dark.background }}>
      <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <AppThemeProvider>
            <CustomAlertProvider>
              <ThemedApp />
            </CustomAlertProvider>
          </AppThemeProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </SafeAreaProvider>
  )
}

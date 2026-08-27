import * as WebBrowser from "expo-web-browser"
import { useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useThemeColor } from "@/hooks/use-theme-color"

function getClerkAccountPortalUrl(): string {
  const publishableKey =
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "pk_test_ZW5nYWdpbmctbW9sZS0xMC5jbGVyay5hY2NvdW50cy5kZXYk"

  try {
    const encodedHost = publishableKey.split("_")[2]
    if (encodedHost && typeof atob !== "undefined") {
      const frontendApiHost = atob(encodedHost).replace(/\$$/, "")
      return `https://${frontendApiHost}/user`
    }
  } catch {
    // Fall through to Clerk's generic Account Portal URL.
  }

  return "https://accounts.clerk.com/user"
}

export default function ProfileModal() {
  const router = useRouter()
  const { colors } = useThemeColor()
  const hasOpenedPortal = useRef(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (hasOpenedPortal.current) return
    hasOpenedPortal.current = true

    let isMounted = true

    const openAccountPortal = async () => {
      try {
        await WebBrowser.openBrowserAsync(getClerkAccountPortalUrl())
        if (isMounted) router.back()
      } catch {
        if (isMounted) setError(true)
      }
    }

    void openAccountPortal()

    return () => {
      isMounted = false
    }
  }, [router])

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        {error ? (
          <Text style={{ color: colors.text, textAlign: "center" }}>
            Unable to open Clerk account settings. Please try again.
          </Text>
        ) : (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.mutedText, marginTop: 12, textAlign: "center" }}>
              Opening Clerk account settings...
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

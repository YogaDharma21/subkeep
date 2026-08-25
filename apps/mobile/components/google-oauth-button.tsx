import React, { useState, useCallback } from "react"
import { TouchableOpacity, Text, ActivityIndicator } from "react-native"
import { useOAuth } from "@clerk/clerk-expo"
import * as WebBrowser from "expo-web-browser"
import * as Linking from "expo-linking"
import Svg, { Path } from "react-native-svg"
import { useAlert } from "@/components/custom-alert-provider"

WebBrowser.maybeCompleteAuthSession()

interface GoogleOAuthButtonProps {
  title?: string
  onSuccess?: () => void
}

export function GoogleOAuthButton({
  title = "Continue with Google",
  onSuccess,
}: GoogleOAuthButtonProps) {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" })
  const [loading, setLoading] = useState(false)
  const { showAlert } = useAlert()

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true)
    try {
      const redirectUrl = Linking.createURL("/(tabs)", { scheme: "mobile" })
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl,
      })

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        if (onSuccess) onSuccess()
      }
    } catch (err: unknown) {
      console.error("OAuth error:", err)
      const error = err as { message?: string; errors?: { message?: string }[] }
      const msg = error.errors?.[0]?.message || error.message || "Failed to sign in with Google."
      showAlert({ title: "Google Sign In", message: msg, icon: "error" })
    } finally {
      setLoading(false)
    }
  }, [startOAuthFlow, onSuccess, showAlert])

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleGoogleSignIn}
      disabled={loading}
      style={{
        height: 50,
        backgroundColor: "#ffffff",
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: "#e4e4e7",
        elevation: 2,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#18181b" />
      ) : (
        <>
          {/* Official Google 'G' Logo */}
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <Path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <Path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <Path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </Svg>

          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: "#18181b",
              letterSpacing: 0.2,
            }}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  )
}

import React, { useState } from "react"
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useSignIn } from "@clerk/clerk-expo"
import { Lock, Mail, ArrowRight } from "lucide-react-native"
import { GoogleOAuthButton } from "@/components/google-oauth-button"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useThemeColor } from "@/hooks/use-theme-color"

export default function SignInScreen() {
  const router = useRouter()
  const { colors } = useThemeColor()
  const { signIn, setActive, isLoaded } = useSignIn()

  const [emailAddress, setEmailAddress] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleSignIn = async () => {
    if (!isLoaded) return

    if (!emailAddress.trim() || !password.trim()) {
      setErrorMsg("Please enter your email and password.")
      return
    }

    setLoading(true)
    setErrorMsg("")

    try {
      const result = await signIn.create({
        identifier: emailAddress.trim(),
        password: password,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.replace("/(tabs)" as never)
      } else {
        console.log("Sign in status not complete:", result)
        setErrorMsg("Further verification required.")
      }
    } catch (err: unknown) {
      const error = err as { errors?: { message?: string; longMessage?: string }[] }
      console.error("Sign in error:", err)
      const msg = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || "Failed to log in. Please check your credentials."
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 24,
            gap: 20,
          }}
        >
          {/* Header */}
          <View style={{ alignItems: "center", gap: 10, paddingVertical: 12 }}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
              }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>
              Welcome back
            </Text>
            <Text style={{ fontSize: 13, color: colors.mutedText, textAlign: "center" }}>
              Sign in to sync your active subscriptions and settings
            </Text>
          </View>

          {/* Primary Google Auth */}
          <GoogleOAuthButton
            title="Continue with Google"
            onSuccess={() => router.replace("/(tabs)" as never)}
          />

          {/* Divider */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.mutedText, textTransform: "uppercase" }}>
              or with email
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          {/* Email/Password Form */}
          <View style={{ gap: 14 }}>
            <Input
              label="Email Address"
              placeholder="user@example.com"
              value={emailAddress}
              onChangeText={setEmailAddress}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Mail size={16} color={colors.mutedText} />}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Lock size={16} color={colors.mutedText} />}
            />

            {errorMsg ? (
              <View
                style={{
                  backgroundColor: colors.destructiveBackground,
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.destructive }}>
                  {errorMsg}
                </Text>
              </View>
            ) : null}

            <Button
              size="lg"
              onPress={handleSignIn}
              loading={loading}
              icon={<ArrowRight size={18} color={colors.primaryForeground} />}
              style={{ marginTop: 6 }}
            >
              LOG IN WITH EMAIL
            </Button>
          </View>

          {/* Footer link to sign up */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 4,
              paddingVertical: 12,
            }}
          >
            <Text style={{ fontSize: 13, color: colors.mutedText }}>
              {"Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-up" as never)}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

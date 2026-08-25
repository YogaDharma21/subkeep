import React, { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useRouter } from "expo-router"
import { useSignUp } from "@clerk/clerk-expo"
import { Lock, Mail, ArrowRight, CheckCircle, Receipt } from "lucide-react-native"
import { GoogleOAuthButton } from "@/components/google-oauth-button"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useThemeColor } from "@/hooks/use-theme-color"

export default function SignUpScreen() {
  const router = useRouter()
  const { colors } = useThemeColor()
  const { isLoaded, signUp, setActive } = useSignUp()

  const [emailAddress, setEmailAddress] = useState("")
  const [password, setPassword] = useState("")
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const onSignUpPress = async () => {
    if (!isLoaded) return

    if (!emailAddress.trim() || !password.trim()) {
      setErrorMsg("Please enter an email and password.")
      return
    }

    setLoading(true)
    setErrorMsg("")

    try {
      await signUp.create({
        emailAddress: emailAddress.trim(),
        password: password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setPendingVerification(true)
    } catch (err: unknown) {
      const error = err as { errors?: { message?: string; longMessage?: string }[] }
      console.error("Sign up error:", err)
      const msg = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || "Failed to create account."
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  const onPressVerify = async () => {
    if (!isLoaded) return

    if (!code.trim()) {
      setErrorMsg("Please enter the verification code sent to your email.")
      return
    }

    setLoading(true)
    setErrorMsg("")

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      })

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId })
        router.replace("/(tabs)" as never)
      } else {
        console.error("Verification status not complete:", completeSignUp)
        setErrorMsg("Verification incomplete.")
      }
    } catch (err: unknown) {
      const error = err as { errors?: { message?: string; longMessage?: string }[] }
      console.error("Verification error:", err)
      const msg = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || "Invalid verification code."
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
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Receipt size={24} color={colors.primaryForeground} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>
              {pendingVerification ? "Verify your email" : "Create your account"}
            </Text>
            <Text style={{ fontSize: 13, color: colors.mutedText, textAlign: "center" }}>
              {pendingVerification
                ? `Enter the 6-digit verification code sent to ${emailAddress}`
                : "Get started with SubKeep subscription manager"}
            </Text>
          </View>

          {/* Primary Google Auth */}
          {!pendingVerification && (
            <>
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
            </>
          )}

          {/* Form */}
          {!pendingVerification ? (
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
                onPress={onSignUpPress}
                loading={loading}
                icon={<ArrowRight size={18} color={colors.primaryForeground} />}
                style={{ marginTop: 6 }}
              >
                CREATE ACCOUNT WITH EMAIL
              </Button>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              <Input
                label="Verification Code"
                placeholder="123456"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                leftIcon={<CheckCircle size={16} color={colors.mutedText} />}
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
                onPress={onPressVerify}
                loading={loading}
                icon={<ArrowRight size={18} color={colors.primaryForeground} />}
                style={{ marginTop: 6 }}
              >
                VERIFY & LOG IN
              </Button>
            </View>
          )}

          {/* Footer link to sign in */}
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
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-in" as never)}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                Log In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

import React, { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useUser, useAuth } from "@clerk/clerk-expo"
import { Image } from "expo-image"
import * as WebBrowser from "expo-web-browser"
import { format } from "date-fns"
import {
  User,
  Mail,
  Shield,
  CheckCircle2,
  Calendar,
  Clock,
  ExternalLink,
  LogOut,
  X,
  Check,
  Edit3,
  KeyRound,
  Globe,
  ChevronRight,
} from "lucide-react-native"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/components/custom-alert-provider"

function getClerkPortalUrl(): string {
  const key =
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "pk_test_ZW5nYWdpbmctbW9sZS0xMC5jbGVyay5hY2NvdW50cy5kZXYk"
  try {
    const parts = key.split("_")
    if (parts.length >= 3) {
      const base64Host = parts[2]
      if (typeof atob !== "undefined") {
        const decoded = atob(base64Host).replace(/\$$/, "")
        return `https://${decoded}/user`
      }
    }
  } catch (e) {
    console.error(e)
  }
  return "https://accounts.clerk.com/user"
}

export default function ProfileModal() {
  const router = useRouter()
  const { colors } = useThemeColor()
  const { user, isLoaded } = useUser()
  const { signOut } = useAuth()
  const { showAlert, showToast } = useAlert()

  const [isEditingName, setIsEditingName] = useState(false)
  const [firstName, setFirstName] = useState(user?.firstName || "")
  const [lastName, setLastName] = useState(user?.lastName || "")
  const [savingName, setSavingName] = useState(false)

  React.useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "")
      setLastName(user.lastName || "")
    }
  }, [user])

  const handleSaveName = async () => {
    if (!user) return
    setSavingName(true)
    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })
      setIsEditingName(false)
      showToast("Profile name updated successfully", "success")
    } catch {
      showAlert({
        title: "Update Failed",
        message: "Could not update profile name on Clerk.",
        icon: "error",
      })
    } finally {
      setSavingName(false)
    }
  }

  const handleOpenClerkPortal = async () => {
    const url = getClerkPortalUrl()
    try {
      await WebBrowser.openBrowserAsync(url)
    } catch {
      showAlert({
        title: "Portal Error",
        message: `Unable to open Clerk Account Portal: ${url}`,
        icon: "error",
      })
    }
  }

  const handleSignOut = () => {
    showAlert({
      title: "Sign Out",
      message: "Are you sure you want to log out of your Clerk account?",
      icon: "info",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            router.back()
            await signOut()
          },
        },
      ],
    })
  }

  if (!isLoaded || !user) {
    return (
      <SafeAreaView
        edges={["top", "bottom", "left", "right"]}
        style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  const initials = (user.fullName || user.primaryEmailAddress?.emailAddress || "U")
    .charAt(0)
    .toUpperCase()

  return (
    <SafeAreaView edges={["top", "bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
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
            <Shield size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text }}>
              Clerk Account
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedText }}>
              User Profile & Authentication
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 50 }}>
        {/* User Hero Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 18,
            alignItems: "center",
            gap: 12,
          }}
        >
          {user.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                borderWidth: 3,
                borderColor: colors.primary,
              }}
            />
          ) : (
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: colors.card,
              }}
            >
              <Text style={{ fontSize: 28, fontWeight: "800", color: colors.primaryForeground }}>
                {initials}
              </Text>
            </View>
          )}

          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
              {user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "SubKeep User"}
            </Text>
            <Text style={{ fontSize: 13, color: colors.mutedText }}>
              {user.primaryEmailAddress?.emailAddress}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            <Badge variant="emerald">
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={10} color={colors.emerald} />
                <Text style={{ fontSize: 10, fontWeight: "700", color: colors.emerald }}>
                  Clerk Verified
                </Text>
              </View>
            </Badge>

            {user.externalAccounts && user.externalAccounts.length > 0 && (
              <Badge variant="blue">
                <Text style={{ fontSize: 10, fontWeight: "700", color: colors.blue }}>
                  {user.externalAccounts[0].provider.toUpperCase()} OAuth
                </Text>
              </Badge>
            )}
          </View>
        </View>

        {/* Personal Details Section */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", letterSpacing: 0.8 }}>
              PROFILE DETAILS
            </Text>
            {!isEditingName && (
              <TouchableOpacity
                onPress={() => setIsEditingName(true)}
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Edit3 size={12} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>
                  Edit Name
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 14,
              gap: 14,
            }}
          >
            {isEditingName ? (
              <View style={{ gap: 10 }}>
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedText }}>
                    First Name
                  </Text>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First Name"
                    placeholderTextColor={colors.mutedText}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      backgroundColor: colors.surface,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontSize: 14,
                      color: colors.text,
                    }}
                  />
                </View>

                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedText }}>
                    Last Name
                  </Text>
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last Name"
                    placeholderTextColor={colors.mutedText}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      backgroundColor: colors.surface,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontSize: 14,
                      color: colors.text,
                    }}
                  />
                </View>

                <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end", paddingTop: 6 }}>
                  <Button
                    variant="outline"
                    onPress={() => {
                      setFirstName(user.firstName || "")
                      setLastName(user.lastName || "")
                      setIsEditingName(false)
                    }}
                    style={{ height: 36, paddingHorizontal: 12 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onPress={handleSaveName}
                    loading={savingName}
                    disabled={savingName}
                    style={{ height: 36, paddingHorizontal: 16 }}
                  >
                    Save
                  </Button>
                </View>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <User size={16} color={colors.mutedText} />
                    <Text style={{ fontSize: 13, color: colors.mutedText }}>Full Name</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                    {user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Not set"}
                  </Text>
                </View>

                <View style={{ height: 1, backgroundColor: colors.border }} />

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Mail size={16} color={colors.mutedText} />
                    <Text style={{ fontSize: 13, color: colors.mutedText }}>Primary Email</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 2 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                      {user.primaryEmailAddress?.emailAddress}
                    </Text>
                    {user.primaryEmailAddress?.verification?.status === "verified" && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Check size={11} color={colors.emerald} />
                        <Text style={{ fontSize: 10, fontWeight: "700", color: colors.emerald }}>
                          Verified
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Connected Accounts Section */}
        {user.externalAccounts && user.externalAccounts.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4 }}>
              CONNECTED ACCOUNTS
            </Text>

            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 14,
                gap: 10,
              }}
            >
              {user.externalAccounts.map((account) => (
                <View
                  key={account.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Globe size={16} color={colors.text} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                        {account.provider.charAt(0).toUpperCase() + account.provider.slice(1)}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.mutedText }}>
                        {account.emailAddress || account.username || "Connected"}
                      </Text>
                    </View>
                  </View>

                  <Badge variant="emerald">Connected</Badge>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Security & Metadata Section */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4 }}>
            SECURITY & ACCOUNT INFO
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 14,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <KeyRound size={16} color={colors.mutedText} />
                <Text style={{ fontSize: 13, color: colors.mutedText }}>Clerk User ID</Text>
              </View>
              <Text style={{ fontSize: 11, fontFamily: "monospace", color: colors.text }}>
                {user.id.slice(0, 16)}...
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: colors.border }} />

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Calendar size={16} color={colors.mutedText} />
                <Text style={{ fontSize: 13, color: colors.mutedText }}>Account Created</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>
                {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "N/A"}
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: colors.border }} />

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Clock size={16} color={colors.mutedText} />
                <Text style={{ fontSize: 13, color: colors.mutedText }}>Last Signed In</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>
                {user.lastSignInAt ? format(new Date(user.lastSignInAt), "MMM d, yyyy") : "Active now"}
              </Text>
            </View>
          </View>
        </View>

        {/* Clerk Account Portal Button */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4 }}>
            CLERK ACCOUNT PORTAL
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenClerkPortal}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 14,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
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
                <ExternalLink size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                  Manage on Clerk Portal
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Security, 2FA, password, and active sessions
                </Text>
              </View>
            </View>

            <ChevronRight size={16} color={colors.mutedText} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSignOut}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: colors.destructiveBackground,
            borderWidth: 1,
            borderColor: "rgba(239, 68, 68, 0.3)",
            borderRadius: 14,
            paddingVertical: 14,
            marginTop: 4,
          }}
        >
          <LogOut size={16} color={colors.destructive} />
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.destructive }}>
            Sign Out of Clerk
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

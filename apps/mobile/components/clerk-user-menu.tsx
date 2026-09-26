import React from "react"
import { View, Text, TouchableOpacity, Modal } from "react-native"
import { Image as ExpoImage } from "expo-image"
import { useRouter } from "expo-router"
import { useUser, useAuth } from "@clerk/expo"
import { Settings, LogOut } from "lucide-react-native"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/hooks/use-alert"
import { isClerkDevMode } from "@/lib/clerk-portal"

interface ClerkUserMenuProps {
  visible: boolean
  onClose: () => void
  topOffset: number
}

export function ClerkUserMenu({ visible, onClose, topOffset }: ClerkUserMenuProps) {
  const router = useRouter()
  const { colors } = useThemeColor()
  const { user } = useUser()
  const { signOut } = useAuth()
  const { showAlert } = useAlert()

  const displayName =
    user?.fullName || user?.primaryEmailAddress?.emailAddress || "User"
  const email = user?.primaryEmailAddress?.emailAddress || ""
  const initial = (displayName || "U").charAt(0).toUpperCase()

  const handleManageAccount = async () => {
    onClose()
    router.push("/modal/profile" as never)
  }

  const handleSignOut = () => {
    onClose()
    showAlert({
      title: "Sign Out",
      message: "Are you sure you want to log out?",
      icon: "info",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut()
          },
        },
      ],
    })
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ flex: 1 }}
      >
        <View
          style={{
            position: "absolute",
            top: topOffset,
            right: 12,
            width: 300,
            backgroundColor: "#1c1c1e",
            borderRadius: 16,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 16,
          }}
        >
          {/* Identity row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 14,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255,255,255,0.08)",
            }}
          >
            {user?.imageUrl ? (
              <ExpoImage
                source={{ uri: user.imageUrl }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.primaryForeground }}>
                  {initial}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "700", color: "#ffffff" }}>
                {displayName}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>
                {email}
              </Text>
            </View>
          </View>

          {/* Manage account */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleManageAccount}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 13,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Settings size={18} color="rgba(255,255,255,0.8)" />
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#ffffff" }}>
              Manage account
            </Text>
          </TouchableOpacity>

          {/* Sign out */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSignOut}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 13,
            }}
          >
            <LogOut size={18} color="rgba(255,255,255,0.8)" />
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#ffffff" }}>
              Sign out
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={{ alignItems: "center", paddingVertical: 12, gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)" }}>
              Secured by clerk
            </Text>
            {isClerkDevMode() ? (
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#f97316" }}>
                Development mode
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

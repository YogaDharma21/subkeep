import { Tabs, useRouter, useSegments } from "expo-router"
import { View, Text, TouchableOpacity, Image } from "react-native"
import { Image as ExpoImage } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useUser } from "@clerk/expo"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/hooks/use-alert"
import {
  Home,
  ArrowLeftRight,
  Repeat,
  PiggyBank,
  Wallet,
  Plus,
  BarChart3,
  Search,
  Settings,
} from "lucide-react-native"

const LEFT_TABS = [
  { name: "index", label: "Home", icon: Home },
  { name: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { name: "subscriptions", label: "Subscriptions", icon: Repeat },
] as const

const RIGHT_TABS = [
  { name: "budgets", label: "Budgets", icon: PiggyBank },
  { name: "accounts", label: "Accounts", icon: Wallet },
  { name: "stats", label: "Stats", icon: BarChart3 },
] as const

export default function TabLayout() {
  const router = useRouter()
  const segments = useSegments()
  const { colors } = useThemeColor()
  const { showSearchModal, showAddTransaction } = useAlert()
  const { user } = useUser()
  const insets = useSafeAreaInsets()

  const avatarLabel =
    user?.fullName || user?.primaryEmailAddress?.emailAddress || "Profile"
  const avatarInitial = (avatarLabel || "U").charAt(0).toUpperCase()

  const activeTab =
    segments.length >= 2 ? String(segments[1]) : "index"

  const renderTab = (item: { name: string; label: string; icon: typeof Home }) => {
    const Icon = item.icon
    const isActive = activeTab === item.name
    const href = item.name === "index" ? "/(tabs)" : `/(tabs)/${item.name}`
    return (
      <TouchableOpacity
        key={item.name}
        activeOpacity={0.7}
        accessibilityLabel={item.label}
        onPress={() => router.push(href as never)}
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
        }}
      >
        <Icon
          size={19}
          color={isActive ? colors.text : colors.tabIconDefault}
        />
      </TouchableOpacity>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Slim top brand bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
          paddingBottom: 10,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={{ width: 30, height: 30, borderRadius: 8 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text, letterSpacing: -0.4 }}>
            SubKeep
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/(tabs)/settings" as never)}
          accessibilityLabel="Settings"
          style={{ padding: 6 }}
        >
          <Settings size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={showSearchModal}
          style={{ padding: 6 }}
        >
          <Search size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/modal/profile" as never)}
          accessibilityLabel={avatarLabel}
          style={{ marginLeft: 2, padding: 2 }}
        >
          {user?.imageUrl ? (
            <ExpoImage
              source={{ uri: user.imageUrl }}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: colors.primaryForeground }}>
                {avatarInitial}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Screens */}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: colors.background },
            tabBarStyle: { display: "none" },
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="transactions" />
          <Tabs.Screen name="subscriptions" />
          <Tabs.Screen name="budgets" />
          <Tabs.Screen name="accounts" />
          <Tabs.Screen name="stats" />
          <Tabs.Screen name="calendar" />
          <Tabs.Screen name="settings" />
          <Tabs.Screen name="add" />
        </Tabs>
      </View>

      {/* Floating dock */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          paddingHorizontal: 12,
          paddingBottom: Math.max(12, insets.bottom),
          pointerEvents: "box-none",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 1,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 999,
            padding: 6,
            maxWidth: "100%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.22,
            shadowRadius: 14,
            elevation: 10,
          }}
        >
          {LEFT_TABS.map(renderTab)}

          <TouchableOpacity
            activeOpacity={0.8}
            accessibilityLabel="Add transaction"
            onPress={showAddTransaction}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Plus size={24} color={colors.primaryForeground} strokeWidth={2.5} />
          </TouchableOpacity>

          {RIGHT_TABS.map(renderTab)}
        </View>
      </View>
    </View>
  )
}

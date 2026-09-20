import { Tabs, useRouter, useSegments } from "expo-router"
import { View, Text, TouchableOpacity, Image, Platform } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/components/custom-alert-provider"
import {
  Home,
  ArrowLeftRight,
  Repeat,
  PiggyBank,
  Wallet,
  Plus,
  BarChart3,
  Search,
} from "lucide-react-native"

const TAB_ITEMS = [
  { name: "index", label: "Home", icon: Home },
  { name: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { name: "subscriptions", label: "Subscriptions", icon: Repeat },
  { name: "budgets", label: "Budgets", icon: PiggyBank },
  { name: "accounts", label: "Accounts", icon: Wallet },
  { name: "stats", label: "Stats", icon: BarChart3 },
] as const

export default function TabLayout() {
  const router = useRouter()
  const segments = useSegments()
  const { colors } = useThemeColor()
  const { showSearchModal } = useAlert()
  const insets = useSafeAreaInsets()

  const activeTab =
    segments.length >= 2 ? String(segments[1]) : "index"

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
          onPress={showSearchModal}
          style={{ padding: 6 }}
        >
          <Search size={20} color={colors.text} />
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
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          paddingHorizontal: 16,
          paddingBottom: Math.max(12, insets.bottom),
          pointerEvents: "box-none",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
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
          {TAB_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.name
            return (
              <TouchableOpacity
                key={item.name}
                activeOpacity={0.7}
                accessibilityLabel={item.label}
                onPress={() => router.push(`/(tabs)/${item.name}` as never)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isActive ? colors.primary : "transparent",
                }}
              >
                <Icon
                  size={20}
                  color={isActive ? colors.primaryForeground : colors.tabIconDefault}
                />
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityLabel="Add transaction"
          onPress={() => router.push("/modal/add-transaction" as never)}
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          <Plus size={24} color={colors.primaryForeground} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {Platform.OS === "android" ? null : null}
    </View>
  )
}

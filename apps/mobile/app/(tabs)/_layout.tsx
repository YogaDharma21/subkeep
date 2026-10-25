import { Tabs, useRouter, useSegments } from "expo-router"
import { View, Text, TouchableOpacity, Image } from "react-native"
import { useState } from "react"
import { Image as ExpoImage } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useUser } from "@clerk/expo"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/hooks/use-alert"
import { QuickAddSheet, QuickAddKind } from "@/components/quick-add-sheet"
import { SectionHeader } from "@/components/section-header"
import { ClerkUserMenu } from "@/components/clerk-user-menu"
import {
  Home,
  Repeat,
  Wallet,
  Plus,
  BarChart3,
  Search,
} from "lucide-react-native"

const PRIMARY_TABS: {
  label: string
  icon: typeof Home
  href: string
  match: string[]
}[] = [
  {
    label: "Home",
    icon: Home,
    href: "/(tabs)",
    match: ["index"],
  },
  {
    label: "Money",
    icon: Wallet,
    href: "/(tabs)/transactions",
    match: ["transactions", "accounts"],
  },
  {
    label: "Subscriptions",
    icon: Repeat,
    href: "/(tabs)/subscriptions",
    match: ["subscriptions", "calendar"],
  },
  {
    label: "Insights",
    icon: BarChart3,
    href: "/(tabs)/stats",
    match: ["stats", "budgets"],
  },
]

const SECTION_TABS = {
  money: {
    title: "Money",
    tabs: [
      { name: "transactions", label: "Transactions" },
      { name: "accounts", label: "Accounts" },
    ],
  },
  subscriptions: {
    title: "Subscriptions",
    tabs: [
      { name: "subscriptions", label: "Tracker" },
      { name: "calendar", label: "Calendar" },
    ],
  },
  insights: {
    title: "Insights",
    tabs: [
      { name: "stats", label: "Analytics" },
      { name: "budgets", label: "Budgets" },
    ],
  },
} as const

const TAB_TO_SECTION: Record<string, keyof typeof SECTION_TABS> = {
  transactions: "money",
  accounts: "money",
  subscriptions: "subscriptions",
  calendar: "subscriptions",
  stats: "insights",
  budgets: "insights",
}

export default function TabLayout() {
  const router = useRouter()
  const segments = useSegments()
  const { colors } = useThemeColor()
  const { showSearchModal, showAddTransaction, showAddSubscription, showAddAccount, showAddBudget } = useAlert()
  const { user } = useUser()
  const insets = useSafeAreaInsets()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleQuickAddSelect = (kind: QuickAddKind) => {
    setQuickAddOpen(false)
    if (kind === "transaction") {
      showAddTransaction()
    } else if (kind === "subscription") {
      showAddSubscription()
    } else if (kind === "budget") {
      showAddBudget()
    } else if (kind === "account") {
      showAddAccount()
    }
  }

  const avatarLabel =
    user?.fullName || user?.primaryEmailAddress?.emailAddress || "Profile"
  const avatarInitial = (avatarLabel || "U").charAt(0).toUpperCase()

  const activeTab =
    (segments as string[]).length >= 2 ? String((segments as string[])[1]) : "index"
  const sectionKey = TAB_TO_SECTION[activeTab]
  const section = sectionKey ? SECTION_TABS[sectionKey] : null
  const splitIndex = Math.ceil(PRIMARY_TABS.length / 2)
  const leftTabs = PRIMARY_TABS.slice(0, splitIndex)
  const rightTabs = PRIMARY_TABS.slice(splitIndex)

  const renderTab = (item: (typeof PRIMARY_TABS)[number]) => {
    const Icon = item.icon
    const isActive = item.match.includes(activeTab)
    return (
      <TouchableOpacity
        key={item.label}
        activeOpacity={0.7}
        accessibilityLabel={item.label}
        accessibilityState={{ selected: isActive }}
        onPress={() => router.push(item.href as never)}
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isActive ? colors.surfaceInset : "transparent",
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
          paddingTop: insets.top + 6,
          paddingBottom: 10,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={{ width: 28, height: 28, borderRadius: 8 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 17, fontWeight: "600", color: colors.text, letterSpacing: -0.6 }}>
            SubKeep
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={showSearchModal}
          accessibilityLabel="Search"
          style={{ padding: 6 }}
        >
          <Search size={18} color={colors.mutedText} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setUserMenuOpen(true)}
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
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primaryForeground }}>
                {avatarInitial}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Screens */}
      <View style={{ flex: 1 }}>
        {section ? (
          <SectionHeader
            title={section.title}
            tabs={[...section.tabs]}
            activeTab={activeTab}
            onSelect={(tab) => router.push(`/(tabs)/${tab.name}` as never)}
          />
        ) : null}

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
            shadowOpacity: 0.32,
            shadowRadius: 18,
            elevation: 10,
          }}
        >
          {leftTabs.map(renderTab)}

          <TouchableOpacity
            activeOpacity={0.8}
            accessibilityLabel="Quick add"
            onPress={() => setQuickAddOpen(true)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={22} color={colors.primaryForeground} strokeWidth={2.4} />
          </TouchableOpacity>

          {rightTabs.map(renderTab)}
        </View>
      </View>

      <QuickAddSheet
        visible={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSelect={handleQuickAddSelect}
      />

      <ClerkUserMenu
        visible={userMenuOpen}
        onClose={() => setUserMenuOpen(false)}
        topOffset={insets.top + 52}
      />
    </View>
  )
}

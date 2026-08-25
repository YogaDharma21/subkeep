import { Tabs } from "expo-router"
import { TouchableOpacity } from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/components/custom-alert-provider"
import { Receipt, Calendar, BarChart3, Settings, Search } from "lucide-react-native"

export default function TabLayout() {
  const { colors } = useThemeColor()
  const { showSearchModal } = useAlert()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: "800",
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerRight: () => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={showSearchModal}
            style={{ marginRight: 16, padding: 4 }}
          >
            <Search size={20} color={colors.text} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Receipt size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => <Calendar size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Statistics",
          tabBarIcon: ({ color, size }) => <BarChart3 size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings size={size || 22} color={color} />,
        }}
      />
    </Tabs>
  )
}

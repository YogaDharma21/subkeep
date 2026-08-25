import { Tabs } from "expo-router"
import { View, Text, TouchableOpacity } from "react-native"
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
        headerShadowVisible: false,
        headerTitle: "",
        headerLeft: () => (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 16 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Receipt size={16} color="#ffffff" strokeWidth={2.4} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text, letterSpacing: -0.4 }}>
              SubKeep
            </Text>
          </View>
        ),
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
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => <Receipt size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarLabel: "Calendar",
          tabBarIcon: ({ color, size }) => <Calendar size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarLabel: "Statistics",
          tabBarIcon: ({ color, size }) => <BarChart3 size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => <Settings size={size || 22} color={color} />,
        }}
      />
    </Tabs>
  )
}

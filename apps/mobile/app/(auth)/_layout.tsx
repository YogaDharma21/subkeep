import { Stack } from "expo-router"
import { useThemeColor } from "@/hooks/use-theme-color"

export default function AuthLayout() {
  const { colors } = useThemeColor()

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="sign-in"
        options={{
          title: "Log In",
          headerBackTitle: "Back",
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          title: "Create Account",
          headerBackTitle: "Back",
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </Stack>
  )
}

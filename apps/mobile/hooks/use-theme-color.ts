import { useColorScheme } from "react-native"
import { Colors, ThemeColors } from "@/constants/theme"

export function useThemeColor(): {
  colorScheme: "light" | "dark"
  colors: ThemeColors
  isDark: boolean
} {
  const systemScheme = useColorScheme()
  const isDark = systemScheme === "dark"
  const colors = isDark ? Colors.dark : Colors.light

  return {
    colorScheme: isDark ? "dark" : "light",
    colors,
    isDark,
  }
}

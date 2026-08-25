import React, { createContext, useContext, useState, useEffect } from "react"
import { useColorScheme, Appearance } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Colors, ThemeColors } from "@/constants/theme"

export type ThemeMode = "system" | "light" | "dark"

export interface ThemeContextType {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => Promise<void>
  colorScheme: "light" | "dark"
  colors: ThemeColors
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = "subkeep_theme_mode"

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system")

  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY)
        if (saved === "light" || saved === "dark" || saved === "system") {
          setThemeModeState(saved)
          Appearance.setColorScheme(saved === "system" ? null : saved)
        }
      } catch {
        // ignore
      }
    }
    loadTheme()
  }, [])

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode)
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode)
      Appearance.setColorScheme(mode === "system" ? null : mode)
    } catch {
      // ignore
    }
  }

  const effectiveScheme: "light" | "dark" =
    themeMode === "system" ? (systemScheme === "dark" ? "dark" : "light") : themeMode

  const isDark = effectiveScheme === "dark"
  const colors = isDark ? Colors.dark : Colors.light

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        colorScheme: effectiveScheme,
        colors,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeColor(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context) return context

  // Fallback if rendered outside provider
  const systemScheme = useColorScheme()
  const isDark = systemScheme === "dark"
  const colors = isDark ? Colors.dark : Colors.light

  return {
    themeMode: "system",
    setThemeMode: async () => {},
    colorScheme: isDark ? "dark" : "light",
    colors,
    isDark,
  }
}

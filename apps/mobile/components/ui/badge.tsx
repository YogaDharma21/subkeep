import React from "react"
import { View, Text, StyleProp, ViewStyle, TextStyle } from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"

export interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "secondary" | "outline" | "emerald" | "amber" | "blue" | "destructive"
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export function Badge({
  children,
  variant = "default",
  style,
  textStyle,
}: BadgeProps) {
  const { colors } = useThemeColor()

  const getBadgeStyle = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case "emerald":
        return {
          container: {
            backgroundColor: colors.emeraldBackground,
            borderColor: colors.border,
            borderWidth: 1,
          },
          text: { color: colors.emerald, fontWeight: "500" },
        }
      case "amber":
        return {
          container: {
            backgroundColor: colors.amberBackground,
            borderColor: colors.border,
            borderWidth: 1,
          },
          text: { color: colors.amber, fontWeight: "500" },
        }
      case "blue":
        return {
          container: {
            backgroundColor: colors.blueBackground,
            borderColor: colors.border,
            borderWidth: 1,
          },
          text: { color: colors.blue, fontWeight: "500" },
        }
      case "destructive":
        return {
          container: {
            backgroundColor: colors.destructiveBackground,
            borderColor: colors.border,
            borderWidth: 1,
          },
          text: { color: colors.destructive, fontWeight: "500" },
        }
      case "secondary":
        return {
          container: { backgroundColor: colors.surfaceInset },
          text: { color: colors.mutedText, fontWeight: "500" },
        }
      case "outline":
        return {
          container: {
            backgroundColor: "transparent",
            borderColor: colors.border,
            borderWidth: 1,
          },
          text: { color: colors.mutedText, fontWeight: "500" },
        }
      default:
        return {
          container: { backgroundColor: colors.primary },
          text: { color: colors.primaryForeground, fontWeight: "500" },
        }
    }
  }

  const s = getBadgeStyle()

  return (
    <View
      style={[
        {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
          alignSelf: "flex-start",
          alignItems: "center",
          justifyContent: "center",
        },
        s.container,
        style,
      ]}
    >
      {typeof children === "string" ? (
        <Text
          style={[
            {
              fontSize: 9,
              fontWeight: "500",
              textTransform: "uppercase",
              letterSpacing: 0.8,
            },
            s.text,
            textStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  )
}

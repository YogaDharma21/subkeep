import React from "react"
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"

export interface ButtonProps {
  children: React.ReactNode
  onPress?: () => void
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive"
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  loading?: boolean
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  icon?: React.ReactNode
}

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const { colors } = useThemeColor()

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      gap: 8,
      borderWidth: 1,
      borderColor: "transparent",
    }

    if (size === "sm") {
      base.paddingHorizontal = 12
      base.paddingVertical = 6
      base.minHeight = 34
    } else if (size === "lg") {
      base.paddingHorizontal = 20
      base.paddingVertical = 14
      base.minHeight = 48
    } else {
      base.paddingHorizontal = 16
      base.paddingVertical = 10
      base.minHeight = 42
    }

    if (variant === "primary") {
      base.backgroundColor = colors.primary
    } else if (variant === "secondary") {
      base.backgroundColor = colors.surfaceInset
      base.borderColor = colors.border
    } else if (variant === "outline") {
      base.backgroundColor = "transparent"
      base.borderColor = colors.border
    } else if (variant === "destructive") {
      base.backgroundColor = colors.destructiveBackground
      base.borderColor = colors.border
    } else if (variant === "ghost") {
      base.backgroundColor = "transparent"
      base.borderWidth = 0
    }

    if (disabled || loading) {
      base.opacity = 0.5
    }

    return base
  }

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: "600",
      letterSpacing: -0.1,
    }

    if (size === "sm") {
      base.fontSize = 12
    } else if (size === "lg") {
      base.fontSize = 15
    } else {
      base.fontSize = 13
    }

    if (variant === "primary") {
      base.color = colors.primaryForeground
    } else if (variant === "secondary") {
      base.color = colors.text
    } else if (variant === "outline" || variant === "ghost") {
      base.color = colors.text
    } else if (variant === "destructive") {
      base.color = colors.destructive
    }

    return base
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "primary" ? colors.primaryForeground : colors.text
          }
        />
      ) : (
        <>
          {icon}
          {typeof children === "string" ? (
            <Text style={[getTextStyle(), textStyle]}>{children}</Text>
          ) : (
            children
          )}
        </>
      )}
    </TouchableOpacity>
  )
}

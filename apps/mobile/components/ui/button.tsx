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
    const sizeStyle: ViewStyle =
      size === "sm"
        ? { paddingHorizontal: 12, paddingVertical: 6, minHeight: 34 }
        : size === "lg"
          ? { paddingHorizontal: 20, paddingVertical: 14, minHeight: 48 }
          : { paddingHorizontal: 16, paddingVertical: 10, minHeight: 42 }

    const variantStyle: ViewStyle =
      variant === "primary"
        ? { backgroundColor: colors.primary }
        : variant === "secondary"
          ? {
              backgroundColor: colors.surfaceInset,
              borderColor: colors.border,
            }
          : variant === "outline"
            ? {
                backgroundColor: "transparent",
                borderColor: colors.border,
              }
            : variant === "destructive"
              ? {
                  backgroundColor: colors.destructiveBackground,
                  borderColor: colors.border,
                }
              : {
                  backgroundColor: "transparent",
                  borderWidth: 0,
                }

    return {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      gap: 8,
      borderWidth: 1,
      borderColor: "transparent",
      ...sizeStyle,
      ...variantStyle,
      ...(disabled || loading ? { opacity: 0.5 } : {}),
    }
  }

  const getTextStyle = (): TextStyle => {
    const fontSize = size === "sm" ? 12 : size === "lg" ? 15 : 13
    const color =
      variant === "primary"
        ? colors.primaryForeground
        : variant === "secondary" || variant === "outline" || variant === "ghost"
          ? colors.text
          : colors.destructive

    return { fontWeight: "600", letterSpacing: -0.1, fontSize, color }
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

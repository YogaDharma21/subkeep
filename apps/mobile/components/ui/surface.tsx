import React from "react"
import {
  Text,
  TextProps,
  View,
  ViewProps,
  ViewStyle,
} from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"
import { Type } from "@/constants/theme"

interface SurfaceProps extends ViewProps {
  inset?: boolean
}

export function Surface({
  children,
  style,
  inset = false,
  ...props
}: SurfaceProps) {
  const { colors } = useThemeColor()

  return (
    <View
      style={[
        {
          backgroundColor: inset ? colors.surfaceInset : colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: inset ? 16 : 24,
          overflow: "hidden",
        } as ViewStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}

export function Label({ children, style, ...props }: TextProps) {
  const { colors } = useThemeColor()

  return (
    <Text
      {...props}
      style={[Type.label, { color: colors.mutedText }, style]}
    >
      {children}
    </Text>
  )
}

export function Numeral({ children, style, ...props }: TextProps) {
  const { colors } = useThemeColor()

  return (
    <Text
      {...props}
      style={[Type.numeral, { color: colors.text }, style]}
    >
      {children}
    </Text>
  )
}

export function PageTitle({ children, style, ...props }: TextProps) {
  const { colors } = useThemeColor()

  return (
    <Text {...props} style={[Type.title, { color: colors.text }, style]}>
      {children}
    </Text>
  )
}

export function PanelTitle({ children, style, ...props }: TextProps) {
  const { colors } = useThemeColor()

  return (
    <Text
      {...props}
      style={[Type.panelTitle, { color: colors.text }, style]}
    >
      {children}
    </Text>
  )
}

import React from "react"
import {
  Text,
  TextProps,
  TextStyle,
  View,
  ViewProps,
  ViewStyle,
} from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"
import { Type } from "@/constants/theme"

interface SurfaceProps extends ViewProps {
  folderTab?: boolean
  inset?: boolean
}

export function Surface({
  children,
  style,
  folderTab = false,
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
      {folderTab ? <FolderTab /> : null}
      {children}
    </View>
  )
}

export function FolderTab() {
  const { colors } = useThemeColor()

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "44%",
        height: 28,
        backgroundColor: colors.surfaceInset,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.border,
        borderBottomRightRadius: 14,
        borderTopLeftRadius: 23,
      }}
    />
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

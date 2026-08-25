import React from "react"
import { View, ViewProps, StyleProp, ViewStyle } from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"

export interface CardProps extends ViewProps {
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}

export function Card({ style, children, ...props }: CardProps) {
  const { colors } = useThemeColor()

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 12,
          padding: 16,
          overflow: "hidden",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}

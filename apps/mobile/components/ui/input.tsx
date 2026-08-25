import React from "react"
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  StyleProp,
  ViewStyle,
} from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"

export interface InputProps extends TextInputProps {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerStyle?: StyleProp<ViewStyle>
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  placeholderTextColor,
  ...props
}: InputProps) {
  const { colors } = useThemeColor()

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label ? (
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.mutedText,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: error ? colors.destructive : colors.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          minHeight: 44,
          gap: 8,
        }}
      >
        {leftIcon}
        <TextInput
          placeholderTextColor={placeholderTextColor || colors.subtleText}
          style={[
            {
              flex: 1,
              color: colors.text,
              fontSize: 14,
              paddingVertical: 10,
            },
            style,
          ]}
          {...props}
        />
        {rightIcon}
      </View>
      {error ? (
        <Text style={{ fontSize: 11, color: colors.destructive }}>{error}</Text>
      ) : null}
    </View>
  )
}

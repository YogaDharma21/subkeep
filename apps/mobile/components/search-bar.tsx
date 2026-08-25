import React from "react"
import { TouchableOpacity, Text } from "react-native"
import { Search } from "lucide-react-native"
import { useThemeColor } from "@/hooks/use-theme-color"

interface SearchBarProps {
  onPress: () => void
  placeholder?: string
}

export function SearchBar({ onPress, placeholder = "Search..." }: SearchBarProps) {
  const { colors } = useThemeColor()

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 11,
        gap: 10,
      }}
    >
      <Search size={16} color={colors.mutedText} />
      <Text style={{ fontSize: 13, color: colors.mutedText, flex: 1 }}>
        {placeholder}
      </Text>
    </TouchableOpacity>
  )
}

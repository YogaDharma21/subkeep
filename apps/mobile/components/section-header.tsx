import React from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"

export interface SectionTab {
  name: string
  label: string
}

interface SectionHeaderProps {
  title: string
  tabs: SectionTab[]
  activeTab: string
  onSelect: (tab: SectionTab) => void
}

export function SectionHeader({
  title,
  tabs,
  activeTab,
  onSelect,
}: SectionHeaderProps) {
  const { colors } = useThemeColor()

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "900",
            letterSpacing: -0.3,
            color: colors.text,
          }}
        >
          {title}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 3,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.name
            return (
              <TouchableOpacity
                key={tab.name}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                onPress={() => onSelect(tab)}
                style={{
                  paddingHorizontal: 11,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: isActive ? colors.primary : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: isActive
                      ? colors.primaryForeground
                      : colors.mutedText,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </View>
  )
}

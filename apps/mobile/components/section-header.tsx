import React from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"
import { PageTitle } from "@/components/ui/surface"

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
    <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 }}>
      <PageTitle>{title}</PageTitle>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          backgroundColor: colors.surfaceInset,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 999,
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
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: isActive ? colors.primary : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  letterSpacing: -0.1,
                  color: isActive ? colors.primaryForeground : colors.mutedText,
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

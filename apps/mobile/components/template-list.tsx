import React, { useState, useMemo } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native"
import { Search, X, Plus } from "lucide-react-native"
import { DEFAULT_TEMPLATES, SubscriptionTemplate } from "@/constants/default-templates"
import { categories } from "@/constants/categories"
import { DynamicIcon } from "@/components/dynamic-icon"
import { useThemeColor } from "@/hooks/use-theme-color"

interface TemplateListProps {
  onSelect: (template: SubscriptionTemplate) => void
  onCustomCreate: () => void
}

export function TemplateList({ onSelect, onCustomCreate }: TemplateListProps) {
  const { colors } = useThemeColor()
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  const q = search.trim().toLowerCase()

  const filteredTemplates = useMemo(() => {
    return DEFAULT_TEMPLATES.filter((t) => {
      const matchesCat =
        activeCategory === "all" || t.category === activeCategory
      const matchesSearch = !q || t.name.toLowerCase().includes(q)
      return matchesCat && matchesSearch
    })
  }, [q, activeCategory])

  return (
    <View style={{ flex: 1 }}>
      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: 10,
            paddingHorizontal: 12,
            height: 42,
            gap: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Search size={16} color={colors.mutedText} />
          <TextInput
            placeholder="Search popular services (Netflix, Spotify, ChatGPT)..."
            placeholderTextColor={colors.subtleText}
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, color: colors.text, fontSize: 13 }}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={14} color={colors.mutedText} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 6,
          gap: 6,
        }}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            onPress={() => setActiveCategory(cat.value)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor:
                activeCategory === cat.value ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor:
                activeCategory === cat.value ? colors.primary : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color:
                  activeCategory === cat.value
                    ? colors.primaryForeground
                    : colors.mutedText,
              }}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Custom Subscription banner */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <TouchableOpacity
          onPress={onCustomCreate}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 12,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={20} color={colors.primaryForeground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
              Custom Subscription
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedText }}>
              Create a blank subscription with custom price, cycle & icon
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Templates List */}
      <FlatList
        data={filteredTemplates}
        keyExtractor={(item) => item.name}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 12,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: item.color,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DynamicIcon name={item.icon} size={20} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                {item.name}
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedText, textTransform: "capitalize" }}>
                {item.category}
              </Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
              ${item.defaultPrice}/mo
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

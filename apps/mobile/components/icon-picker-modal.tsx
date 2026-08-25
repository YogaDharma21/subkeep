import React, { useState, useMemo } from "react"
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
} from "react-native"
import { Search, X, Globe } from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { useThemeColor } from "@/hooks/use-theme-color"
import { Image } from "expo-image"

const SEARCH_ALIASES: Record<string, string[]> = {
  chat: ["MessageSquare", "MessageCircle", "MessagesSquare", "Send", "Bot", "Phone", "Mail", "Speech", "Share2", "Users", "Sparkles", "Headphones", "Inbox", "AtSign", "PhoneCall"],
  talk: ["MessageSquare", "MessageCircle", "MessagesSquare", "Speech", "Phone", "Mic", "PhoneCall"],
  message: ["MessageSquare", "MessageCircle", "MessagesSquare", "Mail", "Send", "Inbox", "AtSign"],
  messaging: ["MessageSquare", "MessageCircle", "MessagesSquare", "Mail", "Send"],
  social: ["Users", "UserCheck", "UserPlus", "Share2", "Globe", "MessageCircle", "Heart", "ThumbsUp"],
  video: ["Film", "Tv", "Video", "Clapperboard", "Play", "Monitor", "Camera", "Youtube", "Tv2", "Presentation"],
  stream: ["Tv", "Film", "Video", "Radio", "Wifi", "Play", "Monitor", "Youtube"],
  streaming: ["Tv", "Film", "Video", "Radio", "Wifi", "Play", "Monitor", "Youtube"],
  music: ["Music", "Headphones", "Radio", "Mic", "Podcast", "Volume2", "Music2", "Disc", "Guitar"],
  audio: ["Headphones", "Radio", "Mic", "Podcast", "Volume2", "Volume", "Music"],
  movie: ["Film", "Clapperboard", "Tv", "Video", "Ticket", "Popcorn"],
  game: ["Gamepad", "Gamepad2", "Trophy", "Crosshair", "Sword", "Puzzle", "Dice5", "Joystick"],
  gaming: ["Gamepad", "Gamepad2", "Trophy", "Crosshair", "Sword", "Puzzle", "Dice5", "Joystick"],
  money: ["Wallet", "CreditCard", "Receipt", "BarChart3", "DollarSign", "Coins", "Briefcase", "Banknote", "PiggyBank", "Landmark"],
  finance: ["Wallet", "CreditCard", "Receipt", "BarChart3", "DollarSign", "Coins", "Briefcase", "Banknote", "PiggyBank", "Landmark", "TrendingUp"],
  pay: ["CreditCard", "Wallet", "Receipt", "DollarSign", "Coins", "Banknote"],
  payment: ["CreditCard", "Wallet", "Receipt", "DollarSign", "Coins", "Banknote"],
  cloud: ["Cloud", "HardDrive", "Database", "Server", "Folder", "CloudDownload", "CloudUpload"],
  ai: ["Brain", "Bot", "Sparkles", "Zap", "Wand2", "WandSparkles"],
  health: ["Dumbbell", "HeartPulse", "Activity", "Footprints", "Bicycle", "Heart", "Stethoscope", "Pill"],
  fitness: ["Dumbbell", "HeartPulse", "Activity", "Footprints", "Bicycle", "Flame", "Trophy"],
  store: ["ShoppingCart", "ShoppingBag", "Store", "Tag", "Gift", "Box", "Package", "Percent"],
  shop: ["ShoppingCart", "ShoppingBag", "Store", "Tag", "Gift", "Box", "Package"],
  code: ["Code", "Terminal", "Laptop", "GitBranch", "FileCode", "FolderGit2"],
  dev: ["Code", "Terminal", "Laptop", "GitBranch", "FileCode", "FolderGit2"],
  work: ["Briefcase", "Building2", "Laptop", "Folder", "FileText", "Calendar", "Clock"],
  food: ["Utensils", "Coffee", "Pizza", "Apple", "Cake", "Beer", "Wine", "CupSoda"],
}

const ICON_CATEGORIES: Record<string, string[]> = {
  Popular: [
    "Tv", "Music", "Film", "MessageSquare", "MessageCircle", "CreditCard", "Wallet", "Cloud",
    "Gamepad2", "Laptop", "Phone", "Mail", "Globe", "Dumbbell", "Brain",
    "Sparkles", "ShoppingCart", "Zap", "Heart", "Briefcase", "BookOpen", "Receipt", "BarChart3",
  ],
  "Chat & Social": [
    "MessageSquare", "MessageCircle", "MessagesSquare", "Send", "Bot", "Phone", "Mail", "Speech",
    "Share2", "Users", "UserCheck", "Inbox", "AtSign", "PhoneCall", "Video",
  ],
  "Media & Ent.": [
    "Tv", "Film", "Video", "Clapperboard", "Play", "Camera", "Youtube", "Music", "Headphones",
    "Radio", "Mic", "Podcast", "Volume2", "Music2", "Disc",
  ],
  "Finance & Pay": [
    "Wallet", "CreditCard", "Receipt", "BarChart3", "DollarSign", "Coins", "Briefcase",
    "Banknote", "PiggyBank", "Landmark", "ShoppingCart", "ShoppingBag", "Store", "Tag", "Gift", "Percent",
  ],
  "Tech & Tools": [
    "Laptop", "Monitor", "Cloud", "Shield", "Brain", "Rocket", "Zap",
    "HardDrive", "Database", "Server", "Code", "Terminal", "WandSparkles", "Folder",
  ],
  Lifestyle: [
    "Dumbbell", "HeartPulse", "Footprints", "Bicycle", "Flower2", "Moon", "Sun", "Globe",
    "MapPin", "Plane", "Car", "Utensils", "Coffee", "Apple",
  ],
}

const ALL_ICONS: string[] = Array.from(
  new Set([
    ...Object.values(ICON_CATEGORIES).flat(),
    ...Object.values(SEARCH_ALIASES).flat(),
  ])
).sort()

interface IconPickerModalProps {
  visible: boolean
  selected: string | null
  onSelect: (icon: string) => void
  onClose: () => void
  defaultDomain?: string
}

export function IconPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
  defaultDomain,
}: IconPickerModalProps) {
  const { colors } = useThemeColor()
  const [tab, setTab] = useState<"icons" | "domain">("icons")
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("Popular")
  const [domainInput, setDomainInput] = useState(defaultDomain || "")
  const [customUrl, setCustomUrl] = useState("")

  const q = search.trim().toLowerCase()

  const filteredIcons = useMemo(() => {
    if (!q) {
      return ICON_CATEGORIES[activeCategory] || ICON_CATEGORIES.Popular
    }

    const matches = new Set<string>()

    Object.entries(SEARCH_ALIASES).forEach(([alias, names]) => {
      if (alias.includes(q) || q.includes(alias)) {
        names.forEach((n) => matches.add(n))
      }
    })

    ALL_ICONS.forEach((name) => {
      if (name.toLowerCase().includes(q)) {
        matches.add(name)
      }
    })

    return Array.from(matches)
  }, [q, activeCategory])

  const cleanDomain = domainInput
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
  const googleFavicon = cleanDomain
    ? `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`
    : ""
  const clearbitLogo = cleanDomain
    ? `https://logo.clearbit.com/${cleanDomain}`
    : ""

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
            Choose Icon or Logo
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Tab switch */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            paddingVertical: 10,
            gap: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => setTab("icons")}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: tab === "icons" ? colors.primary : colors.surface,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: tab === "icons" ? colors.primaryForeground : colors.mutedText,
              }}
            >
              Lucide Icons
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab("domain")}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: tab === "domain" ? colors.primary : colors.surface,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: tab === "domain" ? colors.primaryForeground : colors.mutedText,
              }}
            >
              Domain Logo / URL
            </Text>
          </TouchableOpacity>
        </View>

        {tab === "icons" ? (
          <View style={{ flex: 1 }}>
            {/* Search */}
            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  height: 40,
                  gap: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Search size={16} color={colors.mutedText} />
                <TextInput
                  placeholder="Search icons (e.g. music, chat, ai, card)..."
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

            {/* Category pills */}
            {!q && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 6, gap: 6 }}
              >
                {Object.keys(ICON_CATEGORIES).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 16,
                      backgroundColor:
                        activeCategory === cat ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor:
                        activeCategory === cat ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color:
                          activeCategory === cat
                            ? colors.primaryForeground
                            : colors.mutedText,
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Icon grid */}
            <FlatList
              data={filteredIcons}
              keyExtractor={(item) => item}
              numColumns={5}
              contentContainerStyle={{ padding: 12 }}
              renderItem={({ item }) => {
                const isSelected = selected === item
                return (
                  <TouchableOpacity
                    onPress={() => {
                      onSelect(item)
                      onClose()
                    }}
                    style={{
                      flex: 1 / 5,
                      aspectRatio: 1,
                      margin: 4,
                      borderRadius: 10,
                      backgroundColor: isSelected
                        ? colors.emeraldBackground
                        : colors.surface,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.emerald : colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <DynamicIcon
                      name={item}
                      size={22}
                      color={isSelected ? colors.emerald : colors.text}
                    />
                  </TouchableOpacity>
                )
              }}
            />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* Domain Logo Generator */}
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                Fetch Logo by Website Domain
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  height: 44,
                  gap: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Globe size={16} color={colors.mutedText} />
                <TextInput
                  placeholder="e.g. netflix.com, spotify.com"
                  placeholderTextColor={colors.subtleText}
                  value={domainInput}
                  onChangeText={setDomainInput}
                  autoCapitalize="none"
                  keyboardType="url"
                  style={{ flex: 1, color: colors.text, fontSize: 13 }}
                />
              </View>

              {cleanDomain ? (
                <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      onSelect(googleFavicon)
                      onClose()
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderRadius: 10,
                      padding: 12,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                      gap: 8,
                    }}
                  >
                    <Image
                      source={{ uri: googleFavicon }}
                      style={{ width: 36, height: 36, borderRadius: 8 }}
                      contentFit="contain"
                    />
                    <Text style={{ fontSize: 11, color: colors.text, fontWeight: "600" }}>
                      Favicon Logo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      onSelect(clearbitLogo)
                      onClose()
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderRadius: 10,
                      padding: 12,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                      gap: 8,
                    }}
                  >
                    <Image
                      source={{ uri: clearbitLogo }}
                      style={{ width: 36, height: 36, borderRadius: 8 }}
                      contentFit="contain"
                    />
                    <Text style={{ fontSize: 11, color: colors.text, fontWeight: "600" }}>
                      Clearbit HD Logo
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Custom Image URL */}
            <View style={{ gap: 8, marginTop: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                Or Custom Image URL
              </Text>
              <TextInput
                placeholder="https://..."
                placeholderTextColor={colors.subtleText}
                value={customUrl}
                onChangeText={setCustomUrl}
                autoCapitalize="none"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  height: 44,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                  fontSize: 13,
                }}
              />
              {customUrl.trim() ? (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(customUrl.trim())
                    onClose()
                  }}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.primaryForeground,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    Use Custom Image URL
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  )
}

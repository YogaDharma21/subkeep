export const categories = [
  { value: "all", label: "All" },
  { value: "entertainment", label: "Entertainment" },
  { value: "music", label: "Music" },
  { value: "productivity", label: "Productivity" },
  { value: "cloud", label: "Cloud" },
  { value: "gaming", label: "Gaming" },
  { value: "education", label: "Education" },
  { value: "fitness", label: "Fitness" },
  { value: "news", label: "News" },
  { value: "finance", label: "Finance" },
  { value: "other", label: "Other" },
]

export const categoryColors: Record<string, string> = {
  entertainment: "#a39fb0",
  music: "#a9bfa9",
  productivity: "#9aa7b5",
  cloud: "#9aafb3",
  gaming: "#a89db1",
  education: "#b8ac8d",
  fitness: "#b5a0a6",
  news: "#8b8d92",
  finance: "#9bafa9",
  other: "#7f8186",
}

export const billingCycles = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "3 Months" },
  { value: "semi-annual", label: "6 Months" },
  { value: "yearly", label: "Yearly" },
  { value: "none", label: "No Cycle" },
]

export const colorPresets = [
  "#FFFFFF",
  "#09090B",
  "#64748B",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#EF4444",
  "#F59E0B",
  "#10B981",
]

export const colorOptions = colorPresets

export function getContrastTextColor(hexColor?: string): string {
  if (!hexColor || !hexColor.startsWith("#")) return "#FFFFFF"
  const hex = hexColor.replace("#", "")
  let r = 0, g = 0, b = 0
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16)
    g = parseInt(hex[1] + hex[1], 16)
    b = parseInt(hex[2] + hex[2], 16)
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16)
    g = parseInt(hex.substring(2, 4), 16)
    b = parseInt(hex.substring(4, 6), 16)
  } else {
    return "#FFFFFF"
  }
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 180 ? "#09090B" : "#FFFFFF"
}


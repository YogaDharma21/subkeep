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

export const currencies = [
  { value: "IDR", label: "Rp IDR" },
  { value: "USD", label: "$ USD" },
]

export const currencySymbols: Record<string, string> = {
  IDR: "Rp",
  USD: "$",
}

export const categoryColors: Record<string, string> = {
  entertainment: "#8e94a3",
  music: "#a7b3a2",
  productivity: "#b3aa9a",
  cloud: "#93a4ac",
  gaming: "#a79aae",
  education: "#bda983",
  fitness: "#b59a98",
  news: "#7f858f",
  finance: "#93a6a0",
  other: "#7c7d80",
}

export const colorPresets = [
  "#F4F4F2",
  "#8A8C92",
  "#5C6068",
  "#93A4AC",
  "#8E94A3",
  "#A79AAE",
  "#B59A98",
  "#C19B87",
  "#BDA983",
  "#A7B3A2",
]

export const colorOptions = colorPresets

export const billingCycles = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "3 Months" },
  { value: "semi-annual", label: "6 Months" },
  { value: "yearly", label: "Yearly" },
  { value: "none", label: "No Cycle" },
]

export const iconList = [
  "Tv",
  "Music",
  "Film",
  "Clapperboard",
  "Play",
  "Camera",
  "Headphones",
  "Radio",
  "Mic",
  "Podcast",
  "BookOpen",
  "GraduationCap",
  "Palette",
  "Laptop",
  "Monitor",
  "Cloud",
  "Shield",
  "Robot",
  "Brain",
  "Rocket",
  "Zap",
  "Flame",
  "Star",
  "Heart",
  "Gem",
  "Crown",
  "Trophy",
  "Puzzle",
  "Dice",
  "Paintbrush",
  "WandSparkles",
  "Dumbbell",
  "HeartPulse",
  "Footprints",
  "Bicycle",
  "Flower2",
  "Moon",
  "Sun",
  "CloudSun",
  "Globe",
  "Compass",
  "MapPin",
  "Wallet",
  "CreditCard",
  "Receipt",
  "BarChart3",
  "Briefcase",
  "Building2",
  "Store",
  "ShoppingCart",
  "Gift",
  "Tag",
  "Percent",
  "Truck",
  "Plane",
  "Train",
  "Car",
  "Hotel",
  "Umbrella",
  "Map",
  "Passport",
  "Phone",
  "Mail",
  "MessageCircle",
  "Users",
  "Child",
  "Cat",
  "Dog",
  "PawPrint",
  "Sprout",
  "TreePine",
  "Leaf",
  "Waves",
  "Snowflake",
  "Wind",
  "Gamepad",
  "Gamepad2",
  "Apple",
  "Box",
  "Youtube",
  "RefreshCw",
  "Download",
  "Upload",
  "Bell",
  "Settings",
  "Info",
  "Search",
  "Plus",
  "X",
  "Check",
  "MoreHorizontal",
  "MoreVertical",
  "ArrowLeft",
  "ArrowRight",
  "ChevronLeft",
  "ChevronRight",
  "Trash2",
  "Pencil",
  "Copy",
  "Pause",
  "Play",
  "Calendar",
  "CalendarDays",
  "Clock",
  "Timer",
  "Hourglass",
  "Sparkles",
  "Eye",
  "EyeOff",
  "Lock",
  "Unlock",
  "Key",
  "Fingerprint",
  "Scan",
  "QrCode",
  "Link",
  "ExternalLink",
  "Share2",
  "Download",
  "Upload",
  "FileText",
  "File",
  "Folder",
  "Image",
  "Video",
  "Music2",
  "Mic2",
  "Volume2",
  "VolumeX",
  "Wifi",
  "Bluetooth",
  "Battery",
  "BatteryFull",
  "Lightbulb",
  "Flame",
  "Droplets",
  "Mountain",
  "Sunrise",
  "Sunset",
  "MoonStar",
  "Sparkle",
  "Feather",
]

export function getSymbol(currency: string): string {
  return currencySymbols[currency] || "$"
}

export function calculateMonthlyTotal(
  subs: Array<{ price: number; cycle: string }>
): number {
  return subs.reduce((sum, s) => {
    const cycle = (s.cycle || "monthly").toLowerCase()
    if (cycle === "monthly") return sum + s.price
    if (cycle === "quarterly") return sum + s.price / 3
    if (cycle === "semi-annual") return sum + s.price / 6
    if (cycle === "yearly") return sum + s.price / 12
    if (cycle === "weekly") return sum + s.price * 4.33
    if (cycle === "daily") return sum + s.price * 30
    if (cycle === "none") return sum
    return sum + s.price
  }, 0)
}

export function formatCurrency(amount: number, currency: string): string {
  const symbol = getSymbol(currency)
  return `${symbol}${amount.toFixed(2)}`
}

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

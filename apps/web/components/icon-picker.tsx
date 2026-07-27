"use client"

import { useState, useMemo, useDeferredValue } from "react"
import dynamicIconImports from "lucide-react/dynamicIconImports"
import { Search, X, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DynamicIcon } from "@/components/dynamic-icon"
import { cn } from "@/lib/utils"

// Search keyword aliases for intuitive searching
const SEARCH_ALIASES: Record<string, string[]> = {
  chat: ["MessageSquare", "MessageCircle", "MessagesSquare", "Send", "Bot", "Phone", "Mail", "Speech", "Share2", "Users", "Sparkles", "Headphones", "Inbox", "AtSign", "PhoneCall"],
  talk: ["MessageSquare", "MessageCircle", "MessagesSquare", "Speech", "Phone", "Mic", "PhoneCall"],
  message: ["MessageSquare", "MessageCircle", "MessagesSquare", "Mail", "Send", "Inbox", "AtSign"],
  messaging: ["MessageSquare", "MessageCircle", "MessagesSquare", "Mail", "Send"],
  social: ["Users", "UserCheck", "UserPlus", "Share2", "Globe", "MessageCircle", "Heart", "ThumbsUp"],
  video: ["Film", "Tv", "Video", "Clapperboard", "Play", "Monitor", "Camera", "Youtube", "Tv2", "Presentation"],
  stream: ["Tv", "Film", "Video", "Radio", "Wifi", "Play", "Monitor", "Youtube", "Cast"],
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
  cloud: ["Cloud", "HardDrive", "Database", "Server", "Folder", "CloudDownload", "CloudUpload", "Cpu"],
  ai: ["Brain", "Robot", "Bot", "Sparkles", "Cpu", "Zap", "Wand2", "WandSparkles"],
  health: ["Dumbbell", "HeartPulse", "Activity", "Footprints", "Bicycle", "Heart", "Stethoscope", "Pill"],
  fitness: ["Dumbbell", "HeartPulse", "Activity", "Footprints", "Bicycle", "Flame", "Trophy"],
  store: ["ShoppingCart", "ShoppingBag", "Store", "Tag", "Gift", "Box", "Package", "Percent"],
  shop: ["ShoppingCart", "ShoppingBag", "Store", "Tag", "Gift", "Box", "Package"],
  code: ["Code", "Terminal", "Cpu", "Laptop", "GitBranch", "FileCode", "FolderGit2"],
  dev: ["Code", "Terminal", "Cpu", "Laptop", "GitBranch", "FileCode", "FolderGit2"],
  work: ["Briefcase", "Building2", "Laptop", "Folder", "FileText", "Calendar", "Clock"],
  food: ["Utensils", "Coffee", "Pizza", "Apple", "Cake", "Beer", "Wine", "CupSoda"],
}

const ICON_CATEGORIES: Record<string, string[]> = {
  Popular: [
    "Tv", "Music", "Film", "MessageSquare", "MessageCircle", "CreditCard", "Wallet", "Cloud",
    "Gamepad2", "Laptop", "Phone", "Mail", "Globe", "Dumbbell", "Brain", "Robot",
    "Sparkles", "ShoppingCart", "Zap", "Heart", "Briefcase", "BookOpen", "Receipt", "BarChart3"
  ],
  "Chat & Social": [
    "MessageSquare", "MessageCircle", "MessagesSquare", "Send", "Bot", "Phone", "Mail", "Speech",
    "Share2", "Users", "UserCheck", "Inbox", "AtSign", "PhoneCall", "Video"
  ],
  "Media & Ent.": [
    "Tv", "Film", "Video", "Clapperboard", "Play", "Camera", "Youtube", "Music", "Headphones",
    "Radio", "Mic", "Podcast", "Volume2", "Music2", "Disc"
  ],
  "Finance & Pay": [
    "Wallet", "CreditCard", "Receipt", "BarChart3", "DollarSign", "Coins", "Briefcase",
    "Banknote", "PiggyBank", "Landmark", "ShoppingCart", "ShoppingBag", "Store", "Tag", "Gift", "Percent"
  ],
  "Tech & Tools": [
    "Laptop", "Monitor", "Cloud", "Shield", "Robot", "Brain", "Rocket", "Zap",
    "HardDrive", "Database", "Server", "Code", "Terminal", "Cpu", "WandSparkles", "Folder"
  ],
  "Lifestyle": [
    "Dumbbell", "HeartPulse", "Footprints", "Bicycle", "Flower2", "Moon", "Sun", "Globe",
    "MapPin", "Plane", "Car", "Utensils", "Coffee", "Apple"
  ]
}

// Convert kebab-case keys to PascalCase icon names
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")
}

const ALL_LUCIDE_ICONS: string[] = Object.keys(dynamicIconImports).map(kebabToPascal)

// Pre-indexed for sub-millisecond search performance
const INDEXED_ALIASES = Object.entries(SEARCH_ALIASES).map(([alias, names]) => ({
  alias: alias.toLowerCase(),
  names,
}))

const INDEXED_ALL_ICONS = ALL_LUCIDE_ICONS.map((name) => ({
  name,
  lower: name.toLowerCase(),
}))

interface IconPickerProps {
  selected: string | null
  onSelect: (icon: string) => void
  open: boolean
  onClose: () => void
}

export function IconPicker({ selected, onSelect, open, onClose }: IconPickerProps) {
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [activeCategory, setActiveCategory] = useState("Popular")
  const [visibleCount, setVisibleCount] = useState(72)

  const q = deferredSearch.trim().toLowerCase()

  const filteredIcons = useMemo(() => {
    if (!q) {
      if (activeCategory === "All") return ALL_LUCIDE_ICONS
      return ICON_CATEGORIES[activeCategory] || ICON_CATEGORIES.Popular
    }

    const matchesSet = new Set<string>()

    // Check alias matching
    for (const item of INDEXED_ALIASES) {
      if (item.alias.includes(q) || q.includes(item.alias)) {
        for (const name of item.names) {
          matchesSet.add(name)
        }
      }
    }

    // Direct name matching
    for (const item of INDEXED_ALL_ICONS) {
      if (item.lower.includes(q)) {
        matchesSet.add(item.name)
      }
    }

    return Array.from(matchesSet)
  }, [q, activeCategory])

  const displayedIcons = useMemo(() => {
    return filteredIcons.slice(0, visibleCount)
  }, [filteredIcons, visibleCount])

  const hasMore = filteredIcons.length > visibleCount

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setVisibleCount(72)
  }

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat)
    setVisibleCount(72)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg max-h-[80vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-background border border-border shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-base font-semibold">Choose Icon</h3>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search icons (e.g., chat, streaming, wallet)..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-8"
            />
            {search && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {!search && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {["Popular", ...Object.keys(ICON_CATEGORIES).filter(c => c !== "Popular"), "All"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors",
                    activeCategory === cat
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <ScrollArea className="h-[45vh] pr-2">
            {filteredIcons.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No icons found for &quot;{search}&quot;
              </div>
            ) : (
              <div className="space-y-3 p-1">
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {displayedIcons.map((icon) => {
                    const isSelected = selected === icon
                    return (
                      <button
                        key={icon}
                        title={icon}
                        onClick={() => {
                          onSelect(icon)
                          onClose()
                        }}
                        className={cn(
                          "relative flex aspect-square flex-col items-center justify-center rounded-xl border p-2 transition-all hover:bg-muted active:scale-95",
                          isSelected
                            ? "border-foreground bg-foreground text-background ring-2 ring-foreground/20"
                            : "border-border text-foreground hover:border-foreground/40"
                        )}
                      >
                        <DynamicIcon name={icon} className="size-5" />
                        {isSelected && (
                          <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-background text-foreground">
                            <Check className="size-2.5" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                {hasMore && (
                  <div className="py-2 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 72)}
                      className="rounded-xl border border-border bg-muted px-4 py-2 text-xs font-medium text-foreground transition-all hover:bg-muted/80 active:scale-95"
                    >
                      Load more icons ({filteredIcons.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

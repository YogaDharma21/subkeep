import { useState, useMemo, useDeferredValue, memo, useCallback } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { categories } from "@/lib/constants"
import { DynamicIcon } from "@/components/dynamic-icon"
import { DEFAULT_TEMPLATES, type SubscriptionTemplate } from "@/lib/default-templates"

interface TemplateListProps {
  onSelect: (template: {
    name: string
    icon: string
    color: string
    category: string
    price: number
    currency: string
    cancelUrl?: string
  }) => void
}

const TemplateCard = memo(function TemplateCard({
  template,
  onSelect,
}: {
  template: SubscriptionTemplate
  onSelect: (t: SubscriptionTemplate) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3 hover:bg-muted/80 hover:border-foreground/20 active:scale-[0.99] transition-all text-left group shadow-2xs"
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white shadow-xs transition-transform group-hover:scale-105"
        style={{ backgroundColor: template.color }}
      >
        <DynamicIcon name={template.icon} className="size-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-foreground truncate group-hover:text-foreground">
          {template.name}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          ${template.defaultPrice}/mo
        </div>
      </div>
    </button>
  )
})

export function TemplateList({ onSelect }: TemplateListProps) {
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [activeCategory, setActiveCategory] = useState("all")

  const filteredTemplates = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase()

    return DEFAULT_TEMPLATES.filter((t) => {
      const matchesCategory =
        activeCategory === "all" || t.category === activeCategory
      const matchesSearch = !q || t.name.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [deferredSearch, activeCategory])

  const handleSelect = useCallback(
    (template: SubscriptionTemplate) => {
      onSelect({
        name: template.name,
        icon: template.icon,
        color: template.color,
        category: template.category,
        price: template.defaultPrice,
        currency: template.defaultCurrency,
        cancelUrl: template.cancelUrl,
      })
    },
    [onSelect]
  )

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 space-y-3">
      {/* Search Input Bar */}
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search services (e.g. Netflix, Spotify, iCloud, ChatGPT)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-8 h-9 text-xs"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Categories Filter Pills with Wrap (No Horizontal Overflow) */}
      <div className="flex flex-wrap gap-1.5 shrink-0">
        {categories.map((cat) => (
          <Badge
            key={cat.value}
            variant={activeCategory === cat.value ? "default" : "outline"}
            className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-all hover:bg-foreground/10"
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.label}
          </Badge>
        ))}
      </div>

      {/* Responsive Multi-Column Grid Using Full Available Height */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-2">
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.name}
                template={template}
                onSelect={handleSelect}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-muted-foreground">
            No services found for &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  )
}

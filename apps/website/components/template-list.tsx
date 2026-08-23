"use client"

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

const TemplateRow = memo(function TemplateRow({
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
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2.5 hover:bg-muted/70 active:bg-muted transition-colors text-left"
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white shadow-xs"
        style={{ backgroundColor: template.color }}
      >
        <DynamicIcon name={template.icon} className="size-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground truncate">
          {template.name}
        </div>
        <div className="text-xs text-muted-foreground">
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
    <div className="flex flex-col h-full">
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search services (e.g. Netflix, Spotify, iCloud)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-8"
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

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
        {categories.map((cat) => (
          <Badge
            key={cat.value}
            variant={activeCategory === cat.value ? "default" : "outline"}
            className="cursor-pointer shrink-0 rounded-md px-3 py-1 text-xs transition-colors"
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.label}
          </Badge>
        ))}
      </div>

      <div className="h-[320px] overflow-y-auto overscroll-contain pr-1 flex flex-col gap-1 pb-2">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <TemplateRow
              key={template.name}
              template={template}
              onSelect={handleSelect}
            />
          ))
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No services found for &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  )
}

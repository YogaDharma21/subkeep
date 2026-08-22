"use client"

import { useState, useEffect, useMemo, useDeferredValue } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { categories } from "@/lib/constants"
import { DynamicIcon } from "@/components/dynamic-icon"
import { Skeleton } from "@/components/ui/skeleton"

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

export function TemplateList({ onSelect }: TemplateListProps) {
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [activeCategory, setActiveCategory] = useState("all")

  // Load all templates once and filter in memory for buttery smooth 60fps search
  const allTemplates = useQuery(api.templates.list, {})
  const seedTemplates = useMutation(api.templates.seedTemplates)

  useEffect(() => {
    if (allTemplates && allTemplates.length === 0) {
      seedTemplates()
    }
  }, [allTemplates, seedTemplates])

  const filteredTemplates = useMemo(() => {
    if (!allTemplates) return []

    const q = deferredSearch.trim().toLowerCase()

    return allTemplates.filter((t) => {
      const matchesCategory =
        activeCategory === "all" || t.category === activeCategory
      const matchesSearch = !q || t.name.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [allTemplates, deferredSearch, activeCategory])

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
            className="cursor-pointer shrink-0 rounded-full px-3 py-1 text-xs transition-colors"
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.label}
          </Badge>
        ))}
      </div>

      <ScrollArea className="h-[320px] pr-2">
        <div className="flex flex-col gap-1.5 pb-2">
          {!allTemplates ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
              >
                <Skeleton className="size-10 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <button
                key={template._id}
                onClick={() =>
                  onSelect({
                    name: template.name,
                    icon: template.icon,
                    color: template.color,
                    category: template.category,
                    price: template.defaultPrice,
                    currency: template.defaultCurrency,
                    cancelUrl: template.cancelUrl,
                  })
                }
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent p-2.5 transition-colors hover:border-border hover:bg-accent/50 dark:hover:bg-accent/40 active:scale-[0.99]"
              >
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl shadow-xs"
                  style={{ backgroundColor: template.color }}
                >
                  <DynamicIcon name={template.icon} className="size-5 text-white" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {template.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${template.defaultPrice}/mo
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No services found for &quot;{search}&quot;
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

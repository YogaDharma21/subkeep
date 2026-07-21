"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import * as LucideIcons from "lucide-react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { categories } from "@/lib/constants"
import type { ComponentType } from "react"

const icons = LucideIcons as unknown as Record<string, ComponentType<Record<string, unknown>>>

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] || LucideIcons.Receipt
  return <Icon className={className} />
}

interface TemplateListProps {
  onSelect: (template: {
    name: string
    icon: string
    color: string
    category: string
    price: number
    currency: string
  }) => void
}

export function TemplateList({ onSelect }: TemplateListProps) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const templates = useQuery(api.templates.search, {
    search,
    category: activeCategory,
  })
  const seedTemplates = useMutation(api.templates.seedTemplates)

  useEffect(() => {
    if (templates && templates.length === 0 && search === "" && activeCategory === "all") {
      seedTemplates()
    }
  }, [templates, search, activeCategory, seedTemplates])

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <Badge
            key={cat.value}
            variant={activeCategory === cat.value ? "default" : "outline"}
            className="cursor-pointer shrink-0 rounded-full px-3 py-1"
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.label}
          </Badge>
        ))}
      </div>
      <ScrollArea className="h-[300px]">
        <div className="flex flex-col gap-1.5">
          {templates?.map((template) => (
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
                })
              }
              className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted active:scale-[0.98]"
            >
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: template.color }}
              >
                <DynamicIcon name={template.icon} className="size-5 text-white" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-sm font-medium">{template.name}</div>
                <div className="text-xs text-muted-foreground">
                  ${template.defaultPrice}/mo
                </div>
              </div>
            </button>
          ))}
          {templates?.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No templates found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

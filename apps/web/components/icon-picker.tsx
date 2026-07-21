"use client"

import { useState } from "react"
import * as LucideIcons from "lucide-react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { iconList } from "@/lib/constants"
import type { ComponentType } from "react"

const icons = LucideIcons as unknown as Record<string, ComponentType<Record<string, unknown>>>

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] || LucideIcons.Receipt
  return <Icon className={className} />
}

interface IconPickerProps {
  selected: string | null
  onSelect: (icon: string) => void
  open: boolean
  onClose: () => void
}

export function IconPicker({ selected, onSelect, open, onClose }: IconPickerProps) {
  const [search, setSearch] = useState("")

  const filtered = search
    ? iconList.filter((i) => i.toLowerCase().includes(search.toLowerCase()))
    : iconList

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/50" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 max-h-[70vh] rounded-t-2xl bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-base font-semibold">Choose Icon</h3>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg hover:bg-muted"
          >
            <LucideIcons.X className="size-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[40vh]">
            <div className="grid grid-cols-5 gap-2">
              {filtered.map((icon) => (
                <button
                  key={icon}
                  onClick={() => {
                    onSelect(icon)
                    onClose()
                  }}
                  className={`flex aspect-square items-center justify-center rounded-xl border transition-all hover:bg-muted active:scale-90 ${
                    selected === icon
                      ? "border-foreground bg-foreground text-background"
                      : "border-border"
                  }`}
                >
                  <DynamicIcon name={icon} className="size-5" />
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

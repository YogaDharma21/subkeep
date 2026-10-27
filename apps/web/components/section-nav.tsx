"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { SectionTab } from "@/lib/navigation"

interface SectionTabsProps {
  tabs: SectionTab[]
  className?: string
}

interface SectionHeaderProps {
  title: string
  tabs: SectionTab[]
  eyebrow?: string
}

export function SectionHeader({ title, tabs, eyebrow }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow ? <p className="label">{eyebrow}</p> : null}
        <h1 className="page-title text-foreground">{title}</h1>
      </div>
      <SectionTabs tabs={tabs} />
    </div>
  )
}

export function SectionTabs({ tabs, className }: SectionTabsProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Section"
      className={cn(
        "quiet-scroll flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-border bg-card/70 p-1 backdrop-blur-md",
        className
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-medium tracking-wide transition-colors",
              isActive
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

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
}

export function SectionHeader({ title, tabs }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-lg font-bold tracking-tight text-foreground">
        {title}
      </h1>
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
        "flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-border bg-background p-1 shadow-xs",
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
              "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, Plus, BarChart3, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/more", label: "Settings", icon: Settings },
]

interface BottomNavProps {
  onAddClick?: () => void
}

export function BottomNav({ onAddClick }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2.5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <nav
        aria-label="Primary"
        className="flex items-center gap-1 rounded-full border border-border bg-background/90 p-1.5 shadow-lg backdrop-blur-md"
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex size-11 items-center justify-center rounded-full transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
            </Link>
          )
        })}
      </nav>

      <button
        onClick={onAddClick}
        title="Add subscription"
        aria-label="Add subscription"
        className="flex size-14 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        <Plus className="size-6" />
      </button>
    </div>
  )
}

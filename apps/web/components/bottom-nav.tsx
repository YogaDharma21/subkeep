"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, Plus, BarChart3, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/more", label: "More", icon: MoreHorizontal },
]

interface BottomNavProps {
  onAddClick?: () => void
}

export function BottomNav({ onAddClick }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background">
      <div className="mx-auto flex max-w-[480px] items-center justify-around py-2">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        <button
          onClick={onAddClick}
          className="-mt-5 flex size-12 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg transition-transform active:scale-95"
        >
          <Plus className="size-6" />
        </button>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

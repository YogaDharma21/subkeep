"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, BarChart3, MoreHorizontal, Plus } from "lucide-react"
import { UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
  { href: "/more", label: "Settings & More", icon: MoreHorizontal },
]

interface DesktopSidebarProps {
  onAddClick?: () => void
}

export function DesktopSidebar({ onAddClick }: DesktopSidebarProps) {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-background z-30">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background font-bold text-sm">
            SK
          </div>
          <span className="text-base font-bold text-foreground tracking-tight">SubKeep</span>
        </Link>
      </div>

      {/* Add Subscription Action Button */}
      <div className="p-4">
        <Button
          onClick={onAddClick}
          className="w-full justify-center gap-2 h-10 font-semibold shadow-xs"
        >
          <Plus className="size-4" />
          <span>Add Subscription</span>
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-4.5 shrink-0",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile at Bottom */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 rounded-xl p-2 bg-muted/40 border border-border/50">
          <UserButton />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-foreground">
              {user?.fullName || user?.username || "Account"}
            </div>
            <div className="truncate text-[10px] text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress || "User Profile"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

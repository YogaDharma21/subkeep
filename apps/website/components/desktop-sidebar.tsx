"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Receipt,
  LogOut,
  Search,
  CreditCard,
} from "lucide-react"
import { useUser, useClerk } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
  { href: "/more", label: "Settings", icon: Settings },
]

interface DesktopSidebarProps {
  onAddClick?: () => void
  onSearchClick?: () => void
  onCardsClick?: () => void
}

export function DesktopSidebar({
  onAddClick,
  onSearchClick,
  onCardsClick,
}: DesktopSidebarProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const { openUserProfile, signOut } = useClerk()

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-background z-30">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background shadow-xs">
            <Receipt className="size-4.5 stroke-[2.2]" />
          </div>
          <span className="text-base font-bold text-foreground tracking-tight">SubKeep</span>
        </Link>
      </div>

      {/* Add Subscription Action Button & Command Palette Search */}
      <div className="p-4 space-y-2">
        <Button
          onClick={onAddClick}
          className="w-full justify-center gap-2 h-10 font-semibold shadow-xs cursor-pointer"
        >
          <Plus className="size-4" />
          <span>Add Subscription</span>
        </Button>

        <button
          onClick={onSearchClick}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="size-3.5" />
            <span>Search & Commands...</span>
          </div>
          <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono">
            ⌘K
          </kbd>
        </button>
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

        {/* Card Vault Quick Link */}
        <button
          onClick={onCardsClick}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground cursor-pointer"
        >
          <CreditCard className="size-4.5 shrink-0 text-muted-foreground" />
          <span>Card Vault</span>
        </button>
      </nav>

      {/* User Profile at Bottom */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center justify-between gap-2.5 rounded-lg border border-border/60 bg-muted/40 p-2.5 transition-colors hover:bg-muted/70 w-full">
          <button
            type="button"
            onClick={() => openUserProfile()}
            className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer focus:outline-none"
            title="Manage Account"
          >
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.fullName || "User Avatar"}
                className="size-9 rounded-full object-cover shrink-0 ring-1 ring-border"
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full bg-foreground text-background text-sm font-bold shrink-0">
                {(user?.fullName || user?.username || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground truncate">
                {user?.fullName || user?.username || "My Account"}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {user?.primaryEmailAddress?.emailAddress || "User Profile"}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

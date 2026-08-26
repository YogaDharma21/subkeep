"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  Home,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  LogOut,
  Search,
} from "lucide-react"
import { useUser, useClerk } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function getIsMacSnapshot(): boolean {
  if (typeof window === "undefined") return false
  return /Mac|iPod|iPhone|iPad/i.test(navigator.userAgent || "")
}

function subscribeToPlatform(): () => void {
  return () => {}
}

function getServerSnapshot(): boolean {
  return false
}

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
  { href: "/more", label: "Settings", icon: Settings },
]

interface DesktopSidebarProps {
  onAddClick?: () => void
  onSearchClick?: () => void
}

export function DesktopSidebar({
  onAddClick,
  onSearchClick,
}: DesktopSidebarProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const { openUserProfile, signOut } = useClerk()
  const isMac = useSyncExternalStore(
    subscribeToPlatform,
    getIsMacSnapshot,
    getServerSnapshot
  )

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-background z-30">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/app-icon.png"
            alt="SubKeep"
            width={32}
            height={32}
            className="size-8 rounded-lg object-contain shadow-xs"
          />
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
            {isMac ? "⌘K" : "Ctrl+K"}
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

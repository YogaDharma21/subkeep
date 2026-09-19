"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Home, Calendar, BarChart3, Settings, Plus, Search } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
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

interface TopNavbarProps {
  onAddClick?: () => void
  onSearchClick?: () => void
}

export function TopNavbar({ onAddClick, onSearchClick }: TopNavbarProps) {
  const pathname = usePathname()
  const isMac = useSyncExternalStore(
    subscribeToPlatform,
    getIsMacSnapshot,
    getServerSnapshot
  )

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/app-icon.png"
            alt="SubKeep"
            width={32}
            height={32}
            className="size-8 rounded-lg object-contain shadow-xs"
          />
          <span className="text-base font-bold tracking-tight text-foreground">
            SubKeep
          </span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center md:flex">
          <div className="flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          <button
            onClick={onSearchClick}
            className="hidden h-9 items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground cursor-pointer sm:flex md:w-44 lg:w-52"
          >
            <span className="flex items-center gap-2">
              <Search className="size-3.5 shrink-0" />
              <span className="truncate">Search...</span>
            </span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] shrink-0">
              {isMac ? "⌘K" : "Ctrl+K"}
            </kbd>
          </button>

          <button
            onClick={onSearchClick}
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground transition-colors hover:text-foreground cursor-pointer sm:hidden"
            title="Search & Commands"
            aria-label="Search & Commands"
          >
            <Search className="size-4" />
          </button>

          <Button
            onClick={onAddClick}
            size="sm"
            className="hidden h-9 gap-1.5 font-semibold shadow-xs cursor-pointer md:inline-flex"
          >
            <Plus className="size-4" />
            <span className="hidden lg:inline">Add Subscription</span>
            <span className="lg:hidden">Add</span>
          </Button>

          <UserButton />
        </div>
      </div>
    </header>
  )
}

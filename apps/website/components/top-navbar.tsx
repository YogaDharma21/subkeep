"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Settings } from "lucide-react"
import { UserButton } from "@clerk/nextjs"

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

interface TopNavbarProps {
  onSearchClick?: () => void
}

export function TopNavbar({ onSearchClick }: TopNavbarProps) {
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

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            onClick={onSearchClick}
            className="hidden h-9 cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground sm:flex md:w-44 lg:w-52"
          >
            <span className="flex items-center gap-2">
              <Search className="size-3.5 shrink-0" />
              <span className="truncate">Search...</span>
            </span>
            <kbd className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
              {isMac ? "⌘K" : "Ctrl+K"}
            </kbd>
          </button>

          <button
            onClick={onSearchClick}
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground transition-colors hover:text-foreground sm:hidden"
            title="Search & Commands"
            aria-label="Search & Commands"
          >
            <Search className="size-4" />
          </button>

          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Link
                label="Settings"
                labelIcon={<Settings className="size-4" />}
                href="/more"
              />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </div>
    </header>
  )
}

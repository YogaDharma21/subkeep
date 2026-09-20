"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  Repeat,
  Plus,
  BarChart3,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const leftNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/subscriptions", label: "Subscriptions", icon: Repeat },
]

const rightNavItems = [
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/more", label: "Settings", icon: Settings },
]

interface BottomNavProps {
  onAddClick?: () => void
}

export function BottomNav({ onAddClick }: BottomNavProps) {
  const pathname = usePathname()

  const renderItem = (item: { href: string; label: string; icon: typeof Home }) => {
    const Icon = item.icon
    const isActive =
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(`${item.href}/`)
    return (
      <Link
        key={item.href}
        href={item.href}
        title={item.label}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full transition-colors",
          isActive
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <Icon className="size-5" />
      </Link>
    )
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <nav
        aria-label="Primary"
        className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border bg-background/90 p-1.5 shadow-lg backdrop-blur-md"
      >
        {leftNavItems.map(renderItem)}

        <button
          onClick={onAddClick}
          title="Add transaction"
          aria-label="Add transaction"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus className="size-5" />
        </button>

        {rightNavItems.map(renderItem)}
      </nav>
    </div>
  )
}

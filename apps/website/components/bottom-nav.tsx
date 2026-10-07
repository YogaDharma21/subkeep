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
          "flex size-11 shrink-0 items-center justify-center rounded-full transition-all",
          isActive
            ? "bg-gradient-to-r from-violet-500/20 to-indigo-500/20 text-violet-300 border border-violet-500/30 shadow-xs shadow-violet-500/10"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
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
        className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/[0.08] bg-[#11121C]/90 p-1.5 shadow-2xl shadow-violet-950/40 backdrop-blur-md"
      >
        {leftNavItems.map(renderItem)}

        <button
          onClick={onAddClick}
          title="Quick add"
          aria-label="Quick add"
          className="flex size-12 shrink-0 items-center justify-center rounded-full border border-violet-400/30 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 transition-all hover:scale-105 hover:shadow-violet-500/50 active:scale-95 cursor-pointer"
        >
          <Plus className="size-6" strokeWidth={2.5} />
        </button>

        {rightNavItems.map(renderItem)}
      </nav>
    </div>
  )
}

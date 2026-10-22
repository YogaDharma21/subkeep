import type { LucideIcon } from "lucide-react"
import {
  ArrowLeftRight,
  BarChart3,
  Calendar,
  Home,
  PiggyBank,
  Repeat,
  Wallet,
} from "lucide-react"

export interface SectionTab {
  href: string
  label: string
  icon: LucideIcon
}

export interface PrimaryNavItem {
  href: string
  label: string
  icon: LucideIcon
  match: string[]
}

export const moneyTabs: SectionTab[] = [
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/accounts", label: "Accounts", icon: Wallet },
]

export const subscriptionTabs: SectionTab[] = [
  { href: "/subscriptions", label: "Tracker", icon: Repeat },
  { href: "/calendar", label: "Calendar", icon: Calendar },
]

export const insightTabs: SectionTab[] = [
  { href: "/stats", label: "Analytics", icon: BarChart3 },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
]

export const primaryNav: PrimaryNavItem[] = [
  { href: "/", label: "Home", icon: Home, match: ["/"] },
  {
    href: "/transactions",
    label: "Money",
    icon: Wallet,
    match: ["/transactions", "/accounts"],
  },
  {
    href: "/subscriptions",
    label: "Subscriptions",
    icon: Repeat,
    match: ["/subscriptions", "/calendar"],
  },
  {
    href: "/stats",
    label: "Insights",
    icon: BarChart3,
    match: ["/stats", "/budgets"],
  },
]

"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getSymbol } from "@/lib/constants"
import { DynamicIcon } from "@/components/dynamic-icon"

interface SubscriptionItem {
  _id: string
  name: string
  icon: string
  color: string
  price: number
  currency: string
  cycle?: string
  startDate?: string
  nextBilling: string
  endDate?: string
  category: string
  isActive?: boolean
}

interface CalendarGridProps {
  subscriptions: SubscriptionItem[]
}

function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number)
  const y = parts[0]
  const m = (parts[1] || 1) - 1
  const d = parts[2] || 1
  return new Date(y, m, d)
}

export function CalendarGrid({ subscriptions }: CalendarGridProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const billingDays = useMemo(() => {
    const map: Record<number, SubscriptionItem[]> = {}

    subscriptions.forEach((sub) => {
      // Don't list inactive subscriptions in future projections if suspended
      if (sub.isActive === false) return

      const cycle = (sub.cycle || "monthly").toLowerCase()
      const subStart = sub.startDate
        ? parseLocalDate(sub.startDate)
        : parseLocalDate(sub.nextBilling)
      const subEnd = sub.endDate ? parseLocalDate(sub.endDate) : null

      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month, daysInMonth)

      // Skip if subscription ended before this month or hasn't started yet
      if (subEnd && subEnd < monthStart) return
      if (subStart > monthEnd) return

      const addSubToDay = (d: number) => {
        if (!map[d]) map[d] = []
        if (!map[d].some((item) => item._id === sub._id)) {
          map[d].push(sub)
        }
      }

      if (cycle === "monthly") {
        const startDay = subStart.getDate()
        const targetDay = Math.min(startDay, daysInMonth)
        const candDate = new Date(year, month, targetDay)
        if (candDate >= subStart && (!subEnd || candDate <= subEnd)) {
          addSubToDay(targetDay)
        }
      } else if (cycle === "quarterly") {
        const monthDiff = (year - subStart.getFullYear()) * 12 + (month - subStart.getMonth())
        if (monthDiff >= 0 && monthDiff % 3 === 0) {
          const startDay = subStart.getDate()
          const targetDay = Math.min(startDay, daysInMonth)
          const candDate = new Date(year, month, targetDay)
          if (candDate >= subStart && (!subEnd || candDate <= subEnd)) {
            addSubToDay(targetDay)
          }
        }
      } else if (cycle === "semi-annual") {
        const monthDiff = (year - subStart.getFullYear()) * 12 + (month - subStart.getMonth())
        if (monthDiff >= 0 && monthDiff % 6 === 0) {
          const startDay = subStart.getDate()
          const targetDay = Math.min(startDay, daysInMonth)
          const candDate = new Date(year, month, targetDay)
          if (candDate >= subStart && (!subEnd || candDate <= subEnd)) {
            addSubToDay(targetDay)
          }
        }
      } else if (cycle === "yearly") {
        if (subStart.getMonth() === month) {
          const startDay = subStart.getDate()
          const targetDay = Math.min(startDay, daysInMonth)
          const candDate = new Date(year, month, targetDay)
          if (candDate >= subStart && (!subEnd || candDate <= subEnd)) {
            addSubToDay(targetDay)
          }
        }
      } else if (cycle === "weekly") {
        for (let d = 1; d <= daysInMonth; d++) {
          const candDate = new Date(year, month, d)
          if (candDate >= subStart && (!subEnd || candDate <= subEnd)) {
            const diffDays = Math.round(
              (candDate.getTime() - subStart.getTime()) / (1000 * 60 * 60 * 24)
            )
            if (diffDays >= 0 && diffDays % 7 === 0) {
              addSubToDay(d)
            }
          }
        }
      } else if (cycle === "daily") {
        for (let d = 1; d <= daysInMonth; d++) {
          const candDate = new Date(year, month, d)
          if (candDate >= subStart && (!subEnd || candDate <= subEnd)) {
            addSubToDay(d)
          }
        }
      } else if (cycle === "none") {
        if (subStart.getFullYear() === year && subStart.getMonth() === month) {
          addSubToDay(subStart.getDate())
        }
      } else {
        // Fallback matching against nextBilling
        const nbDate = parseLocalDate(sub.nextBilling)
        if (nbDate.getFullYear() === year && nbDate.getMonth() === month) {
          addSubToDay(nbDate.getDate())
        }
      }
    })
    return map
  }, [subscriptions, year, month, daysInMonth])

  const today = new Date()
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  const days: Array<{ day: number; isCurrentMonth: boolean }> = []

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, isCurrentMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, isCurrentMonth: true })
  }
  const remaining = days.length % 7 === 0 ? 0 : 7 - (days.length % 7)
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, isCurrentMonth: false })
  }

  const selectedSubs = selectedDay ? billingDays[selectedDay] || [] : []

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{monthName}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="icon-sm" onClick={prevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={nextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="py-1 text-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            const hasSub = d.isCurrentMonth && billingDays[d.day]
            const isSelected = selectedDay === d.day && d.isCurrentMonth
            return (
              <button
                key={i}
                onClick={() => d.isCurrentMonth && setSelectedDay(d.day)}
                disabled={!d.isCurrentMonth}
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-lg text-sm transition-all",
                  !d.isCurrentMonth && "text-muted-foreground/40",
                  d.isCurrentMonth && "hover:bg-muted",
                  isToday(d.day) &&
                    "bg-foreground font-semibold text-background",
                  isSelected &&
                    !isToday(d.day) &&
                    "border-2 border-foreground font-semibold",
                  hasSub && "font-medium"
                )}
              >
                {d.day}
                {hasSub && (
                  <span
                    className={cn(
                      "absolute bottom-0.5 size-1 rounded-full",
                      isToday(d.day) ? "bg-background" : "bg-blue-500"
                    )}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDay !== null && (
        <div className="rounded-xl border border-border bg-background">
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-semibold">
              {selectedSubs.length > 0
                ? `${selectedSubs.length} subscription${selectedSubs.length > 1 ? "s" : ""} due`
                : "No subscriptions"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {new Date(year, month, selectedDay).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="p-2">
            {selectedSubs.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No payments scheduled for this day
              </div>
            ) : (
              selectedSubs.map((sub) => (
                <div
                  key={sub._id}
                  onClick={() => router.push(`/subscriptions/${sub._id}`)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-muted"
                >
                  <div
                    className="flex size-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: sub.color }}
                  >
                    <DynamicIcon name={sub.icon} className="size-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {sub.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sub.category}
                      {sub.cycle && ` · ${sub.cycle}`}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {getSymbol(sub.currency)}{sub.price}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

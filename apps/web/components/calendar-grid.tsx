"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ComponentType } from "react"

const icons = LucideIcons as unknown as Record<string, ComponentType<Record<string, unknown>>>

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] || LucideIcons.Receipt
  return <Icon className={className} />
}

interface CalendarGridProps {
  subscriptions: Array<{
    _id: string
    name: string
    icon: string
    color: string
    price: number
    currency: string
    nextBilling: string
    category: string
  }>
}

export function CalendarGrid({ subscriptions }: CalendarGridProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

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
    const map: Record<number, typeof subscriptions> = {}
    subscriptions.forEach((sub) => {
      const d = new Date(sub.nextBilling)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(sub)
      }
    })
    return map
  }, [subscriptions, year, month])

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
            const isSelected =
              selectedDay === d.day && d.isCurrentMonth
            return (
              <button
                key={i}
                onClick={() =>
                  d.isCurrentMonth && setSelectedDay(d.day)
                }
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
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      ${sub.price}
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

"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getSymbol } from "@/lib/constants"
import { DynamicIcon } from "@/components/dynamic-icon"
import { convertAndFormat, formatCurrencyAmount } from "@/lib/currency"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"

export type CalendarEventType = "start" | "renewal" | "trial_end" | "end"

export interface SubscriptionItem {
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
  isTrial?: boolean
  trialEndDate?: string
  account?: string
  isShared?: boolean
  totalMembers?: number
}

export interface CalendarDayEvent {
  subscription: SubscriptionItem
  eventType: CalendarEventType
}

interface CalendarGridProps {
  subscriptions: SubscriptionItem[]
}

const eventPriority: Record<CalendarEventType, number> = {
  start: 1,
  renewal: 2,
  trial_end: 3,
  end: 4,
}

function getEventDotClass(eventType: CalendarEventType, isTodayCell: boolean): string {
  const isEndEvent = eventType === "end" || eventType === "trial_end"
  if (isTodayCell) {
    return isEndEvent ? "bg-orange-300" : "bg-blue-300"
  }
  return isEndEvent ? "bg-orange-500" : "bg-blue-500"
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
  const { primaryCurrency, rates } = usePrimaryCurrency()
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
    const map: Record<number, CalendarDayEvent[]> = {}

    const addEvent = (d: number, event: CalendarDayEvent) => {
      if (d < 1 || d > daysInMonth) return
      if (!map[d]) map[d] = []
      if (
        !map[d].some(
          (e) =>
            e.subscription._id === event.subscription._id &&
            e.eventType === event.eventType
        )
      ) {
        map[d].push(event)
      }
    }

    subscriptions.forEach((sub) => {
      if (sub.isActive === false) return

      const cycle = (sub.cycle || "monthly").toLowerCase()
      const subStart = sub.startDate
        ? parseLocalDate(sub.startDate)
        : parseLocalDate(sub.nextBilling)
      const subEnd = sub.endDate ? parseLocalDate(sub.endDate) : null
      const trialEnd =
        sub.isTrial && sub.trialEndDate ? parseLocalDate(sub.trialEndDate) : null

      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59)

      // 1. Subscription Start Date Event
      if (subStart.getFullYear() === year && subStart.getMonth() === month) {
        addEvent(subStart.getDate(), {
          subscription: sub,
          eventType: "start",
        })
      }

      // 2. Trial End Date Event
      if (trialEnd && trialEnd.getFullYear() === year && trialEnd.getMonth() === month) {
        addEvent(trialEnd.getDate(), {
          subscription: sub,
          eventType: "trial_end",
        })
      }

      // 3. Subscription End Date Event
      if (subEnd && subEnd.getFullYear() === year && subEnd.getMonth() === month) {
        addEvent(subEnd.getDate(), {
          subscription: sub,
          eventType: "end",
        })
      }

      // 4. Recurring Billing / Renewal Dates
      if (subEnd && subEnd < monthStart) return
      if (subStart > monthEnd) return

      const monthDiff = (year - subStart.getFullYear()) * 12 + (month - subStart.getMonth())

      if (cycle === "monthly") {
        if (monthDiff > 0) {
          const originalDay = subStart.getDate()
          const targetDay = Math.min(originalDay, daysInMonth)
          const candDate = new Date(year, month, targetDay)
          if (!subEnd || candDate <= subEnd) {
            addEvent(targetDay, { subscription: sub, eventType: "renewal" })
          }
        }
      } else if (cycle === "quarterly") {
        if (monthDiff > 0 && monthDiff % 3 === 0) {
          const originalDay = subStart.getDate()
          const targetDay = Math.min(originalDay, daysInMonth)
          const candDate = new Date(year, month, targetDay)
          if (!subEnd || candDate <= subEnd) {
            addEvent(targetDay, { subscription: sub, eventType: "renewal" })
          }
        }
      } else if (cycle === "semi-annual") {
        if (monthDiff > 0 && monthDiff % 6 === 0) {
          const originalDay = subStart.getDate()
          const targetDay = Math.min(originalDay, daysInMonth)
          const candDate = new Date(year, month, targetDay)
          if (!subEnd || candDate <= subEnd) {
            addEvent(targetDay, { subscription: sub, eventType: "renewal" })
          }
        }
      } else if (cycle === "yearly") {
        if (subStart.getMonth() === month && year > subStart.getFullYear()) {
          const originalDay = subStart.getDate()
          const targetDay = Math.min(originalDay, daysInMonth)
          const candDate = new Date(year, month, targetDay)
          if (!subEnd || candDate <= subEnd) {
            addEvent(targetDay, { subscription: sub, eventType: "renewal" })
          }
        }
      } else if (cycle === "weekly") {
        for (let d = 1; d <= daysInMonth; d++) {
          const candDate = new Date(year, month, d)
          if (candDate > subStart && (!subEnd || candDate <= subEnd)) {
            const diffDays = Math.round(
              (candDate.getTime() - subStart.getTime()) / (1000 * 60 * 60 * 24)
            )
            if (diffDays > 0 && diffDays % 7 === 0) {
              addEvent(d, { subscription: sub, eventType: "renewal" })
            }
          }
        }
      } else if (cycle === "daily") {
        for (let d = 1; d <= daysInMonth; d++) {
          const candDate = new Date(year, month, d)
          if (candDate > subStart && (!subEnd || candDate <= subEnd)) {
            addEvent(d, { subscription: sub, eventType: "renewal" })
          }
        }
      } else if (cycle === "none") {
        // One-time subscription has no recurring renewals
      } else {
        const nbDate = parseLocalDate(sub.nextBilling)
        if (nbDate.getFullYear() === year && nbDate.getMonth() === month) {
          if (nbDate.getTime() === subStart.getTime()) {
            addEvent(nbDate.getDate(), { subscription: sub, eventType: "start" })
          } else {
            addEvent(nbDate.getDate(), { subscription: sub, eventType: "renewal" })
          }
        }
      }
    })
    Object.keys(map).forEach((key) => {
      const d = Number(key)
      map[d].sort((a, b) => eventPriority[a.eventType] - eventPriority[b.eventType])
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

  const selectedEvents = selectedDay ? billingDays[selectedDay] || [] : []

  const getHeaderTitle = () => {
    if (selectedEvents.length === 0) {
      return "No subscriptions"
    }

    const startCount = selectedEvents.filter((e) => e.eventType === "start").length
    const renewalCount = selectedEvents.filter((e) => e.eventType === "renewal").length
    const trialEndCount = selectedEvents.filter((e) => e.eventType === "trial_end").length
    const endCount = selectedEvents.filter((e) => e.eventType === "end").length

    if (startCount === selectedEvents.length) {
      if (selectedEvents.length === 1) {
        return selectedEvents[0].subscription.isTrial
          ? "1 trial starts"
          : "1 subscription starts"
      }
      return `${selectedEvents.length} subscriptions starting`
    }

    if (renewalCount === selectedEvents.length) {
      return `${selectedEvents.length} subscription${selectedEvents.length > 1 ? "s" : ""} due`
    }

    if (trialEndCount === selectedEvents.length) {
      return `${selectedEvents.length} trial${selectedEvents.length > 1 ? "s" : ""} ending`
    }

    if (endCount === selectedEvents.length) {
      return `${selectedEvents.length} subscription${selectedEvents.length > 1 ? "s" : ""} ending`
    }

    return `${selectedEvents.length} subscriptions scheduled`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 rounded-lg border border-border bg-background p-4 sm:p-5">
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
            const dayEvents = d.isCurrentMonth ? billingDays[d.day] : undefined
            const hasSub = !!(dayEvents && dayEvents.length > 0)
            const isSelected = selectedDay === d.day && d.isCurrentMonth
            const isCurrentDayToday = d.isCurrentMonth && isToday(d.day)
            return (
              <button
                key={i}
                onClick={() => d.isCurrentMonth && setSelectedDay(d.day)}
                disabled={!d.isCurrentMonth}
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-lg text-sm transition-all cursor-pointer",
                  !d.isCurrentMonth && "text-muted-foreground/40",
                  d.isCurrentMonth && "hover:bg-muted",
                  isCurrentDayToday &&
                    "bg-foreground font-semibold text-background",
                  isSelected &&
                    !isCurrentDayToday &&
                    "border-2 border-foreground font-semibold",
                  hasSub && "font-medium"
                )}
              >
                {d.day}
                {hasSub && dayEvents && (
                  <div className="absolute bottom-1 flex items-center justify-center gap-1">
                    {dayEvents.slice(0, 3).map((event, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "size-1.5 rounded-full transition-colors",
                          getEventDotClass(event.eventType, isCurrentDayToday)
                        )}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span
                        className={cn(
                          "size-1 rounded-full",
                          isCurrentDayToday ? "bg-background/80" : "bg-muted-foreground/70"
                        )}
                      />
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Calendar Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 border-t border-border pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-500" />
            <span>Subscription Start</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-orange-500" />
            <span>Subscription End</span>
          </div>
        </div>
      </div>

      {selectedDay !== null && (
        <div className="lg:col-span-5 rounded-lg border border-border bg-background lg:sticky lg:top-6">
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-semibold">{getHeaderTitle()}</h3>
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
            {selectedEvents.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No events or payments scheduled for this day
              </div>
            ) : (
              selectedEvents.map(({ subscription: sub, eventType }) => {
                const isTrial = !!sub.isTrial
                const showConverted =
                  primaryCurrency && primaryCurrency !== sub.currency

                return (
                  <div
                    key={`${sub._id}-${eventType}`}
                    onClick={() => router.push(`/subscriptions/${sub._id}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-muted transition-colors"
                  >
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: sub.color }}
                    >
                      <DynamicIcon
                        name={sub.icon}
                        className="size-4 text-white"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="truncate text-sm font-medium"
                          title={sub.name}
                        >
                          {sub.name}
                        </span>

                        {eventType === "start" && (
                          <span
                            className={cn(
                              "rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider shrink-0 border",
                              isTrial
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            )}
                          >
                            {isTrial ? "Trial Starts" : "Starts"}
                          </span>
                        )}

                        {eventType === "trial_end" && (
                          <span className="rounded-md bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-orange-600 dark:text-orange-400 border border-orange-500/30 uppercase tracking-wider shrink-0">
                            Trial Ends
                          </span>
                        )}

                        {eventType === "renewal" && (
                          <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider shrink-0">
                            Due
                          </span>
                        )}

                        {eventType === "end" && (
                          <span className="rounded-md bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-orange-600 dark:text-orange-400 border border-orange-500/30 uppercase tracking-wider shrink-0">
                            Ends
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        <span className="capitalize">{sub.category}</span>
                        {sub.cycle && ` · ${sub.cycle}`}
                        {sub.account && ` · ${sub.account}`}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold">
                        {showConverted
                          ? convertAndFormat(
                              sub.price,
                              sub.currency,
                              primaryCurrency,
                              rates
                            )
                          : formatCurrencyAmount(sub.price, sub.currency)}
                      </div>
                      {showConverted && (
                        <div className="text-[10px] text-muted-foreground">
                          ({getSymbol(sub.currency)}{sub.price})
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

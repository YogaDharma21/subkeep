import React, { useState, useMemo } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { useRouter } from "expo-router"
import { ChevronLeft, ChevronRight } from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { convertAndFormat, formatCurrencyAmount, convertCurrency } from "@/lib/currency"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"

export type CalendarEventType = "start" | "renewal" | "trial_end" | "end"

export interface CalendarSubscriptionItem {
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
  subscription: CalendarSubscriptionItem
  eventType: CalendarEventType
}

interface CalendarGridProps {
  subscriptions: CalendarSubscriptionItem[]
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
  const { colors } = useThemeColor()
  const { primaryCurrency, rates } = usePrimaryCurrency()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

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

      // 1. Subscription Start Date
      if (subStart.getFullYear() === year && subStart.getMonth() === month) {
        addEvent(subStart.getDate(), {
          subscription: sub,
          eventType: "start",
        })
      }

      // 2. Trial End Date
      if (trialEnd && trialEnd.getFullYear() === year && trialEnd.getMonth() === month) {
        addEvent(trialEnd.getDate(), {
          subscription: sub,
          eventType: "trial_end",
        })
      }

      // 3. Subscription End Date
      if (subEnd && subEnd.getFullYear() === year && subEnd.getMonth() === month) {
        addEvent(subEnd.getDate(), {
          subscription: sub,
          eventType: "end",
        })
      }

      // 4. Recurring Billing / Renewal
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
        if (monthDiff > 0 && monthDiff % 12 === 0) {
          const originalDay = subStart.getDate()
          const targetDay = Math.min(originalDay, daysInMonth)
          const candDate = new Date(year, month, targetDay)
          if (!subEnd || candDate <= subEnd) {
            addEvent(targetDay, { subscription: sub, eventType: "renewal" })
          }
        }
      } else if (cycle === "weekly") {
        let cursor = new Date(subStart.getTime())
        while (cursor <= monthEnd) {
          if (cursor >= monthStart) {
            if (!subEnd || cursor <= subEnd) {
              addEvent(cursor.getDate(), { subscription: sub, eventType: "renewal" })
            }
          }
          cursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      } else if (cycle === "daily") {
        for (let d = 1; d <= daysInMonth; d++) {
          const candDate = new Date(year, month, d)
          if (candDate >= subStart && (!subEnd || candDate <= subEnd)) {
            addEvent(d, { subscription: sub, eventType: "renewal" })
          }
        }
      }
    })

    return map
  }, [subscriptions, year, month, daysInMonth])

  // Total Projected Spent in current viewed month
  const monthTotal = useMemo(() => {
    let sum = 0
    Object.values(billingDays).forEach((dayEvents) => {
      dayEvents.forEach((ev) => {
        if (ev.eventType === "renewal" || ev.eventType === "start") {
          sum += convertCurrency(
            ev.subscription.price,
            ev.subscription.currency,
            primaryCurrency,
            rates
          )
        }
      })
    })
    return sum
  }, [billingDays, primaryCurrency, rates])

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(1)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(1)
  }

  const isCurrentMonth =
    new Date().getFullYear() === year && new Date().getMonth() === month

  const selectedEvents = (selectedDay ? billingDays[selectedDay] : []) || []

  return (
    <View style={{ gap: 14 }}>
      {/* Calendar Header / Month Switcher */}
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          padding: 14,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
            {monthName}
          </Text>

          <View style={{ flexDirection: "row", gap: 6 }}>
            <TouchableOpacity
              onPress={prevMonth}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={16} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={nextMonth}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Days of Week Headers */}
        <View style={{ flexDirection: "row" }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.mutedText }}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid Cells */}
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {/* Empty cells before month starts */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <View key={`empty-${i}`} style={{ width: `${100 / 7}%`, height: 42 }} />
          ))}

          {/* Days 1..N */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1
            const events = billingDays[d] || []
            const isToday = isCurrentMonth && new Date().getDate() === d
            const isSelected = selectedDay === d

            return (
              <TouchableOpacity
                key={`day-${d}`}
                onPress={() => setSelectedDay(d)}
                style={{
                  width: `${100 / 7}%`,
                  height: 42,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  backgroundColor: isSelected
                    ? colors.primary
                    : isToday
                    ? colors.surface
                    : "transparent",
                  borderWidth: isToday && !isSelected ? 1 : 0,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected || isToday ? "700" : "500",
                    color: isSelected
                      ? colors.primaryForeground
                      : isToday
                      ? colors.text
                      : colors.text,
                  }}
                >
                  {d}
                </Text>

                {/* Event dots */}
                {events.length > 0 && (
                  <View style={{ flexDirection: "row", gap: 2, marginTop: 2 }}>
                    {events.slice(0, 3).map((ev, idx) => (
                      <View
                        key={idx}
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor:
                            isSelected
                              ? colors.primaryForeground
                              : ev.eventType === "trial_end"
                              ? colors.amber
                              : ev.eventType === "start"
                              ? colors.blue
                              : ev.subscription.color || colors.emerald,
                        }}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Month Summary Banner */}
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 14,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
          {formatCurrencyAmount(monthTotal, primaryCurrency)}
        </Text>
        <Text style={{ fontSize: 10, color: colors.mutedText, textTransform: "uppercase", marginTop: 2 }}>
          Total Projected Spend
        </Text>
      </View>

      {/* Selected Day Events List */}
      {selectedDay && (
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            padding: 14,
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
            Events on {currentDate.toLocaleDateString("en-US", { month: "short" })} {selectedDay}, {year}
          </Text>

          {selectedEvents.length === 0 ? (
            <Text style={{ fontSize: 12, color: colors.mutedText, paddingVertical: 8 }}>
              No subscription events on this day
            </Text>
          ) : (
            <View style={{ gap: 8 }}>
              {selectedEvents.map((ev, idx) => {
                const sub = ev.subscription
                const isTrialEnd = ev.eventType === "trial_end"
                const isStart = ev.eventType === "start"

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/subscriptions/${sub._id}` as never)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.surface,
                      borderRadius: 10,
                      padding: 10,
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        backgroundColor: sub.color || "#000000",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <DynamicIcon name={sub.icon} size={16} color="#ffffff" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                        {sub.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.mutedText }}>
                        {isTrialEnd ? (
                          <Text style={{ color: colors.amber, fontWeight: "600" }}>Trial Ending</Text>
                        ) : isStart ? (
                          <Text style={{ color: colors.blue, fontWeight: "600" }}>Start Date</Text>
                        ) : (
                          "Renewal Payment"
                        )}
                      </Text>
                    </View>

                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                      {convertAndFormat(sub.price, sub.currency, primaryCurrency, rates)}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

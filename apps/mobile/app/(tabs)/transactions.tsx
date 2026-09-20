import React, { useMemo, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Pencil,
  Trash2,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
} from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/components/custom-alert-provider"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import {
  TransactionType,
  financeCategoryMeta,
  financeCategories,
  currentMonthKey,
  monthLabel,
  shiftMonth,
} from "@/constants/finance"

type TxnDoc = {
  _id: string
  type: string
  amount: number
  currency: string
  category: string
  date: string
  note?: string
  accountId?: string
  toAccountId?: string
  icon?: string
  color?: string
}

export default function TransactionsScreen() {
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const { showAlert, showToast } = useAlert()
  const [month, setMonth] = useState(currentMonthKey())
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all")
  const [editing, setEditing] = useState<TxnDoc | null>(null)

  const transactions = useQuery(
    api.transactions.list,
    isSignedIn ? { month } : "skip"
  )
  const accounts = useQuery(api.accounts.list, isSignedIn ? {} : "skip")
  const updateMutation = useMutation(api.transactions.update)
  const removeMutation = useMutation(api.transactions.remove)

  const { primaryCurrency, rates } = usePrimaryCurrency()

  const [editAmount, setEditAmount] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editNote, setEditNote] = useState("")
  const [editCategory, setEditCategory] = useState("")

  const filtered = useMemo(() => {
    let list = [...(transactions || [])]
    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((t) => {
        const meta = financeCategoryMeta(t.category)
        return (
          (t.note || "").toLowerCase().includes(q) ||
          meta.label.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.date.includes(q)
        )
      })
    }
    return list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  }, [transactions, typeFilter, search])

  const totals = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of filtered) {
      const converted = convertCurrency(t.amount, t.currency, primaryCurrency, rates)
      if (t.type === "income") income += converted
      else if (t.type === "expense") expense += converted
    }
    return { income, expense, net: income - expense }
  }, [filtered, primaryCurrency, rates])

  const accountName = (id?: string) =>
    accounts?.find((a) => a._id === id)?.name

  const openEdit = (t: TxnDoc) => {
    setEditing(t)
    setEditAmount(String(t.amount))
    setEditDate(t.date)
    setEditNote(t.note || "")
    setEditCategory(t.category)
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    const parsed = parseFloat(editAmount)
    if (isNaN(parsed) || parsed <= 0) {
      showToast("Please enter a valid amount", "error")
      return
    }
    try {
      await updateMutation({
        id: editing._id as never,
        amount: parsed,
        date: editDate,
        note: editNote || undefined,
        category: editCategory || undefined,
      })
      showToast("Transaction updated", "success")
      setEditing(null)
    } catch {
      showToast("Failed to update transaction", "error")
    }
  }

  const handleDelete = (t: TxnDoc) => {
    const meta = financeCategoryMeta(t.category)
    showAlert({
      title: "Delete Transaction",
      message: `Remove ${t.note || meta.label} (${formatCurrencyAmount(convertCurrency(t.amount, t.currency, primaryCurrency, rates), primaryCurrency)})? This cannot be undone.`,
      icon: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMutation({ id: t._id as never })
              showToast("Transaction deleted", "success")
            } catch {
              showToast("Failed to delete transaction", "error")
            }
          },
        },
      ],
    })
  }

  const grouped = useMemo(() => {
    const map = new Map<string, TxnDoc[]>()
    for (const t of filtered) {
      const arr = map.get(t.date) || []
      arr.push(t)
      map.set(t.date, arr)
    }
    return [...map.entries()]
  }, [filtered])

  const filters: Array<{ value: "all" | TransactionType; label: string }> = [
    { value: "all", label: "All" },
    { value: "expense", label: "Expenses" },
    { value: "income", label: "Income" },
    { value: "transfer", label: "Transfers" },
  ]

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 14,
          paddingBottom: 110,
        }}
      >
        {/* Month + totals */}
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
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => setMonth(shiftMonth(month, -1))}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={16} color={colors.text} />
            </TouchableOpacity>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text }}>
                {monthLabel(month)}
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedText }}>
                Net {formatCurrencyAmount(totals.net, primaryCurrency)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setMonth(shiftMonth(month, 1))}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.emeraldBackground,
                borderRadius: 10,
                padding: 10,
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <ArrowDownRight size={14} color={colors.emerald} />
                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.emerald }}>
                  {formatCurrencyAmount(totals.income, primaryCurrency)}
                </Text>
              </View>
              <Text style={{ fontSize: 10, fontWeight: "600", color: colors.mutedText, textTransform: "uppercase" }}>
                Income
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.destructiveBackground,
                borderRadius: 10,
                padding: 10,
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <ArrowUpRight size={14} color={colors.destructive} />
                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.destructive }}>
                  {formatCurrencyAmount(totals.expense, primaryCurrency)}
                </Text>
              </View>
              <Text style={{ fontSize: 10, fontWeight: "600", color: colors.mutedText, textTransform: "uppercase" }}>
                Expenses
              </Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            gap: 8,
          }}
        >
          <Search size={16} color={colors.mutedText} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search notes, categories, dates..."
            placeholderTextColor={colors.mutedText}
            style={{ flex: 1, fontSize: 14, color: colors.text, paddingVertical: 10 }}
            autoCapitalize="none"
          />
        </View>

        {/* Type filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setTypeFilter(f.value)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: typeFilter === f.value ? colors.primary : colors.surface,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: typeFilter === f.value ? colors.primaryForeground : colors.mutedText,
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        {transactions === undefined ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : filtered.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: "dashed",
              borderRadius: 14,
              padding: 24,
              alignItems: "center",
              gap: 6,
            }}
          >
            <ArrowLeftRight size={22} color={colors.subtleText} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
              No transactions found
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedText, textAlign: "center" }}>
              {search ? "Try a different search" : "Use the + tab to log your first transaction"}
            </Text>
          </View>
        ) : (
          grouped.map(([date, items]) => (
            <View
              key={date}
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  backgroundColor: colors.surface,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>
                  {new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
              {items.map((t, i) => {
                const meta = financeCategoryMeta(t.category)
                return (
                  <View
                    key={t._id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 12,
                      gap: 10,
                      borderTopWidth: i > 0 ? 1 : 0,
                      borderTopColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: t.color || meta.color,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <DynamicIcon name={t.icon || meta.icon} size={16} color="#ffffff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                        {t.type === "transfer"
                          ? `Transfer${accountName(t.accountId) ? ` · ${accountName(t.accountId)}` : ""}${accountName(t.toAccountId) ? ` → ${accountName(t.toAccountId)}` : ""}`
                          : t.note || meta.label}
                      </Text>
                      <Text numberOfLines={1} style={{ fontSize: 11, color: colors.mutedText }}>
                        {meta.label}
                        {t.type !== "transfer" && accountName(t.accountId) ? ` · ${accountName(t.accountId)}` : ""}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "800",
                          color: t.type === "income" ? colors.emerald : t.type === "transfer" ? colors.blue : colors.destructive,
                        }}
                      >
                        {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}
                        {formatCurrencyAmount(
                          convertCurrency(t.amount, t.currency, primaryCurrency, rates),
                          primaryCurrency
                        )}
                      </Text>
                      {t.currency !== primaryCurrency ? (
                        <Text style={{ fontSize: 10, color: colors.mutedText }}>
                          {t.amount} {t.currency}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity onPress={() => openEdit(t)} style={{ padding: 4 }}>
                      <Pencil size={14} color={colors.mutedText} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(t)} style={{ padding: 4 }}>
                      <Trash2 size={14} color={colors.mutedText} />
                    </TouchableOpacity>
                  </View>
                )
              })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit sheet */}
      {editing ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setEditing(null)}
            style={{ flex: 1 }}
          />
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 16,
              gap: 12,
              paddingBottom: 32,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
              Edit Transaction
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>AMOUNT</Text>
                <TextInput
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="numeric"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    fontSize: 14,
                    color: colors.text,
                    backgroundColor: colors.surface,
                  }}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>DATE</Text>
                <TextInput
                  value={editDate}
                  onChangeText={setEditDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.mutedText}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    fontSize: 14,
                    color: colors.text,
                    backgroundColor: colors.surface,
                  }}
                />
              </View>
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {financeCategories.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    onPress={() => setEditCategory(c.value)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: editCategory === c.value ? colors.primary : colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: editCategory === c.value ? colors.primaryForeground : colors.mutedText,
                      }}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>NOTE</Text>
              <TextInput
                value={editNote}
                onChangeText={setEditNote}
                placeholder="Optional note"
                placeholderTextColor={colors.mutedText}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  fontSize: 14,
                  color: colors.text,
                  backgroundColor: colors.surface,
                }}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setEditing(null)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primaryForeground }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  )
}

import React, { useMemo, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/expo"
import { api } from "@/convex/_generated/api"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Pencil,
  Trash2,
  ArrowLeftRight,
} from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { Label, Numeral, Surface } from "@/components/ui/surface"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/hooks/use-alert"
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
  subscriptionId?: string
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
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
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

  const filters: { value: "all" | TransactionType; label: string }[] = [
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
        <Surface style={{ padding: 18, gap: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <View style={{ gap: 3 }}>
              <Label>Transactions</Label>
              <Text style={{ fontSize: 15, fontWeight: "500", letterSpacing: -0.2, color: colors.text }}>
                {monthLabel(month)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <TouchableOpacity
                onPress={() => setMonth(shiftMonth(month, -1))}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  backgroundColor: colors.surfaceInset,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronLeft size={15} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMonth(shiftMonth(month, 1))}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  backgroundColor: colors.surfaceInset,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronRight size={15} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <Label>Net</Label>
            <Numeral style={{ fontSize: 28 }}>
              {formatCurrencyAmount(totals.net, primaryCurrency)}
            </Numeral>
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 12,
            }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Label>Income</Label>
              <Numeral style={{ fontSize: 14, color: colors.positive }}>
                +{formatCurrencyAmount(totals.income, primaryCurrency)}
              </Numeral>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Label>Expenses</Label>
              <Numeral style={{ fontSize: 14, color: colors.negative }}>
                -{formatCurrencyAmount(totals.expense, primaryCurrency)}
              </Numeral>
            </View>
          </View>
        </Surface>

        {/* Search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surfaceInset,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 999,
            paddingHorizontal: 14,
            gap: 8,
            height: 40,
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
                borderRadius: 999,
                backgroundColor: typeFilter === f.value ? colors.primary : colors.surfaceInset,
                borderWidth: 1,
                borderColor: typeFilter === f.value ? colors.primary : colors.border,
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
              borderRadius: 24,
              padding: 24,
              alignItems: "center",
              gap: 6,
            }}
          >
            <ArrowLeftRight size={22} color={colors.subtleText} />
            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.text }}>
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
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  backgroundColor: colors.surfaceInset,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "500", letterSpacing: 1, textTransform: "uppercase", color: colors.mutedText }}>
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
                      borderTopColor: colors.borderLight,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        backgroundColor: colors.surfaceInset,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <DynamicIcon name={t.icon || meta.icon} size={15} color={colors.mutedText} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "500", color: colors.text, flexShrink: 1 }}>
                          {t.type === "transfer"
                            ? `Transfer${accountName(t.accountId) ? ` · ${accountName(t.accountId)}` : ""}${accountName(t.toAccountId) ? ` → ${accountName(t.toAccountId)}` : ""}`
                            : t.note || meta.label}
                        </Text>
                        {t.subscriptionId && subscriptions ? (() => {
                          const sub = subscriptions.find((s) => s._id === t.subscriptionId)
                          return sub ? (
                            <View
                              style={{
                                backgroundColor: colors.surfaceInset,
                                borderWidth: 1,
                                borderColor: colors.border,
                                paddingHorizontal: 6,
                                paddingVertical: 1,
                                borderRadius: 999,
                              }}
                            >
                              <Text style={{ fontSize: 8, fontWeight: "500", letterSpacing: 0.6, color: colors.mutedText }}>
                                {sub.name}
                              </Text>
                            </View>
                          ) : null
                        })() : null}
                      </View>
                      <Text numberOfLines={1} style={{ fontSize: 11, color: colors.mutedText }}>
                        {meta.label}
                        {t.type !== "transfer" && accountName(t.accountId) ? ` · ${accountName(t.accountId)}` : ""}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Numeral
                        style={{
                          fontSize: 13,
                          color: t.type === "income" ? colors.positive : t.type === "transfer" ? colors.mutedText : colors.text,
                        }}
                      >
                        {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}
                        {formatCurrencyAmount(
                          convertCurrency(t.amount, t.currency, primaryCurrency, rates),
                          primaryCurrency
                        )}
                      </Numeral>
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
      <Modal
        visible={!!editing}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <View
          style={{
            flex: 1,
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
              backgroundColor: colors.card,
              borderTopWidth: 1,
              borderColor: colors.border,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 20,
              gap: 14,
              paddingBottom: 32,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", letterSpacing: -0.4, color: colors.text }}>
              Edit transaction
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: "500", letterSpacing: 1.4, textTransform: "uppercase", color: colors.mutedText }}>AMOUNT</Text>
                <TextInput
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="numeric"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: colors.text,
                    backgroundColor: colors.surfaceInset,
                  }}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: "500", letterSpacing: 1.4, textTransform: "uppercase", color: colors.mutedText }}>DATE</Text>
                <TextInput
                  value={editDate}
                  onChangeText={setEditDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.mutedText}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: colors.text,
                    backgroundColor: colors.surfaceInset,
                  }}
                />
              </View>
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: "500", letterSpacing: 1.4, textTransform: "uppercase", color: colors.mutedText }}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {financeCategories.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    onPress={() => setEditCategory(c.value)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: editCategory === c.value ? colors.primary : colors.surfaceInset,
                      borderWidth: 1,
                      borderColor: editCategory === c.value ? colors.primary : colors.border,
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
              <Text style={{ fontSize: 10, fontWeight: "500", letterSpacing: 1.4, textTransform: "uppercase", color: colors.mutedText }}>NOTE</Text>
              <TextInput
                value={editNote}
                onChangeText={setEditNote}
                placeholder="Optional note"
                placeholderTextColor={colors.mutedText}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: colors.text,
                  backgroundColor: colors.surfaceInset,
                }}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setEditing(null)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 999,
                  backgroundColor: colors.surfaceInset,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "500", color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 999,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "500", color: colors.primaryForeground }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

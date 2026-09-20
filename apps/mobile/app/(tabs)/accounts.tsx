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
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Archive,
} from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/components/custom-alert-provider"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import {
  accountTypeMeta,
  accountTypes,
  currentMonthKey,
} from "@/constants/finance"
import { colorPresets, getContrastTextColor } from "@/constants/categories"
import { currencies } from "@/constants/currencies"

type AccountDoc = {
  _id: string
  name: string
  type: string
  balance: number
  currency: string
  icon: string
  color: string
  last4?: string
  isArchived?: boolean
}

export default function AccountsScreen() {
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const { showAlert, showToast } = useAlert()

  const accounts = useQuery(
    api.accounts.list,
    isSignedIn ? { includeArchived: true } : "skip"
  )
  const monthTxns = useQuery(
    api.transactions.list,
    isSignedIn ? { month: currentMonthKey() } : "skip"
  )
  const createMutation = useMutation(api.accounts.create)
  const updateMutation = useMutation(api.accounts.update)
  const archiveMutation = useMutation(api.accounts.archive)
  const removeMutation = useMutation(api.accounts.remove)

  const { primaryCurrency, rates } = usePrimaryCurrency()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<AccountDoc | null>(null)
  const [name, setName] = useState("")
  const [type, setType] = useState("checking")
  const [balance, setBalance] = useState("")
  const [currency, setCurrency] = useState("IDR")
  const [last4, setLast4] = useState("")
  const [selectedColor, setSelectedColor] = useState("#6366F1")

  const { active, archived, totalNetWorth } = useMemo(() => {
    const all = accounts || []
    const active = all.filter((a) => !a.isArchived)
    const archived = all.filter((a) => a.isArchived)
    const totalNetWorth = active.reduce(
      (s, a) => s + convertCurrency(a.balance, a.currency, primaryCurrency, rates),
      0
    )
    return { active, archived, totalNetWorth }
  }, [accounts, primaryCurrency, rates])

  const monthFlowByAccount = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>()
    for (const t of monthTxns || []) {
      if (!t.accountId) continue
      const entry = map.get(t.accountId) || { income: 0, expense: 0 }
      const converted = convertCurrency(t.amount, t.currency, primaryCurrency, rates)
      if (t.type === "income") entry.income += converted
      else if (t.type === "expense") entry.expense += converted
      map.set(t.accountId, entry)
    }
    return map
  }, [monthTxns, primaryCurrency, rates])

  const openAdd = () => {
    setEditing(null)
    setName("")
    setType("checking")
    setBalance("")
    setCurrency(primaryCurrency)
    setLast4("")
    setSelectedColor("#6366F1")
    setSheetOpen(true)
  }

  const openEdit = (a: AccountDoc) => {
    setEditing(a)
    setName(a.name)
    setType(a.type)
    setBalance(String(a.balance))
    setCurrency(a.currency)
    setLast4(a.last4 || "")
    setSelectedColor(a.color)
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      showToast("Please enter an account name", "error")
      return
    }
    const parsed = parseFloat(balance || "0")
    if (isNaN(parsed)) {
      showToast("Please enter a valid balance", "error")
      return
    }
    try {
      const meta = accountTypeMeta(type)
      if (editing) {
        await updateMutation({
          id: editing._id as never,
          name: name.trim(),
          type,
          balance: parsed,
          currency,
          icon: meta.icon,
          color: selectedColor,
          last4: last4 || undefined,
        })
        showToast("Account updated", "success")
      } else {
        await createMutation({
          name: name.trim(),
          type,
          balance: parsed,
          currency,
          icon: meta.icon,
          color: selectedColor,
          last4: last4 || undefined,
        })
        showToast("Account added", "success")
      }
      setSheetOpen(false)
    } catch {
      showToast("Failed to save account", "error")
    }
  }

  const handleArchive = async (a: AccountDoc) => {
    try {
      await archiveMutation({ id: a._id as never })
      showToast(a.isArchived ? "Account restored" : "Account archived", "success")
    } catch {
      showToast("Failed to update account", "error")
    }
  }

  const handleDelete = (a: AccountDoc) => {
    showAlert({
      title: "Delete Account?",
      message: `${a.name} will be removed. Linked transactions are kept but detached.`,
      icon: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMutation({ id: a._id as never })
              showToast("Account deleted", "success")
            } catch {
              showToast("Failed to delete account", "error")
            }
          },
        },
      ],
    })
  }

  const renderCard = (a: AccountDoc) => {
    const meta = accountTypeMeta(a.type)
    const flow = monthFlowByAccount.get(a._id)
    return (
      <View
        key={a._id}
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          padding: 14,
          gap: 10,
          opacity: a.isArchived ? 0.6 : 1,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              backgroundColor: a.color,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DynamicIcon name={a.icon || meta.icon} size={20} color={getContrastTextColor(a.color)} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "800", color: colors.text, flexShrink: 1 }}>
                {a.name}
              </Text>
              {a.last4 ? (
                <Text style={{ fontSize: 11, color: colors.mutedText }}>···· {a.last4}</Text>
              ) : null}
              {a.isArchived ? (
                <View style={{ backgroundColor: colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: "800", color: colors.mutedText }}>ARCHIVED</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ fontSize: 11, color: colors.mutedText, textTransform: "capitalize" }}>
              {meta.label}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text }}>
              {formatCurrencyAmount(
                convertCurrency(a.balance, a.currency, primaryCurrency, rates),
                primaryCurrency
              )}
            </Text>
            {a.currency !== primaryCurrency ? (
              <Text style={{ fontSize: 10, color: colors.mutedText }}>
                {a.balance.toLocaleString()} {a.currency}
              </Text>
            ) : null}
          </View>
        </View>

        {flow && (flow.income > 0 || flow.expense > 0) ? (
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 8,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.emerald }}>
              +{formatCurrencyAmount(flow.income, primaryCurrency)}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.destructive }}>
              -{formatCurrencyAmount(flow.expense, primaryCurrency)}
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedText }}>this month</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", gap: 6 }}>
          <TouchableOpacity onPress={() => openEdit(a)} style={{ padding: 6 }}>
            <Pencil size={15} color={colors.mutedText} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleArchive(a)} style={{ padding: 6 }}>
            <Archive size={15} color={colors.mutedText} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(a)} style={{ padding: 6 }}>
            <Trash2 size={15} color={colors.mutedText} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

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
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            padding: 14,
            gap: 6,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Wallet size={14} color={colors.primary} />
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.mutedText, textTransform: "uppercase" }}>
                Total Net Worth ({primaryCurrency})
              </Text>
            </View>
            <TouchableOpacity
              onPress={openAdd}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: colors.primary,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Plus size={14} color={colors.primaryForeground} />
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primaryForeground }}>
                Add
              </Text>
            </TouchableOpacity>
          </View>
          {accounts === undefined ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={{ fontSize: 24, fontWeight: "900", color: colors.text }}>
              {formatCurrencyAmount(totalNetWorth, primaryCurrency)}
            </Text>
          )}
          <Text style={{ fontSize: 11, color: colors.mutedText }}>
            Sum of all active account balances. Archived accounts are excluded.
          </Text>
        </View>

        {accounts === undefined ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : active.length === 0 && archived.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: "dashed",
              borderRadius: 14,
              padding: 28,
              alignItems: "center",
              gap: 6,
            }}
          >
            <Wallet size={24} color={colors.subtleText} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
              No accounts yet
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedText, textAlign: "center" }}>
              Add checking, savings, cash, or e-wallets to track balances
            </Text>
            <TouchableOpacity
              onPress={openAdd}
              style={{
                marginTop: 8,
                backgroundColor: colors.primary,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primaryForeground }}>
                Add your first account
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={{ gap: 10 }}>{active.map(renderCard)}</View>
            {archived.length > 0 ? (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, textTransform: "uppercase", paddingHorizontal: 4 }}>
                  Archived ({archived.length})
                </Text>
                <View style={{ gap: 10 }}>{archived.map(renderCard)}</View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Add/Edit sheet */}
      {sheetOpen ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "flex-end",
            zIndex: 50,
            elevation: 50,
          }}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => setSheetOpen(false)} style={{ flex: 1 }} />
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 16,
              gap: 12,
              paddingBottom: 32,
              maxHeight: "85%",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
              {editing ? "Edit Account" : "Add Account"}
            </Text>
            <ScrollView contentContainerStyle={{ gap: 12 }}>
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>TYPE</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {accountTypes.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      onPress={() => setType(t.value)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 10,
                        paddingVertical: 7,
                        borderRadius: 8,
                        backgroundColor: type === t.value ? colors.primary : colors.surface,
                      }}
                    >
                      <DynamicIcon
                        name={t.icon}
                        size={13}
                        color={type === t.value ? colors.primaryForeground : colors.mutedText}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "600",
                          color: type === t.value ? colors.primaryForeground : colors.mutedText,
                        }}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>NAME</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. BCA Checking, Cash Wallet"
                  placeholderTextColor={colors.mutedText}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 9,
                    fontSize: 14,
                    color: colors.text,
                    backgroundColor: colors.surface,
                  }}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>BALANCE</Text>
                  <TextInput
                    value={balance}
                    onChangeText={setBalance}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={colors.mutedText}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 9,
                      fontSize: 14,
                      color: colors.text,
                      backgroundColor: colors.surface,
                    }}
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>CURRENCY</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                    {currencies.map((c) => (
                      <TouchableOpacity
                        key={c.value}
                        onPress={() => setCurrency(c.value)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 9,
                          borderRadius: 8,
                          backgroundColor: currency === c.value ? colors.primary : colors.surface,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: currency === c.value ? colors.primaryForeground : colors.mutedText,
                          }}
                        >
                          {c.value}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>COLOR</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {colorPresets.slice(0, 8).map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setSelectedColor(c)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: c,
                        borderWidth: selectedColor.toLowerCase() === c.toLowerCase() ? 2.5 : 0,
                        borderColor: colors.primary,
                      }}
                    />
                  ))}
                </View>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>LAST 4 (OPTIONAL)</Text>
                <TextInput
                  value={last4}
                  onChangeText={(v) => setLast4(v.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 4242"
                  placeholderTextColor={colors.mutedText}
                  maxLength={4}
                  keyboardType="number-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 9,
                    fontSize: 14,
                    color: colors.text,
                    backgroundColor: colors.surface,
                  }}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setSheetOpen(false)}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.surface, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primaryForeground }}>
                    {editing ? "Save" : "Add"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  )
}

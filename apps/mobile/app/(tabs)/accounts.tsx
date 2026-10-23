import React, { useMemo } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/expo"
import { api } from "@/convex/_generated/api"
import {
  Wallet,
  Pencil,
  Trash2,
  Archive,
} from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { Label, Numeral, Surface } from "@/components/ui/surface"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/hooks/use-alert"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import {
  accountTypeMeta,
  currentMonthKey,
} from "@/constants/finance"

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
  const { showAlert, showToast, showAddAccount } = useAlert()

  const accounts = useQuery(
    api.accounts.list,
    isSignedIn ? { includeArchived: true } : "skip"
  )
  const monthTxns = useQuery(
    api.transactions.list,
    isSignedIn ? { month: currentMonthKey() } : "skip"
  )
  const subscriptions = useQuery(
    api.subscriptions.list,
    isSignedIn ? {} : "skip"
  )
  const archiveMutation = useMutation(api.accounts.archive)
  const removeMutation = useMutation(api.accounts.remove)

  const { primaryCurrency, rates } = usePrimaryCurrency()

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

  const subscriptionsByAccount = useMemo(() => {
    const map = new Map<string, { count: number; monthlyCommitment: number }>()
    for (const sub of subscriptions || []) {
      if (!sub.accountId || !sub.isActive) continue
      const entry = map.get(sub.accountId) || { count: 0, monthlyCommitment: 0 }
      entry.count += 1
      let monthly = sub.price
      if (sub.cycle === "yearly") monthly = sub.price / 12
      else if (sub.cycle === "quarterly") monthly = sub.price / 3
      else if (sub.cycle === "weekly") monthly = sub.price * 4.33
      entry.monthlyCommitment += convertCurrency(monthly, sub.currency, primaryCurrency, rates)
      map.set(sub.accountId, entry)
    }
    return map
  }, [subscriptions, primaryCurrency, rates])

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
    const subInfo = subscriptionsByAccount.get(a._id)
    return (
      <View
        key={a._id}
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 20,
          padding: 16,
          gap: 12,
          opacity: a.isArchived ? 0.6 : 1,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              backgroundColor: colors.surfaceInset,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DynamicIcon name={a.icon || meta.icon} size={18} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "500", color: colors.text, flexShrink: 1 }}>
                {a.name}
              </Text>
              {a.last4 ? (
                <Text style={{ fontSize: 11, color: colors.mutedText }}>···· {a.last4}</Text>
              ) : null}
              {a.isArchived ? (
                <View style={{ backgroundColor: colors.surfaceInset, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 }}>
                  <Text style={{ fontSize: 8, fontWeight: "500", letterSpacing: 0.8, color: colors.mutedText }}>ARCHIVED</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ fontSize: 11, color: colors.mutedText, textTransform: "capitalize" }}>
              {meta.label}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Numeral style={{ fontSize: 14 }}>
              {formatCurrencyAmount(
                convertCurrency(a.balance, a.currency, primaryCurrency, rates),
                primaryCurrency
              )}
            </Numeral>
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
              borderTopColor: colors.borderLight,
              paddingTop: 8,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "500", color: colors.positive }}>
              +{formatCurrencyAmount(flow.income, primaryCurrency)}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: "500", color: colors.negative }}>
              -{formatCurrencyAmount(flow.expense, primaryCurrency)}
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedText }}>this month</Text>
          </View>
        ) : null}

        {subInfo && subInfo.count > 0 ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: colors.surfaceInset,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.mutedText }}>
              {subInfo.count} active subscription{subInfo.count > 1 ? "s" : ""}
            </Text>
            <Numeral style={{ fontSize: 11 }}>
              ~{formatCurrencyAmount(subInfo.monthlyCommitment, primaryCurrency)}/mo
            </Numeral>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", gap: 4 }}>
          <TouchableOpacity onPress={() => showAddAccount(a)} style={{ padding: 6 }}>
            <Pencil size={14} color={colors.mutedText} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleArchive(a)} style={{ padding: 6 }}>
            <Archive size={14} color={colors.mutedText} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(a)} style={{ padding: 6 }}>
            <Trash2 size={14} color={colors.mutedText} />
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
        <Surface style={{ padding: 18, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Label>Net worth · {primaryCurrency}</Label>
          </View>
          {accounts === undefined ? (
            <ActivityIndicator size="small" color={colors.mutedText} style={{ alignSelf: "flex-start" }} />
          ) : (
            <Numeral style={{ fontSize: 30 }}>
              {formatCurrencyAmount(totalNetWorth, primaryCurrency)}
            </Numeral>
          )}
          <Text style={{ fontSize: 11, color: colors.mutedText }}>
            Active account balances. Archived accounts are excluded.
          </Text>
        </Surface>

        {accounts === undefined ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : active.length === 0 && archived.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: "dashed",
              borderRadius: 24,
              padding: 28,
              alignItems: "center",
              gap: 6,
            }}
          >
            <Wallet size={24} color={colors.subtleText} />
            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.text }}>
              No accounts yet
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedText, textAlign: "center" }}>
              Add checking, savings, cash, or e-wallets to track balances
            </Text>
          </View>
        ) : (
          <>
            <View style={{ gap: 10 }}>{active.map(renderCard)}</View>
            {archived.length > 0 ? (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: "500", letterSpacing: 1.2, color: colors.mutedText, textTransform: "uppercase", paddingHorizontal: 4 }}>
                  Archived ({archived.length})
                </Text>
                <View style={{ gap: 10 }}>{archived.map(renderCard)}</View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

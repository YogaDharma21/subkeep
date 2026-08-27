import { useState, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/clerk-react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  ArrowLeft,
  Pencil,
  Pause,
  Play,
  Copy,
  Trash2,
  DollarSign,
  ExternalLink,
  Sparkles,
  Link2,
  CreditCard,
  Users,
  Check,
  TrendingUp,
  FileText,
  Upload,
  MessageSquare,
  Paperclip,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { IconPicker } from "@/components/icon-picker"
import { DynamicIcon } from "@/components/dynamic-icon"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  categories,
  currencies,
  billingCycles,
  getSymbol,
  categoryColors,
} from "@/lib/constants"
import { format, differenceInDays } from "date-fns"
import { convertAndFormat } from "@/lib/currency"
import { CancellationGuideModal } from "@/components/cancellation-guide-modal"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { SubscriptionDetailSkeleton } from "@/components/subscription-detail-skeleton"

interface SubscriptionDetailViewProps {
  subscriptionId: string
  onBack: () => void
  onSelectSubscription?: (id: string) => void
}

export function SubscriptionDetailView({
  subscriptionId,
  onBack,
  onSelectSubscription,
}: SubscriptionDetailViewProps) {
  const { isSignedIn } = useAuth()
  const [editing, setEditing] = useState(false)
  const [iconOpen, setIconOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const receiptInputRef = useRef<HTMLInputElement>(null)

  const sub = useQuery(
    api.subscriptions.get,
    subscriptionId ? { id: subscriptionId as Id<"subscriptions"> } : "skip"
  )
  const subPayments = useQuery(
    api.payments.listBySubscription,
    subscriptionId && isSignedIn ? { subscriptionId: subscriptionId as Id<"subscriptions"> } : "skip"
  )
  const paymentMethods = useQuery(
    api.paymentMethods.list,
    isSignedIn ? {} : "skip"
  ) as Array<{ _id: string; name: string; type: string; last4?: string }> | undefined

  const updateMutation = useMutation(api.subscriptions.update)
  const suspendMutation = useMutation(api.subscriptions.suspend)
  const cloneMutation = useMutation(api.subscriptions.clone)
  const removeMutation = useMutation(api.subscriptions.remove)
  const recordPaymentMutation = useMutation(api.payments.create)
  const updatePaymentMutation = useMutation(api.payments.update)
  const removePaymentMutation = useMutation(api.payments.remove)
  const generateUploadUrl = useMutation(api.subscriptions.generateUploadUrl)

  const { primaryCurrency, rates } = usePrimaryCurrency()

  const [editName, setEditName] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [editCurrency, setEditCurrency] = useState("USD")
  const [editCycle, setEditCycle] = useState("monthly")
  const [editCategory, setEditCategory] = useState("entertainment")
  const [editIcon, setEditIcon] = useState<string | null>(null)
  const [editColor, setEditColor] = useState("#000000")
  const [editEndDate, setEditEndDate] = useState("")
  const [editAccount, setEditAccount] = useState("")
  const [editWebsite, setEditWebsite] = useState("")
  const [editIsTrial, setEditIsTrial] = useState(false)
  const [editTrialEndDate, setEditTrialEndDate] = useState("")
  const [editCancelUrl, setEditCancelUrl] = useState("")
  const [editIsShared, setEditIsShared] = useState(false)
  const [editTotalPlanPrice, setEditTotalPlanPrice] = useState("")
  const [editTotalMembers, setEditTotalMembers] = useState("4")
  const [editPaymentMethodId, setEditPaymentMethodId] = useState("")
  const [editSplitMembers, setEditSplitMembers] = useState<
    Array<{ name: string; shareAmount: number; isPaid?: boolean }>
  >([])
  const [cancelUrlModalOpen, setCancelUrlModalOpen] = useState(false)
  const [tempCancelUrl, setTempCancelUrl] = useState("")
  const [savingCancelUrl, setSavingCancelUrl] = useState(false)

  // Payment History Edit/Delete State
  const [editingPayment, setEditingPayment] = useState<{
    _id: string
    name: string
    amount: number
    currency: string
    date: string
  } | null>(null)
  const [editPaymentAmount, setEditPaymentAmount] = useState("")
  const [editPaymentCurrency, setEditPaymentCurrency] = useState("USD")
  const [editPaymentDate, setEditPaymentDate] = useState("")
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)

  const [deletingPayment, setDeletingPayment] = useState<{
    _id: string
    name: string
    amount: number
    currency: string
    date: string
  } | null>(null)
  const [isDeletingPayment, setIsDeletingPayment] = useState(false)

  const handleOpenEditPayment = (p: {
    _id: string
    name: string
    amount: number
    currency: string
    date: string
  }) => {
    setEditingPayment(p)
    setEditPaymentAmount(p.amount.toString())
    setEditPaymentCurrency(p.currency)
    setEditPaymentDate(p.date)
  }

  const handleSaveEditPayment = async () => {
    if (!editingPayment) return
    const parsedAmount = parseFloat(editPaymentAmount)
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      toast.error("Please enter a valid amount")
      return
    }
    if (!editPaymentDate) {
      toast.error("Please select a date")
      return
    }
    setIsUpdatingPayment(true)
    try {
      await updatePaymentMutation({
        id: editingPayment._id as Id<"payments">,
        amount: parsedAmount,
        currency: editPaymentCurrency,
        date: editPaymentDate,
      })
      toast.success("Payment record updated")
      setEditingPayment(null)
    } catch {
      toast.error("Failed to update payment record")
    } finally {
      setIsUpdatingPayment(false)
    }
  }

  const handleConfirmDeletePayment = async () => {
    if (!deletingPayment) return
    setIsDeletingPayment(true)
    try {
      await removePaymentMutation({
        id: deletingPayment._id as Id<"payments">,
      })
      toast.success("Payment record deleted")
      setDeletingPayment(null)
    } catch {
      toast.error("Failed to delete payment record")
    } finally {
      setIsDeletingPayment(false)
    }
  }

  const colorOptions = [
    "#000000", "#555555", "#E50914", "#1DB954", "#00A8E1",
    "#4285F4", "#0078D4", "#B535F6", "#F47D31", "#00C4CC",
    "#E60023", "#107C10", "#003087", "#58CC02", "#FF0000",
  ]

  const startEditing = () => {
    if (!sub) return
    setEditName(sub.name)
    setEditPrice(sub.price.toString())
    setEditCurrency(sub.currency)
    setEditCycle(sub.cycle)
    setEditCategory(sub.category)
    setEditIcon(sub.icon)
    setEditColor(sub.color)
    setEditEndDate(sub.endDate || "")
    setEditAccount(sub.account || "")
    setEditWebsite(sub.website || "")
    setEditIsTrial(!!sub.isTrial)
    setEditTrialEndDate(sub.trialEndDate || "")
    setEditCancelUrl(sub.cancelUrl || "")
    setEditIsShared(!!sub.isShared)
    setEditTotalPlanPrice(sub.totalPlanPrice?.toString() || "")
    setEditTotalMembers(sub.totalMembers?.toString() || "4")
    setEditPaymentMethodId(sub.paymentMethodId || "")
    setEditSplitMembers(sub.splitMembers ? [...sub.splitMembers] : [])
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!sub || !subscriptionId) return
    try {
      await updateMutation({
        id: subscriptionId as Id<"subscriptions">,
        name: editName,
        price: parseFloat(editPrice || "0"),
        currency: editCurrency,
        cycle: editCycle,
        category: editCategory,
        icon: editIcon || sub.icon,
        color: editColor,
        endDate: editEndDate,
        account: editAccount,
        website: editWebsite,
        isTrial: editIsTrial,
        trialEndDate: editTrialEndDate,
        cancelUrl: editCancelUrl,
        isShared: editIsShared,
        totalPlanPrice: editTotalPlanPrice ? parseFloat(editTotalPlanPrice) : undefined,
        totalMembers: editTotalMembers ? parseInt(editTotalMembers) : undefined,
        paymentMethodId: editPaymentMethodId || undefined,
        splitMembers: editIsShared && editSplitMembers.length > 0 ? editSplitMembers : undefined,
      })
      toast.success("Subscription updated successfully")
      setEditing(false)
    } catch {
      toast.error("Failed to update subscription")
    }
  }

  const handleSuspend = async () => {
    if (!subscriptionId || !sub) return
    try {
      await suspendMutation({ id: subscriptionId as Id<"subscriptions"> })
      toast.success(sub.isActive ? "Subscription paused" : "Subscription resumed")
    } catch {
      toast.error("Failed to change subscription state")
    }
  }

  const handleClone = async () => {
    if (!subscriptionId) return
    try {
      const newId = await cloneMutation({ id: subscriptionId as Id<"subscriptions"> })
      toast.success("Subscription cloned!")
      onSelectSubscription?.(newId)
    } catch {
      toast.error("Failed to clone subscription")
    }
  }

  const handleDelete = async () => {
    if (!subscriptionId) return
    try {
      await removeMutation({ id: subscriptionId as Id<"subscriptions"> })
      toast.success("Subscription deleted")
      onBack()
    } catch {
      toast.error("Failed to delete subscription")
    }
  }

  const handleRecordPayment = async () => {
    if (!sub || !subscriptionId) return
    try {
      await recordPaymentMutation({
        subscriptionId: subscriptionId as Id<"subscriptions">,
        name: sub.name,
        icon: sub.icon,
        color: sub.color,
        amount: sub.price,
        currency: sub.currency,
        category: sub.category,
        date: new Date().toISOString().split("T")[0],
      })
      toast.success(`Recorded payment of ${convertAndFormat(sub.price, sub.currency, primaryCurrency, rates)}`)
    } catch {
      toast.error("Failed to record payment")
    }
  }

  const handleToggleMemberPaid = async (idx: number) => {
    if (!sub || !sub.splitMembers || !subscriptionId) return
    const updated = [...sub.splitMembers]
    updated[idx] = {
      ...updated[idx],
      isPaid: !updated[idx].isPaid,
    }
    await updateMutation({
      id: subscriptionId as Id<"subscriptions">,
      splitMembers: updated,
    })
    toast.success(`Updated status for ${updated[idx].name}`)
  }

  const handleCopyPaymentReminder = (member: { name: string; shareAmount: number }) => {
    const formattedAmount = `${getSymbol(sub?.currency || "USD")}${member.shareAmount}`
    const text = `Hey ${member.name}, your share for ${sub?.name || "our subscription"} this month is ${formattedAmount}. Please transfer when convenient. Thank you!`
    navigator.clipboard.writeText(text)
    toast.success(`Copied reminder for ${member.name}!`)
  }

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !subscriptionId) return

    setUploadingReceipt(true)
    try {
      const postUrl = await generateUploadUrl()
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      const { storageId } = await result.json()

      await updateMutation({
        id: subscriptionId as Id<"subscriptions">,
        receiptStorageId: storageId,
        receiptFileName: file.name,
      })
      toast.success("Receipt invoice uploaded successfully")
    } catch {
      toast.error("Failed to upload invoice file")
    } finally {
      setUploadingReceipt(false)
      if (e.target) e.target.value = ""
    }
  }

  const handleRemoveReceipt = async () => {
    if (!subscriptionId) return
    try {
      await updateMutation({
        id: subscriptionId as Id<"subscriptions">,
        receiptStorageId: undefined,
        receiptFileName: "",
      })
      toast.success("Receipt invoice removed")
    } catch {
      toast.error("Failed to remove receipt")
    }
  }

  const handleUpdateCancelUrl = async (subId: string, url: string) => {
    try {
      await updateMutation({
        id: subId as Id<"subscriptions">,
        cancelUrl: url.trim() || undefined,
      })
      toast.success("Cancellation page URL updated")
    } catch {
      toast.error("Failed to update cancellation URL")
    }
  }

  const handleOpenCancelUrlModal = () => {
    setTempCancelUrl(sub?.cancelUrl || "")
    setCancelUrlModalOpen(true)
  }

  const handleSaveCancelUrlModal = async () => {
    if (!sub || !subscriptionId) return
    setSavingCancelUrl(true)
    try {
      await handleUpdateCancelUrl(subscriptionId, tempCancelUrl)
      setCancelUrlModalOpen(false)
    } finally {
      setSavingCancelUrl(false)
    }
  }

  const openUrl = (url: string) => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url)
    } else {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  if (sub === null) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Subscription not found.</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  if (!sub) {
    return <SubscriptionDetailSkeleton />
  }

  const currentIcon = editing ? editIcon || sub.icon : sub.icon
  const nativeYearlyCost =
    sub.cycle === "monthly"
      ? sub.price * 12
      : sub.cycle === "yearly"
      ? sub.price
      : sub.cycle === "weekly"
      ? sub.price * 52
      : sub.price * 365

  let trialDaysLeft: number | null = null
  if (sub.isTrial && sub.trialEndDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tEnd = new Date(sub.trialEndDate)
    tEnd.setHours(0, 0, 0, 0)
    trialDaysLeft = Math.max(0, differenceInDays(tEnd, today))
  }

  const linkedCard = paymentMethods?.find((pm) => pm._id === sub.paymentMethodId)

  const priceHistory = sub.priceHistory || []
  const originalPriceEntry = priceHistory[0]
  const hasPriceHike =
    originalPriceEntry &&
    priceHistory.length > 1 &&
    sub.price > originalPriceEntry.price
  const priceHikeDiff = hasPriceHike
    ? Math.round(((sub.price - originalPriceEntry.price) / originalPriceEntry.price) * 100)
    : 0

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      <input
        ref={receiptInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleReceiptUpload}
      />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          className="cursor-pointer"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="flex-1 text-lg font-bold">Subscription Details</h1>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={editing ? () => setEditing(false) : startEditing}
          className="cursor-pointer"
        >
          <Pencil className="size-4" />
        </Button>
      </div>

      {sub.isTrial && (
        <div className="flex items-center justify-between rounded-lg bg-muted/60 p-3.5 text-xs text-foreground border border-border">
          <div className="flex items-center gap-2.5">
            <Sparkles className="size-4 shrink-0 text-foreground" />
            <div>
              <p className="font-bold">Active Free Trial</p>
              <p className="text-[11px] text-muted-foreground">
                {sub.trialEndDate
                  ? `Expires on ${format(new Date(sub.trialEndDate), "MMM d, yyyy")} (${trialDaysLeft} days left)`
                  : "Trial subscription mode"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCancelModalOpen(true)}
            className="h-8 text-xs gap-1 cursor-pointer"
          >
            <ExternalLink className="size-3.5" />
            Cancel Guide
          </Button>
        </div>
      )}

      {/* Main Card Header */}
      <div className="rounded-lg border border-border bg-background p-5 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => editing && setIconOpen(true)}
            className={cn(
              "flex size-14 items-center justify-center rounded-lg shadow-xs transition-transform",
              editing && "cursor-pointer ring-2 ring-border ring-offset-2 hover:scale-105"
            )}
            style={{ backgroundColor: editing ? editColor : sub.color }}
            disabled={!editing}
          >
            <DynamicIcon name={currentIcon} className="size-7 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            {editing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mb-1 text-base font-bold"
              />
            ) : (
              <h2 className="text-lg font-bold truncate">{sub.name}</h2>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {editing ? (
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                >
                  {categories
                    .filter((c) => c.value !== "all")
                    .map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                </select>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-xs rounded-md"
                  style={{
                    backgroundColor: categoryColors[sub.category] + "20",
                    color: categoryColors[sub.category],
                  }}
                >
                  {sub.category}
                </Badge>
              )}

              {sub.isTrial && (
                <Badge variant="outline" className="bg-muted/60 text-foreground border-border text-xs font-semibold rounded-md">
                  FREE TRIAL
                </Badge>
              )}

              {sub.isShared && (
                <Badge variant="outline" className="bg-muted/60 text-foreground border-border text-xs font-semibold rounded-md">
                  SPLIT PLAN {sub.totalMembers ? `(1/${sub.totalMembers})` : ""}
                </Badge>
              )}

              {hasPriceHike && (
                <Badge variant="outline" className="bg-muted/60 text-foreground border-border text-xs font-semibold rounded-md">
                  +{priceHikeDiff}% PRICE HIKE
                </Badge>
              )}

              <Badge
                variant={sub.isActive ? "default" : "destructive"}
                className="text-xs rounded-md"
              >
                {sub.isActive ? "Active" : "Suspended"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-muted/50 border border-border/60 p-3 text-center">
          <div className="text-sm font-extrabold text-foreground truncate">
            {convertAndFormat(
              editing ? parseFloat(editPrice || "0") : sub.price,
              editing ? editCurrency : sub.currency,
              primaryCurrency,
              rates
            )}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mt-0.5">
            Price ({primaryCurrency})
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 border border-border/60 p-3 text-center">
          <div className="text-sm font-bold truncate">
            {editing
              ? editCycle.charAt(0).toUpperCase() + editCycle.slice(1)
              : sub.cycle.charAt(0).toUpperCase() + sub.cycle.slice(1)}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mt-0.5">
            Cycle
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 border border-border/60 p-3 text-center">
          <div className="text-sm font-extrabold text-foreground truncate">
            {convertAndFormat(
              nativeYearlyCost,
              sub.currency,
              primaryCurrency,
              rates
            )}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mt-0.5">
            Yearly Total
          </div>
        </div>
      </div>

      {/* Editing Form */}
      {editing ? (
        <div className="space-y-4 rounded-lg border border-border bg-background p-4 shadow-xs">
          <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/30">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Free Trial Subscription
            </span>
            <input
              type="checkbox"
              checked={editIsTrial}
              onChange={(e) => setEditIsTrial(e.target.checked)}
              className="size-4 rounded accent-emerald-500 cursor-pointer"
            />
          </div>

          {editIsTrial && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Trial End Date
              </label>
              <Input
                type="date"
                value={editTrialEndDate}
                onChange={(e) => setEditTrialEndDate(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Price</label>
              <Input
                type="number"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Currency</label>
              <select
                value={editCurrency}
                onChange={(e) => setEditCurrency(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-xs"
              >
                {currencies.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium flex items-center gap-1">
              <CreditCard className="size-3.5 text-primary" />
              Linked Payment Method
            </label>
            <select
              value={editPaymentMethodId}
              onChange={(e) => setEditPaymentMethodId(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-xs"
            >
              <option value="">No linked payment method</option>
              {paymentMethods?.map((pm) => (
                <option key={pm._id} value={pm._id}>
                  {pm.name} {pm.last4 ? `(•••• ${pm.last4})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Billing Cycle</label>
            <div className="grid grid-cols-3 gap-2">
              {billingCycles.map((bc) => (
                <button
                  key={bc.value}
                  type="button"
                  onClick={() => setEditCycle(bc.value)}
                  className={`flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                    editCycle === bc.value
                      ? "border-foreground bg-foreground text-background font-bold"
                      : "border-border bg-background text-foreground hover:border-foreground/50"
                  }`}
                >
                  {bc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium flex items-center gap-1">
              <Link2 className="size-3.5 text-primary" />
              Direct Cancellation Link
            </label>
            <Input
              placeholder="e.g. https://www.netflix.com/youraccount"
              value={editCancelUrl}
              onChange={(e) => setEditCancelUrl(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Account / Email</label>
              <Input
                placeholder="e.g. user@gmail.com"
                value={editAccount}
                onChange={(e) => setEditAccount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Provider Website</label>
              <Input
                placeholder="e.g. netflix.com"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">End Date (Optional)</label>
            <Input
              type="date"
              value={editEndDate}
              onChange={(e) => setEditEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Icon Color</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setEditColor(c)}
                  className={cn(
                    "size-7 rounded-lg border-2 transition-all cursor-pointer",
                    editColor === c
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <Button className="w-full cursor-pointer h-10 font-bold" onClick={saveEdit}>
            Save Changes
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Details Block */}
          <div className="rounded-lg border border-border bg-background p-4 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Subscription Information
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Cancellation Guide
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCancelModalOpen(true)}
                  className="h-7 text-xs gap-1 font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 cursor-pointer"
                >
                  <ExternalLink className="size-3" />
                  Direct Cancel Link & Checklist
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Original Price
                </span>
                <span className="text-xs font-bold">
                  {getSymbol(sub.currency)}{sub.price} ({sub.currency})
                </span>
              </div>

              <Separator />

              {/* Linked Card */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Payment Method
                </span>
                {linkedCard ? (
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <CreditCard className="size-3.5 text-primary" />
                    {linkedCard.name} {linkedCard.last4 ? `(•••• ${linkedCard.last4})` : ""}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    None linked
                  </span>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Next Billing
                </span>
                <span className="text-xs font-semibold">
                  {format(new Date(sub.nextBilling), "MMMM d, yyyy")}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Account / Email
                </span>
                <span className="text-xs font-semibold">
                  {sub.account || "Not specified"}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  Direct Cancel Page
                </span>
                <div className="flex items-center gap-2">
                  {sub.cancelUrl ? (
                    <button
                      onClick={() => openUrl(sub.cancelUrl!)}
                      className="text-foreground hover:underline flex items-center gap-1 cursor-pointer text-xs font-semibold truncate max-w-[180px]"
                    >
                      <ExternalLink className="size-3 shrink-0" />
                      <span className="truncate">Cancellation Page</span>
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">
                      Standard URL search
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleOpenCancelUrlModal}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Pencil className="size-3 mr-1" />
                    {sub.cancelUrl ? "Change" : "Set URL"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* SplitKeep Household Splitting Section */}
          {sub.isShared && sub.splitMembers && sub.splitMembers.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
                    SplitKeep: Household Split Tracker
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  Total: {getSymbol(sub.currency)}{sub.totalPlanPrice || sub.price * (sub.totalMembers || 1)}
                </span>
              </div>

              <div className="space-y-2">
                {sub.splitMembers.map((member: { name: string; shareAmount: number; isPaid?: boolean }, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-background p-2.5 border border-border text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleToggleMemberPaid(idx)}
                        className={cn(
                          "size-5 rounded flex items-center justify-center border transition-all cursor-pointer",
                          member.isPaid
                            ? "bg-foreground text-background border-foreground"
                            : "border-border hover:border-foreground/50"
                        )}
                        title={member.isPaid ? "Mark as unpaid" : "Mark as paid"}
                      >
                        {member.isPaid && <Check className="size-3.5" />}
                      </button>
                      <div>
                        <span className={cn("font-medium", member.isPaid && "line-through text-muted-foreground")}>
                          {member.name}
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {getSymbol(sub.currency)}{member.shareAmount} · {member.isPaid ? "Paid this month" : "Pending transfer"}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyPaymentReminder(member)}
                      className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <MessageSquare className="size-3" />
                      Copy Reminder
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Hike History */}
          {priceHistory.length > 0 && (
            <div className="rounded-lg border border-border bg-background p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Price History & Inflation Log
                  </h3>
                </div>
                {hasPriceHike && (
                  <span className="text-xs font-bold text-foreground">
                    +{priceHikeDiff}% overall increase
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {priceHistory.map((ph: { price: number; currency: string; changedAt: string }, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-b-0"
                  >
                    <span className="text-muted-foreground">
                      {format(new Date(ph.changedAt), "MMM d, yyyy")}
                    </span>
                    <span className="font-bold text-foreground">
                      {getSymbol(ph.currency)}{ph.price} ({ph.currency})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoice / Receipt Attachment */}
          <div className="rounded-lg border border-border bg-background p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="size-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Invoice & Warranty Receipt
                </h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => receiptInputRef.current?.click()}
                disabled={uploadingReceipt}
                className="h-7 text-xs gap-1 cursor-pointer"
              >
                <Upload className="size-3" />
                {uploadingReceipt ? "Uploading..." : sub.receiptStorageId ? "Replace File" : "Attach File"}
              </Button>
            </div>

            {sub.receiptUrl ? (
              <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 border border-border text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="size-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {sub.receiptFileName || "Attached Invoice"}
                    </p>
                    <button
                      onClick={() => openUrl(sub.receiptUrl!)}
                      className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 cursor-pointer text-left"
                    >
                      <ExternalLink className="size-3" /> View / Download Document
                    </button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleRemoveReceipt}
                  className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No invoice attached yet. Upload a PDF or image receipt to keep tax and warranty records safe.
              </p>
            )}
          </div>

          {/* Payment History Log */}
          <div className="rounded-lg border border-border bg-background p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="size-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Payment History & Billing Logs
                </h3>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {subPayments?.length || 0} {subPayments?.length === 1 ? "record" : "records"}
              </span>
            </div>

            {subPayments && subPayments.length > 0 ? (
              <div className="space-y-2">
                {subPayments.map((p) => {
                  const paymentDate = new Date(p.date)
                  return (
                    <div
                      key={p._id}
                      className="flex items-center justify-between rounded-lg bg-muted/40 p-2.5 border border-border text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="flex size-7 shrink-0 items-center justify-center rounded-md font-bold text-white text-[11px]"
                          style={{ backgroundColor: p.color || sub.color }}
                        >
                          {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {format(paymentDate, "MMM d, yyyy")}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {getSymbol(p.currency)}{p.amount} ({p.currency})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                          {convertAndFormat(p.amount, p.currency, primaryCurrency, rates)}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleOpenEditPayment(p)}
                            title="Edit payment"
                            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeletingPayment(p)}
                            title="Delete payment"
                            className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No payments logged yet. Use &ldquo;Record Payment&rdquo; below to log each billing transaction.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 cursor-pointer"
          onClick={handleSuspend}
        >
          {sub.isActive ? (
            <>
              <Pause className="size-4" /> Suspend
            </>
          ) : (
            <>
              <Play className="size-4" /> Resume
            </>
          )}
        </Button>
        <Button variant="outline" className="flex-1 cursor-pointer" onClick={handleClone}>
          <Copy className="size-4" /> Clone
        </Button>
      </div>

      <div>
        <Button
          variant="outline"
          className="w-full cursor-pointer"
          onClick={handleRecordPayment}
        >
          <DollarSign className="size-4" /> Record Payment
        </Button>
      </div>

      <div>
        {deleteConfirm ? (
          <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-center text-xs text-muted-foreground">
              Are you sure you want to delete this subscription? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 cursor-pointer"
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 cursor-pointer"
                onClick={handleDelete}
              >
                <Trash2 className="size-4" /> Confirm Delete
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="destructive"
            className="w-full cursor-pointer"
            onClick={() => setDeleteConfirm(true)}
          >
            <Trash2 className="size-4" /> Delete Subscription
          </Button>
        )}
      </div>

      <CancellationGuideModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        subscription={sub}
        onMarkCanceled={handleSuspend}
        onUpdateCancelUrl={handleUpdateCancelUrl}
        primaryCurrency={primaryCurrency}
        rates={rates}
      />

      <Dialog open={cancelUrlModalOpen} onOpenChange={setCancelUrlModalOpen}>
        <DialogContent className="max-w-sm rounded-lg p-5" onClose={() => setCancelUrlModalOpen(false)}>
          <DialogHeader className="pr-6 space-y-1 text-left mb-0">
            <DialogTitle className="text-base font-semibold">Change Cancellation Page</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide the direct account cancellation or subscription management URL for {sub.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Link2 className="size-3.5 text-primary" />
                Cancellation URL
              </label>
              <Input
                placeholder="https://service.com/account/cancel"
                value={tempCancelUrl}
                onChange={(e) => setTempCancelUrl(e.target.value)}
                className="text-xs"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Leave empty to use the standard search guide for {sub.name}.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelUrlModalOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCancelUrlModal}
              disabled={savingCancelUrl}
              className="cursor-pointer"
            >
              {savingCancelUrl ? "Saving..." : "Save URL"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={!!editingPayment} onOpenChange={(open) => !open && setEditingPayment(null)}>
        <DialogContent className="max-w-sm rounded-lg p-5" onClose={() => setEditingPayment(null)}>
          <DialogHeader className="space-y-1 text-left mb-0">
            <DialogTitle className="text-base font-semibold">Edit Payment Record</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update the payment details for {editingPayment?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editPaymentAmount}
                  onChange={(e) => setEditPaymentAmount(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Currency</label>
                <select
                  value={editPaymentCurrency}
                  onChange={(e) => setEditPaymentCurrency(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs"
                >
                  {currencies.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Payment Date</label>
              <Input
                type="date"
                value={editPaymentDate}
                onChange={(e) => setEditPaymentDate(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingPayment(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEditPayment}
              disabled={isUpdatingPayment}
              className="cursor-pointer"
            >
              {isUpdatingPayment ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Dialog */}
      <Dialog open={!!deletingPayment} onOpenChange={(open) => !open && setDeletingPayment(null)}>
        <DialogContent className="max-w-sm rounded-lg p-5" onClose={() => setDeletingPayment(null)}>
          <DialogHeader className="space-y-1 text-left mb-0">
            <DialogTitle className="text-base font-semibold">Delete Payment Record</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete this payment record of {deletingPayment?.amount} {deletingPayment?.currency} on {deletingPayment?.date}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingPayment(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDeletePayment}
              disabled={isDeletingPayment}
              className="cursor-pointer"
            >
              {isDeletingPayment ? "Deleting..." : "Delete Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <IconPicker
        selected={editIcon}
        onSelect={(icon) => {
          setEditIcon(icon)
        }}
        open={iconOpen}
        onClose={() => setIconOpen(false)}
        defaultDomain={editWebsite || editName || sub.website || sub.name}
      />
    </div>
  )
}

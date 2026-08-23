"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { IconPicker } from "@/components/icon-picker"
import { DynamicIcon } from "@/components/dynamic-icon"
import { cn } from "@/lib/utils"
import {
  categories,
  currencies,
  billingCycles,
  getSymbol,
  categoryColors,
} from "@/lib/constants"
import { format, differenceInDays } from "date-fns"
import { convertAndFormat, convertCurrency } from "@/lib/currency"
import { CancellationGuideModal } from "@/components/cancellation-guide-modal"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"

export default function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [iconOpen, setIconOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  const sub = useQuery(
    api.subscriptions.get,
    id ? { id: id as Id<"subscriptions"> } : "skip"
  )
  const updateMutation = useMutation(api.subscriptions.update)
  const suspendMutation = useMutation(api.subscriptions.suspend)
  const cloneMutation = useMutation(api.subscriptions.clone)
  const removeMutation = useMutation(api.subscriptions.remove)
  const recordPaymentMutation = useMutation(api.payments.create)

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
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!sub || !id) return
    await updateMutation({
      id: id as Id<"subscriptions">,
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
    })
    setEditing(false)
  }

  const handleSuspend = async () => {
    if (!id) return
    await suspendMutation({ id: id as Id<"subscriptions"> })
  }

  const handleClone = async () => {
    if (!id) return
    const newId = await cloneMutation({ id: id as Id<"subscriptions"> })
    router.push(`/subscriptions/${newId}`)
  }

  const handleDelete = async () => {
    if (!id) return
    await removeMutation({ id: id as Id<"subscriptions"> })
    router.push("/")
  }

  const handleRecordPayment = async () => {
    if (!sub || !id) return
    await recordPaymentMutation({
      subscriptionId: id as Id<"subscriptions">,
      name: sub.name,
      icon: sub.icon,
      color: sub.color,
      amount: sub.price,
      currency: sub.currency,
      category: sub.category,
      date: new Date().toISOString().split("T")[0],
    })
  }

  if (sub === null) {
    router.replace("/")
    return null
  }

  if (!sub) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    )
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

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="flex-1 text-lg font-semibold">Subscription Details</h1>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={editing ? () => setEditing(false) : startEditing}
        >
          <Pencil className="size-4" />
        </Button>
      </div>

      {sub.isTrial && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-emerald-500/15 p-3 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 shrink-0" />
            <div>
              <p className="font-bold">Active Free Trial</p>
              <p className="text-[11px] opacity-90">
                {sub.trialEndDate
                  ? `Expires on ${format(new Date(sub.trialEndDate), "MMM d, yyyy")} (${trialDaysLeft} days left)`
                  : "Trial subscription mode"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setCancelModalOpen(true)}
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
          >
            <ExternalLink className="size-3.5" />
            Cancel Guide
          </Button>
        </div>
      )}

      <div className="mb-4 rounded-lg border border-border bg-background p-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => editing && setIconOpen(true)}
            className={cn(
              "flex size-14 items-center justify-center rounded-lg",
              editing && "cursor-pointer ring-2 ring-border ring-offset-2"
            )}
            style={{ backgroundColor: editing ? editColor : sub.color }}
            disabled={!editing}
          >
            <DynamicIcon name={currentIcon} className="size-7 text-white" />
          </button>
          <div className="flex-1">
            {editing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mb-1 text-lg font-bold"
              />
            ) : (
              <h2 className="text-lg font-bold">{sub.name}</h2>
            )}
            <div className="flex flex-wrap items-center gap-2">
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
                <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-md">
                  FREE TRIAL
                </Badge>
              )}

              {sub.isShared && (
                <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-bold rounded-md">
                  SPLIT PLAN {sub.totalMembers ? `(1/${sub.totalMembers})` : ""}
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

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-muted p-3 text-center">
          <div className="text-sm font-extrabold text-foreground truncate">
            {convertAndFormat(
              editing ? parseFloat(editPrice || "0") : sub.price,
              editing ? editCurrency : sub.currency,
              primaryCurrency,
              rates
            )}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Price ({primaryCurrency})
          </div>
        </div>
        <div className="rounded-lg bg-muted p-3 text-center">
          <div className="text-sm font-bold truncate">
            {editing
              ? editCycle.charAt(0).toUpperCase() + editCycle.slice(1)
              : sub.cycle.charAt(0).toUpperCase() + sub.cycle.slice(1)}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Cycle
          </div>
        </div>
        <div className="rounded-lg bg-muted p-3 text-center">
          <div className="text-sm font-extrabold text-foreground truncate">
            {convertAndFormat(
              nativeYearlyCost,
              sub.currency,
              primaryCurrency,
              rates
            )}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Yearly Total
          </div>
        </div>
      </div>

      {editing ? (
        <div className="space-y-4 rounded-lg border border-border bg-background p-4">
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
                className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
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
            <label className="text-xs font-medium">Billing Cycle</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {billingCycles.map((bc) => (
                <button
                  key={bc.value}
                  type="button"
                  onClick={() => setEditCycle(bc.value)}
                  className={`flex items-center justify-center rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                    editCycle === bc.value
                      ? "border-foreground bg-foreground text-background"
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
                    "size-8 rounded-full border-2 transition-all",
                    editColor === c
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={saveEdit}>
            Save Changes
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background">
          <div className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Details & Cancellation Guide
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Cancellation Guide
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCancelModalOpen(true)}
                  className="h-7 text-xs gap-1 font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                >
                  <ExternalLink className="size-3" />
                  Direct Cancel Link & Checklist
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Original Price
                </span>
                <span className="text-sm font-semibold">
                  {getSymbol(sub.currency)}{sub.price} ({sub.currency})
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Next Billing
                </span>
                <span className="text-sm font-medium">
                  {format(new Date(sub.nextBilling), "MMMM d, yyyy")}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Billing Cycle
                </span>
                <span className="text-sm font-medium">
                  {billingCycles.find((bc) => bc.value === sub.cycle)?.label ||
                    sub.cycle.charAt(0).toUpperCase() + sub.cycle.slice(1)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Account / Email
                </span>
                <span className="text-sm font-medium">
                  {sub.account || "Not specified"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Direct Cancel Page
                </span>
                <span className="text-sm font-medium">
                  {sub.cancelUrl ? (
                    <a
                      href={sub.cancelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="size-3" />
                      Cancellation Page
                    </a>
                  ) : (
                    "Standard URL search"
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Start Date
                </span>
                <span className="text-sm font-medium">
                  {format(new Date(sub.startDate), "MMMM d, yyyy")}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  End Date
                </span>
                <span className="text-sm font-medium">
                  {sub.endDate
                    ? format(new Date(sub.endDate), "MMMM d, yyyy")
                    : "Ongoing"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
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
        <Button variant="outline" className="flex-1" onClick={handleClone}>
          <Copy className="size-4" /> Clone
        </Button>
      </div>

      <div className="mt-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleRecordPayment}
        >
          <DollarSign className="size-4" /> Record Payment
        </Button>
      </div>

      <div className="mt-3">
        {deleteConfirm ? (
          <div className="space-y-2">
            <p className="text-center text-sm text-muted-foreground">
              Are you sure? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="destructive"
            className="w-full"
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
        primaryCurrency={primaryCurrency}
      />

      <IconPicker
        selected={editIcon}
        onSelect={(icon) => {
          setEditIcon(icon)
          setEditColor("#000000")
        }}
        open={iconOpen}
        onClose={() => setIconOpen(false)}
        defaultDomain={editWebsite || editName || sub.website || sub.name}
      />
    </div>
  )
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-muted", className)}
    />
  )
}

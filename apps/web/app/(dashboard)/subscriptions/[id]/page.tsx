"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import * as LucideIcons from "lucide-react"
import { ArrowLeft, Pencil, Pause, Play, Copy, Trash2, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { IconPicker } from "@/components/icon-picker"
import { cn } from "@/lib/utils"
import {
  categories,
  currencies,
  billingCycles,
  getSymbol,
  categoryColors,
} from "@/lib/constants"
import { format } from "date-fns"
import type { ComponentType } from "react"

const icons = LucideIcons as unknown as Record<string, ComponentType<Record<string, unknown>>>

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] || LucideIcons.Receipt
  return <Icon className={className} />
}

export default function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [iconOpen, setIconOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  // Resolve params
  params.then((p) => {
    if (p.id !== id) setId(p.id)
  })

  const sub = useQuery(
    api.subscriptions.get,
    id ? { id: id as Id<"subscriptions"> } : "skip"
  )
  const updateMutation = useMutation(api.subscriptions.update)
  const suspendMutation = useMutation(api.subscriptions.suspend)
  const cloneMutation = useMutation(api.subscriptions.clone)
  const removeMutation = useMutation(api.subscriptions.remove)
  const recordPaymentMutation = useMutation(api.payments.create)

  const [editName, setEditName] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [editCurrency, setEditCurrency] = useState("USD")
  const [editCycle, setEditCycle] = useState("monthly")
  const [editCategory, setEditCategory] = useState("entertainment")
  const [editIcon, setEditIcon] = useState<string | null>(null)
  const [editColor, setEditColor] = useState("#000000")

  const startEditing = () => {
    if (!sub) return
    setEditName(sub.name)
    setEditPrice(sub.price.toString())
    setEditCurrency(sub.currency)
    setEditCycle(sub.cycle)
    setEditCategory(sub.category)
    setEditIcon(sub.icon)
    setEditColor(sub.color)
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!sub || !id) return
    await updateMutation({
      id: id as Id<"subscriptions">,
      name: editName,
      price: parseFloat(editPrice),
      currency: editCurrency,
      cycle: editCycle,
      category: editCategory,
      icon: editIcon || sub.icon,
      color: editColor,
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

  if (!sub) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    )
  }

  const currentIcon = editing ? editIcon || sub.icon : sub.icon
  const yearlyCost =
    sub.cycle === "monthly"
      ? sub.price * 12
      : sub.cycle === "yearly"
      ? sub.price
      : sub.cycle === "weekly"
      ? sub.price * 52
      : sub.price * 365

  return (
    <div className="p-4">
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

      <div className="mb-4 rounded-xl border border-border bg-background p-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => editing && setIconOpen(true)}
            className={cn(
              "flex size-14 items-center justify-center rounded-2xl",
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
            <div className="flex items-center gap-2">
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
                  className="text-xs"
                  style={{
                    backgroundColor: categoryColors[sub.category] + "20",
                    color: categoryColors[sub.category],
                  }}
                >
                  {sub.category}
                </Badge>
              )}
              <Badge
                variant={sub.isActive ? "default" : "destructive"}
                className="text-xs"
              >
                {sub.isActive ? "Active" : "Suspended"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-muted p-3 text-center">
          <div className="text-lg font-bold">
            {editing
              ? `${getSymbol(editCurrency)}${editPrice}`
              : `${getSymbol(sub.currency)}${sub.price}`}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Price
          </div>
        </div>
        <div className="rounded-xl bg-muted p-3 text-center">
          <div className="text-lg font-bold">
            {editing
              ? editCycle.charAt(0).toUpperCase() + editCycle.slice(1)
              : sub.cycle.charAt(0).toUpperCase() + sub.cycle.slice(1)}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Cycle
          </div>
        </div>
        <div className="rounded-xl bg-muted p-3 text-center">
          <div className="text-lg font-bold">
            ${yearlyCost.toFixed(2)}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Yearly
          </div>
        </div>
      </div>

      {editing ? (
        <div className="space-y-4 rounded-xl border border-border bg-background p-4">
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
            <div className="grid grid-cols-2 gap-2">
              {billingCycles.map((bc) => (
                <button
                  key={bc.value}
                  type="button"
                  onClick={() => setEditCycle(bc.value)}
                  className={`flex items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
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
          <Button className="w-full" onClick={saveEdit}>
            Save Changes
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background">
          <div className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Details
            </h3>
            <div className="space-y-3">
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
                  {sub.cycle.charAt(0).toUpperCase() + sub.cycle.slice(1)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Currency</span>
                <span className="text-sm font-medium">{sub.currency}</span>
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

      <IconPicker
        selected={editIcon}
        onSelect={(icon) => {
          setEditIcon(icon)
          setEditColor("#000000")
        }}
        open={iconOpen}
        onClose={() => setIconOpen(false)}
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

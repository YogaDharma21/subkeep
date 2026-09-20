"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DynamicIcon } from "@/components/dynamic-icon"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { currencies, colorPresets, getContrastTextColor } from "@/lib/constants"
import { accountTypes } from "@/lib/finance"

interface AddAccountSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: {
    _id: string
    name: string
    type: string
    balance: number
    currency: string
    icon: string
    color: string
    last4?: string
  } | null
}

export function AddAccountSheet({ open, onOpenChange, editing }: AddAccountSheetProps) {
  const create = useMutation(api.accounts.create)
  const update = useMutation(api.accounts.update)

  const [name, setName] = useState(editing?.name || "")
  const [type, setType] = useState(editing?.type || "checking")
  const [balance, setBalance] = useState(editing ? String(editing.balance) : "")
  const [currency, setCurrency] = useState(editing?.currency || "IDR")
  const [last4, setLast4] = useState(editing?.last4 || "")
  const [selectedIcon, setSelectedIcon] = useState(editing?.icon || "Wallet")
  const [selectedColor, setSelectedColor] = useState(editing?.color || "#6366F1")
  const [isSaving, setIsSaving] = useState(false)

  const resetForm = () => {
    setName("")
    setType("checking")
    setBalance("")
    setCurrency("IDR")
    setLast4("")
    setSelectedIcon("Wallet")
    setSelectedColor("#6366F1")
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter an account name")
      return
    }
    const parsed = parseFloat(balance || "0")
    if (isNaN(parsed)) {
      toast.error("Please enter a valid balance")
      return
    }
    setIsSaving(true)
    try {
      if (editing) {
        await update({
          id: editing._id as Id<"accounts">,
          name: name.trim(),
          type,
          balance: parsed,
          currency,
          icon: selectedIcon,
          color: selectedColor,
          last4: last4 || undefined,
        })
        toast.success("Account updated")
      } else {
        await create({
          name: name.trim(),
          type,
          balance: parsed,
          currency,
          icon: selectedIcon,
          color: selectedColor,
          last4: last4 || undefined,
        })
        toast.success(`Added ${name.trim()} account`)
      }
      resetForm()
      onOpenChange(false)
    } catch {
      toast.error("Failed to save account")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm()
        onOpenChange(o)
      }}
    >
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col" showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between border-b border-border p-4">
          <SheetTitle>{editing ? "Edit Account" : "Add Account"}</SheetTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
          >
            <X className="size-4" />
          </Button>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted p-3.5">
            <div
              className="flex size-10 items-center justify-center rounded-lg shadow-xs"
              style={{ backgroundColor: selectedColor }}
            >
              <DynamicIcon
                name={selectedIcon}
                className="size-5"
                style={{ color: getContrastTextColor(selectedColor) }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {colorPresets.slice(0, 8).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={cn(
                    "size-6 rounded-full border-2 transition-all cursor-pointer",
                    selectedColor.toLowerCase() === c.toLowerCase()
                      ? "border-primary ring-2 ring-primary/30 scale-110"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Account Type</label>
            <div className="grid grid-cols-4 gap-2">
              {accountTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setType(t.value)
                    setSelectedIcon(t.icon)
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all cursor-pointer",
                    type === t.value
                      ? "border-foreground bg-muted shadow-xs"
                      : "border-border bg-background hover:border-foreground/40"
                  )}
                >
                  <DynamicIcon name={t.icon} className="size-4 text-foreground" />
                  <span className="text-[10px] font-medium text-center leading-tight">
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Account Name</label>
            <Input
              placeholder="e.g. BCA Checking, Cash Wallet"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Balance</label>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Last 4 Digits (Optional)</label>
            <Input
              placeholder="e.g. 4242"
              maxLength={4}
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-border p-4">
          <Button
            className="w-full cursor-pointer"
            onClick={handleSubmit}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? "Saving..." : editing ? "Save Changes" : "Add Account"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import * as LucideIcons from "lucide-react"
import { ArrowLeft, Plus } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TemplateList } from "@/components/template-list"
import { IconPicker } from "@/components/icon-picker"
import { cn } from "@/lib/utils"
import {
  categories,
  currencies,
  billingCycles,
} from "@/lib/constants"
import type { ComponentType } from "react"

const icons = LucideIcons as unknown as Record<string, ComponentType<Record<string, unknown>>>

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] || LucideIcons.Receipt
  return <Icon className={className} />
}

interface AddSubscriptionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddSubscriptionSheet({
  open,
  onOpenChange,
}: AddSubscriptionSheetProps) {
  const create = useMutation(api.subscriptions.create)
  const [step, setStep] = useState(1)
  const [iconOpen, setIconOpen] = useState(false)

  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [cycle, setCycle] = useState("monthly")
  const [category, setCategory] = useState("entertainment")
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState("#000000")

  const resetForm = () => {
    setStep(1)
    setName("")
    setPrice("")
    setCurrency("USD")
    setCycle("monthly")
    setCategory("entertainment")
    setStartDate(new Date().toISOString().split("T")[0])
    setSelectedIcon(null)
    setSelectedColor("#000000")
  }

  const handleTemplateSelect = (template: {
    name: string
    icon: string
    color: string
    category: string
    price: number
    currency: string
  }) => {
    setName(template.name)
    setPrice(template.price.toString())
    setCurrency(template.currency)
    setCategory(template.category)
    setSelectedIcon(template.icon)
    setSelectedColor(template.color)
    setStep(2)
  }

  const handleCustomCreate = () => {
    setStep(2)
  }

  const handleSubmit = async () => {
    if (!name || !price) return
    await create({
      name,
      icon: selectedIcon || "Receipt",
      color: selectedColor,
      price: parseFloat(price),
      currency,
      cycle,
      category,
      startDate,
      nextBilling: startDate,
    })
    resetForm()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o) }}>
      <SheetContent side="bottom" className="rounded-t-2xl overflow-hidden" showCloseButton={false}>
        <SheetHeader className="flex-row items-center gap-2 border-b border-border p-4">
          {step === 2 && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <SheetTitle className="flex-1">
            {step === 1 ? "Add Subscription" : "Subscription Details"}
          </SheetTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => { resetForm(); onOpenChange(false) }}
          >
            <LucideIcons.X className="size-4" />
          </Button>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {step === 1 ? (
            <div className="flex flex-1 flex-col overflow-hidden p-4">
              <Button
                variant="outline"
                className="mb-4 w-full shrink-0"
                onClick={handleCustomCreate}
              >
                <Plus className="size-4" />
                Create Custom
              </Button>
              <div className="min-h-0 flex-1 overflow-hidden">
                <TemplateList onSelect={handleTemplateSelect} />
              </div>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4">
                <div className="space-y-4 pb-4">
                  <button
                    onClick={() => setIconOpen(true)}
                    className="flex items-center gap-3 rounded-xl bg-muted p-3.5"
                  >
                    <div
                      className={cn(
                        "flex size-12 items-center justify-center rounded-xl border-2 border-dashed",
                        selectedIcon
                          ? "border-transparent"
                          : "border-border text-muted-foreground"
                      )}
                      style={
                        selectedIcon ? { backgroundColor: selectedColor } : undefined
                      }
                    >
                      {selectedIcon ? (
                        <DynamicIcon name={selectedIcon} className="size-5 text-white" />
                      ) : (
                        <Plus className="size-5" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Tap to choose icon
                    </span>
                  </button>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      placeholder="e.g., Netflix"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
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
                    <label className="text-sm font-medium">Billing Cycle</label>
                    <div className="grid grid-cols-2 gap-2">
                      {billingCycles.map((bc) => (
                        <button
                          key={bc.value}
                          type="button"
                          onClick={() => setCycle(bc.value)}
                          className={`flex items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                            cycle === bc.value
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-background text-foreground hover:border-foreground/50"
                          }`}
                        >
                          {bc.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    >
                      {categories
                        .filter((c) => c.value !== "all")
                        .map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-border p-4">
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!name || !price}
                >
                  Add Subscription
                </Button>
              </div>
            </>
          )}
        </div>

        <IconPicker
          selected={selectedIcon}
          onSelect={(icon) => {
            setSelectedIcon(icon)
            setSelectedColor("#000000")
          }}
          open={iconOpen}
          onClose={() => setIconOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}

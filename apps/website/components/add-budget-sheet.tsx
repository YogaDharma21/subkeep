"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
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
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { expenseCategories, financeCategoryMeta, currentMonthKey } from "@/lib/finance"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface AddBudgetSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddBudgetSheet({ open, onOpenChange }: AddBudgetSheetProps) {
  const { isSignedIn } = useAuth()
  const { primaryCurrency } = usePrimaryCurrency()
  const month = currentMonthKey()

  const budgets = useQuery(api.budgets.list, isSignedIn && open ? { month } : "skip")
  const upsertMutation = useMutation(api.budgets.upsert)

  const [category, setCategory] = useState("food")
  const [amount, setAmount] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const usedCategories = new Set((budgets || []).map((b) => b.category))
  const availableCategories = expenseCategories.filter((c) => !usedCategories.has(c.value))
  const categoryOptions = availableCategories.length > 0 ? availableCategories : expenseCategories

  const resetForm = () => {
    setCategory("food")
    setAmount("")
  }

  const handleSave = async () => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Please enter a valid budget amount")
      return
    }
    setIsSaving(true)
    try {
      await upsertMutation({
        category,
        amount: parsed,
        currency: primaryCurrency,
        month,
      })
      const meta = financeCategoryMeta(category)
      toast.success(`Budget set for ${meta.label}`)
      resetForm()
      onOpenChange(false)
    } catch {
      toast.error("Failed to save budget")
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
          <SheetTitle>Set Budget</SheetTitle>
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-0.5">
              {categoryOptions.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border-2 p-2 text-left transition-all cursor-pointer",
                    category === c.value
                      ? "border-foreground bg-muted"
                      : "border-border hover:border-foreground/40"
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                    <DynamicIcon name={c.icon} className="size-3.5" />
                  </span>
                  <span className="text-[11px] font-medium leading-tight">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Monthly Cap ({primaryCurrency})</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder={`Monthly cap in ${primaryCurrency}`}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button onClick={handleSave} disabled={isSaving || !amount} className="cursor-pointer shrink-0">
                {isSaving ? "Saving..." : "Set"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

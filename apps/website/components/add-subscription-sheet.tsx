"use client"

import { useState, useCallback } from "react"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { ArrowLeft, Plus, X, Sparkles, Link2, Users, CreditCard, UserPlus, Trash2, Pipette } from "lucide-react"
import { DynamicIcon } from "@/components/dynamic-icon"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import dynamic from "next/dynamic"
import { TemplateList } from "@/components/template-list"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const IconPicker = dynamic(
  () => import("@/components/icon-picker").then((m) => m.IconPicker),
  { ssr: false }
)
import {
  categories,
  currencies,
  billingCycles,
  colorPresets,
  getContrastTextColor,
} from "@/lib/constants"

interface AddSubscriptionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddSubscriptionSheet({
  open,
  onOpenChange,
}: AddSubscriptionSheetProps) {
  const { isSignedIn } = useAuth()
  const create = useMutation(api.subscriptions.create)
  const paymentMethods = useQuery(
    api.paymentMethods.list,
    isSignedIn && open ? {} : "skip"
  ) as Array<{ _id: string; name: string; type: string; last4?: string }> | undefined

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
  const [endDate, setEndDate] = useState("")
  const [account, setAccount] = useState("")
  const [website, setWebsite] = useState("")
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>("")

  // Trial additions
  const [isTrial, setIsTrial] = useState(false)
  const [trialEndDate, setTrialEndDate] = useState("")
  const [cancelUrl, setCancelUrl] = useState("")

  // Shared / Split plan additions (SplitKeep)
  const [isShared, setIsShared] = useState(false)
  const [totalPlanPrice, setTotalPlanPrice] = useState("")
  const [totalMembers, setTotalMembers] = useState("4")
  const [splitMembersList, setSplitMembersList] = useState<Array<{ name: string; shareAmount: number }>>([])


  const resetForm = () => {
    setStep(1)
    setName("")
    setPrice("")
    setCurrency("USD")
    setCycle("monthly")
    setCategory("entertainment")
    setStartDate(new Date().toISOString().split("T")[0])
    setEndDate("")
    setAccount("")
    setWebsite("")
    setSelectedIcon(null)
    setSelectedColor("#000000")
    setSelectedPaymentMethodId("")
    setIsTrial(false)
    setTrialEndDate("")
    setCancelUrl("")
    setIsShared(false)
    setTotalPlanPrice("")
    setTotalMembers("4")
    setSplitMembersList([])
  }

  const handleTemplateSelect = useCallback((template: {
    name: string
    icon: string
    color: string
    category: string
    price: number
    currency: string
    cancelUrl?: string
  }) => {
    setName(template.name)
    setPrice(template.price.toString())
    setCurrency(template.currency)
    setCategory(template.category)
    setSelectedIcon(template.icon)
    setSelectedColor(template.color)
    if (template.cancelUrl) setCancelUrl(template.cancelUrl)
    setStep(2)
  }, [])

  const handleCustomCreate = () => {
    setStep(2)
  }

  const handleTotalPlanPriceChange = (val: string) => {
    setTotalPlanPrice(val)
    const total = parseFloat(val)
    const members = parseInt(totalMembers) || 1
    if (!isNaN(total) && members > 0) {
      const share = parseFloat((total / members).toFixed(2))
      setPrice(share.toString())
    }
  }

  const handleTotalMembersChange = (val: string) => {
    setTotalMembers(val)
    const total = parseFloat(totalPlanPrice)
    const members = parseInt(val) || 1
    if (!isNaN(total) && members > 0) {
      const share = parseFloat((total / members).toFixed(2))
      setPrice(share.toString())
    }
  }

  const addSplitMember = () => {
    const total = parseFloat(totalPlanPrice) || parseFloat(price) || 0
    const count = splitMembersList.length + 1
    const share = count > 0 ? parseFloat((total / count).toFixed(2)) : 0
    setSplitMembersList([...splitMembersList, { name: `Member ${count}`, shareAmount: share }])
  }

  const removeSplitMember = (index: number) => {
    const updated = splitMembersList.filter((_, i) => i !== index)
    setSplitMembersList(updated)
  }

  const updateSplitMemberName = (index: number, val: string) => {
    const updated = [...splitMembersList]
    updated[index].name = val
    setSplitMembersList(updated)
  }

  const handleSubmit = async () => {
    if (!name || (!price && !isTrial)) return
    try {
      await create({
        name,
        icon: selectedIcon || "Receipt",
        color: selectedColor,
        price: price ? parseFloat(price) : 0,
        currency,
        cycle,
        category,
        startDate,
        nextBilling: isTrial && trialEndDate ? trialEndDate : startDate,
        endDate: endDate || undefined,
        account: account || undefined,
        website: website || undefined,
        isTrial,
        trialEndDate: trialEndDate || undefined,
        cancelUrl: cancelUrl || undefined,
        isShared,
        totalPlanPrice: totalPlanPrice ? parseFloat(totalPlanPrice) : undefined,
        totalMembers: totalMembers ? parseInt(totalMembers) : undefined,
        paymentMethodId: selectedPaymentMethodId || undefined,
        splitMembers: isShared && splitMembersList.length > 0 ? splitMembersList : undefined,
      })
      toast.success(`Added ${name} to your subscriptions!`)
      resetForm()
      onOpenChange(false)
    } catch {
      toast.error("Failed to add subscription. Please try again.")
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o) }}>
      <SheetContent side="bottom" className="rounded-t-lg overflow-hidden max-h-[90vh]" showCloseButton={false}>
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
            <X className="size-4" />
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
                    className="flex items-center gap-3 rounded-lg bg-muted p-3.5 w-full cursor-pointer"
                  >
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-lg border border-black/10 dark:border-white/10 shadow-xs",
                        !selectedIcon && "border-dashed border-border"
                      )}
                      style={
                        selectedIcon ? { backgroundColor: selectedColor || "#6366F1" } : undefined
                      }
                    >
                      {selectedIcon ? (
                        <DynamicIcon
                          name={selectedIcon}
                          className="size-5"
                          style={{ color: getContrastTextColor(selectedColor) }}
                        />
                      ) : (
                        <Plus className="size-5" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Tap to choose icon
                    </span>
                  </button>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand Color</label>
                    <div className="flex flex-wrap items-center gap-2">
                      {colorPresets.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          className={cn(
                            "size-7 rounded-full border-2 transition-all cursor-pointer shadow-xs",
                            selectedColor?.toLowerCase() === c.toLowerCase()
                              ? "border-primary ring-2 ring-primary/30 scale-110"
                              : c.toLowerCase() === "#ffffff"
                                ? "border-muted-foreground/30"
                                : "border-transparent"
                          )}
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                      <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-border">
                        <label
                          className="relative size-7 rounded-full border border-border cursor-pointer overflow-hidden flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors shrink-0"
                          title="Pick custom color"
                        >
                          <Pipette className="size-3.5 text-muted-foreground" />
                          <input
                            type="color"
                            value={
                              selectedColor?.startsWith("#") && selectedColor.length === 7
                                ? selectedColor
                                : "#FFFFFF"
                            }
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </label>
                        <input
                          type="text"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          placeholder="#FFFFFF"
                          maxLength={7}
                          className="w-20 px-2 py-1 text-xs font-mono rounded-md border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Free Trial Toggle */}
                  <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-emerald-500" />
                      <div>
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          Free Trial Subscription
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          Track trial expiration to cancel before auto-renewing
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isTrial}
                      onChange={(e) => setIsTrial(e.target.checked)}
                      className="size-4 rounded accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {isTrial && (
                    <div className="space-y-2 rounded-lg bg-muted/40 p-3 border border-border">
                      <label className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        Trial Expiration Date *
                      </label>
                      <Input
                        type="date"
                        value={trialEndDate}
                        onChange={(e) => setTrialEndDate(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Shared / Split Subscription Toggle (SplitKeep) */}
                  <div className="flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-blue-500" />
                      <div>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          Shared / Split Plan (SplitKeep)
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          Split total plan across members and track individual shares
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isShared}
                      onChange={(e) => setIsShared(e.target.checked)}
                      className="size-4 rounded accent-blue-500 cursor-pointer"
                    />
                  </div>

                  {isShared && (
                    <div className="space-y-3 rounded-lg bg-blue-500/5 p-3 border border-blue-500/20">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            Total Plan Price
                          </label>
                          <Input
                            type="number"
                            placeholder="e.g. 22.99"
                            step="0.01"
                            value={totalPlanPrice}
                            onChange={(e) => handleTotalPlanPriceChange(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            Total Members
                          </label>
                          <Input
                            type="number"
                            placeholder="e.g. 4"
                            min="1"
                            value={totalMembers}
                            onChange={(e) => handleTotalMembersChange(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Split members detail names */}
                      <div className="space-y-2 pt-1 border-t border-blue-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            Member Names & Split List
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={addSplitMember}
                            className="h-6 text-xs text-blue-500 gap-1 px-2"
                          >
                            <UserPlus className="size-3" />
                            Add Member
                          </Button>
                        </div>

                        {splitMembersList.map((m, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              placeholder={`Member ${idx + 1} Name`}
                              value={m.name}
                              onChange={(e) => updateSplitMemberName(idx, e.target.value)}
                              className="h-8 text-xs flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeSplitMember(idx)}
                              className="size-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                      <label className="text-sm font-medium">
                        {isShared ? "Your Share Price" : isTrial ? "Price (After Trial)" : "Price"}
                      </label>
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

                  {/* Payment Method Selector (Card Vault) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <CreditCard className="size-4 text-primary" />
                      Linked Payment Method (Card / Wallet)
                    </label>
                    <select
                      value={selectedPaymentMethodId}
                      onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                      className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    >
                      <option value="">No linked payment method (Default)</option>
                      {paymentMethods?.map((pm) => (
                        <option key={pm._id} value={pm._id}>
                          {pm.name} {pm.last4 ? `(•••• ${pm.last4})` : ""} - {pm.type.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Billing Cycle</label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {billingCycles.map((bc) => (
                        <button
                          key={bc.value}
                          type="button"
                          onClick={() => setCycle(bc.value)}
                          className={`flex items-center justify-center rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition-all cursor-pointer ${
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
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Link2 className="size-3.5 text-primary" />
                      Direct Cancellation URL
                    </label>
                    <Input
                      placeholder="e.g. https://www.netflix.com/youraccount"
                      value={cancelUrl}
                      onChange={(e) => setCancelUrl(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Account / Email (Optional)</label>
                      <Input
                        placeholder="e.g. user@gmail.com"
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Provider Website (Optional)</label>
                      <Input
                        placeholder="e.g. netflix.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Date (Optional)</label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-border p-4">
                <Button
                  className="w-full cursor-pointer"
                  onClick={handleSubmit}
                  disabled={!name || (!price && !isTrial)}
                >
                  Add Subscription
                </Button>
              </div>
            </>
          )}
        </div>

        {iconOpen && (
          <IconPicker
            selected={selectedIcon}
            onSelect={(icon) => {
              setSelectedIcon(icon)
            }}
            open={iconOpen}
            onClose={() => setIconOpen(false)}
            defaultDomain={website || name}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

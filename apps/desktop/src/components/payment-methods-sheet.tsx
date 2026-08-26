import { useState, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/clerk-react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  CreditCard,
  Plus,
  Trash2,
  AlertTriangle,
  Building,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { convertAndFormat } from "@/lib/currency"
import { cn } from "@/lib/utils"

export interface PaymentMethodItem {
  _id: Id<"paymentMethods">
  userId?: string
  name: string
  type: string
  last4?: string
  color: string
  expiryMonth?: number
  expiryYear?: number
}

interface PaymentMethodsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CARD_TYPES = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "amex", label: "American Express" },
  { value: "paypal", label: "PayPal" },
  { value: "applepay", label: "Apple Pay" },
  { value: "bank", label: "Bank Account" },
  { value: "other", label: "Other" },
]

const COLOR_OPTIONS = [
  "#1e293b",
  "#0f172a",
  "#1e40af",
  "#b91c1c",
  "#047857",
  "#6b21a8",
  "#b45309",
]

export function PaymentMethodsSheet({
  open,
  onOpenChange,
}: PaymentMethodsSheetProps) {
  const { isSignedIn } = useAuth()
  const { primaryCurrency, rates } = usePrimaryCurrency()
  const paymentMethods = useQuery(
    api.paymentMethods.list,
    isSignedIn && open ? {} : "skip"
  ) as PaymentMethodItem[] | undefined
  const subscriptions = useQuery(
    api.subscriptions.list,
    isSignedIn && open ? {} : "skip"
  )
  const createMutation = useMutation(api.paymentMethods.create)
  const removeMutation = useMutation(api.paymentMethods.remove)

  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState("visa")
  const [last4, setLast4] = useState("")
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [expiryMonth, setExpiryMonth] = useState("")
  const [expiryYear, setExpiryYear] = useState("")

  // Calculate spending per card
  const cardSpendStats = useMemo(() => {
    const map: Record<string, { totalMonthly: number; subCount: number }> = {}
    if (!subscriptions) return map

    subscriptions.forEach((sub: { isActive?: boolean; paymentMethodId?: string; cycle?: string; price: number }) => {
      if (sub.isActive === false || !sub.paymentMethodId) return
      if (!map[sub.paymentMethodId]) {
        map[sub.paymentMethodId] = { totalMonthly: 0, subCount: 0 }
      }
      const cycle = (sub.cycle || "monthly").toLowerCase()
      let m = sub.price
      if (cycle === "quarterly") m = sub.price / 3
      else if (cycle === "semi-annual") m = sub.price / 6
      else if (cycle === "yearly") m = sub.price / 12
      else if (cycle === "weekly") m = sub.price * 4.33
      else if (cycle === "daily") m = sub.price * 30
      else if (cycle === "none") m = 0

      map[sub.paymentMethodId].totalMonthly += m
      map[sub.paymentMethodId].subCount += 1
    })
    return map
  }, [subscriptions])

  // Check expiring cards
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const checkExpiryStatus = (month?: number, year?: number) => {
    if (!year || !month) return null
    const isExpired = year < currentYear || (year === currentYear && month < currentMonth)
    if (isExpired) return "expired"
    const monthsUntil = (year - currentYear) * 12 + (month - currentMonth)
    if (monthsUntil <= 2) return "expiring_soon"
    return null
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name for the payment method")
      return
    }

    try {
      await createMutation({
        name: name.trim(),
        type,
        last4: last4.trim() ? last4.trim().slice(-4) : undefined,
        color,
        expiryMonth: expiryMonth ? parseInt(expiryMonth) : undefined,
        expiryYear: expiryYear ? parseInt(expiryYear) : undefined,
      })
      toast.success("Payment method added successfully")
      setName("")
      setLast4("")
      setExpiryMonth("")
      setExpiryYear("")
      setIsAdding(false)
    } catch {
      toast.error("Failed to add payment method")
    }
  }

  const handleDelete = async (id: Id<"paymentMethods">, cardName: string) => {
    try {
      await removeMutation({ id })
      toast.success(`Removed ${cardName}`)
    } catch {
      toast.error("Failed to remove payment method")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent onClose={() => onOpenChange(false)}>
        <SheetHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-primary" />
            <SheetTitle>Payment Methods & Card Vault</SheetTitle>
          </div>
        </SheetHeader>

        <div className="space-y-5">
          {/* Header Description */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Track cards linked to subscriptions, monitor spend per card, and avoid failed renewals.
            </p>
            {!isAdding && (
              <Button
                size="sm"
                onClick={() => setIsAdding(true)}
                className="gap-1 text-xs shrink-0 cursor-pointer"
              >
                <Plus className="size-3.5" />
                Add Method
              </Button>
            )}
          </div>

          {/* Add New Card Form */}
          {isAdding && (
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-4 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  New Payment Method
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                  className="h-6 text-xs text-muted-foreground cursor-pointer"
                >
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Card / Method Name *</label>
                  <Input
                    placeholder="e.g. Chase Sapphire, Apple Card"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Method Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-xs"
                  >
                    {CARD_TYPES.map((ct) => (
                      <option key={ct.value} value={ct.value}>
                        {ct.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Last 4 Digits</label>
                  <Input
                    placeholder="4092"
                    maxLength={4}
                    value={last4}
                    onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Expiry Month</label>
                  <Input
                    type="number"
                    placeholder="MM (1-12)"
                    min={1}
                    max={12}
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Expiry Year</label>
                  <Input
                    type="number"
                    placeholder="YYYY (2026)"
                    min={2024}
                    max={2040}
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Card Accent Color</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        "size-7 rounded-full border-2 transition-transform cursor-pointer",
                        color === c ? "border-foreground scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full text-xs h-9 cursor-pointer">
                Save Payment Method
              </Button>
            </div>
          )}

          {/* Cards List */}
          <div className="space-y-3">
            {paymentMethods && paymentMethods.length > 0 ? (
              paymentMethods.map((pm: PaymentMethodItem) => {
                const stats = cardSpendStats[pm._id] || { totalMonthly: 0, subCount: 0 }
                const expiryStatus = checkExpiryStatus(pm.expiryMonth, pm.expiryYear)

                return (
                  <div
                    key={pm._id}
                    className="relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className="flex size-10 items-center justify-center rounded-lg text-white shadow-xs shrink-0"
                          style={{ backgroundColor: pm.color }}
                        >
                          {pm.type === "bank" ? (
                            <Building className="size-5" />
                          ) : (
                            <CreditCard className="size-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {pm.name}
                            </span>
                            {pm.last4 && (
                              <span className="text-xs font-mono text-muted-foreground">
                                •••• {pm.last4}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="capitalize">{pm.type}</span>
                            {pm.expiryMonth && pm.expiryYear && (
                              <>
                                <span>·</span>
                                <span>
                                  Exp: {String(pm.expiryMonth).padStart(2, "0")}/{pm.expiryYear}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Spend details */}
                          <div className="mt-2 text-xs font-medium text-foreground/90">
                            Spend:{" "}
                            <strong>
                              {convertAndFormat(stats.totalMonthly, primaryCurrency, primaryCurrency, rates)}
                              /mo
                            </strong>{" "}
                            <span className="text-muted-foreground">
                              ({stats.subCount} active subscription{stats.subCount === 1 ? "" : "s"})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(pm._id, pm.name)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expiry alerts */}
                    {expiryStatus === "expired" && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-2 text-xs text-destructive">
                        <AlertTriangle className="size-4 shrink-0" />
                        <span>This card has expired! Update your subscriptions to prevent billing interruptions.</span>
                      </div>
                    )}

                    {expiryStatus === "expiring_soon" && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/60 border border-border p-2 text-xs text-foreground">
                        <AlertTriangle className="size-4 shrink-0 text-muted-foreground" />
                        <span>Card expires soon. Remember to update renewal details.</span>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="py-8 text-center rounded-xl border border-dashed border-border p-6 text-xs text-muted-foreground">
                <CreditCard className="size-8 mx-auto mb-2 text-muted-foreground/60" />
                <p className="font-medium text-foreground">No payment methods added yet</p>
                <p className="mt-1">Add your credit cards, PayPal, or bank accounts to track spending per payment source.</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

import { useState, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/clerk-react"
import { api } from "@/convex/_generated/api"
import {
  Download,
  Upload,
  Info,
  Trash2,
  FileJson,
  FileSpreadsheet,
  CreditCard,
  Moon,
  Sun,
  Globe,
  Bell,
  Target,
  ShieldCheck,
  Laptop,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useTheme } from "@/components/theme-provider"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { currencies, getSymbol } from "@/lib/constants"
import { exportSubscriptionsToCSV, parseCSVToSubscriptions } from "@/lib/csv"
import { sendDesktopNotification, requestWebPushPermission } from "@/lib/notifications"
import { toast } from "sonner"

interface SettingsViewProps {
  onOpenPaymentMethods: () => void
}

export function SettingsView({ onOpenPaymentMethods }: SettingsViewProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { isSignedIn } = useAuth()
  const { primaryCurrency, setPrimaryCurrency } = usePrimaryCurrency()

  const userSettings = useQuery(api.userSettings.get, isSignedIn ? {} : "skip")
  const updateSettings = useMutation(api.userSettings.update)
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const payments = useQuery(api.payments.list, isSignedIn ? {} : "skip")

  const removeAll = useMutation(api.subscriptions.removeAll)
  const restoreSubscriptions = useMutation(api.subscriptions.restoreAll)
  const restorePayments = useMutation(api.payments.restoreAll)

  const [aboutOpen, setAboutOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [restoreConfirm, setRestoreConfirm] = useState(false)
  const [restoreData, setRestoreData] = useState<{
    subscriptions: Array<Record<string, unknown>>
    payments?: Array<Record<string, unknown>>
  } | null>(null)

  const [budgetCap, setBudgetCap] = useState<string>(
    userSettings?.monthlyBudgetCap !== undefined ? String(userSettings.monthlyBudgetCap) : ""
  )
  const [reminderDays, setReminderDays] = useState<number>(userSettings?.reminderDays ?? 3)

  const jsonFileInputRef = useRef<HTMLInputElement>(null)
  const csvFileInputRef = useRef<HTMLInputElement>(null)

  const handleCurrencyChange = async (val: string) => {
    await setPrimaryCurrency(val)
    toast.success(`Primary currency set to ${val}`)
  }

  const handleSaveBudgetCap = async () => {
    const val = budgetCap.trim() ? parseFloat(budgetCap.trim()) : undefined
    try {
      await updateSettings({ monthlyBudgetCap: val })
      toast.success(val ? `Monthly budget limit set to ${getSymbol(primaryCurrency)}${val}` : "Budget limit removed")
    } catch {
      toast.error("Failed to update budget limit")
    }
  }

  const handleReminderDaysChange = async (days: number) => {
    setReminderDays(days)
    try {
      await updateSettings({ reminderDays: days })
      toast.success(`Reminder alert set to ${days === 0 ? "due date" : `${days} days before`}`)
    } catch {
      toast.error("Failed to update reminder timing")
    }
  }

  const handleTestNotification = async () => {
    await requestWebPushPermission()
    sendDesktopNotification("SubKeep Notification Test", "Desktop notifications are working perfectly!")
    toast.success("Desktop notification sent!")
  }

  const saveFileNativeOrWeb = async (content: string, defaultFilename: string, mimeType: string, extensionFilter: string) => {
    if (window.electronAPI?.saveFile) {
      const result = await window.electronAPI.saveFile({
        defaultFilename,
        content,
        mimeType,
        filters: [{ name: "Files", extensions: [extensionFilter] }],
      })
      if (result.success) {
        toast.success(`Saved to ${result.filePath}`)
      }
      return
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = defaultFilename
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${defaultFilename}`)
  }

  const handleExportCSV = async () => {
    if (!subscriptions || subscriptions.length === 0) {
      toast.error("No subscriptions available to export")
      return
    }
    const csvContent = exportSubscriptionsToCSV(subscriptions)
    const date = new Date().toISOString().split("T")[0]
    await saveFileNativeOrWeb(csvContent, `subkeep-subscriptions-${date}.csv`, "text/csv;charset=utf-8;", "csv")
  }

  const handleExportJSON = async () => {
    if (!subscriptions || subscriptions.length === 0) {
      toast.error("No subscriptions available to export")
      return
    }
    const data = subscriptions.map((s: {
      name: string
      icon: string
      color: string
      price: number
      currency: string
      cycle: string
      category: string
      startDate?: string
      nextBilling: string
      isActive?: boolean
      isTrial?: boolean
      trialEndDate?: string
      cancelUrl?: string
      isShared?: boolean
      totalPlanPrice?: number
      totalMembers?: number
    }) => ({
      name: s.name,
      icon: s.icon,
      color: s.color,
      price: s.price,
      currency: s.currency,
      cycle: s.cycle,
      category: s.category,
      startDate: s.startDate,
      nextBilling: s.nextBilling,
      isActive: s.isActive,
      isTrial: s.isTrial,
      trialEndDate: s.trialEndDate,
      cancelUrl: s.cancelUrl,
      isShared: s.isShared,
      totalPlanPrice: s.totalPlanPrice,
      totalMembers: s.totalMembers,
    }))
    const date = new Date().toISOString().split("T")[0]
    await saveFileNativeOrWeb(JSON.stringify({ subscriptions: data }, null, 2), `subkeep-export-${date}.json`, "application/json", "json")
  }

  const handleBackup = async () => {
    if (!subscriptions) return
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      subscriptions: subscriptions.map((s: {
        name: string
        icon: string
        color: string
        price: number
        currency: string
        cycle: string
        category: string
        startDate?: string
        nextBilling: string
        isActive?: boolean
        isTrial?: boolean
        trialEndDate?: string
        cancelUrl?: string
        isShared?: boolean
        totalPlanPrice?: number
        totalMembers?: number
      }) => ({
        name: s.name,
        icon: s.icon,
        color: s.color,
        price: s.price,
        currency: s.currency,
        cycle: s.cycle,
        category: s.category,
        startDate: s.startDate,
        nextBilling: s.nextBilling,
        isActive: s.isActive,
        isTrial: s.isTrial,
        trialEndDate: s.trialEndDate,
        cancelUrl: s.cancelUrl,
        isShared: s.isShared,
        totalPlanPrice: s.totalPlanPrice,
        totalMembers: s.totalMembers,
      })),
      payments: (payments || []).map((p: {
        name: string
        icon: string
        color: string
        amount: number
        currency: string
        category: string
        date: string
      }) => ({
        name: p.name,
        icon: p.icon,
        color: p.color,
        amount: p.amount,
        currency: p.currency,
        category: p.category,
        date: p.date,
      })),
    }
    const date = new Date().toISOString().split("T")[0]
    await saveFileNativeOrWeb(JSON.stringify(data, null, 2), `subkeep-backup-${date}.json`, "application/json", "json")
  }

  const handleOpenJsonFile = async () => {
    if (window.electronAPI?.openFile) {
      const result = await window.electronAPI.openFile({
        filters: [{ name: "JSON Files", extensions: ["json"] }],
      })
      if (result.success && result.content) {
        try {
          const data = JSON.parse(result.content)
          if (data.subscriptions && Array.isArray(data.subscriptions)) {
            setRestoreData(data)
            setRestoreConfirm(true)
          } else {
            toast.error("Invalid backup file structure")
          }
        } catch {
          toast.error("Failed to parse JSON file")
        }
      }
      return
    }

    jsonFileInputRef.current?.click()
  }

  const handleOpenCsvFile = async () => {
    if (window.electronAPI?.openFile) {
      const result = await window.electronAPI.openFile({
        filters: [{ name: "CSV Files", extensions: ["csv"] }],
      })
      if (result.success && result.content) {
        try {
          const parsedRows = parseCSVToSubscriptions(result.content)
          if (parsedRows.length > 0) {
            setRestoreData({ subscriptions: parsedRows as never[] })
            setRestoreConfirm(true)
          } else {
            toast.error("No valid subscription rows found in CSV")
          }
        } catch {
          toast.error("Failed to parse CSV file")
        }
      }
      return
    }

    csvFileInputRef.current?.click()
  }

  const handleJsonFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.subscriptions && Array.isArray(data.subscriptions)) {
          setRestoreData(data)
          setRestoreConfirm(true)
        } else {
          toast.error("Invalid backup file structure")
        }
      } catch {
        toast.error("Failed to parse JSON file")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const handleCsvFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsedRows = parseCSVToSubscriptions(event.target?.result as string)
        if (parsedRows.length > 0) {
          setRestoreData({ subscriptions: parsedRows as never[] })
          setRestoreConfirm(true)
        } else {
          toast.error("No valid subscription rows found in CSV")
        }
      } catch {
        toast.error("Failed to parse CSV file")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const handleRestore = async () => {
    if (!restoreData) return
    try {
      await restoreSubscriptions({ subscriptions: restoreData.subscriptions as never[] })
      if (restoreData.payments && restoreData.payments.length > 0) {
        await restorePayments({ payments: restoreData.payments as never[] })
      }
      setRestoreConfirm(false)
      setRestoreData(null)
      toast.success(`Successfully restored ${restoreData.subscriptions.length} subscriptions!`)
    } catch {
      toast.error("Failed to restore data")
    }
  }

  const handleDeleteAll = async () => {
    try {
      await removeAll()
      setDeleteConfirm(false)
      toast.success("All subscription data deleted")
    } catch {
      toast.error("Failed to delete data")
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <input
        ref={jsonFileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleJsonFileInput}
      />
      <input
        ref={csvFileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleCsvFileInput}
      />

      <div>
        <h1 className="text-xl font-extrabold text-foreground">Settings & Preferences</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Customize currency, notifications, budget limits, card vault, and data backups.
        </p>
      </div>

      {/* Preferences Section */}
      <div className="rounded-xl border border-border bg-background p-5 shadow-xs space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          General Preferences
        </h3>

        {/* Theme Preference */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {resolvedTheme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              <span>Theme Appearance</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Select dark, light, or system sync (Hotkey: &apos;D&apos;)
            </p>
          </div>

          <div className="flex rounded-lg border border-border bg-muted/50 p-0.5 text-xs font-medium">
            <button
              onClick={() => setTheme("light")}
              className={`rounded-md px-3 py-1 transition-all cursor-pointer ${
                theme === "light" ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground"
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`rounded-md px-3 py-1 transition-all cursor-pointer ${
                theme === "dark" ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground"
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`rounded-md px-3 py-1 transition-all cursor-pointer ${
                theme === "system" ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground"
              }`}
            >
              System
            </button>
          </div>
        </div>

        <Separator />

        {/* Primary Currency */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Globe className="size-4 text-primary" />
              <span>Primary Currency</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Used to normalize and convert all subscription totals
            </p>
          </div>

          <select
            value={primaryCurrency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="flex h-9 w-44 rounded-lg border border-border bg-background px-3 text-xs font-medium"
          >
            {currencies.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label} ({c.value})
              </option>
            ))}
          </select>
        </div>

        <Separator />

        {/* Monthly Budget Cap */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Target className="size-4 text-primary" />
                <span>Monthly Budget Limit</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Set a spending cap to receive alerts when subscriptions exceed your budget
              </p>
            </div>
          </div>

          <div className="flex gap-2 max-w-sm">
            <Input
              type="number"
              placeholder={`e.g. 50 (${primaryCurrency})`}
              value={budgetCap}
              onChange={(e) => setBudgetCap(e.target.value)}
              className="text-xs"
            />
            <Button onClick={handleSaveBudgetCap} size="sm" className="cursor-pointer text-xs shrink-0">
              Save Limit
            </Button>
          </div>
        </div>

        <Separator />

        {/* Notifications & Reminders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Bell className="size-4 text-primary" />
                <span>Renewal & Trial Reminder Timing</span>
              </div>
              <p className="text-xs text-muted-foreground">
                When to trigger desktop alerts before upcoming renewal dates
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              className="text-xs cursor-pointer h-8"
            >
              Test Alert
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2 max-w-md">
            {[
              { label: "Same day", value: 0 },
              { label: "1 day before", value: 1 },
              { label: "3 days before", value: 3 },
              { label: "7 days before", value: 7 },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleReminderDaysChange(opt.value)}
                className={`rounded-lg border px-2 py-2 text-center text-xs transition-all cursor-pointer ${
                  reminderDays === opt.value
                    ? "border-foreground bg-foreground text-background font-bold"
                    : "border-border bg-muted/40 hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Card Vault Quick Access */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="size-4 text-primary" />
              <span>Payment Methods & Card Vault</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Manage connected credit cards, spend breakdown & expiry tracking
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPaymentMethods}
            className="cursor-pointer text-xs"
          >
            Manage Cards
          </Button>
        </div>
      </div>

      {/* Data Export & Backup Section */}
      <div className="rounded-xl border border-border bg-background p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Backup, Export & Migration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3.5 text-left transition-all hover:bg-muted/60 cursor-pointer"
          >
            <FileSpreadsheet className="size-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Export as CSV</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Download spreadsheet formatted for Excel and Google Sheets
              </p>
            </div>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3.5 text-left transition-all hover:bg-muted/60 cursor-pointer"
          >
            <Download className="size-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Export JSON</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Download raw JSON records for subscriptions
              </p>
            </div>
          </button>

          <button
            onClick={handleOpenCsvFile}
            className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3.5 text-left transition-all hover:bg-muted/60 cursor-pointer"
          >
            <Upload className="size-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Import from CSV</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload CSV spreadsheet to batch import subscriptions
              </p>
            </div>
          </button>

          <button
            onClick={handleBackup}
            className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3.5 text-left transition-all hover:bg-muted/60 cursor-pointer"
          >
            <FileJson className="size-5 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Full JSON Backup</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Export complete database including payment history
              </p>
            </div>
          </button>

          <button
            onClick={handleOpenJsonFile}
            className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3.5 text-left transition-all hover:bg-muted/60 cursor-pointer sm:col-span-2"
          >
            <Download className="size-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Restore JSON Backup</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Restore subscriptions and payments from a JSON backup file
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Danger Zone & About Section */}
      <div className="rounded-xl border border-border bg-background p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          System & Danger Zone
        </h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Info className="size-4 text-primary" />
              <span>About SubKeep Desktop</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Version 1.0.0 &middot; Electron Desktop App
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={() => setAboutOpen(true)} className="cursor-pointer text-xs">
            App Info
          </Button>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <Trash2 className="size-4" />
              <span>Delete All Data</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Permanently wipe all subscriptions, cards, and payment history
            </p>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteConfirm(true)}
            className="cursor-pointer text-xs"
          >
            Delete All Data
          </Button>
        </div>
      </div>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="max-w-sm rounded-xl p-5" onClose={() => setDeleteConfirm(false)}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive">
              Wipe All Subscription Data?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This action is permanent and cannot be reversed. Make sure you have exported a backup before continuing.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 cursor-pointer text-xs"
              onClick={() => setDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 cursor-pointer text-xs"
              onClick={handleDeleteAll}
            >
              Confirm Wipe
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreConfirm} onOpenChange={setRestoreConfirm}>
        <DialogContent className="max-w-sm rounded-xl p-5" onClose={() => setRestoreConfirm(false)}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Restore Subscriptions?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Found {restoreData?.subscriptions?.length || 0} subscriptions ready to restore into your account.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 cursor-pointer text-xs"
              onClick={() => {
                setRestoreConfirm(false)
                setRestoreData(null)
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 cursor-pointer text-xs font-bold"
              onClick={handleRestore}
            >
              Restore Records
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* About Dialog */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-md rounded-xl p-5" onClose={() => setAboutOpen(false)}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Laptop className="size-5 text-primary" />
              <DialogTitle className="text-base font-bold">About SubKeep Desktop</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Modern Subscription & Recurring Expense Tracker
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-bold">1.0.0</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Runtime</span>
              <span className="font-medium">Electron + React 19 + Vite</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Backend & Realtime</span>
              <span className="font-medium">Convex Realtime Database</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Authentication</span>
              <span className="font-medium">Clerk Auth</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Security</span>
              <span className="font-medium flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-3.5" /> End-to-End Encrypted Sessions
              </span>
            </div>
          </div>

          <Button onClick={() => setAboutOpen(false)} className="w-full text-xs cursor-pointer">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

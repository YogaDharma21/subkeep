"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { useQuery, useMutation } from "convex/react"
import { useAuth, useUser, useClerk } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { api } from "@/convex/_generated/api"
import {
  SlidersHorizontal,
  Download,
  Upload,
  Info,
  Trash2,
  ChevronRight,
  FileJson,
  FileSpreadsheet,
  ExternalLink,
  CreditCard,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SettingsSheet } from "@/components/settings-sheet"
import { PaymentMethodsSheet } from "@/components/payment-methods-sheet"
import { exportSubscriptionsToCSV, parseCSVToSubscriptions } from "@/lib/csv"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { getSymbol } from "@/lib/constants"
import { toast } from "sonner"

export default function MorePage() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { theme, resolvedTheme } = useTheme()
  const { primaryCurrency } = usePrimaryCurrency()
  const isDark = resolvedTheme === "dark" || theme === "dark"

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [restoreConfirm, setRestoreConfirm] = useState(false)
  const [restoreData, setRestoreData] = useState<{
    subscriptions: Array<Record<string, unknown>>
    payments?: Array<Record<string, unknown>>
  } | null>(null)

  const jsonFileInputRef = useRef<HTMLInputElement>(null)
  const csvFileInputRef = useRef<HTMLInputElement>(null)

  const removeAll = useMutation(api.subscriptions.removeAll)
  const restoreSubscriptions = useMutation(api.subscriptions.restoreAll)
  const restorePayments = useMutation(api.payments.restoreAll)

  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const payments = useQuery(api.payments.list, isSignedIn ? {} : "skip")

  const handleDeleteAll = async () => {
    try {
      await removeAll()
      setDeleteConfirm(false)
      toast.success("All subscription data deleted")
    } catch {
      toast.error("Failed to delete data")
    }
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    if (!subscriptions || subscriptions.length === 0) {
      toast.error("No subscriptions available to export")
      return
    }
    const csvContent = exportSubscriptionsToCSV(subscriptions)
    const date = new Date().toISOString().split("T")[0]
    downloadFile(csvContent, `subkeep-subscriptions-${date}.csv`, "text/csv;charset=utf-8;")
    toast.success("Exported subscriptions to CSV")
  }

  const handleExportJSON = () => {
    if (!subscriptions || subscriptions.length === 0) {
      toast.error("No subscriptions available to export")
      return
    }
    const data = subscriptions.map((s) => ({
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
    downloadFile(JSON.stringify({ subscriptions: data }, null, 2), `subkeep-export-${date}.json`, "application/json")
    toast.success("Exported subscriptions to JSON")
  }

  const handleBackup = () => {
    if (!subscriptions || !payments) return
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      subscriptions: subscriptions.map((s) => ({
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
      payments: payments.map((p) => ({
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
    downloadFile(JSON.stringify(data, null, 2), `subkeep-backup-${date}.json`, "application/json")
    toast.success("Full system backup exported")
  }

  const handleJsonFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        toast.error("Invalid JSON file")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <input
        ref={jsonFileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleJsonFileSelect}
      />
      <input
        ref={csvFileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleCsvFileSelect}
      />

      {/* User Profile Card */}
      {user && (
        <div className="flex items-center gap-3.5 rounded-xl border border-border bg-background p-4 shadow-2xs">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-xs">
            {(user.fullName || user.primaryEmailAddress?.emailAddress || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-foreground truncate">
              {user.fullName || "SubKeep User"}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      )}

      {/* Category: GENERAL & PREFERENCES */}
      <div className="space-y-2">
        <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          General & Preferences
        </h3>
        <div className="overflow-hidden rounded-xl border border-border bg-background divide-y divide-border shadow-2xs">
          {/* Preferences */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex w-full cursor-pointer items-center gap-3.5 p-4 text-left transition-colors hover:bg-accent/50 dark:hover:bg-accent/40 active:bg-accent/70"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground/80 shrink-0">
              <SlidersHorizontal className="size-4 text-foreground/80" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">Preferences</div>
              <div className="text-xs text-muted-foreground">
                {isDark ? "Dark" : "Light"} mode · {primaryCurrency} ({getSymbol(primaryCurrency)}) · Budget cap & alerts
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>

          {/* Payment Methods & Card Vault */}
          <button
            onClick={() => setPaymentMethodsOpen(true)}
            className="flex w-full cursor-pointer items-center gap-3.5 p-4 text-left transition-colors hover:bg-accent/50 dark:hover:bg-accent/40 active:bg-accent/70"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground/80 shrink-0">
              <CreditCard className="size-4 text-foreground/80" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">Payment Methods & Card Vault</div>
              <div className="text-xs text-muted-foreground">
                Track credit cards, card expiry alerts & spend breakdown
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Category: DATA & BACKUP */}
      <div className="space-y-2">
        <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Data & Backup
        </h3>
        <div className="overflow-hidden rounded-xl border border-border bg-background divide-y divide-border shadow-2xs">
          <button
            onClick={handleExportCSV}
            className="flex w-full cursor-pointer items-center gap-3.5 p-4 text-left transition-colors hover:bg-accent/50 dark:hover:bg-accent/40 active:bg-accent/70"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground/80 shrink-0">
              <FileSpreadsheet className="size-4 text-foreground/80" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">Export as CSV</div>
              <div className="text-xs text-muted-foreground">Download spreadsheet formatted for Excel / Sheets</div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>

          <button
            onClick={() => csvFileInputRef.current?.click()}
            className="flex w-full cursor-pointer items-center gap-3.5 p-4 text-left transition-colors hover:bg-accent/50 dark:hover:bg-accent/40 active:bg-accent/70"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground/80 shrink-0">
              <Upload className="size-4 text-foreground/80" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">Import from CSV</div>
              <div className="text-xs text-muted-foreground">Upload spreadsheet to restore or migrate subscriptions</div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>

          <button
            onClick={handleExportJSON}
            className="flex w-full cursor-pointer items-center gap-3.5 p-4 text-left transition-colors hover:bg-accent/50 dark:hover:bg-accent/40 active:bg-accent/70"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground/80 shrink-0">
              <Download className="size-4 text-foreground/80" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">Export JSON</div>
              <div className="text-xs text-muted-foreground">Download raw JSON subscription records</div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>

          <button
            onClick={handleBackup}
            className="flex w-full cursor-pointer items-center gap-3.5 p-4 text-left transition-colors hover:bg-accent/50 dark:hover:bg-accent/40 active:bg-accent/70"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground/80 shrink-0">
              <FileJson className="size-4 text-foreground/80" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">Full Backup</div>
              <div className="text-xs text-muted-foreground">Export full backup including payment history</div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>

          <button
            onClick={() => jsonFileInputRef.current?.click()}
            className="flex w-full cursor-pointer items-center gap-3.5 p-4 text-left transition-colors hover:bg-accent/50 dark:hover:bg-accent/40 active:bg-accent/70"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground/80 shrink-0">
              <Upload className="size-4 text-foreground/80" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">Restore JSON Backup</div>
              <div className="text-xs text-muted-foreground">Import from a previous SubKeep JSON backup</div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Category: ABOUT */}
      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-2xs">
        <button
          onClick={() => setAboutOpen(true)}
          className="flex w-full cursor-pointer items-center gap-3.5 p-4 text-left transition-colors hover:bg-accent/50 dark:hover:bg-accent/40 active:bg-accent/70"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground/80 shrink-0">
            <Info className="size-4 text-foreground/80" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground">About SubKeep</div>
            <div className="text-xs text-muted-foreground">Version 0.0.1</div>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </div>

      {/* Category: ACCOUNT & DANGER ZONE */}
      <div className="overflow-hidden rounded-xl border border-border bg-background divide-y divide-border shadow-2xs">
        {isSignedIn && (
          <button
            onClick={() => signOut()}
            className="flex w-full cursor-pointer items-center gap-3.5 p-4 text-left transition-colors hover:bg-accent/50 dark:hover:bg-accent/40 active:bg-accent/70"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground/80 shrink-0">
              <LogOut className="size-4 text-foreground/80" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">Sign Out</div>
              <div className="text-xs text-muted-foreground">Log out of this device and session</div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )}

        <button
          onClick={() => setDeleteConfirm(true)}
          className="flex w-full cursor-pointer items-center gap-3.5 p-4 text-left transition-colors hover:bg-destructive/10 active:bg-destructive/20 group"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive shrink-0">
            <Trash2 className="size-4 text-destructive" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-destructive">
              Delete All Data
            </div>
            <div className="text-xs text-muted-foreground">
              Permanently erase all subscriptions and payment logs
            </div>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-destructive transition-colors" />
        </button>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-background p-6 border border-border shadow-xl">
            <div className="mb-4 flex justify-center">
              <div className="flex size-12 items-center justify-center rounded-lg bg-destructive/10">
                <Trash2 className="size-6 text-destructive" />
              </div>
            </div>
            <h3 className="mb-2 text-center text-lg font-semibold">
              Delete All Data?
            </h3>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              This will permanently remove all your subscriptions and payment records. This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
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
                onClick={handleDeleteAll}
              >
                Delete All
              </Button>
            </div>
          </div>
        </div>
      )}

      {restoreConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-background p-6 border border-border shadow-xl">
            <div className="mb-4 flex justify-center">
              <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
                <Upload className="size-6 text-foreground" />
              </div>
            </div>
            <h3 className="mb-2 text-center text-lg font-semibold">
              Restore Subscriptions?
            </h3>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              This will replace your current subscription records with the imported file.
            </p>
            <div className="mb-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <div>{restoreData?.subscriptions?.length || 0} subscriptions ready to import</div>
              {restoreData?.payments && (
                <div>{restoreData.payments.length} payments included</div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 cursor-pointer"
                onClick={() => {
                  setRestoreConfirm(false)
                  setRestoreData(null)
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 cursor-pointer"
                onClick={handleRestore}
              >
                Restore
              </Button>
            </div>
          </div>
        </div>
      )}

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
      <PaymentMethodsSheet open={paymentMethodsOpen} onOpenChange={setPaymentMethodsOpen} />

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Image
                src="/app-icon.png"
                alt="SubKeep"
                width={36}
                height={36}
                className="size-9 rounded-xl object-contain shadow-xs"
              />
              <div>
                <DialogTitle>About SubKeep</DialogTitle>
                <p className="text-xs text-muted-foreground">Version 0.0.1</p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground pt-1">
            <p>
              SubKeep is a sleek subscription management and analytics platform designed to keep your recurring expenses organized.
            </p>
            <p>
              Track monthly costs, view upcoming billing dates on a calendar, manage household group split plans with SplitKeep, track credit card vaults, and prevent unexpected charges.
            </p>
            <a
              href="https://github.com/YogaDharma21/subkeep"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-foreground hover:underline font-medium pt-1"
            >
              <ExternalLink className="size-4" />
              View on GitHub
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

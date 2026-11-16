"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { useQuery, useMutation, useConvex } from "convex/react"
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
import { exportSubscriptionsToCSV, parseCSVToSubscriptions, exportTransactionsToCSV } from "@/lib/csv"
import { parseAndNormalizeBackup, downloadBackupJson, ParsedBackup } from "@/lib/backup"
import { RestorePreviewDialog } from "@/components/restore-preview-dialog"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { getSymbol } from "@/lib/constants"
import { toast } from "sonner"

export default function MorePage() {
  useDocumentTitle("Settings")
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
  const [restorePreviewOpen, setRestorePreviewOpen] = useState(false)
  const [parsedBackup, setParsedBackup] = useState<ParsedBackup | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)

  const jsonFileInputRef = useRef<HTMLInputElement>(null)
  const csvFileInputRef = useRef<HTMLInputElement>(null)

  const convex = useConvex()
  const restoreDataMutation = useMutation(api.backup.restoreData)
  const removeAll = useMutation(api.subscriptions.removeAll)
  const removeAllFinance = useMutation(api.transactions.removeAll)

  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const transactions = useQuery(api.transactions.list, isSignedIn ? {} : "skip")

  const handleDeleteAll = async () => {
    try {
      await removeAllFinance()
      await removeAll()
      setDeleteConfirm(false)
      toast.success("All finance data deleted")
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

  const handleBackup = async () => {
    try {
      const data = await convex.query(api.backup.exportData, {})
      downloadBackupJson(data)
      toast.success("Full system backup exported")
    } catch {
      toast.error("Failed to export backup")
    }
  }

  const handleExportTransactionsCSV = () => {
    if (!transactions || transactions.length === 0) {
      toast.error("No transactions available to export")
      return
    }
    const rows = exportTransactionsToCSV(transactions)
    const date = new Date().toISOString().split("T")[0]
    downloadFile(rows, `subkeep-transactions-${date}.csv`, "text/csv;charset=utf-8;")
    toast.success("Exported transactions to CSV")
  }

  const handleJsonFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsed = parseAndNormalizeBackup(text)
        setParsedBackup(parsed)
        setRestorePreviewOpen(true)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Invalid backup file")
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
          const parsed = parseAndNormalizeBackup(parsedRows)
          setParsedBackup(parsed)
          setRestorePreviewOpen(true)
        } else {
          toast.error("No valid subscription rows found in CSV")
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to parse CSV file")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const handleConfirmRestore = async () => {
    if (!parsedBackup) return
    setIsRestoring(true)
    try {
      await restoreDataMutation({
        version: parsedBackup.version,
        exportedAt: parsedBackup.exportedAt,
        data: parsedBackup.data,
      })
      toast.success("Data successfully restored")
      setRestorePreviewOpen(false)
      setParsedBackup(null)
    } catch {
      toast.error("Failed to restore data")
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8">
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
        <div className="surface p-5">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-foreground/[0.05] text-base font-medium text-foreground">
              {(user.fullName || user.primaryEmailAddress?.emailAddress || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-medium text-foreground">
                {user.fullName || "SubKeep User"}
              </h2>
              <p className="truncate text-xs text-muted-foreground">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>
            <span className="label hidden sm:block">Signed in</span>
          </div>
        </div>
      )}

      {/* Category: GENERAL & PREFERENCES */}
      <div className="space-y-2">
        <h3 className="label px-1">
          General & preferences
        </h3>
        <div className="surface overflow-hidden divide-y divide-border">
          {/* Preferences */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex w-full cursor-pointer items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.05]"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-foreground/[0.03] text-foreground/75">
              <SlidersHorizontal className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">Preferences</div>
              <div className="text-xs text-muted-foreground">
                {isDark ? "Dark" : "Light"} mode · {primaryCurrency} ({getSymbol(primaryCurrency)}) · Budget cap & alerts
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>

          {/* Payment Methods & Card Vault */}
          <button
            onClick={() => setPaymentMethodsOpen(true)}
            className="flex w-full cursor-pointer items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.05]"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-foreground/[0.03] text-foreground/75">
              <CreditCard className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">Payment Methods & Card Vault</div>
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
        <h3 className="label px-1">
          Data & backup
        </h3>
        <div className="surface overflow-hidden divide-y divide-border">
          <button
            onClick={handleExportTransactionsCSV}
            className="flex w-full cursor-pointer items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.05]"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-foreground/[0.03] text-foreground/75">
              <FileSpreadsheet className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">Export Transactions CSV</div>
              <div className="text-xs text-muted-foreground">Download expenses & income for Excel / Sheets</div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex w-full cursor-pointer items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.05]"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-foreground/[0.03] text-foreground/75">
              <FileSpreadsheet className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">Export Subscriptions CSV</div>
              <div className="text-xs text-muted-foreground">Download spreadsheet formatted for Excel / Sheets</div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>

          <button
            onClick={() => csvFileInputRef.current?.click()}
            className="flex w-full cursor-pointer items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.05]"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-foreground/[0.03] text-foreground/75">
              <Upload className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">Import from CSV</div>
              <div className="text-xs text-muted-foreground">Upload spreadsheet to restore or migrate subscriptions</div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>

          <button
            onClick={handleExportJSON}
            className="flex w-full cursor-pointer items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.05]"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-foreground/[0.03] text-foreground/75">
              <Download className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">Export JSON</div>
              <div className="text-xs text-muted-foreground">Download raw JSON subscription records</div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>

          <button
            onClick={handleBackup}
            className="flex w-full cursor-pointer items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.05]"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-foreground/[0.03] text-foreground/75">
              <FileJson className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">Full Backup</div>
              <div className="text-xs text-muted-foreground">Export everything: subs, transactions, accounts, budgets</div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>

          <button
            onClick={() => jsonFileInputRef.current?.click()}
            className="flex w-full cursor-pointer items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.05]"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-foreground/[0.03] text-foreground/75">
              <Upload className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">Restore JSON Backup</div>
              <div className="text-xs text-muted-foreground">Import from a previous SubKeep JSON backup</div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Category: ABOUT */}
      <div className="surface overflow-hidden">
        <button
          onClick={() => setAboutOpen(true)}
          className="flex w-full cursor-pointer items-center gap-3.5 p-4 text-left transition-colors hover:bg-accent/50 dark:hover:bg-accent/40 active:bg-accent/70"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-foreground/[0.03] text-foreground/75">
            <Info className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-foreground">About SubKeep</div>
            <div className="text-xs text-muted-foreground">Version 0.0.1</div>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </div>

      {/* Category: ACCOUNT & DANGER ZONE */}
      <div className="surface overflow-hidden divide-y divide-border">
        {isSignedIn && (
          <button
            onClick={() => signOut()}
            className="flex w-full cursor-pointer items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.05]"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-foreground/[0.03] text-foreground/75">
              <LogOut className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">Sign Out</div>
              <div className="text-xs text-muted-foreground">Log out of this device and session</div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )}

        <button
          onClick={() => setDeleteConfirm(true)}
          className="flex w-full cursor-pointer items-center gap-3.5 p-4 text-left transition-colors hover:bg-destructive/10 active:bg-destructive/20 group"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-destructive/10 text-destructive">
            <Trash2 className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-destructive">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-popover p-6 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.95)]">
            <div className="mb-4 flex justify-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10">
                <Trash2 className="size-6 text-destructive" />
              </div>
            </div>
            <h3 className="mb-2 text-center text-lg font-medium tracking-tight">
              Delete everything?
            </h3>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              This removes all subscriptions and payment records. You cannot undo this.
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

      <RestorePreviewDialog
        open={restorePreviewOpen}
        onOpenChange={setRestorePreviewOpen}
        backup={parsedBackup}
        onConfirm={handleConfirmRestore}
        isRestoring={isRestoring}
      />

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

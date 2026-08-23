"use client"

import { useState, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import {
  Settings,
  Download,
  Upload,
  Info,
  Trash2,
  ChevronRight,
  FileJson,
  FileSpreadsheet,
  ExternalLink,
  CreditCard,
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
import { toast } from "sonner"

export default function MorePage() {
  const { isSignedIn } = useAuth()
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

  const handleItemClick = (id: string) => {
    if (id === "settings") setSettingsOpen(true)
    else if (id === "cards") setPaymentMethodsOpen(true)
    else if (id === "export-csv") handleExportCSV()
    else if (id === "export-json") handleExportJSON()
    else if (id === "import-csv") csvFileInputRef.current?.click()
    else if (id === "backup") handleBackup()
    else if (id === "restore") jsonFileInputRef.current?.click()
    else if (id === "about") setAboutOpen(true)
  }

  const menuGroups = [
    [
      {
        id: "settings",
        icon: Settings,
        label: "Settings & Budget Cap",
        description: "Dark mode, primary currency, monthly budget limit",
      },
      {
        id: "cards",
        icon: CreditCard,
        label: "Payment Methods & Card Vault",
        description: "Track credit cards, card expiry alerts & spend breakdown",
      },
    ],
    [
      {
        id: "export-csv",
        icon: FileSpreadsheet,
        label: "Export as CSV",
        description: "Download spreadsheet formatted for Excel / Sheets",
      },
      {
        id: "import-csv",
        icon: Upload,
        label: "Import from CSV",
        description: "Upload spreadsheet to restore or migrate subscriptions",
      },
      {
        id: "export-json",
        icon: Download,
        label: "Export JSON",
        description: "Download raw JSON subscription records",
      },
      {
        id: "backup",
        icon: FileJson,
        label: "Full Backup",
        description: "Export full backup including payment history",
      },
      {
        id: "restore",
        icon: Upload,
        label: "Restore JSON Backup",
        description: "Import from a previous SubKeep JSON backup",
      },
    ],
    [
      {
        id: "about",
        icon: Info,
        label: "About SubKeep",
        description: "Version 0.0.1",
      },
    ],
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-4">
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

      {menuGroups.map((group, gi) => (
        <div
          key={gi}
          className="mb-3 overflow-hidden rounded-lg border border-border bg-background divide-y divide-border"
        >
          {group.map((item, ii) => {
            const Icon = item.icon
            return (
              <button
                key={ii}
                onClick={() => handleItemClick(item.id)}
                className="flex w-full cursor-pointer items-center gap-3.5 p-4 text-left transition-colors hover:bg-accent/50 dark:hover:bg-accent/40 active:bg-accent/70"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground/80">
                  <Icon className="size-4 text-foreground/80" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">{item.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            )
          })}
        </div>
      ))}

      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <button
          onClick={() => setDeleteConfirm(true)}
          className="flex w-full cursor-pointer items-center gap-3.5 p-4 text-left transition-colors hover:bg-destructive/10 active:bg-destructive/20 group"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <Trash2 className="size-4 text-destructive" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-destructive">
              Delete All Data
            </div>
            <div className="text-xs text-muted-foreground">
              Remove all subscriptions and payment logs
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
            <DialogTitle>About SubKeep</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
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
              className="flex items-center gap-2 text-foreground hover:underline"
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

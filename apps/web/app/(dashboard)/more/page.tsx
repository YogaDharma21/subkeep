"use client"

import { useState, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import {
  Settings,
  Download,
  Upload,
  Bell,
  Info,
  Star,
  Trash2,
  ChevronRight,
  FileJson,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SettingsSheet } from "@/components/settings-sheet"


export default function MorePage() {
  const { isSignedIn } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [restoreConfirm, setRestoreConfirm] = useState(false)
  const [restoreData, setRestoreData] = useState<{
    subscriptions: Array<Record<string, unknown>>
    payments: Array<Record<string, unknown>>
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const removeAll = useMutation(api.subscriptions.removeAll)
  const restoreSubscriptions = useMutation(api.subscriptions.restoreAll)
  const restorePayments = useMutation(api.payments.restoreAll)

  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const payments = useQuery(api.payments.list, isSignedIn ? {} : "skip")

  const handleDeleteAll = async () => {
    await removeAll()
    setDeleteConfirm(false)
  }

  const downloadJson = (data: Record<string, unknown>, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportData = () => {
    if (!subscriptions) return
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
    }))
    const date = new Date().toISOString().split("T")[0]
    downloadJson({ subscriptions: data }, `subkeep-export-${date}.json`)
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
    downloadJson(data, `subkeep-backup-${date}.json`)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.subscriptions && Array.isArray(data.subscriptions)) {
          setRestoreData(data)
          setRestoreConfirm(true)
        }
      } catch {
        alert("Invalid backup file")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const handleRestore = async () => {
    if (!restoreData) return
    await restoreSubscriptions({ subscriptions: restoreData.subscriptions as never[] })
    if (restoreData.payments && restoreData.payments.length > 0) {
      await restorePayments({ payments: restoreData.payments as never[] })
    }
    setRestoreConfirm(false)
    setRestoreData(null)
  }

  const menuGroups = [
    [
      {
        icon: Settings,
        label: "Settings",
        description: "Theme, notifications, currency",
        color: "bg-muted-foreground",
        onClick: () => setSettingsOpen(true),
      },
      {
        icon: Download,
        label: "Export Data",
        description: "Download subscriptions as JSON",
        color: "bg-blue-500",
        onClick: handleExportData,
      },
      {
        icon: FileJson,
        label: "Backup",
        description: "Export all data including payments",
        color: "bg-green-500",
        onClick: handleBackup,
      },
      {
        icon: Upload,
        label: "Restore",
        description: "Import data from backup file",
        color: "bg-teal-500",
        onClick: () => fileInputRef.current?.click(),
      },
      {
        icon: Bell,
        label: "Reminders",
        description: "Get notified before billing",
        color: "bg-orange-500",
        onClick: () => {},
      },
    ],
    [
      {
        icon: Info,
        label: "About SubKeep",
        description: "Version 1.0.0",
        color: "bg-purple-500",
        onClick: () => setAboutOpen(true),
      },
      {
        icon: Star,
        label: "Rate SubKeep",
        description: "Help us improve with your feedback",
        color: "bg-pink-500",
        onClick: () => {},
      },
    ],
  ]

  return (
    <div className="p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelect}
      />

      {menuGroups.map((group, gi) => (
        <div
          key={gi}
          className={`mb-3 overflow-hidden rounded-xl border border-border bg-background`}
        >
          {group.map((item, ii) => {
            const Icon = item.icon
            return (
              <button
                key={ii}
                onClick={item.onClick}
                className="flex w-full items-center gap-3.5 p-4 text-left transition-colors hover:bg-muted active:bg-muted/80"
              >
                <div
                  className={`flex size-9 items-center justify-center rounded-xl ${item.color}`}
                >
                  <Icon className="size-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{item.label}</div>
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

      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <button
          onClick={() => setDeleteConfirm(true)}
          className="flex w-full items-center gap-3.5 p-4 text-left text-red-500 transition-colors hover:bg-muted active:bg-muted/80"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-red-500">
            <Trash2 className="size-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">Delete All Data</div>
            <div className="text-xs text-muted-foreground">
              Remove all subscriptions
            </div>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-background p-6">
            <div className="mb-4 flex justify-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10">
                <Trash2 className="size-6 text-red-500" />
              </div>
            </div>
            <h3 className="mb-2 text-center text-lg font-semibold">
              Delete All Data?
            </h3>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              This will permanently remove all your subscriptions. This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
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
                onClick={handleDeleteAll}
              >
                Delete All
              </Button>
            </div>
          </div>
        </div>
      )}

      {restoreConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-background p-6">
            <div className="mb-4 flex justify-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10">
                <Upload className="size-6 text-green-500" />
              </div>
            </div>
            <h3 className="mb-2 text-center text-lg font-semibold">
              Restore Data?
            </h3>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              This will replace all your current data with the backup. This
              action cannot be undone.
            </p>
            <div className="mb-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <div>{restoreData?.subscriptions?.length || 0} subscriptions</div>
              <div>{restoreData?.payments?.length || 0} payments</div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRestoreConfirm(false)
                  setRestoreData(null)
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={handleRestore}
              >
                Restore
              </Button>
            </div>
          </div>
        </div>
      )}

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>About SubKeep</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              SubKeep is a subscription tracker that helps you manage and visualize
              all your recurring payments in one place.
            </p>
            <p>
              Track monthly costs, view upcoming billing dates on a calendar, and
              get insights into your spending habits.
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

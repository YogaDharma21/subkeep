"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Settings,
  Download,
  CloudUpload,
  Bell,
  Info,
  Star,
  Trash2,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SettingsSheet } from "@/components/settings-sheet"


export default function MorePage() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const removeAll = useMutation(api.subscriptions.removeAll)

  const handleDeleteAll = async () => {
    await removeAll()
    setDeleteConfirm(false)
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
        description: "Download your subscription data",
        color: "bg-blue-500",
        onClick: () => {},
      },
      {
        icon: CloudUpload,
        label: "Backup & Restore",
        description: "Sync your data across devices",
        color: "bg-green-500",
        onClick: () => {},
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
        onClick: () => {},
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

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}

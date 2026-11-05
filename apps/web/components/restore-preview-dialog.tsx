"use client"

import * as React from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { type ParsedBackup } from "@/lib/backup"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface RestorePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  backup: ParsedBackup | null
  onConfirm: () => Promise<void> | void
  isRestoring: boolean
}

function getVersionLabel(version: number): string {
  switch (version) {
    case 3:
      return "v3 - Full Database"
    case 2:
      return "v2 - Subscriptions & Payments"
    case 1:
      return "v1 - Subscriptions Only"
    default:
      return `v${version}`
  }
}

function formatExportedDate(dateString?: string): string | null {
  if (!dateString) return null
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return dateString
  }
}

export function RestorePreviewDialog({
  open,
  onOpenChange,
  backup,
  onConfirm,
  isRestoring,
}: RestorePreviewDialogProps) {
  if (!backup) {
    return null
  }

  const breakdownItems = [
    {
      label: "Subscriptions",
      value: backup.summary.counts.subscriptions.toLocaleString(),
    },
    {
      label: "Accounts",
      value: backup.summary.counts.accounts.toLocaleString(),
    },
    {
      label: "Transactions",
      value: backup.summary.counts.transactions.toLocaleString(),
    },
    {
      label: "Budgets",
      value: backup.summary.counts.budgets.toLocaleString(),
    },
    {
      label: "Payment Methods",
      value: backup.summary.counts.paymentMethods.toLocaleString(),
    },
    {
      label: "Payment Records",
      value: backup.summary.counts.payments.toLocaleString(),
    },
    {
      label: "Settings",
      value: backup.data.userSettings ? "Configured" : "None",
    },
  ]

  const exportedDate = formatExportedDate(backup.exportedAt)

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isRestoring) return
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-w-md gap-5" showCloseButton={!isRestoring}>
        <DialogHeader className="gap-1.5 text-left">
          <DialogTitle className="text-base font-semibold">
            Restore Backup
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Review backup contents before replacing data.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-surface-inset flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Format</span>
            <Badge
              variant="secondary"
              className="border border-border font-mono text-[11px] font-normal"
            >
              {getVersionLabel(backup.version)}
            </Badge>
          </div>
          {exportedDate && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>Exported:</span>
              <span className="font-mono text-foreground tabular-nums">
                {exportedDate}
              </span>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-inset border-b border-border text-muted-foreground">
              <tr>
                <th className="px-3.5 py-2 font-medium">Category</th>
                <th className="px-3.5 py-2 text-right font-medium">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {breakdownItems.map((item) => (
                <tr
                  key={item.label}
                  className="hover:bg-surface-inset/50 transition-colors"
                >
                  <td className="px-3.5 py-2 text-foreground">{item.label}</td>
                  <td className="px-3.5 py-2 text-right font-mono text-foreground tabular-nums">
                    {item.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p className="leading-relaxed">
            Warning: Restoring this backup will replace existing data in the
            affected categories. This action cannot be reversed.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isRestoring}
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isRestoring}
            onClick={() => void onConfirm()}
            className="cursor-pointer"
          >
            {isRestoring && <Loader2 className="size-4 animate-spin" />}
            Restore Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

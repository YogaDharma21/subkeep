"use client"

import * as React from "react"
import { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { getCancellationGuide } from "@/lib/default-templates"
import { Check, Compass, ExternalLink, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface CancellationGuideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscriptionName: string
  customCancelUrl?: string
}

export function CancellationGuideDialog({
  open,
  onOpenChange,
  subscriptionName,
  customCancelUrl,
}: CancellationGuideDialogProps) {
  const guide = useMemo(
    () => getCancellationGuide(subscriptionName, customCancelUrl),
    [subscriptionName, customCancelUrl]
  )

  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({})

  // Reset checklist whenever the dialog is reopened or target subscription changes
  useEffect(() => {
    if (open) {
      setCheckedSteps({})
    }
  }, [open, subscriptionName])

  const toggleStep = (index: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const completedCount = useMemo(
    () => guide.steps.filter((_, idx) => !!checkedSteps[idx]).length,
    [guide.steps, checkedSteps]
  )

  const progressPercentage =
    guide.steps.length > 0 ? Math.round((completedCount / guide.steps.length) * 100) : 0

  const allCompleted = completedCount === guide.steps.length && guide.steps.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-5 sm:p-6">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2.5">
            <span className="surface-inset flex size-9 shrink-0 items-center justify-center rounded-xl text-foreground shadow-xs">
              <Compass className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold truncate">
                Cancel {subscriptionName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {guide.isGeneric ? "Standard cancellation walkthrough" : "Step-by-step walkthrough guide"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Direct Link Callout */}
        {guide.cancelUrl ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-inset/60 p-3">
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-xs font-medium text-foreground">Direct Cancellation Page</p>
              <p className="truncate text-[11px] text-muted-foreground font-mono">
                {guide.cancelUrl}
              </p>
            </div>
            <a
              href={guide.cancelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "shrink-0 cursor-pointer text-xs"
              )}
            >
              <span>Open</span>
              <ExternalLink className="size-3 ml-1" />
            </a>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-inset/60 p-3">
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-xs font-medium text-foreground">Search Provider Settings</p>
              <p className="truncate text-[11px] text-muted-foreground">
                Find online cancellation for {subscriptionName}
              </p>
            </div>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`how to cancel ${subscriptionName} subscription`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "shrink-0 cursor-pointer text-xs"
              )}
            >
              <span>Search</span>
              <ExternalLink className="size-3 ml-1" />
            </a>
          </div>
        )}

        {/* Checklist Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Checklist</span>
            <span className="font-mono tabular-nums text-[11px]">
              {completedCount} / {guide.steps.length} completed ({progressPercentage}%)
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-inset">
            <div
              className={cn(
                "h-full transition-all duration-300 ease-out",
                allCompleted ? "bg-[var(--emerald,#a9bfa9)]" : "bg-primary"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Interactive Steps List */}
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {guide.steps.map((step, index) => {
            const isDone = !!checkedSteps[index]
            return (
              <button
                key={index}
                type="button"
                onClick={() => toggleStep(index)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-2.5 sm:p-3 text-left transition-colors cursor-pointer",
                  isDone
                    ? "border-border/40 bg-surface-inset/30 text-muted-foreground"
                    : "border-border bg-surface-inset/70 text-foreground hover:bg-surface-inset"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-mono tabular-nums transition-colors",
                    isDone
                      ? "border-[rgba(169,191,169,0.3)] bg-[rgba(169,191,169,0.12)] text-[var(--emerald,#a9bfa9)]"
                      : "border-border bg-surface text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="size-3" /> : index + 1}
                </div>
                <span
                  className={cn(
                    "text-xs leading-relaxed select-none",
                    isDone && "line-through opacity-70"
                  )}
                >
                  {step}
                </span>
              </button>
            )
          })}
        </div>

        <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-2">
          {completedCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCheckedSteps({})}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer h-8 px-2"
            >
              <RotateCcw className="size-3 mr-1" />
              Reset
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer text-xs"
          >
            {allCompleted ? "Done" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

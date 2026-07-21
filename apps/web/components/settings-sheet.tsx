"use client"

import { Moon, Bell, DollarSign, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { theme, setTheme } = useTheme()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl" showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between border-b border-border p-4">
          <SheetTitle>Settings</SheetTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </SheetHeader>

        <div className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Moon className="size-5 text-muted-foreground" />
                <span className="text-sm">Dark Mode</span>
              </div>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="relative h-7 w-12 rounded-full bg-muted transition-colors data-[state=on]:bg-foreground"
                data-state={theme === "dark" ? "on" : "off"}
              >
                <span
                  className="absolute left-1 top-1 h-5 w-5 rounded-full bg-background shadow-sm transition-transform data-[state=on]:translate-x-5"
                  data-state={theme === "dark" ? "on" : "off"}
                />
              </button>
            </div>

            <Separator />

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Bell className="size-5 text-muted-foreground" />
                <span className="text-sm">Notifications</span>
              </div>
              <button className="relative h-7 w-12 rounded-full bg-foreground data-[state=on]:bg-foreground">
                <span className="absolute left-1 top-1 h-5 w-5 translate-x-5 rounded-full bg-background shadow-sm" />
              </button>
            </div>

            <Separator />

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <DollarSign className="size-5 text-muted-foreground" />
                <span className="text-sm">Default Currency</span>
              </div>
              <span className="text-sm text-muted-foreground">USD</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

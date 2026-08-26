import { useState, useEffect } from "react"
import {
  Minus,
  Square,
  X,
  Search,
  Plus,
  Moon,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

interface DesktopTitlebarProps {
  onOpenCommandPalette?: () => void
  onAddSubscription?: () => void
  isLanding?: boolean
}

export function DesktopTitlebar({
  onOpenCommandPalette,
  onAddSubscription,
  isLanding = false,
}: DesktopTitlebarProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const [isMaximized, setIsMaximized] = useState(false)
  const isElectron = !!window.electronAPI?.isElectron

  useEffect(() => {
    if (window.electronAPI?.isMaximized) {
      window.electronAPI.isMaximized().then(setIsMaximized)
    }
  }, [])

  const handleMinimize = () => {
    window.electronAPI?.minimize()
  }

  const handleMaximize = async () => {
    await window.electronAPI?.maximize()
    if (window.electronAPI?.isMaximized) {
      const max = await window.electronAPI.isMaximized()
      setIsMaximized(max)
    }
  }

  const handleClose = () => {
    window.electronAPI?.close()
  }

  if (isLanding) {
    return (
      <header className="h-10 bg-black flex items-center justify-between px-3 select-none app-drag shrink-0 z-40">
        <div className="flex items-center gap-2 min-w-[150px]">
          <span className="font-extrabold text-[11px] tracking-widest text-zinc-600 uppercase">
            SUBKEEP
          </span>
        </div>

        <div className="flex items-center gap-1 justify-end app-no-drag">
          {isElectron && (
            <div className="flex items-center">
              <button
                onClick={handleMinimize}
                className="size-7 flex items-center justify-center rounded hover:bg-zinc-900 text-zinc-500 hover:text-white cursor-pointer transition-colors"
                title="Minimize"
              >
                <Minus className="size-3.5" />
              </button>
              <button
                onClick={handleMaximize}
                className="size-7 flex items-center justify-center rounded hover:bg-zinc-900 text-zinc-500 hover:text-white cursor-pointer transition-colors"
                title={isMaximized ? "Restore" : "Maximize"}
              >
                <Square className="size-3" />
              </button>
              <button
                onClick={handleClose}
                className="size-7 flex items-center justify-center rounded hover:bg-red-600 hover:text-white text-zinc-500 cursor-pointer transition-colors"
                title="Close"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>
    )
  }

  return (
    <header className="h-11 border-b border-border/80 bg-background/95 backdrop-blur-xs flex items-center justify-between px-3 select-none app-drag shrink-0 z-40">
      {/* Brand & App Name */}
      <div className="flex items-center gap-2.5 min-w-[200px]">
        <div className="size-6 rounded-lg bg-foreground text-background flex items-center justify-center font-black text-xs shadow-xs">
          S
        </div>
        <span className="font-extrabold text-xs tracking-wide text-foreground">
          SUBKEEP
        </span>
        <span className="text-[10px] uppercase font-semibold text-muted-foreground/80 bg-muted px-1.5 py-0.5 rounded border border-border/60">
          Desktop
        </span>
      </div>

      {/* Center Search / Command Palette Bar */}
      {onOpenCommandPalette && (
        <div className="flex-1 max-w-md px-4 flex justify-center app-no-drag">
          <button
            onClick={onOpenCommandPalette}
            className="w-full h-7 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted/80 px-2.5 flex items-center justify-between text-xs text-muted-foreground transition-colors cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Search className="size-3.5" />
              <span className="text-[11px]">Search subscriptions, actions...</span>
            </div>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.2 text-[10px] font-mono font-medium text-muted-foreground shadow-2xs">
              Ctrl+K
            </kbd>
          </button>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-1 min-w-[200px] justify-end app-no-drag">
        {onAddSubscription && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddSubscription}
            className="h-7 px-2.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
          title={`Switch theme (${resolvedTheme === "dark" ? "Light" : "Dark"})`}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="size-3.5" />
          ) : (
            <Moon className="size-3.5" />
          )}
        </Button>

        {/* Window Controls (Native Electron) */}
        {isElectron && (
          <div className="flex items-center ml-1.5 border-l border-border/60 pl-1.5">
            <button
              onClick={handleMinimize}
              className="size-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="Minimize"
            >
              <Minus className="size-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              className="size-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              <Square className="size-3" />
            </button>
            <button
              onClick={handleClose}
              className="size-7 flex items-center justify-center rounded hover:bg-destructive hover:text-white text-muted-foreground cursor-pointer transition-colors"
              title="Close"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

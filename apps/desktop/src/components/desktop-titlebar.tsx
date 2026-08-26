import { useEffect, useState } from "react"
import { Minus, Square, Copy, X, Sun, Moon, Command } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

interface DesktopTitlebarProps {
  activeSubCount?: number
  totalSubCount?: number
  currentView?: string
  onOpenCommandPalette?: () => void
  onAddSubscription?: () => void
  isLanding?: boolean
}

export function DesktopTitlebar({
  activeSubCount = 0,
  totalSubCount = 0,
  currentView = "dashboard",
  onOpenCommandPalette,
  isLanding = false,
}: DesktopTitlebarProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()
  const isMac = typeof window !== "undefined" && window.electronAPI?.platform === "darwin"

  useEffect(() => {
    if (!window.electronAPI) return

    window.electronAPI.isMaximized().then(setIsMaximized).catch(() => {})
    const unsubscribe = window.electronAPI.onMaximizeChange?.((maximized) => {
      setIsMaximized(maximized)
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  const handleMinimize = () => window.electronAPI?.minimize()
  const handleMaximize = () => {
    window.electronAPI?.maximize().then(setIsMaximized).catch(() => {})
  }
  const handleClose = () => window.electronAPI?.close()

  const viewNameMap: Record<string, string> = {
    dashboard: "Subscriptions",
    calendar: "Calendar",
    stats: "Analytics",
    settings: "Settings",
    detail: "Subscription Detail",
  }

  const sectionName = viewNameMap[currentView] || "Subscriptions"
  const countRatio = `${activeSubCount}/${totalSubCount}`

  if (isLanding) {
    return (
      <header
        className={`sticky top-0 z-50 flex h-10 w-full select-none items-center justify-between border-b border-zinc-900 bg-black app-drag-region ${
          isMac ? "pl-20 pr-3" : "px-3"
        }`}
      >
        {/* Left: App Brand */}
        <div className="flex items-center gap-2 app-no-drag">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white text-black font-black text-xs shadow-xs">
            S
          </div>
          <span className="text-xs font-black tracking-tight text-white">SubKeep</span>
        </div>

        {/* Center: Draggable Spacer */}
        <div className="flex-1 h-full min-w-4" />

        {/* Right: Window Controls */}
        <div className="flex items-center gap-1.5 app-no-drag">
          {!isMac && (
            <div className="flex items-center ml-1 gap-0.5">
              <button
                type="button"
                onClick={handleMinimize}
                className="flex h-7 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                title="Minimize"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleMaximize}
                className="flex h-7 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                title={isMaximized ? "Restore" : "Maximize"}
              >
                {isMaximized ? (
                  <Copy className="h-3 w-3 rotate-180" />
                ) : (
                  <Square className="h-3 w-3" />
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-7 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>
    )
  }

  return (
    <header
      className={`sticky top-0 z-50 flex h-10 w-full select-none items-center justify-between border-b border-border bg-card/85 backdrop-blur-md app-drag-region ${
        isMac ? "pl-20 pr-3" : "px-3"
      }`}
    >
      {/* Left: App Brand & Breadcrumb */}
      <div className="flex items-center gap-2 app-no-drag">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary text-primary-foreground font-black text-xs shadow-xs">
          S
        </div>
        <span className="text-xs font-black tracking-tight text-foreground">SubKeep</span>
        {sectionName && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            <span className="text-border">/</span>
            <span className="text-foreground/90">{sectionName}</span>
            {totalSubCount > 0 && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-extrabold text-foreground border border-border/50">
                {countRatio}
              </span>
            )}
          </span>
        )}
      </div>

      {/* Center: Draggable Window Spacer */}
      <div className="flex-1 h-full min-w-4" />

      {/* Right: Actions & Window Controls */}
      <div className="flex items-center gap-1.5 app-no-drag">
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            title="Command Palette (Ctrl+K)"
          >
            <Command className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Toggle Theme (D)"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </button>

        {!isMac && (
          <div className="flex items-center ml-1 gap-0.5">
            <button
              type="button"
              onClick={handleMinimize}
              className="flex h-7 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Minimize"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleMaximize}
              className="flex h-7 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <Copy className="h-3 w-3 rotate-180" />
              ) : (
                <Square className="h-3 w-3" />
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-7 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

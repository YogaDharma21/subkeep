import { useEffect, useState } from "react"
import { Minus, Square, Copy, X, Command } from "lucide-react"

interface DesktopTitlebarProps {
  activeSubCount?: number
  totalSubCount?: number
  currentView?: string
  onOpenCommandPalette?: () => void
  onAddSubscription?: () => void
  isLanding?: boolean
}

const noDragStyle = {
  WebkitAppRegion: "no-drag",
} as React.CSSProperties

const dragStyle = {
  WebkitAppRegion: "drag",
} as React.CSSProperties

export function DesktopTitlebar({
  activeSubCount = 0,
  totalSubCount = 0,
  currentView = "dashboard",
  onOpenCommandPalette,
  isLanding = false,
}: DesktopTitlebarProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const isMac =
    (typeof window !== "undefined" && window.electronAPI?.platform === "darwin") ||
    (typeof navigator !== "undefined" &&
      navigator.userAgent.toLowerCase().includes("mac") &&
      !navigator.userAgent.toLowerCase().includes("win"))

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

  const handleMinimize = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.electronAPI?.minimize()
  }

  const handleMaximize = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.electronAPI?.maximize) {
      const max = await window.electronAPI.maximize()
      setIsMaximized(max)
    }
  }

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.electronAPI?.close()
  }

  const viewNameMap: Record<string, string> = {
    dashboard: "Dashboard",
    transactions: "Transactions",
    subscriptions: "Subscriptions",
    budgets: "Budgets",
    accounts: "Accounts",
    calendar: "Calendar",
    stats: "Analytics",
    settings: "Settings",
    detail: "Subscription Detail",
  }

  const sectionName = viewNameMap[currentView] || "Dashboard"
  const countRatio = `${activeSubCount}/${totalSubCount}`

  if (isLanding) {
    return (
      <header
        className={`sticky top-0 z-50 flex h-10 w-full select-none items-center justify-between border-b border-white/[0.08] bg-[#090A0F] ${
          isMac ? "pl-20 pr-3" : "px-3"
        }`}
      >
        {/* Left: App Brand */}
        <div className="flex items-center gap-2 app-no-drag" style={noDragStyle}>
          <img
            src="/app-icon.png"
            alt="SubKeep"
            className="size-5 rounded-lg object-contain shadow-xs shadow-violet-500/20"
          />
          <span className="text-xs font-black tracking-tight text-white">SubKeep</span>
        </div>

        {/* Center: Draggable Spacer Only */}
        <div
          className="flex-1 h-full min-w-4 cursor-default app-drag-region"
          style={dragStyle}
          onDoubleClick={handleMaximize}
        />

        {/* Right: Window Controls */}
        <div className="flex items-center gap-1.5 app-no-drag" style={noDragStyle}>
          {!isMac && (
            <div className="flex items-center ml-1 gap-0.5" style={noDragStyle}>
              <button
                type="button"
                onClick={handleMinimize}
                style={noDragStyle}
                className="flex h-7 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                title="Minimize"
              >
                <Minus className="h-3.5 w-3.5 pointer-events-none" />
              </button>
              <button
                type="button"
                onClick={handleMaximize}
                style={noDragStyle}
                className="flex h-7 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                title={isMaximized ? "Restore" : "Maximize"}
              >
                {isMaximized ? (
                  <Copy className="h-3 w-3 rotate-180 pointer-events-none" />
                ) : (
                  <Square className="h-3 w-3 pointer-events-none" />
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                style={noDragStyle}
                className="flex h-7 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-3.5 w-3.5 pointer-events-none" />
              </button>
            </div>
          )}
        </div>
      </header>
    )
  }

  return (
    <header
      className={`sticky top-0 z-50 flex h-10 w-full select-none items-center justify-between border-b border-border bg-card/85 backdrop-blur-md ${
        isMac ? "pl-20 pr-3" : "px-3"
      }`}
    >
      {/* Left: App Brand & Breadcrumb */}
      <div className="flex items-center gap-2 app-no-drag" style={noDragStyle}>
        <img
          src="/app-icon.png"
          alt="SubKeep"
          className="size-5 rounded-lg object-contain shadow-xs shadow-violet-500/20"
        />
        <span className="text-xs font-black tracking-tight text-foreground">SubKeep</span>
        {sectionName && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            <span className="text-border">/</span>
            <span className="text-foreground/90">{sectionName}</span>
            {totalSubCount > 0 && (
              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-extrabold text-violet-400 border border-violet-500/20">
                {countRatio}
              </span>
            )}
          </span>
        )}
      </div>

      {/* Center: Draggable Window Spacer Only */}
      <div
        className="flex-1 h-full min-w-4 cursor-default app-drag-region"
        style={dragStyle}
        onDoubleClick={handleMaximize}
      />

      {/* Right: Actions & Window Controls */}
      <div className="flex items-center gap-1.5 app-no-drag" style={noDragStyle}>
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            style={noDragStyle}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors cursor-pointer"
            title="Command Palette (Ctrl+K)"
          >
            <Command className="h-3.5 w-3.5 pointer-events-none" />
          </button>
        )}

        {!isMac && (
          <div className="flex items-center ml-1 gap-0.5" style={noDragStyle}>
            <button
              type="button"
              onClick={handleMinimize}
              style={noDragStyle}
              className="flex h-7 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Minimize"
            >
              <Minus className="h-3.5 w-3.5 pointer-events-none" />
            </button>
            <button
              type="button"
              onClick={handleMaximize}
              style={noDragStyle}
              className="flex h-7 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <Copy className="h-3 w-3 rotate-180 pointer-events-none" />
              ) : (
                <Square className="h-3 w-3 pointer-events-none" />
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              style={noDragStyle}
              className="flex h-7 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-3.5 w-3.5 pointer-events-none" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

import { useState, useEffect } from "react"
import {
  Minus,
  Square,
  X,
  Sun,
  Moon,
  Command,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"

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
  const { setTheme, resolvedTheme } = useTheme()
  const isElectron =
    typeof window !== "undefined" &&
    (!!window.electronAPI?.isElectron ||
      (typeof navigator !== "undefined" &&
        navigator.userAgent.toLowerCase().includes(" electron/")))

  useEffect(() => {
    if (window.electronAPI?.isMaximized) {
      window.electronAPI.isMaximized().then(setIsMaximized)
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
    await window.electronAPI?.maximize()
    if (window.electronAPI?.isMaximized) {
      const max = await window.electronAPI.isMaximized()
      setIsMaximized(max)
    }
  }

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.electronAPI?.close()
  }

  const viewNameMap: Record<string, string> = {
    dashboard: "Subscriptions",
    calendar: "Calendar",
    stats: "Analytics",
    settings: "Settings",
    detail: "Subscription Detail",
  }

  const sectionName = viewNameMap[currentView] || "Subscriptions"

  if (isLanding) {
    return (
      <header className="h-10 bg-black flex items-center justify-between px-3 select-none shrink-0 z-40 border-b border-zinc-900">
        {/* Left: Brand (No Drag) */}
        <div className="flex items-center gap-2.5 min-w-[150px]" style={noDragStyle}>
          <div className="size-5.5 rounded-full bg-white text-black flex items-center justify-center font-black text-[11px] shadow-xs">
            S
          </div>
          <span className="font-bold text-xs tracking-tight text-white">
            SubKeep
          </span>
        </div>

        {/* Center: Draggable Space Only */}
        <div className="flex-1 h-full cursor-default" style={dragStyle} />

        {/* Right: Window Controls (No Drag) */}
        <div className="flex items-center gap-0.5 justify-end" style={noDragStyle}>
          {isElectron && (
            <div className="flex items-center" style={noDragStyle}>
              <button
                type="button"
                onClick={handleMinimize}
                style={noDragStyle}
                className="size-8 flex items-center justify-center rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                title="Minimize"
              >
                <Minus className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={handleMaximize}
                style={noDragStyle}
                className="size-8 flex items-center justify-center rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                title={isMaximized ? "Restore" : "Maximize"}
              >
                <Square className="size-3" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                style={noDragStyle}
                className="size-8 flex items-center justify-center rounded-md hover:bg-red-600 hover:text-white text-zinc-400 cursor-pointer transition-colors"
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
    <header className="h-10 border-b border-border/60 bg-background/95 backdrop-blur-md flex items-center justify-between px-3 select-none shrink-0 z-40">
      {/* Left: Modern App Brand + Breadcrumb + Pill Counter (No Drag) */}
      <div className="flex items-center gap-2 shrink-0" style={noDragStyle}>
        {/* Rounded Circular Icon Container */}
        <div className="size-5.5 rounded-full bg-foreground text-background flex items-center justify-center font-black text-[11px] shadow-xs">
          S
        </div>

        {/* App Title */}
        <span className="font-bold text-xs tracking-tight text-foreground">
          SubKeep
        </span>

        {/* Breadcrumb Separator */}
        <span className="text-muted-foreground/60 text-xs font-normal">
          /
        </span>

        {/* Active Section Name */}
        <span className="text-xs font-semibold text-foreground/90">
          {sectionName}
        </span>

        {/* Counter Badge Pill */}
        <span className="bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-border/60">
          {activeSubCount}/{totalSubCount}
        </span>
      </div>

      {/* Center: Draggable Space Only (Never Overlaps Buttons) */}
      <div className="flex-1 h-full min-w-[20px] cursor-default" style={dragStyle} />

      {/* Right: Quick Tools & Custom Window Control Buttons (No Drag) */}
      <div className="flex items-center gap-1.5 justify-end shrink-0" style={noDragStyle}>
        {/* Command Palette Trigger */}
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            style={noDragStyle}
            className="size-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Command Palette (Ctrl+K)"
          >
            <Command className="size-3.5" />
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          style={noDragStyle}
          className="size-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Toggle Theme (D)"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="size-3.5" />
          ) : (
            <Moon className="size-3.5" />
          )}
        </button>

        {/* Window Controls */}
        {isElectron && (
          <div className="flex items-center ml-1" style={noDragStyle}>
            <button
              type="button"
              onClick={handleMinimize}
              style={noDragStyle}
              className="size-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="Minimize"
            >
              <Minus className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleMaximize}
              style={noDragStyle}
              className="size-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              <Square className="size-3" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              style={noDragStyle}
              className="size-8 flex items-center justify-center rounded-md hover:bg-destructive hover:text-destructive-foreground text-muted-foreground cursor-pointer transition-colors"
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

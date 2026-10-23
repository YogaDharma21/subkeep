import { useEffect, useState } from "react"
import { useClerk, useAuth } from "@clerk/clerk-react"
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react"

export function DesktopCallbackPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const clerk = useClerk()
  const [status, setStatus] = useState<"connecting" | "prompted" | "success">("connecting")

  const triggerDesktopHandoff = async () => {
    try {
      const session = clerk.session
      const sessionId = session?.id
      const token = await session?.getToken()

      // Post auth session directly to local Electron server
      await fetch("http://127.0.0.1:49221/auth-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          token,
          __clerk_created_session_id: sessionId,
        }),
      })
    } catch {
      // Loopback post failed or app is listening via deep link
    }

    // Trigger native deep link to prompt the browser's "Open SubKeep?" modal
    try {
      const deepLink = `subkeep://auth-callback${window.location.search}`
      window.location.href = deepLink
      setStatus("prompted")
    } catch {
      setStatus("prompted")
    }
  }

  useEffect(() => {
    if (isLoaded) {
      triggerDesktopHandoff()
    }
  }, [isLoaded, isSignedIn])

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center p-4 selection:bg-foreground/15 selection:text-foreground select-none">
      <div className="w-full max-w-sm mx-auto bg-card border border-border rounded-2xl p-8 text-center space-y-6 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-200">
        {/* SubKeep App Icon */}
        <img
          src="/app-icon.png"
          alt="SubKeep"
          className="size-20 rounded-3xl shadow-xl shadow-white/5 mx-auto object-contain"
        />

        {/* Brand & State Heading */}
        <div className="space-y-2">
          <h1 className="text-xl font-medium tracking-tight text-white">
            Continue in desktop app
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Authentication complete! Click below if your browser did not automatically prompt you to open SubKeep.
          </p>
        </div>

        {/* Action Button */}
        <div className="space-y-3 pt-2">
          <button
            onClick={triggerDesktopHandoff}
            className="w-full h-12 rounded-xl bg-foreground text-background font-medium text-xs uppercase tracking-[0.18em] flex items-center justify-center gap-2 hover:bg-foreground/90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl cursor-pointer"
          >
            <ExternalLink className="size-4" />
            <span>Open SubKeep Desktop</span>
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            {status === "connecting" ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Opening SubKeep Desktop...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5 text-muted-foreground" />
                <span>You can close this tab once opened</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

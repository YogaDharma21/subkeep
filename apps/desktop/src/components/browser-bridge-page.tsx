import { useEffect } from "react"
import { useAuth } from "@clerk/clerk-react"

export function BrowserBridgePage() {
  const { sessionId, userId } = useAuth()

  const deepLinkUrl = `subkeep://auth-callback?session_id=${encodeURIComponent(sessionId || "")}&user_id=${encodeURIComponent(userId || "")}`

  useEffect(() => {
    // Automatically trigger custom protocol prompt: "Open SubKeep?"
    const timeout = setTimeout(() => {
      window.location.href = deepLinkUrl
    }, 100)

    return () => clearTimeout(timeout)
  }, [deepLinkUrl])

  return (
    <div className="min-h-screen w-screen bg-black text-white flex flex-col items-center justify-center p-6 selection:bg-zinc-800 selection:text-white select-none">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center space-y-7 animate-in fade-in zoom-in-95 duration-300">
        {/* White Rounded Squircle App Icon */}
        <div className="size-24 rounded-3xl bg-white flex items-center justify-center shadow-2xl shadow-white/10">
          <svg
            viewBox="0 0 24 24"
            className="size-12 fill-black"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2.2L20.8 7.3L12 12.4L3.2 7.3L12 2.2Z" />
            <path d="M2.5 9.1L11.3 14.2V21.8L2.5 16.7V9.1Z" />
            <path d="M12.7 14.2L21.5 9.1V16.7L12.7 21.8V14.2Z" />
          </svg>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-wider uppercase">
            <span className="text-white">SUB</span>
            <span className="text-zinc-500">KEEP</span>
          </h1>
          <p className="text-sm font-medium text-zinc-400">
            Authentication successful! Opening SubKeep Desktop...
          </p>
        </div>

        {/* Deep Link Action Button */}
        <div className="w-full pt-2">
          <a
            href={deepLinkUrl}
            className="w-full h-13 rounded-full bg-white text-black font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xl shadow-black/60 text-decoration-none"
          >
            <span>CONTINUE IN DESKTOP APP</span>
          </a>
          <p className="text-[11px] text-zinc-500 mt-4">
            Click the button above if your browser did not prompt you to open SubKeep.
          </p>
        </div>
      </div>
    </div>
  )
}

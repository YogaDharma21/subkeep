import { useState, useEffect, useCallback } from "react"
import { useSignIn, SignInButton, SignUpButton } from "@clerk/clerk-react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function LandingPage() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const [loading, setLoading] = useState(false)
  const isElectron = !!window.electronAPI?.isElectron

  // Listen for loopback OAuth callback from external browser
  const handleAuthCallback = useCallback(
    async (data: { query: Record<string, string>; url: string }) => {
      if (!isLoaded || !signIn) return

      try {
        setLoading(true)
        const { query } = data

        // 1. Ticket based auth
        const ticket = query.__clerk_ticket || query.ticket
        if (ticket) {
          const res = await signIn.create({
            strategy: "ticket",
            ticket,
          })
          if (res.status === "complete" && res.createdSessionId) {
            await setActive({ session: res.createdSessionId })
            toast.success("Successfully logged in!")
            return
          }
        }

        // 2. Created Session ID based auth
        const createdSessionId = query.__clerk_created_session_id || query.created_session_id
        if (createdSessionId) {
          await setActive({ session: createdSessionId })
          toast.success("Successfully logged in!")
          return
        }

        // 3. Status complete verification
        if (signIn.status === "complete" && signIn.createdSessionId) {
          await setActive({ session: signIn.createdSessionId })
          toast.success("Successfully logged in!")
          return
        }

        // 4. Fallback reload
        await signIn.reload()
        if (signIn.status === "complete" && signIn.createdSessionId) {
          await setActive({ session: signIn.createdSessionId })
          toast.success("Successfully logged in!")
        }
      } catch (err: unknown) {
        console.error("Auth callback error:", err)
        const error = err as { errors?: { message?: string }[]; message?: string }
        const msg = error.errors?.[0]?.message || error.message || "Failed to complete authentication"
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    },
    [isLoaded, signIn, setActive]
  )

  useEffect(() => {
    if (window.electronAPI?.onAuthCallback) {
      const unsubscribe = window.electronAPI.onAuthCallback(handleAuthCallback)
      return () => {
        unsubscribe()
      }
    }
  }, [handleAuthCallback])

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return

    if (!isElectron) {
      // In web browser, standard redirect or Clerk modal handles it
      return
    }

    try {
      setLoading(true)
      const callbackUrl = "http://127.0.0.1:49221/auth-callback"

      // Request OAuth URL from Clerk
      const response = await signIn.create({
        strategy: "oauth_google",
        redirectUrl: callbackUrl,
        actionCompleteRedirectUrl: callbackUrl,
      })

      const externalUrl = response.firstFactorVerification?.externalVerificationRedirectURL

      if (externalUrl) {
        await window.electronAPI?.startBrowserAuth({ url: externalUrl.toString() })
      } else {
        await window.electronAPI?.startBrowserAuth({ mode: "google" })
      }

      toast.info("Opening Google Sign-In in your browser...", { duration: 4000 })
    } catch (err: unknown) {
      console.error("Google sign in error:", err)
      // Fallback to hosted Clerk browser sign-in
      await window.electronAPI?.startBrowserAuth({ mode: "google" })
      toast.info("Opening sign-in page in your browser...", { duration: 4000 })
    }
  }

  const handleBrowserSignIn = async (mode: "sign-in" | "sign-up") => {
    if (isElectron && window.electronAPI?.startBrowserAuth) {
      setLoading(true)
      await window.electronAPI.startBrowserAuth({ mode })
      toast.info(`Opening ${mode === "sign-up" ? "sign up" : "sign in"} in your browser...`, { duration: 4000 })
    }
  }

  return (
    <div className="min-h-full w-full bg-black text-white flex flex-col items-center justify-center px-4 py-8 selection:bg-zinc-800 selection:text-white select-none">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center space-y-7 sm:space-y-8 animate-in fade-in zoom-in-95 duration-300">
        {/* White Rounded Squircle App Icon Container */}
        <div className="size-24 sm:size-28 rounded-3xl bg-white flex items-center justify-center shadow-2xl shadow-white/10 transition-transform hover:scale-105">
          {/* Isometric 3D Cube Icon */}
          <svg
            viewBox="0 0 24 24"
            className="size-12 sm:size-14 fill-black"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top Diamond Facet */}
            <path d="M12 2.2L20.8 7.3L12 12.4L3.2 7.3L12 2.2Z" />
            {/* Left Vertical Facet */}
            <path d="M2.5 9.1L11.3 14.2V21.8L2.5 16.7V9.1Z" />
            {/* Right Vertical Facet */}
            <path d="M12.7 14.2L21.5 9.1V16.7L12.7 21.8V14.2Z" />
          </svg>
        </div>

        {/* Brand Title: SUB (white) + KEEP (gray) */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black tracking-wider uppercase">
            <span className="text-white">SUB</span>
            <span className="text-zinc-500">KEEP</span>
          </h1>

          {/* Tagline Subtitle */}
          <div className="space-y-1 text-xs sm:text-sm font-medium text-zinc-400 leading-relaxed max-w-xs mx-auto">
            <p>Track your recurring subscriptions before they renew!</p>
            <p>Never forget a free trial, bill date, or fee again.</p>
          </div>
        </div>

        {/* Primary Action CTA: Rounded Pill Button */}
        <div className="w-full space-y-4 pt-2">
          {isElectron ? (
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-13 sm:h-14 rounded-full bg-white text-black font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-3 transition-all hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xl shadow-black/60 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="size-5 animate-spin text-black" />
                  <span>Waiting for browser...</span>
                </>
              ) : (
                <>
                  {/* Google 'G' Icon */}
                  <svg
                    className="size-5 shrink-0 fill-current"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>CONTINUE WITH GOOGLE</span>
                </>
              )}
            </button>
          ) : (
            <SignInButton mode="modal">
              <button className="w-full h-13 sm:h-14 rounded-full bg-white text-black font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-3 transition-all hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xl shadow-black/60">
                {/* Google 'G' Icon */}
                <svg
                  className="size-5 shrink-0 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
              </button>
            </SignInButton>
          )}

          {/* Secondary Sign In / Sign Up Trigger Links */}
          <div className="flex items-center justify-center gap-3 text-xs text-zinc-500 font-medium">
            {isElectron ? (
              <>
                <button
                  onClick={() => handleBrowserSignIn("sign-in")}
                  className="hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  Sign in in browser
                </button>
                <span>&middot;</span>
                <button
                  onClick={() => handleBrowserSignIn("sign-up")}
                  className="hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  Create account in browser
                </button>
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="hover:text-zinc-300 transition-colors cursor-pointer">
                    Sign in with email
                  </button>
                </SignInButton>
                <span>&middot;</span>
                <SignUpButton mode="modal">
                  <button className="hover:text-zinc-300 transition-colors cursor-pointer">
                    Create account
                  </button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

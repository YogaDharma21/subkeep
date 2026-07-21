import Link from "next/link"
import { WifiOff } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <WifiOff className="size-8 text-muted-foreground" />
          </div>
        </div>
        <h1 className="mb-2 text-xl font-bold">You&apos;re offline</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Please reconnect to the internet to continue using SubKeep.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Try Again
        </Link>
      </div>
    </div>
  )
}

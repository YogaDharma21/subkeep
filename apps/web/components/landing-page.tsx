"use client"

import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LandingPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-6 py-12 text-center select-none">
      <div className="flex w-full max-w-sm flex-col items-center">
        {/* App Icon Squircle */}
        <div className="mb-6 flex size-24 items-center justify-center rounded-3xl bg-neutral-200 text-neutral-900 shadow-lg dark:bg-neutral-100">
          <Receipt className="size-12 stroke-[2.2]" />
        </div>

        {/* Brand Name */}
        <h1 className="mb-3 text-3xl font-extrabold tracking-widest text-foreground uppercase sm:text-4xl">
          SUBKEEP
        </h1>

        {/* Subtitle / Description */}
        <p className="mb-8 max-w-xs text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
          Track your subscriptions and never miss a payment! Manage recurring costs, trial deadlines, and smart insights.
        </p>

        {/* Action Buttons */}
        <div className="w-full max-w-xs space-y-3">
          <SignInButton mode="modal">
            <Button className="h-12 w-full cursor-pointer rounded-full bg-foreground text-sm font-bold tracking-wider text-background shadow-xs transition-all hover:bg-foreground/90 active:scale-[0.98]">
              LOG IN
            </Button>
          </SignInButton>

          <SignUpButton mode="modal">
            <Button
              variant="outline"
              className="h-12 w-full cursor-pointer rounded-full border border-border bg-transparent text-sm font-bold tracking-wider text-foreground transition-all hover:bg-muted active:scale-[0.98]"
            >
              CREATE ACCOUNT
            </Button>
          </SignUpButton>
        </div>
      </div>
    </div>
  )
}

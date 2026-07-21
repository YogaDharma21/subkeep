"use client"

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold">SubKeep</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your subscriptions
        </p>
      </div>
      <SignIn />
    </div>
  )
}

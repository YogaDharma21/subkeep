"use client"

import Image from "next/image"
import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
      <div className="mb-6 text-center flex flex-col items-center">
        <Image
          src="/app-icon.png"
          alt="SubKeep"
          width={48}
          height={48}
          className="size-12 rounded-xl object-contain shadow-xs mb-3"
          priority
        />
        <h1 className="text-xl font-bold">SubKeep</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your subscriptions
        </p>
      </div>
      <SignUp />
    </div>
  )
}

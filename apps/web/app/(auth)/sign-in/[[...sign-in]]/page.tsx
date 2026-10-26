"use client"

import Image from "next/image"
import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="surface p-6 sm:p-7">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image
          src="/app-icon.png"
          alt="SubKeep"
          width={48}
          height={48}
          className="mb-3 size-12 rounded-xl object-contain shadow-xs"
          priority
        />
        <h1 className="text-lg font-medium tracking-tight">SubKeep</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Track your subscriptions
        </p>
      </div>
      <SignIn />
    </div>
  )
}

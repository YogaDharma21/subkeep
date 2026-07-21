"use client"

import Link from "next/link"
import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { Receipt, BarChart3, Calendar, Shield, Smartphone, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-foreground">
            <Receipt className="size-4 text-background" />
          </div>
          <span className="text-lg font-bold">SubKeep</span>
        </div>
        <div className="flex items-center gap-2">
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="sm">Get Started</Button>
          </SignUpButton>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-green-500" />
          Track smarter, spend better
        </div>

        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Never miss a
          <br />
          subscription payment
        </h1>

        <p className="mb-8 text-lg text-muted-foreground">
          SubKeep helps you track all your subscriptions in one place.
          <br className="hidden sm:block" />
          See what you're spending, when bills are due, and save money.
        </p>

        <div className="mb-16 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <SignUpButton mode="modal">
            <Button size="lg" className="w-full sm:w-auto">
              Start Tracking Free
            </Button>
          </SignUpButton>
          <SignInButton mode="modal">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Sign In
            </Button>
          </SignInButton>
        </div>

        <div className="mb-16 rounded-2xl border border-border bg-muted/50 p-8">
          <div className="mb-4 flex justify-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-background">
              <Receipt className="size-6" />
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-background">
              <BarChart3 className="size-6" />
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-background">
              <Calendar className="size-6" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Your subscriptions, analytics, and calendar — all in one app
          </p>
        </div>

        <div className="grid gap-6 text-left sm:grid-cols-3">
          <div className="rounded-xl border border-border p-5">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted">
              <Smartphone className="size-5" />
            </div>
            <h3 className="mb-1 font-semibold">Mobile Friendly</h3>
            <p className="text-sm text-muted-foreground">
              Access your subscriptions anywhere, on any device
            </p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted">
              <BarChart3 className="size-5" />
            </div>
            <h3 className="mb-1 font-semibold">Spending Analytics</h3>
            <p className="text-sm text-muted-foreground">
              See where your money goes with detailed charts
            </p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted">
              <Shield className="size-5" />
            </div>
            <h3 className="mb-1 font-semibold">Secure & Private</h3>
            <p className="text-sm text-muted-foreground">
              Your data is encrypted and tied to your account
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        SubKeep v1.0.0 — Track your subscriptions
      </footer>
    </div>
  )
}

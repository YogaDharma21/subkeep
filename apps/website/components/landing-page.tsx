"use client"

import { SignInButton, SignUpButton } from "@clerk/nextjs"
import {
  Receipt,
  ArrowRight,
  Sparkles,
  CreditCard,
  Users,
  Check,
  Clock,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 selection:bg-zinc-800 selection:text-white">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Brand, Pitch, Mini Features, CTAs */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6 sm:space-y-8">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-950 shadow-md">
              <Receipt className="size-6 sm:size-7 stroke-[2.4]" />
            </div>
            <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-wider text-white uppercase">
              SUBKEEP
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              Never lose track of your subscriptions and recurring bills again.
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl">
              Take complete control of your monthly spend, free trial deadlines, card payment methods, and split group expenses in one unified, privacy-friendly hub.
            </p>
          </div>

          {/* 3 Feature Highlights (similar to screenshot cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 backdrop-blur-xs flex flex-col justify-between space-y-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
                <Sparkles className="size-4 text-zinc-200" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-zinc-200">
                  Smart Analytics
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  MoM trends, hike alerts & budget caps
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 backdrop-blur-xs flex flex-col justify-between space-y-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
                <CreditCard className="size-4 text-zinc-200" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-zinc-200">
                  Card Vault
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Map renewal cards & avoid surprise fees
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 backdrop-blur-xs flex flex-col justify-between space-y-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
                <Users className="size-4 text-zinc-200" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-zinc-200">
                  SplitKeep
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Split costs & generate 1-tap reminders
                </p>
              </div>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <SignInButton mode="modal">
              <Button className="h-12 px-7 cursor-pointer rounded-xl bg-zinc-100 text-zinc-950 font-bold text-xs sm:text-sm tracking-wider uppercase shadow-md transition-all hover:bg-white active:scale-95 flex items-center gap-2">
                <span>LOG IN</span>
                <ArrowRight className="size-4" />
              </Button>
            </SignInButton>

            <SignUpButton mode="modal">
              <Button
                variant="outline"
                className="h-12 px-7 cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-200 font-bold text-xs sm:text-sm tracking-wider uppercase transition-all hover:bg-zinc-800 hover:text-white active:scale-95"
              >
                CREATE ACCOUNT
              </Button>
            </SignUpButton>
          </div>
        </div>

        {/* Right Column: App Window Preview Mockup */}
        <div className="lg:col-span-5 flex justify-center w-full">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800/90 bg-zinc-900/80 p-5 sm:p-6 backdrop-blur-md shadow-2xl space-y-5">
            {/* Window Title Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-rose-500/80" />
                <div className="size-2.5 rounded-full bg-amber-500/80" />
                <div className="size-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                  MONTHLY BILLING PREVIEW
                </span>
              </div>
              <span className="rounded-md bg-zinc-800/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 border border-zinc-700/50">
                4 Active
              </span>
            </div>

            {/* Budget Progress Bar Box */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200">72% Monthly Budget Used</span>
                <span className="text-zinc-400">$144.00 / $200.00</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-zinc-400 to-zinc-100 w-[72%]" />
              </div>
            </div>

            {/* Subscriptions Checklist Rows */}
            <div className="space-y-2.5">
              {/* Item 1 */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3 transition-colors hover:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400">
                    <Check className="size-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-zinc-200">
                      Netflix Premium
                    </div>
                    <div className="text-[11px] text-zinc-400">$19.99 · Monthly</div>
                  </div>
                </div>
                <span className="rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
                  Paid
                </span>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3 transition-colors hover:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400">
                    <Check className="size-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-zinc-200">
                      Spotify Duo Plan
                    </div>
                    <div className="text-[11px] text-zinc-400">$14.99 · Monthly</div>
                  </div>
                </div>
                <span className="rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
                  Active
                </span>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3 transition-colors hover:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400">
                    <Check className="size-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-zinc-200">
                      GitHub Copilot Pro
                    </div>
                    <div className="text-[11px] text-zinc-400">$10.00 · Monthly</div>
                  </div>
                </div>
                <span className="rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
                  Auto-Renew
                </span>
              </div>

              {/* Item 4 (Alert / Trial ending badge like the Missing badge in reference image) */}
              <div className="flex items-center justify-between rounded-xl border border-rose-900/40 bg-rose-950/20 p-3 transition-colors hover:border-rose-800/60">
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-400">
                    <Clock className="size-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-rose-200">
                      Apple TV+ Free Trial
                    </div>
                    <div className="text-[11px] text-rose-300/80">$9.99 · Ends in 2 days</div>
                  </div>
                </div>
                <span className="rounded-full bg-rose-600 border border-rose-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                  Due Soon
                </span>
              </div>
            </div>

            {/* Bottom Security / Privacy notice */}
            <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-zinc-500">
              <ShieldCheck className="size-3.5 text-zinc-400" />
              <span>Private & Client-Encrypted Storage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

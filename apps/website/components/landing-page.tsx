"use client"

import Image from "next/image"
import { SignInButton, SignUpButton } from "@clerk/nextjs"
import {
  ArrowRight,
  Sparkles,
  CreditCard,
  Check,
  Clock,
  ShieldCheck,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function LandingPage() {
  return (
    <div className="relative min-h-screen w-full bg-[#090A0F] text-zinc-100 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 selection:bg-violet-600/30 selection:text-white overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 size-[500px] rounded-full bg-violet-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 size-[500px] rounded-full bg-indigo-600/15 blur-[120px]" />

      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Brand, Pitch, Mini Features, CTAs */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6 sm:space-y-8">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <Image
              src="/app-icon.png"
              alt="SubKeep"
              width={56}
              height={56}
              priority
              className="size-12 sm:size-14 rounded-2xl object-contain shadow-lg shadow-violet-500/25 border border-violet-500/20"
            />
            <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-wider text-white uppercase">
              SUBKEEP
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              All your money in one place — budgets, bills, and subscriptions.
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl">
              Track expenses and income, set category budgets, manage accounts and net worth, and keep every subscription and free trial under control in one privacy-friendly hub.
            </p>
          </div>

          {/* 3 Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-2xl border border-white/[0.08] bg-[#11121C]/80 p-3.5 backdrop-blur-md flex flex-col justify-between space-y-2 shadow-md">
              <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 text-violet-300">
                <Wallet className="size-4 text-violet-300" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-zinc-100">
                  Money Tracking
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Expenses, income, accounts & budgets
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#11121C]/80 p-3.5 backdrop-blur-md flex flex-col justify-between space-y-2 shadow-md">
              <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 text-violet-300">
                <Sparkles className="size-4 text-violet-300" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-zinc-100">
                  Smart Analytics
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Cash flow, trends & budget alerts
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#11121C]/80 p-3.5 backdrop-blur-md flex flex-col justify-between space-y-2 shadow-md">
              <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 text-violet-300">
                <CreditCard className="size-4 text-violet-300" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-zinc-100">
                  Subscriptions
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Trials, renewals & split plans
                </p>
              </div>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <SignInButton mode="modal">
              <Button className="h-12 px-8 cursor-pointer rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white font-bold text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-violet-500/30 hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                <span>LOG IN</span>
                <ArrowRight className="size-4" />
              </Button>
            </SignInButton>

            <SignUpButton mode="modal">
              <Button
                variant="outline"
                className="h-12 px-8 cursor-pointer rounded-full border border-white/[0.12] bg-[#11121C]/80 text-zinc-200 font-bold text-xs sm:text-sm tracking-wider uppercase transition-all hover:bg-white/[0.06] hover:border-violet-500/40 hover:text-white active:scale-95"
              >
                CREATE ACCOUNT
              </Button>
            </SignUpButton>
          </div>
        </div>

        {/* Right Column: App Window Preview Mockup */}
        <div className="lg:col-span-5 flex justify-center w-full">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#11121C]/90 p-5 sm:p-6 backdrop-blur-md shadow-2xl shadow-violet-950/40 space-y-5">
            {/* Window Title Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-rose-500/80" />
                <div className="size-2.5 rounded-full bg-amber-500/80" />
                <div className="size-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                  MONTHLY BILLING PREVIEW
                </span>
              </div>
              <span className="rounded-full bg-violet-500/15 border border-violet-500/25 px-2.5 py-0.5 text-[10px] font-semibold text-violet-300">
                4 Active
              </span>
            </div>

            {/* Budget Progress Bar Box */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#090A0F]/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200">72% Monthly Budget Used</span>
                <span className="text-zinc-400">$144.00 / $200.00</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 w-[72%]" />
              </div>
            </div>

            {/* Subscriptions Checklist Rows */}
            <div className="space-y-2.5">
              {/* Item 1 */}
              <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#090A0F]/50 p-3 transition-colors hover:border-violet-500/30">
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-300">
                    <Check className="size-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-zinc-200">
                      Netflix Premium
                    </div>
                    <div className="text-[11px] text-zinc-400">$19.99 · Monthly</div>
                  </div>
                </div>
                <span className="rounded-full bg-violet-500/15 border border-violet-500/25 px-2.5 py-0.5 text-[11px] font-medium text-violet-300">
                  Paid
                </span>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#090A0F]/50 p-3 transition-colors hover:border-violet-500/30">
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-300">
                    <Check className="size-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-zinc-200">
                      Spotify Duo Plan
                    </div>
                    <div className="text-[11px] text-zinc-400">$14.99 · Monthly</div>
                  </div>
                </div>
                <span className="rounded-full bg-violet-500/15 border border-violet-500/25 px-2.5 py-0.5 text-[11px] font-medium text-violet-300">
                  Active
                </span>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#090A0F]/50 p-3 transition-colors hover:border-violet-500/30">
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-300">
                    <Check className="size-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-zinc-200">
                      GitHub Copilot Pro
                    </div>
                    <div className="text-[11px] text-zinc-400">$10.00 · Monthly</div>
                  </div>
                </div>
                <span className="rounded-full bg-violet-500/15 border border-violet-500/25 px-2.5 py-0.5 text-[11px] font-medium text-violet-300">
                  Auto-Renew
                </span>
              </div>

              {/* Item 4 */}
              <div className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-950/20 p-3 transition-colors hover:border-rose-500/50">
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-400">
                    <Clock className="size-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-rose-200">
                      Apple TV+ Free Trial
                    </div>
                    <div className="text-[11px] text-rose-300/80">$9.99 · Ends in 2 days</div>
                  </div>
                </div>
                <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 text-[11px] font-bold text-rose-300 shadow-xs">
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

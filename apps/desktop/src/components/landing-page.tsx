import { SignInButton, SignUpButton } from "@clerk/clerk-react"
import {
  Receipt,
  ArrowRight,
  Sparkles,
  CreditCard,
  Users,
  ShieldCheck,
  Laptop,
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
            <span className="text-[11px] uppercase font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
              Desktop Edition
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              Never lose track of your subscriptions and recurring bills again.
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl">
              Take complete control of your monthly spend, free trial deadlines, card payment methods, and split group expenses in one unified, fast desktop application.
            </p>
          </div>

          {/* 3 Feature Highlights */}
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
                <span>SIGN UP FREE</span>
              </Button>
            </SignUpButton>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 pt-2 text-xs text-zinc-500 font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Realtime Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Laptop className="size-4 text-blue-400" />
              <span>Native Desktop Offline Ready</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive App Preview */}
        <div className="lg:col-span-5 relative">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-red-500/80" />
                <div className="size-3 rounded-full bg-amber-500/80" />
                <div className="size-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Monthly Spending</span>
            </div>

            <div className="space-y-2.5">
              {[
                { name: "Netflix Premium", cat: "Entertainment", price: "$22.99", color: "#E50914", tag: "Split 1/4" },
                { name: "Spotify Family", cat: "Music", price: "$16.99", color: "#1DB954", tag: "Split 1/6" },
                { name: "iCloud 2TB", cat: "Cloud", price: "$9.99", color: "#0078D4", tag: "Renews in 3d" },
                { name: "ChatGPT Plus", cat: "AI & Tools", price: "$20.00", color: "#107C10", tag: "Trial 5d left" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-xs"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">{s.name}</p>
                      <p className="text-[10px] text-zinc-400">{s.cat}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-zinc-100">{s.price}/mo</p>
                    <span className="text-[9px] text-zinc-400 font-mono bg-zinc-800/60 px-1.5 py-0.5 rounded">
                      {s.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

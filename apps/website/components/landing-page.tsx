"use client"

import Image from "next/image"
import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { ArrowRight, Check, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

const dots = [
  0.08, 0.12, 0.52, 0.1, 0.18, 0.08, 0.3, 0.08, 0.08, 0.62,
  0.14, 0.46, 0.08, 0.1, 0.08, 0.24, 0.08, 0.72, 0.16, 0.08,
  0.08, 0.2, 0.08, 0.34, 0.08, 0.1, 0.56, 0.08, 0.22, 0.08,
  0.42, 0.08, 0.12, 0.08, 0.28, 0.08, 0.66, 0.14, 0.08, 0.2,
  0.08, 0.3, 0.08, 0.1, 0.48, 0.08, 0.18, 0.08, 0.38, 0.08,
]

export function LandingPage() {
  return (
    <div className="dark relative min-h-screen overflow-hidden bg-[#08090b] text-[#f4f4f2] selection:bg-white/15">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(ellipse_55%_55%_at_50%_-12%,rgba(255,255,255,0.11),transparent_72%)]"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="flex h-20 items-center justify-between border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <Image
              src="/app-icon.png"
              alt="SubKeep"
              width={30}
              height={30}
              priority
              className="size-[30px] rounded-lg object-contain"
            />
            <span className="text-[13px] font-semibold uppercase tracking-[0.18em]">
              SubKeep
            </span>
          </div>
          <SignInButton mode="modal">
            <button className="text-[11px] uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-white">
              Sign in
            </button>
          </SignInButton>
        </header>

        <main className="grid grid-cols-1 items-center gap-14 py-16 lg:grid-cols-12 lg:gap-10 lg:py-24">
          <div className="lg:col-span-7">
            <p className="label">Personal finance · one quiet place</p>

            <h1 className="mt-6 text-[clamp(2.7rem,6vw,4.9rem)] font-[550] leading-[0.94] tracking-[-0.055em]">
              Every bill.
              <br />
              Every balance.
              <br />
              <span className="text-white/30">Nothing shouting.</span>
            </h1>

            <p className="mt-7 max-w-md text-[13px] leading-relaxed text-white/50">
              Expenses, accounts, budgets, and every renewal in one dashboard.
              Built to show what matters and leave the rest folded away.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <SignInButton mode="modal">
                <Button className="h-11 cursor-pointer gap-2 rounded-full bg-[#f2f1ec] px-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0a0a0b] transition-colors hover:bg-white">
                  Open SubKeep
                  <ArrowRight className="size-3.5" />
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button
                  variant="outline"
                  className="h-11 cursor-pointer rounded-full border-white/12 bg-transparent px-6 text-[11px] font-medium uppercase tracking-[0.14em] text-white/70 transition-colors hover:border-white/25 hover:bg-white/5 hover:text-white"
                >
                  Create account
                </Button>
              </SignUpButton>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-[11px] text-white/35">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" />
                Private by default
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5" />
                Multi-currency
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5" />
                Trial reminders
              </span>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-5">
            <div className="mx-auto w-full max-w-sm space-y-3">
              <div className="surface relative overflow-hidden p-5">
                <div className="folder-tab" aria-hidden />
                <div className="relative flex items-center justify-between">
                  <p className="label">Net worth</p>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[9px] tracking-[0.14em] text-muted-foreground">
                    IDR
                  </span>
                </div>
                <p className="display-number mt-5 text-[2.35rem]">Rp128.400.000</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  4 accounts · live balances
                </p>

                <div className="mt-6 flex gap-1.5">
                  {Array.from({ length: 10 }).map((_, col) => (
                    <div key={col} className="flex flex-col gap-1.5">
                      {dots
                        .slice(col * 5, col * 5 + 5)
                        .map((value, row) => (
                          <span
                            key={row}
                            className="size-[5px] rounded-full bg-foreground"
                            style={{ opacity: Math.max(0.07, value) }}
                          />
                        ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="surface relative flex min-h-[112px] flex-col justify-end overflow-hidden p-4 pt-9">
                  <span className="folder-tab" aria-hidden />
                  <span className="numeral text-xl">Rp2.4jt</span>
                  <span className="mt-1.5 text-[10px] text-muted-foreground">
                    Recurring / month
                  </span>
                </div>
                <div className="surface relative flex min-h-[112px] flex-col justify-end overflow-hidden p-4 pt-9">
                  <span className="folder-tab" aria-hidden />
                  <span className="numeral text-xl">Oct 28</span>
                  <span className="mt-1.5 text-[10px] text-muted-foreground">
                    Next renewal
                  </span>
                </div>
              </div>

              <div className="surface p-3">
                {[
                  { name: "Spotify", meta: "Music · Oct 18", price: "-Rp54.900" },
                  { name: "Salary", meta: "Income · Oct 15", price: "+Rp12.500.000" },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between gap-3 border-b border-border/70 px-1 py-3 last:border-0 last:pb-1"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px]">{row.name}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {row.meta}
                      </p>
                    </div>
                    <span className="numeral shrink-0 text-[12px]">
                      {row.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <section className="grid grid-cols-1 gap-3 border-t border-white/[0.07] py-10 sm:grid-cols-3">
          {[
            {
              title: "Money",
              body: "Balances, income, and spending with a running net worth.",
            },
            {
              title: "Recurring",
              body: "Renewals, trials, and split plans with reminders before money moves.",
            },
            {
              title: "Insights",
              body: "Six months of cash flow and category budgets, without the noise.",
            },
          ].map((item) => (
            <div key={item.title} className="px-1 py-2">
              <p className="label">{item.title}</p>
              <p className="mt-3 max-w-[26ch] text-[12px] leading-relaxed text-white/45">
                {item.body}
              </p>
            </div>
          ))}
        </section>

        <footer className="flex items-center justify-between border-t border-white/[0.07] py-7 text-[10px] uppercase tracking-[0.14em] text-white/25">
          <span>SubKeep</span>
          <span>Made for quiet money</span>
        </footer>
      </div>
    </div>
  )
}

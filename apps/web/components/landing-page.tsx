"use client"

import Image from "next/image"
import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { ArrowRight } from "lucide-react"
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
    <div className="dark relative flex min-h-screen flex-col bg-[#08090b] text-[#f4f4f2] selection:bg-white/15">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(ellipse_55%_55%_at_50%_-12%,rgba(255,255,255,0.11),transparent_72%)]"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex h-16 shrink-0 items-center justify-between sm:h-20">
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
        </header>

        <main className="grid flex-1 grid-cols-1 items-center gap-10 py-6 pb-16 sm:py-8 md:grid-cols-12 md:gap-8 md:pb-8 lg:gap-12">
          <div className="md:col-span-7">
            <h1 className="text-[clamp(2.5rem,5.2vw,4.75rem)] font-[550] leading-[0.96] tracking-[-0.055em]">
              Every bill.
              <br />
              Every balance.
              <br />
              <span className="text-white/30">Nothing shouting.</span>
            </h1>

            <div className="mt-8 flex flex-wrap items-center gap-3">
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
          </div>

          {/* Preview */}
          <div className="w-full md:col-span-5">
            <div className="mx-auto w-full max-w-sm space-y-3 md:max-w-none lg:max-w-sm">
              <div className="surface p-5 sm:p-6">
                <div className="flex items-center justify-between">
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
                <div className="surface flex min-h-[104px] flex-col justify-end p-4">
                  <span className="numeral text-xl">Rp2.4jt</span>
                  <span className="mt-1.5 text-[10px] text-muted-foreground">
                    Recurring / month
                  </span>
                </div>
                <div className="surface flex min-h-[104px] flex-col justify-end p-4">
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
      </div>
    </div>
  )
}

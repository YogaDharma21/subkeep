"use client"

import { useMemo, useState } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import {
  Wallet,
  Landmark,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  Clock,
  RotateCcw,
  SlidersHorizontal,
  Plus,
  Minus,
} from "lucide-react"
import {
  calculateRunwayMetrics,
  type AccountInput,
  type SubscriptionInput,
  type TransactionInput,
} from "@/lib/runway"
import { formatCurrencyAmount } from "@/lib/currency"
import { getSymbol } from "@/lib/constants"
import { cn } from "@/lib/utils"

export interface CashRunwaySimulatorProps {
  accounts?: AccountInput[] | null
  subscriptions?: SubscriptionInput[] | null
  transactions?: TransactionInput[] | null
  primaryCurrency?: string
  rates?: Record<string, number>
}

interface TooltipPayloadEntry {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string
}

interface RunwayTooltipProps {
  active?: boolean
  payload?: readonly TooltipPayloadEntry[]
  label?: string
  primaryCurrency?: string
}

function RunwayTooltip({
  active,
  payload,
  label,
  primaryCurrency = "USD",
}: RunwayTooltipProps) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="surface-inset p-3 bg-card/95 backdrop-blur-sm border border-border rounded-[12px] shadow-2xl text-xs space-y-1.5 min-w-[180px]">
      <p className="text-[11px] font-medium text-muted-foreground border-b border-border/60 pb-1">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey || entry.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-mono tabular-nums font-medium text-foreground">
              {formatCurrencyAmount(Number(entry.value || 0), primaryCurrency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatCompactCurrency(val: number, currency: string): string {
  const symbol = getSymbol(currency)
  const abs = Math.abs(val)
  const sign = val < 0 ? "-" : ""

  if (abs >= 1_000_000_000) {
    return `${sign}${symbol}${(abs / 1_000_000_000).toFixed(1)}B`
  }
  if (abs >= 1_000_000) {
    return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}M`
  }
  if (abs >= 1_000) {
    return `${sign}${symbol}${(abs / 1_000).toFixed(0)}k`
  }
  return `${sign}${symbol}${Math.round(abs)}`
}

export function CashRunwaySimulator({
  accounts,
  subscriptions,
  transactions,
  primaryCurrency = "USD",
  rates,
}: CashRunwaySimulatorProps) {
  const [spendAdjustment, setSpendAdjustment] = useState(0)

  const hasAccounts = Array.isArray(accounts) && accounts.length > 0

  const metrics = useMemo(() => {
    return calculateRunwayMetrics({
      accounts,
      subscriptions,
      transactions,
      primaryCurrency,
      rates,
      spendAdjustment,
    })
  }, [accounts, subscriptions, transactions, primaryCurrency, rates, spendAdjustment])

  const currencyCode = (primaryCurrency || "USD").toUpperCase()
  const isHighDenom = ["IDR", "VND", "KRW"].includes(currencyCode)
  const isJPY = currencyCode === "JPY"

  const { sliderMin, sliderMax, sliderStep, presets } = useMemo(() => {
    if (isHighDenom) {
      return {
        sliderMin: -15_000_000,
        sliderMax: 15_000_000,
        sliderStep: 500_000,
        presets: [-2_500_000, -1_000_000, 1_000_000, 2_500_000],
      }
    }
    if (isJPY) {
      return {
        sliderMin: -200_000,
        sliderMax: 200_000,
        sliderStep: 5_000,
        presets: [-50_000, -20_000, 20_000, 50_000],
      }
    }
    return {
      sliderMin: -2000,
      sliderMax: 2000,
      sliderStep: 50,
      presets: [-500, -200, 200, 500],
    }
  }, [isHighDenom, isJPY])

  const hasNearZeroOrDip = useMemo(() => {
    return (
      metrics.projection.some((p) => p.liquidCash <= 0 || p.netWorth <= 0) ||
      (metrics.runwayMonths !== null && metrics.runwayMonths <= 12)
    )
  }, [metrics.projection, metrics.runwayMonths])

  if (!hasAccounts) {
    return (
      <div className="surface p-8 text-center rounded-[24px]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] surface-inset text-muted-foreground">
          <Wallet className="h-6 w-6 stroke-[1.5]" />
        </div>
        <h3 className="mt-4 text-[15px] font-medium tracking-tight text-foreground">
          No Accounts Found
        </h3>
        <p className="mt-1 text-[13px] text-muted-foreground max-w-sm mx-auto">
          Add checking, savings, or investment accounts to view your cash runway and 12-month net worth projection.
        </p>
      </div>
    )
  }

  return (
    <div className="surface overflow-hidden rounded-[24px]">
      {/* Header */}
      <div className="border-b border-border p-5">
        <h3 className="text-[15px] font-medium tracking-tight text-foreground">
          Cash Runway Simulator
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          12-month forward projection based on accounts, recurring expenses, and cash flow
        </p>
      </div>

      {/* 4 Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-5">
        {/* 1. Liquid Cash */}
        <div className="surface-inset p-4 rounded-[16px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground">
              Liquid Cash
            </span>
            <div className="p-1.5 rounded-[10px] surface-inset text-muted-foreground">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[20px] sm:text-[22px] font-mono tabular-nums font-medium tracking-tight text-foreground">
              {formatCurrencyAmount(metrics.liquidCash, primaryCurrency)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground truncate">
              Checking, savings & cash
            </p>
          </div>
        </div>

        {/* 2. Net Worth */}
        <div className="surface-inset p-4 rounded-[16px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground">
              Net Worth
            </span>
            <div className="p-1.5 rounded-[10px] surface-inset text-muted-foreground">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[20px] sm:text-[22px] font-mono tabular-nums font-medium tracking-tight text-foreground">
              {formatCurrencyAmount(metrics.netWorth, primaryCurrency)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground truncate">
              {metrics.totalDebt > 0
                ? `${formatCurrencyAmount(metrics.totalDebt, primaryCurrency)} debt deducted`
                : "Assets minus liabilities"}
            </p>
          </div>
        </div>

        {/* 3. Monthly Net Flow */}
        <div className="surface-inset p-4 rounded-[16px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground">
              Monthly Net Flow
            </span>
            <div
              className={cn(
                "p-1.5 rounded-[10px] surface-inset",
                metrics.isNetPositive ? "text-positive" : "text-negative"
              )}
            >
              {metrics.isNetPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <div
              className={cn(
                "text-[20px] sm:text-[22px] font-mono tabular-nums font-medium tracking-tight",
                metrics.isNetPositive ? "text-positive" : "text-negative"
              )}
            >
              {metrics.isNetPositive ? "+" : "-"}
              {formatCurrencyAmount(Math.abs(metrics.netMonthlyBurn), primaryCurrency)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground truncate">
              {metrics.isNetPositive ? "Monthly net surplus" : "Monthly net burn"}
            </p>
          </div>
        </div>

        {/* 4. Projected Runway */}
        <div className="surface-inset p-4 rounded-[16px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground">
              Projected Runway
            </span>
            <div
              className={cn(
                "p-1.5 rounded-[10px] surface-inset",
                metrics.isNetPositive
                  ? "text-positive"
                  : metrics.runwayMonths !== null && metrics.runwayMonths < 6
                    ? "text-negative"
                    : "text-warning"
              )}
            >
              {metrics.isNetPositive ? (
                <Shield className="h-4 w-4" />
              ) : metrics.runwayMonths !== null && metrics.runwayMonths < 6 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              {metrics.isNetPositive ? (
                <>
                  <span className="text-[20px] sm:text-[22px] font-mono tabular-nums font-medium tracking-tight text-positive">
                    Surplus
                  </span>
                  <span className="rounded-full bg-positive/10 border border-positive/20 px-2 py-0.5 text-[10px] font-mono text-positive font-medium">
                    Net Positive
                  </span>
                </>
              ) : metrics.runwayMonths !== null ? (
                <>
                  <span className="text-[20px] sm:text-[22px] font-mono tabular-nums font-medium tracking-tight text-foreground">
                    {metrics.runwayMonths.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground font-sans">Mo</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-mono font-medium border",
                      metrics.runwayMonths >= 12
                        ? "bg-positive/10 text-positive border-positive/20"
                        : metrics.runwayMonths >= 6
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-negative/10 text-negative border-negative/20"
                    )}
                  >
                    {metrics.runwayMonths >= 12
                      ? "12+ Mo"
                      : metrics.runwayMonths >= 6
                        ? "Caution"
                        : "Critical"}
                  </span>
                </>
              ) : (
                <span className="text-[20px] sm:text-[22px] font-mono tabular-nums font-medium tracking-tight text-muted-foreground">
                  N/A
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground truncate">
              {metrics.isNetPositive
                ? "Reserves sustained indefinitely"
                : "Pace until cash reserves deplete"}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Simulation Controls */}
      <div className="border-t border-border p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-[6px] surface-inset text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </div>
            <span className="text-[13px] font-medium text-foreground">
              Scenario Spend Adjustment
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-mono tabular-nums text-[12px] font-medium",
                spendAdjustment === 0
                  ? "text-muted-foreground"
                  : spendAdjustment > 0
                    ? "text-negative"
                    : "text-positive"
              )}
            >
              {spendAdjustment === 0
                ? "Baseline (No change)"
                : spendAdjustment > 0
                  ? `+${formatCurrencyAmount(spendAdjustment, primaryCurrency)}/mo`
                  : `-${formatCurrencyAmount(Math.abs(spendAdjustment), primaryCurrency)}/mo`}
            </span>
            {spendAdjustment !== 0 && (
              <button
                type="button"
                onClick={() => setSpendAdjustment(0)}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground surface-interactive px-2 py-0.5 rounded-[8px] border border-border cursor-pointer active:scale-95 transition-all"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Range slider and stepper buttons */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSpendAdjustment((prev) => Math.max(sliderMin, prev - sliderStep))}
              disabled={spendAdjustment <= sliderMin}
              className="h-7 w-7 rounded-[8px] border border-border surface-inset flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer active:scale-95 transition-all"
              aria-label="Decrease simulated monthly spend"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={sliderStep}
              value={spendAdjustment}
              onChange={(e) => setSpendAdjustment(Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <button
              type="button"
              onClick={() => setSpendAdjustment((prev) => Math.min(sliderMax, prev + sliderStep))}
              disabled={spendAdjustment >= sliderMax}
              className="h-7 w-7 rounded-[8px] border border-border surface-inset flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer active:scale-95 transition-all"
              aria-label="Increase simulated monthly spend"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex justify-between text-[10px] font-mono tabular-nums text-muted-foreground">
            <span>{formatCompactCurrency(sliderMin, primaryCurrency)}</span>
            <span>0</span>
            <span>+{formatCompactCurrency(sliderMax, primaryCurrency)}</span>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] uppercase font-medium tracking-[0.16em] text-muted-foreground mr-1">
            Presets:
          </span>
          {presets.map((preset) => {
            const isSelected = spendAdjustment === preset
            const label =
              preset > 0
                ? `+${formatCompactCurrency(preset, primaryCurrency)}`
                : formatCompactCurrency(preset, primaryCurrency)
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setSpendAdjustment(isSelected ? 0 : preset)}
                className={cn(
                  "text-[11px] font-mono tabular-nums px-2.5 py-1 rounded-[10px] border cursor-pointer active:scale-95 transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border surface-inset text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 12-Month Projection Chart */}
      <div className="border-t border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 pb-2">
          <div>
            <h4 className="text-[14px] font-medium tracking-tight text-foreground">
              12-Month Liquidity Forecast
            </h4>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Simulated forward trajectory for liquid cash and net worth
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-positive" />
              <span className="text-[11px] text-muted-foreground">Liquid Cash</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-chart-3" />
              <span className="text-[11px] text-muted-foreground">Net Worth</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 pt-2">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={metrics.projection}
                margin={{ top: 12, right: 12, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="liquidCashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--positive)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--positive)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  stroke="var(--border)"
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  stroke="var(--border)"
                  tickLine={false}
                  domain={[
                    hasNearZeroOrDip ? (dataMin: number) => Math.min(0, dataMin) : "auto",
                    "auto",
                  ]}
                  tickFormatter={(val: number) => formatCompactCurrency(val, primaryCurrency)}
                />
                <Tooltip
                  content={(props) => (
                    <RunwayTooltip
                      active={props.active}
                      payload={props.payload as unknown as readonly TooltipPayloadEntry[] | undefined}
                      label={typeof props.label === "string" ? props.label : undefined}
                      primaryCurrency={primaryCurrency}
                    />
                  )}
                />
                {hasNearZeroOrDip && (
                  <ReferenceLine
                    y={0}
                    stroke="var(--negative)"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{
                      value: "Zero Cash",
                      position: "insideBottomLeft",
                      fill: "var(--negative)",
                      fontSize: 10,
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="liquidCash"
                  name="Liquid Cash"
                  stroke="var(--positive)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#liquidCashGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  name="Net Worth"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#netWorthGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

# SubKeep (v0.1.0)

A sleek, mobile-first personal finance tracker built with Next.js 16, Convex, Clerk, and Tailwind CSS v4 — with a full subscription tracker built in.

---

## Screenshots

<details>
<summary>Click to expand / collapse project screenshots</summary>
<br />

| Landing Page | Main Dashboard |
| :---: | :---: |
| ![Landing Page](./public/screenshot-landing.png) | ![Dashboard](./public/screenshot-home.png) |

| Calendar Billing Projections | Custom Subscription & Fast Icon Search |
| :---: | :---: |
| ![Calendar View](./public/screenshot-calendar.png) | ![Custom Subscription](./public/screenshot-create.png) |

| Spending Analytics & Trends | Settings & Backups |
| :---: | :---: |
| ![Spending Analytics](./public/screenshot-stats.png) | ![Settings](./public/screenshot-settings.png) |

</details>

---

## Key Features

- **Money Dashboard** — Net worth, monthly income vs expenses, top spending categories, budget snapshot, and subscription cost preview in one home view.
- **Transactions** — Log expenses, income, and account-to-account transfers with 20+ categories, per-month browsing, search, and CSV export.
- **Accounts & Net Worth** — Track checking, savings, cash, e-wallets, credit, and investment balances with monthly in/out flow per account.
- **Budgets** — Per-category monthly spending caps with progress bars, over-budget alerts, subscription-spend overlays, and copy-last-month.
- **Subscription Management** — Add, edit, suspend, clone, and delete subscriptions with custom colors and icons. Recording a payment also logs it as an expense transaction.
- **Flexible Billing Cycles** — Support for Daily, Weekly, Monthly, **3 Months**, **6 Months**, Yearly, and **No Cycle / One-time** payments.
- **Start Date & End Date** — Track subscription start dates and optional end dates with automatic expiration handling.
- **Account & Website Links** — Track sub-accounts/emails (`user@gmail.com`) and direct clickable provider links (`netflix.com`).
- **Instant Icon Picker** — Sub-millisecond keyword search ("chat", "stream", "ai", "finance") powered by `useDeferredValue` and pre-indexed aliases across 1,500+ Lucide icons.
- **Start-Date Aware Trends** — Historical spending trend chart calculates monthly costs strictly based on active subscription date ranges.
- **Interactive Category Breakdown** — Toggle between **By Cost ($)** and **By Count (#)**, and filter between **All** or **Paid Only** subscriptions.
- **Calendar Projections** — Automatically projects recurring billing dates across any month and year.
- **50+ Pre-built Templates** — Quick setup for popular services (Netflix, Spotify, ChatGPT, iCloud, etc.).
- **Export, Backup & Restore** — Download JSON data backups and restore subscriptions effortlessly.
- **Automatic Dark / Light Mode** — Seamless theme detection and manual toggle via `next-themes`.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router & Turbopack)
- **Database:** Convex (real-time backend & mutations)
- **Auth:** Clerk
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Charts:** Recharts
- **Icons:** Lucide React (`lucide-react/dynamicIconImports` code-split dynamic renderer)

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Convex](https://convex.dev) account
- A [Clerk](https://clerk.com) account

### Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables in `.env.local`:

```env
# Convex
CONVEX_DEPLOYMENT=dev:<your-deployment-id>
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment-id>.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

3. Push Convex schema and start Convex dev server:

```bash
npx convex dev
```

4. Start the Next.js dev server:

```bash
npm run dev
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build optimized production bundle |
| `npm run start` | Start production server |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint check |
| `npm run format` | Format files with Prettier |

---

## Project Structure

```
app/
  (auth)/           # Clerk sign-in / sign-up pages
  (dashboard)/      # Main application routes
    page.tsx        # Money dashboard (net worth, cash flow, budgets, subs preview)
    transactions/   # Expense / income / transfer ledger
    accounts/       # Wallets, banks & net worth
    budgets/        # Per-category monthly spending caps
    subscriptions/  # Subscription tracker (list + detail)
    calendar/       # Calendar view with projected billing dates + daily cash flow
    stats/          # Finance analytics + subscription spending trends
    more/           # Settings, backups, export & restore
  layout.tsx        # Root layout (Clerk, Convex, NextThemes providers)
convex/
  schema.ts         # Database schema (subscriptions, templates, payments, accounts, transactions, budgets)
  subscriptions.ts  # Subscription CRUD mutations & stats calculations
  transactions.ts   # Expense / income / transfer ledger + monthly summaries
  accounts.ts       # Account CRUD, archive & net worth balances
  budgets.ts        # Category budget caps, upsert & month-to-month copy
  templates.ts      # Pre-built templates seed data
  payments.ts       # Subscription payment history tracking
components/
  dynamic-icon.tsx  # Code-split dynamic icon renderer
  icon-picker.tsx   # Lag-free keyword icon search picker
  stats-charts.tsx  # Subscription spending trend & category breakdown charts
  finance-analytics.tsx # Income-vs-expense cash flow & expense category charts
  transaction-calendar.tsx # Last-7-days daily cash flow strip
  calendar-grid.tsx # Calendar recurrence projection engine
```

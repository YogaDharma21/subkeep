# SubKeep

A mobile-first subscription tracker built with Next.js, Convex, and Clerk.

## Tech Stack

- **Framework:** Next.js 16 (App Router + Turbopack)
- **UI:** shadcn/ui + Tailwind CSS v4
- **Backend:** Convex (real-time database)
- **Auth:** Clerk
- **Charts:** Recharts
- **Icons:** Lucide React

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

```
# Convex
CONVEX_DEPLOYMENT=dev:<your-deployment-id>
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment-id>.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://<your-deployment-id>.convex.site

# Clerk
CLERK_FRONTEND_API_URL=https://<your-clerk-id>.clerk.accounts.dev
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

3. Run Convex dev (pushes schema + seeds templates):

```bash
npx convex dev
```

4. Start the dev server:

```bash
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run format` | Format code with Prettier |

## Project Structure

```
app/
  (auth)/           # Clerk sign-in/sign-up pages
  (dashboard)/      # Main app pages
    page.tsx        # Home (stats + subscription list)
    calendar/       # Calendar view with billing dates
    stats/          # Analytics charts
    more/           # Settings, export, backup, restore
    subscriptions/  # Subscription detail (edit/suspend/clone/delete)
  layout.tsx        # Root layout (providers)
  manifest.ts       # PWA manifest
convex/
  schema.ts         # Database schema (subscriptions, templates, payments)
  subscriptions.ts  # Subscription CRUD + stats
  templates.ts      # 50 pre-built templates + seed
  payments.ts       # Payment history tracking
components/
  ui/               # shadcn/ui components
  *.tsx             # App-specific components
lib/
  constants.ts      # Categories, currencies, icons, billing cycles
```

## Features

- **Subscription Management** — Add, edit, suspend, clone, delete subscriptions
- **50 Templates** — Pre-built templates for popular services (Netflix, Spotify, etc.)
- **Calendar View** — See upcoming billing dates on a monthly calendar
- **Stats & Charts** — Monthly spending, category breakdown, payment history
- **Payment History** — Record payments per subscription
- **Export & Backup** — Download subscriptions as JSON, full backup with payments
- **Restore** — Import data from a backup file
- **Dark/Light Mode** — Theme toggle via next-themes
- **Mobile-First** — 480px max-width, bottom navigation, touch-friendly

## Adding Components

```bash
npx shadcn@latest add <component-name>
```

## Using Components

```tsx
import { Button } from "@/components/ui/button"
```

## Deployment

Deploy to [Vercel](https://vercel.com):

```bash
npx vercel
```

Make sure to set environment variables in the Vercel dashboard.

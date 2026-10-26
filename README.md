# SubKeep (v0.1.0)

SubKeep is a sleek, modern personal finance tracker that helps you log expenses and income, set category budgets, track account balances and net worth, and manage subscriptions — recurring billing cycles, trials, payment schedules, and monthly spending analytics — in one clean dashboard.

---

## Project Screenshots

<details>
<summary>Click to expand / collapse project screenshots</summary>
<br />

| Landing Page | Main Dashboard |
| :---: | :---: |
| ![Landing Page](./apps/web/public/screenshot-landing.png) | ![Dashboard](./apps/web/public/screenshot-home.png) |

| Calendar Billing Projections | Custom Subscription & Fast Icon Search |
| :---: | :---: |
| ![Calendar View](./apps/web/public/screenshot-calendar.png) | ![Custom Subscription](./apps/web/public/screenshot-create.png) |

| Spending Analytics & Trends | Settings & Backups |
| :---: | :---: |
| ![Spending Analytics](./apps/web/public/screenshot-stats.png) | ![Settings](./apps/web/public/screenshot-settings.png) |

</details>

---

## Applications & Structure

Each application in `apps/` is self-contained with its own dependencies
and `pnpm-lock.yaml` — install and run commands inside each app directory:

```text
subkeep/
├── apps/
│   ├── web/        # SubKeep Web App (Next.js 16 + Convex + Clerk + Tailwind CSS v4)
│   ├── mobile/     # SubKeep Mobile App (Expo SDK 58 + Convex + Clerk)
│   ├── desktop/    # SubKeep Desktop App (Electron + Vite + Convex + Clerk)
├── docker/         # Docker orchestration configurations
├── docs/           # Architecture & technical documentation
└── scripts/        # Utility automation scripts
```

For full setup details, environment configuration, and features, see [apps/web/README.md](./apps/web/README.md).

---

## Quick Start

```bash
cd apps/web
pnpm install
pnpm dlx convex dev
pnpm dev
```

---

## License

[MIT](LICENSE)

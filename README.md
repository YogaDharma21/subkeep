# SubKeep (v0.0.1)

SubKeep is a sleek, modern subscription tracker that helps you manage recurring expenses, track account credentials and billing cycles, project payment schedules, and visualize monthly spending analytics in one clean dashboard.

---

## Project Screenshots

<details>
<summary>Click to expand / collapse project screenshots</summary>
<br />

| Landing Page | Main Dashboard |
| :---: | :---: |
| ![Landing Page](./apps/website/public/screenshot-landing.png) | ![Dashboard](./apps/website/public/screenshot-home.png) |

| Calendar Billing Projections | Custom Subscription & Fast Icon Search |
| :---: | :---: |
| ![Calendar View](./apps/website/public/screenshot-calendar.png) | ![Custom Subscription](./apps/website/public/screenshot-create.png) |

| Spending Analytics & Trends | Settings & Backups |
| :---: | :---: |
| ![Spending Analytics](./apps/website/public/screenshot-stats.png) | ![Settings](./apps/website/public/screenshot-settings.png) |

</details>

---

## Applications & Structure

This repository is structured as a monorepo workspace:

```text
subkeep/
├── apps/
│   └── website/    # SubKeep Web App (Next.js 16 + Convex + Clerk + Tailwind CSS v4)
├── docker/         # Docker orchestration configurations
├── docs/           # Architecture & technical documentation
└── scripts/        # Utility automation scripts
```

For full setup details, environment configuration, and features, see [apps/website/README.md](./apps/website/README.md).

---

## Quick Start

```bash
# 1. Install root workspace dependencies
npm install

# 2. Start Convex backend & Next.js web application
npm run dev
```

Or navigate directly to the web app:

```bash
cd apps/website
npm install
npx convex dev
npm run dev
```

---

## License

[MIT](LICENSE)

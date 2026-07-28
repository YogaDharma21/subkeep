# SubKeep (v1.0.0)

SubKeep is a sleek, modern subscription tracker that helps you manage recurring expenses, track account credentials and billing cycles, project payment schedules, and visualize monthly spending analytics in one clean dashboard.

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

This repository is structured as a self-contained monorepo:

```text
apps/
└── web/        # SubKeep Web App (Next.js 16 + Convex + Clerk + Tailwind CSS v4)
```

For full setup details, environment configuration, and features, see [apps/web/README.md](./apps/web/README.md).

---

## Quick Start

```bash
# 1. Go to the web app
cd apps/web

# 2. Install dependencies
npm install

# 3. Start Convex backend & Next.js dev server
npx convex dev
npm run dev
```

---

## License

[MIT](LICENSE)

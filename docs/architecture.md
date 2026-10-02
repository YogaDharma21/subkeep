# Architecture Documentation

## Project Structure

```text
subkeep/
├── apps/
│   ├── website/    # SubKeep Next.js 16 App Router (React 19, Convex, Clerk, Tailwind CSS v4)
│   ├── mobile/     # Reserved for mobile client
│   ├── desktop/    # Reserved for desktop client
│   ├── extension/  # Reserved for browser extension
│   ├── backend/    # Reserved for standalone API / services
│   └── cli/        # Reserved for command-line tools
├── docker/         # Docker configurations
├── docs/           # Documentation
├── scripts/        # Utility scripts
└── .github/        # GitHub Actions workflows
```

## Monorepo Principles

### Self-Contained Applications
Each application in `apps/` is self-contained:
- Independent dependencies and build configurations
- Shared type definitions can be imported or generated via Convex
- Polyglot flexibility for mobile, desktop, or extension apps

### Per-App Scripts
Each application in `apps/` manages its own dependencies with pnpm —
there is no root workspace. Run commands inside each app directory:
- `pnpm dev` (website): Starts the Next.js dev server for `apps/website`
- `pnpm build` (website/desktop): Compiles and produces production assets
- `pnpm lint` (website/mobile): Runs ESLint for that app
- `pnpm typecheck` (website/desktop): Validates TypeScript types for that app

## CI/CD Workflow

The monorepo uses path-based filtering in GitHub Actions:
- Changes to `apps/website/**` trigger the website build, lint, and typecheck jobs.
- Path-based triggers ensure fast pipeline execution.

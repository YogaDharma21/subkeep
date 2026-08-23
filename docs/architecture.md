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

### Workspace Scripts
Root `package.json` coordinates common commands across the workspace:
- `npm run dev`: Starts the Next.js dev server for `apps/website`
- `npm run build`: Compiles and produces production assets for `apps/website`
- `npm run lint`: Runs ESLint across `apps/website`
- `npm run typecheck`: Validates TypeScript types across `apps/website`

## CI/CD Workflow

The monorepo uses path-based filtering in GitHub Actions:
- Changes to `apps/website/**` trigger the website build, lint, and typecheck jobs.
- Path-based triggers ensure fast pipeline execution.

## Core Directives

- **Entry Point:** On every prompt, always call skill `command-center` first to inspect state and advance the lifecycle.
- **Strict Linear Lifecycle with User Gates (No Skipping, No Chaining):**
  - Features: `scout` (grill user, wait for reply) -> `spec` (confirm spec, wait for approval) -> `slice` (confirm task DAG, wait for approval) -> `build` -> `review` -> `launch`.
  - Fixes: `debug` -> `build` -> `review` -> `launch`.
  - Planning stages (`scout`, `spec`, `slice`) must end turn and wait for user confirmation. Never chain planning into `build` in the same turn.
  - Never open PRs without `launch` (which generates PR descriptions via `pr-body`).
- **Primary Thread is Orchestrator Only:** Never execute builds, tests, file edits, or deep searches directly in the primary thread. Always delegate implementation to child sessions via `subagent`.
- **Communication Style:** Minimal, direct, telegraphic. Zero emojis. Zero em dashes (`—`) or en dashes (`–`).
- Always use user git and GitHub account.

## Rules

### 1. Git & Branches
- Work on semantic kebab-case branches (`feat/*`, `fix/*`, `chore/*`, `refactor/*`, `docs/*`, `test/*`).
- Never prefix with `t3/*` or random tool prefixes. Never work on default branches.
- No destructive git commands (`git reset --hard`, force-push, branch deletion).
- Make atomic commits per slice with concise messages.

### 2. UI & Design
- Adhere strictly to `DESIGN.md` for UI and styling decisions.

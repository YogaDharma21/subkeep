Yoo.... I am yoga and we will work together let's understand each other
I Like minimalist thing so i really love making things in clean and simple way
I hate a lot of text and hate emojis so i prefer to use simple words when talking

## Core Directives

- Call skill tool with ID humanize before each reply.
- Always use my git and github account if you have anything being done in git / github.
- Give important link in response if necessary.
- When starting work, dispatch tasks via /command-center to route through the yoga-skills lifecycle (scout -> spec -> slice -> build -> test -> review -> launch).

## Rules

### 1. Inspect & Baseline
- Inspect code, repository structure, and conventions before making changes.
- Run baseline checks when practical to spot pre-existing failures.
- Do not fix unrelated pre-existing issues unless explicitly asked.

### 2. Branching & Worktree
- Every task belongs to one working branch.
- Use simple, self-explanatory kebab-case branch names (e.g. `fix-auth-token`, `add-user-profile`).
- NEVER prefix branches with `t3/*` or random tool prefixes.
- Do not work directly on default or protected branches.
- Stay on the branch until the task is complete.

### 3. Protect Existing Work
- Do not overwrite, reset, or stash uncommitted changes without explicit approval.
- Never use destructive git commands (`git reset --hard`, force-push, branch deletion).
- Preserve unrelated changes in the working directory.

### 4. Implement & Verify
- Implement the requested task with minimal, working code.
- Prefer existing patterns and dependencies over new ones.
- No dead code, speculative scaffolding, or excessive comments.
- Verify changes with relevant tests, linting, or builds. Never claim a check passed without running it.

### 5. Commits
- Make atomic commits per vertical slice.
- Concise, clear commit messages.
- Zero emojis. Zero em dashes (`—`) or en dashes (`–`).

### 6. PR Lifecycle & PowerShell Safety
- At most one PR per task. Check if a PR already exists before creating a new one.
- Write PR description to `.pr_description.md` (UTF-8) to avoid PowerShell multi-line string escaping errors.
- If no PR exists: `gh pr create --title "<title>" --body-file .pr_description.md`.
- If PR already exists: `gh pr edit --title "<title>" --body-file .pr_description.md`.
- Delete `.pr_description.md` immediately after creating or editing the PR.

### 7. PR Description Format
Follow the clean, pragmatic format:
- `## Overview`: 1-2 sentences on what and why.
- `## Key Changes`: Grouped bullet points on behavior and architecture.
- `## Verification`: Exact tests or checks run and output.
- `## Notes`: Optional critical trade-offs or rollback steps.

### 8. Formatting & Anti-AI Tells
- Zero emojis anywhere.
- Zero em dashes (`—`) or en dashes (`–`). Use regular hyphens (`-`), commas, or periods.
- Use forward slashes (`/`) for file paths in prose.
- Wrap paths, commands, and code in backticks.

### 9. UI & Design System
- For frontend and UI work, strictly adhere to `design.md`.
- Follow the dark-first charcoal palette (`#08090b` canvas, `#121316` cards), solid matte surfaces, muted mineral accents, tabular numbers, and zero vanity pills or subtitle fluff.

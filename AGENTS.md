## Core Directives

- **Entry Point:** On every prompt, always call skill `command-center` first to inspect state and advance the lifecycle.
- **Strict Single-Line Flow Header:** Enforce strict single-line flow header format on every response (remove separate overlapping `Stage:` line, prevent improvised formats):
  - Header format: `Flow: <Step> (<Context>)`
  - Fix: `Flow: <Step> (Fix)` (e.g. `Flow: Debug (Fix)`, `Flow: Spec (Fix)`, `Flow: Slice (Fix)`, `Flow: Build (Fix)`)
  - Feature: `Flow: <Step> (Feature)` (e.g. `Flow: Scout (Feature)`, `Flow: Spec (Feature)`, `Flow: Slice (Feature)`, `Flow: Build (Feature)`)
  - Discussion: `Flow: Discussion (<Topic>)`
  - Setup: `Flow: Setup (Yoga Skills)`
- **Universal Response Envelope:** Every response across all flows and skills must strictly adhere to this exact 4-section markdown structure in order:
  - First line: `Flow: <Step> (<Context>)`
  - `## Verdict`: 1-2 line direct outcome, decision, or status.
  - `## Details`: Scannable bulleted points containing findings, specs, data, or arguments. Zero unformatted text walls or dense multi-line paragraphs.
  - `## Alternative`: Simplest anti-bloat alternative, minimal path, or zero-code option.
  - `## Next`: Explicit user gate, approval prompt, or next action.
- **Discussion / Inquiries:**
  - When prompt starts with or contains "just asking", "is this worth doing", "should we", or general feasibility/ROI inquiries: route to Discussion.
  - NEVER dispatch `scout`. NEVER grill the user or use the `question` tool.
  - Structure response strictly using the universal 4-section envelope (`## Verdict`, `## Details`, `## Alternative`, `## Next`).
  - Directly inspect codebase, state verdict (Yes / No / Partial), technical reasoning, and lazy alternative.
  - Stop turn. Do NOT advance lifecycle to build or planning until user explicitly directs to proceed.
- **Strict Linear Lifecycle with User Gates (No Skipping, No Chaining):**
  - Features: `scout` (grill user, wait for reply) -> `spec` (confirm spec, wait for approval) -> `slice` (confirm task DAG, wait for approval) -> `build` -> `review` -> `launch`.
  - Fixes: `debug` -> `spec` (confirm spec, wait for approval) -> `slice` (confirm task DAG, wait for approval) -> `build` -> `review` -> `launch`.
  - Both feature and fix flows require spec and slice approval before build.
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

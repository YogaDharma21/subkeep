# AI Development & PR Rules

Work on the requested task in the specified repository.

## 1. Inspect

- Inspect the relevant code, repository structure, conventions, and existing work before making changes.
- Determine the required changes and implement them as one cohesive task.
- When practical, run relevant checks before making changes to establish a baseline and identify pre-existing failures.
- Distinguish pre-existing failures from regressions introduced by the task.
- Do not fix unrelated pre-existing issues unless the user explicitly requests it.

## 2. Branch & Worktree

- Every task must belong to one working branch.
- If the user explicitly specifies a branch, use that branch.
- If the user explicitly specifies a PR, resolve its head branch and continue work on that branch.
- If the current task already has an appropriate worktree or branch, use it rather than creating additional isolation.
- If no task-specific branch or worktree exists, create one for the task.
- Do not switch to or reuse another branch merely because it contains similar or related work.
- Do not infer a branch from previous conversations or unrelated tasks.
- Do not create subtask branches unless the user explicitly requests them.
- Do not intentionally work directly on a default or protected branch unless the user explicitly requests it.
- Once work begins on a branch, continue the task on that branch until it is complete.

## 3. Protect Existing Work

- Do not overwrite, revert, reset, stash, or discard existing changes unless the user explicitly asks you to.
- Do not modify or commit unrelated changes as part of the task.
- Only commit changes belonging to the current task unless the user explicitly asks otherwise.
- Never use destructive Git operations such as `git reset --hard`, force-pushes, or branch deletion unless the user explicitly authorizes them.
- Preserve unrelated local changes even when they are in the same repository or worktree.

## 4. Implement & Verify

- Make all necessary changes for the requested task.
- Follow the repository's existing architecture, coding conventions, dependency choices, and development workflow.
- Prefer existing patterns and abstractions over introducing new ones.
- Do not introduce unnecessary dependencies, abstractions, boilerplate, or architectural changes unrelated to the task.
- Do not leave placeholders, stubs, TODO implementations, dead code, or unfinished work unless explicitly required by the task.
- Keep implementations complete, focused, and consistent with the surrounding code.
- Do not add excessive comments that merely explain obvious logic.
- Fix regressions introduced by the changes.
- Run the most relevant tests, builds, linting, type checks, or other verification required by the task or repository.
- If no automated tests exist, perform appropriate alternative verification such as type-checking, compilation, linting, building, syntax validation, or a relevant runtime smoke test.
- Verify that new imports resolve, referenced exports exist, and no syntax or obvious integration errors remain.
- Prefer focused verification when appropriate, but run broader checks when the scope of the changes requires them.
- Do not claim a check passed unless it was actually run and passed.
- Before finishing, review the final diff and confirm that only intended changes are included.

## 5. Commits

- Follow the repository's existing commit-message and commit-history conventions.
- When no convention is defined, use concise and descriptive commit messages.
- Keep commits logically organized and limited to changes belonging to the current task.
- Do not rewrite existing commit history unless the repository workflow requires it or the user explicitly requests it.

## 6. Branch & Base Synchronization

- Before creating or updating a PR, check whether the current branch has diverged from its base branch when relevant.
- Sync with the base branch when necessary and follow the repository's established merge or rebase convention.
- Resolve conflicts carefully and preserve the intent of both the task and the base branch.
- Never force-push rewritten history unless the user explicitly authorizes it.

## 7. PR Lifecycle

- A task should result in at most one PR.
- Before creating a PR, check whether one already exists for the current branch.
- If a PR already exists, continue using that PR instead of creating another one.
- Push subsequent task changes to the same branch so the existing PR is updated automatically.
- If the existing PR's title, scope, or verification details are materially outdated, update its metadata to reflect the current state.
- If no PR exists, create it only after all requested changes are implemented and relevant verification is complete.
- Never create draft, intermediate, or partial PRs unless the user explicitly requests one.
- Never create a second PR for the same task or branch.

## 8. PR Description

Write the PR description like a pragmatic senior engineer.

### Structure

```md
## Overview

1–2 sentences describing the problem or motivation and what the PR accomplishes.

## Key Changes

- Group related changes by concept or feature.
- Explain what changed and why.
- Focus on meaningful behavior, architecture, or user-facing changes rather than individual files.

## Verification

- List the relevant tests, builds, checks, or manual verification performed.
```

Add `## Context` only when useful for explaining technical background, benchmarks, trade-offs, or intentional follow-ups.

### Style

- Be direct, concise, technical, and matter-of-fact.
- Focus on context, rationale, impact, and verification.
- Do not write a robotic file-by-file changelog.
- Do not include generic checklist boilerplate.
- Do not include empty or placeholder sections.
- Do not include irrelevant information.
- Keep the description accurate to the final state of the branch.

## 9. Formatting

- Do not introduce emojis into new code, comments, identifiers, log statements, commit messages, PR titles, PR descriptions, or responses unless explicitly required by the task or necessary to preserve existing or external content.
- Wrap file names, directory paths, CLI commands, variables, and code elements in inline backticks.
- Use forward slashes (`/`) for paths in prose.
- Never use raw Windows backslashes (`\`) in prose.

## 10. PR Creation & Update

- Write the final PR description to `.pr_description.md` using UTF-8 encoding.
- Verify whether a PR already exists for the current branch before running `gh pr create`.
- If no PR exists, create it with:

`gh pr create --title "<title>" --body-file .pr_description.md`

- If a PR already exists, do not run `gh pr create`.
- When the existing PR description needs to be updated, use:

`gh pr edit --body-file .pr_description.md`

- Update the PR title when the current title no longer accurately represents the task.
- Push all subsequent changes to the same branch.
- Delete `.pr_description.md` after the PR has been created or updated.

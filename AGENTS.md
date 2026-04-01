# Agent Instructions

This file defines persistent repository-level implementation guidance for coding agents.

## Core preferences

- Favor small, focused files and explicit interfaces between modules.
- Prefer decomposition over adding more responsibilities to an existing large file.
- Keep module boundaries clear: rendering, state mutation, event wiring, and domain logic should not be mixed unless there is a strong reason.

## File size guideline

- Target a soft maximum of **500 lines of code per file**.
- If a change would push a file significantly beyond this threshold, split the work into smaller files first.
- For existing files already near or above the threshold, prefer refactors that reduce size over adding more code in place.
- Exceptions are allowed when justified (for example generated files, schema snapshots, or unavoidable framework constraints), but should be called out explicitly in PR notes or change summaries.

## Refactor expectations

- During refactors, optimize for isolated changes and stable interfaces.
- Extract shared utilities only when they are genuinely shared by multiple modules.
- Keep public module APIs small and explicit so future changes require less cross-file context.

## Testing expectations

- After any change to JavaScript files, run the full repository test suite before closing the task.
- If a new or changed behavior is a good unit-test candidate, add or update unit tests in the same change.
- UI features are in active flux: do not require new end-to-end/UI automation tests by default unless explicitly requested.

## Version-planning workflow

- Before coding for roadmap work, create or update a version plan file with checkbox steps for each feature version listed in `IMPLEMENTATION_PLAN.md`.
- Keep this plan in a dedicated markdown file at repository root: `FEATURE_VERSION_CHECKLIST.md`.
- After initial planning and before implementation, review `FEATURE_VERSION_CHECKLIST.md` and augment it with any missing concrete tasks needed for the specific feature/version.
- As implementation progresses, check off each completed task individually rather than marking entire sections at once.

## Code review subagent

- Use the `code reviewer` subagent configuration at `.agents/code-reviewer.toml` for implementation reviews.
- Run this reviewer before finalizing substantial code changes and after tests pass.
- Treat reviewer findings as actionable follow-ups: resolve them or document why an exception is justified.

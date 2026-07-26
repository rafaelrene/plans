# Plans — working notes

A minimal app for hosting and sharing self-contained AI-generated HTML plans.
Read `CONTEXT.md` for the language and `docs/adr/` for the decisions.

## Philosophy: evergreen project

This is a personal project. There is **no backwards-compatibility concern and no
fear of breakage** — if everything breaks, that's fine.

- Always prefer the new/better way. Never keep an old path around for compat.
- Bold suggestions that change everything or risk breakage are welcome.
- Never soften a recommendation to avoid a breaking change — just do it right.

## Stack

- SvelteKit + `adapter-vercel` (Hobby free tier), Svelte 5, Tailwind 4.
- Vercel Blob for plan storage. No database (see ADR 0002).
- pnpm monorepo with `apps/web` and `apps/cli` workspaces.

## Feature choices

Experimental features are **not something to be afraid of** — reach for them
when they make the code simpler or better.

- **Remote functions** are the only browser↔server channel — never `load`.
  Queries for reads, commands/forms for writes.
- **Plain `+server.ts` endpoints** are reserved for the external CLI-facing API
  (`POST /api/plans`), Bearer-authed.
- **Async Svelte** is enabled. Consume remote queries by awaiting them directly
  in markup; wrap data-dependent components in `<svelte:boundary>`. Keep one
  top-level boundary in the layout as a catch-all.

## CLI

- The CLI is a separately distributable program with exactly two commands:
  `login` and `upload`.
- Implement and compile `apps/cli` with Bun; do not migrate `apps/web` from
  pnpm.
- Distribute the CLI as a standalone executable built with `bun build --compile`.
- Build only for Apple Silicon macOS initially. Add other Bun targets when
  someone needs them.
- It targets one URL compiled into the program rather than user-configurable
  servers or profiles. Use `http://localhost:5173` until production exists.
- Persist login credentials under
  `${XDG_STATE_HOME:-$HOME/.local/state}/plans`.
- `upload <file.html>` uploads one Plan and prints its Share Link.
- Plan deletion, if added, belongs to the web UI.

## Code style

- Optimize for a human reader. Simple over clever; YAGNI unless stated.
- Lean on the type system; avoid `any`. Let types document intent.
- Svelte 5 runes (`$state`, `$derived`, `$effect`) — no legacy reactive `$:`.
- **Always use strict comparison** (`===` / `!==`). No loose equality.
- **Be explicit, never implicit.** Don't let things fail silently — check for
  the failure, handle it deliberately, and surface a clear, owned error.
  Failing loud is fine; failing vaguely is not.
- Comments explain how something is used and _why_, not line-by-line what.
- Tests are focused, not regression/smoke slop.
- Run format, lint, and tests after code changes.

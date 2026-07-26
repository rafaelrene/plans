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
- **Plain `+server.ts` endpoints** are reserved for the Bearer-authenticated
  external CLI API: `GET /api/auth` validates credentials and
  `POST /api/plans` uploads a Plan.
- **Async Svelte** is enabled. Consume remote queries by awaiting them directly
  in markup; wrap data-dependent components in `<svelte:boundary>`. Keep one
  top-level boundary in the layout as a catch-all.

## CLI

- The CLI is a separately distributable program with exactly two commands:
  `login` and `upload`.
- Keep the CLI dependency-free. Parse `Bun.argv` directly; support `--help`
  without introducing a command framework.
- Implement and compile `apps/cli` with Bun; do not migrate `apps/web` from
  pnpm.
- Distribute the CLI as a standalone executable built with `bun build --compile`.
- Build only for Apple Silicon macOS initially. Add other Bun targets when
  someone needs them.
- Until production has a stable URL, build only `apps/cli/dist/plans`; defer
  GitHub Releases, npm, and Homebrew packaging.
- It targets one URL compiled into the program rather than user-configurable
  servers or profiles. Use `http://localhost:5173` until production exists.
- Persist the Owner secret as plaintext at
  `${XDG_STATE_HOME:-$HOME/.local/state}/plans/credentials`. Create the
  directory with mode `0700` and the file with mode `0600`.
- `login` validates the supplied Owner secret through `GET /api/auth` and saves
  it only after a `204` response. Read the secret from a hidden interactive
  prompt, never from an argument or flag.
- Re-running `login` validates first, then atomically replaces the credential.
  Failed or interrupted login preserves the existing credential.
- `upload <file.html>` accepts only the file path, uploads one Plan, and prints
  its Share Link. Reject HTML without a non-empty `<title>`; there is no title
  argument or filename fallback.
- The CLI validates that the path is a readable regular `.html` file. The server
  alone validates non-empty content and extracts the required `<title>`.
- Plans are limited to 4 MiB. Enforce the limit in both CLI and server; reject
  oversized requests with `413 Plan exceeds 4 MiB.`
- `POST /api/plans` receives the file bytes directly as a
  `text/html; charset=utf-8` body, without multipart data or metadata.
- Every upload creates a distinct immutable Plan, even when its content matches
  an existing Plan. There is no deduplication, overwrite, or update path.
- Generate the Plan ID with `crypto.randomUUID()`, store the Plan at
  `plans/<uuid>/<base64url(title)>.html`, and expose it at `/p/<uuid>`. Decode
  sidebar titles from Blob pathnames rather than fetching every Plan.
- A successful upload returns `201 Created`, an empty body, and the absolute
  Share Link in `Location`; the CLI prints only that value to stdout.
- API failures return the meaningful HTTP status and a concise `text/plain`
  message. All CLI diagnostics go to stderr and exit non-zero.
- Do not try to detect external assets; self-containment is the producer's
  responsibility because arbitrary JavaScript makes complete validation
  impossible.
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

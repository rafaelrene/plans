# Plans

A minimal app for hosting and sharing self-contained, AI-generated HTML Plans.

## Setup

```sh
mise install
pnpm install
cp apps/web/.env.example apps/web/.env
vercel env pull apps/web/.env.local
pnpm dev
```

Set `PLANS_OWNER_SECRET` in `apps/web/.env`. Connecting a private Vercel Blob store
and pulling the project environment provides `BLOB_STORE_ID`. Vercel Blob obtains
the short-lived OIDC token from the request context in production and from the
pulled environment during local development.

## CLI

Build the Apple Silicon executable:

```sh
pnpm --filter @plans/cli build
```

Then authenticate once and upload a Plan:

```sh
apps/cli/dist/plans login
apps/cli/dist/plans upload ./plan.html
```

The CLI targets `http://localhost:5173` until the production deployment exists.

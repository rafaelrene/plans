# Plans

A minimal app for hosting and sharing self-contained, AI-generated HTML Plans.

## Setup

```sh
mise install
pnpm install
cp apps/web/.env.example apps/web/.env
pnpm dev
```

Set `PLANS_OWNER_SECRET` and `BLOB_READ_WRITE_TOKEN` in `apps/web/.env`.

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

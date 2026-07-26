# Single shared-secret authentication, no user database

The app has one Owner, so we authenticate with a single server-side secret
rather than a user/password system or an auth provider. The browser login
exchanges the secret for an httpOnly session cookie; the CLI/API sends it as
`Authorization: Bearer <secret>`. Chosen for simplicity; the cost is that
supporting multiple distinct humans later means real rework.

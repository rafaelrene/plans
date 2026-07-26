# Blob-only storage, no database

Plans are stored as HTML files in Vercel Blob with no database. The sidebar
lists plans via Blob's `list()` (owner-only, server-side). On upload, the server
extracts the required, non-empty HTML `<title>` and stores it as base64url in
`plans/<id>/<encoded-title>.html`; the sidebar decodes the title from that
pathname and uses Blob's `uploadedAt` for the date. Uploads without a title are
rejected; there is no override or filename fallback. Chosen over Postgres/Turso
for radical simplicity; the cost is metadata is limited to what fits in the
pathname — tags/description/expiry would require adding a database later.

The Blob store is private. The server reads Plan content with authenticated
Blob requests, so the Share Link is the only public access path.

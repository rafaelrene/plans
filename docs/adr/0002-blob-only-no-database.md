# Blob-only storage, no database

Plans are stored as HTML files in Vercel Blob with no database. The sidebar
lists plans via Blob's `list()` (owner-only, server-side); title comes from the
HTML `<title>` (or an optional `?title=`), date from `uploadedAt`, and the
unguessable id/pathname is the Share Link secret. Chosen over Postgres/Turso for
radical simplicity; the cost is metadata is limited to what fits in the pathname
— tags/description/expiry would require adding a database later.

# Plans

A minimal web app for hosting and sharing self-contained, AI-generated HTML
plans. The Owner logs in to manage and upload plans; anyone holding a plan's
Share Link can view it without logging in.

## Language

**Plan**: A single immutable, self-contained HTML file, AI-generated, describing
a plan of work; no external assets — one file, nothing else. Uploading even
identical content creates a distinct Plan.
_Avoid_: Document, page, report

**Owner**: The single authenticated human who uploads and manages plans and is
the only one who can see the full list of plans and their Share Links. (May
become multiple humans later.)
_Avoid_: User, admin, account

**Share Link**: The public, unguessable app URL (`/p/<id>`) that renders a Plan.
Anyone holding it can view the plan without authenticating; the link is the
secret. Only the Owner can discover a plan's Share Link.
_Avoid_: Public link, blob URL, share URL

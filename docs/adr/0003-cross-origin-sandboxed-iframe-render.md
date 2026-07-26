# Render plans in a cross-origin sandboxed iframe

Plan HTML may contain arbitrary JS, so we never inject it into our own DOM.
`/p/<id>` embeds the plan in an `<iframe>` whose `src` is the raw Vercel Blob
URL (a different registrable domain) plus `sandbox="allow-scripts"`. Cross-origin
means the plan's JS can never read the Owner's cookies or reach app endpoints.
Deliberately NOT proxied through our own domain — doing so would expose the
session origin to plan JS. The blob URL is visible in devtools, which is
harmless because the content is public-by-link by design.

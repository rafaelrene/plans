# Render plans in an opaque-origin sandboxed `srcdoc` iframe

Vercel Blob deliberately blocks inline HTML and framing, so `/p/<id>` fetches
the Plan server-side and renders its HTML in an iframe through `srcdoc`. The
iframe uses `sandbox="allow-scripts"` without `allow-same-origin`, giving Plan
JavaScript an opaque origin that cannot access the Owner's cookies or app
endpoints. Relaying the public-by-link content through the app increases the
response size, but keeps one deployment and Blob-only storage; using the raw
Blob URL is not viable.

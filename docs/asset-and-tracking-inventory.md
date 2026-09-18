# Asset and tracking inventory — 2026-09-18

Scope: application source and local browser checks, not a legal rights certification or an audit of hosting-provider settings.

| Item | Observed use / action |
| --- | --- |
| `Client/public/og-image.png` | New original AI-generated social preview, inspected and copied into the project. PNG 1730×909, 1,208,843 bytes. Social metadata uses the real dimensions. Not loaded as the landing hero; optimization remains to be done. |
| `Client/src/assets/hero.png` | Existing asset, no source imports found. Origin/rights not established. Preserved, not deleted or relabelled as licensed. |
| Existing React/Vite SVG assets | Existing development assets; no current page imports found. Preserved. |
| `Client/public/favicon.svg`, `icons.svg`, `AILogo.jsx` | Existing vector/code-native branding preserved; logo label no longer falsely reports live AI status. |
| Lucide icons | Installed package icons; retain their package/license notices. Decorative instances use the library's hidden SVG semantics. |
| Avatar component | Its optional image already has name-based alt text. Current profile UI uses initials, not uploaded remote photos. Future user-supplied image URLs need review. |
| Google Fonts CSS import | Removed. Existing system/sans-serif fallback is used; no replacement remote font or font service added. |
| Advertising/visitor analytics | No ad tags, tracking pixels, analytics SDK initialization or third-party marketing embeds found in application source. Hosting dashboards may separately enable services; review those before launch. |
| PDF preview | Locally generated PDF shown in a browser iframe/blob, not a third-party content embed. Iframe title and download-control accessibility still need final review. |
| Necessary session | Server HttpOnly, SameSite=Lax cookie; Secure in production. No tokens in localStorage. |
| Optional browser state | `arr-theme`, `arr-notif-last-seen` gated by an explicit preference choice. `arr-privacy-choice` records that decision. Rejecting/revoking removes only optional app keys. |
| Server providers | Google Gemini receives resume text/sections for requested processing. PostgreSQL stores account/document data. Provider terms, retention, backups and hosting logs require owner review. |

## Social image provenance

Built-in image-generation tool, new image; no reference photos, logos or third-party artwork supplied. The prompt requested an opaque landscape social graphic in dark brown `#20150e`, cream `#fdfbd4` and restrained orange, with abstract resume sheets/version markers. Exact copy: “ResumeTrackerAI”, “Review your resume.”, “Track every improvement.”, and “AI-assisted review • Version tracking • PDF export”. Constraints: high contrast, safe inset, no people/photos, other brands, metrics, ratings, hiring claims or watermark. It requested 1200×630, but the tool returned 1730×909; metadata reflects the actual output.

This is an origin record, not a guarantee of exclusive copyright or jurisdiction-specific ownership. Do not publish unrelated existing assets without establishing their rights.

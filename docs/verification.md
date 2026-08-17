# Dashboard Verification Record

## Verified in managed preview

The managed project preview rendered the authenticated Orbit Console dashboard with the seeded database-derived values: **100 repository signals** and **3 connected surfaces**, plus the persisted integration list, read-only repository-analysis controls, n8n boundary card, draft queue, and activity trace. The rendering was captured after the development service restart on 16 August 2026.

## Browser-session limitation

The standalone browser initially reached the Orbit Console sign-in page and the Manus OAuth form. On 17 August 2026, the owner completed the supported OAuth flow. The authenticated dashboard then displayed the expected owner profile, **100 repository signals**, **3 connected surfaces**, all six seeded integration records, the local-only n8n boundary, and the repository analysis controls. A bounded metadata-only analysis then completed for one listed repository, with its generated read-only report and audit entry displayed in the Activity Trace. It neither cloned nor changed repository code.

The authenticated browser was then closed after verification to release sandbox memory; no repository, n8n, credential, or account write action was performed.

After the report-rendering refinement, the same authenticated control was invoked again to validate that a newly generated metadata-only report reaches the formatted report card.

That repeat analysis completed successfully. The report card rendered headings, inline code, and structured learning opportunities with Markdown formatting, and the Activity Trace recorded the second read-only analysis. The browser session was closed afterward to minimize memory use.

## Published domain

Orbit Console is published at `https://n8nproxy-cahgljjg.manus.space`. The production route responds with the intended authentication gate rather than exposing dashboard data anonymously. Its sign-in action opens the Manus OAuth flow for the production callback URL; no anonymous access, credential configuration, or external workflow activation is available from that public route.

The owner-authorized account selection was initiated through the production OAuth flow to complete the protected production dashboard verification.

The browser runtime became unavailable while waiting for the callback. As a fallback, a direct HTTPS request to the production domain returned HTTP 200 with an HTML response. Combined with the observed sign-in gate and OAuth redirect, this verifies that the published domain is reachable and protected. No production-side data or workflow write was attempted during the check.

## Durable n8n readiness

The local n8n health endpoint is currently responsive (HTTP 200), and the prepared personal-computer deployment package is present alongside 16 staged workflow JSON files. However, no writable personal-computer mount is attached in this session, so there is no zero-cost machine available to install and keep a durable n8n runtime online. The local sandbox instance therefore remains a non-durable, local-only boundary and is not eligible for external endpoint registration.

## API credential readiness

Non-generative metadata checks confirm that the configured OpenAI and Anthropic credentials currently authenticate successfully. The Gemini variable does not have the required Google API-key format, so it cannot activate the Google Gemini n8n credential. The xAI credential retains the expected token prefix but its metadata request returns HTTP 403, so it requires replacement or account-side resolution before use. Local n8n credential metadata could not be enumerated because the stored browser session is unauthorized (HTTP 401); no secret values were requested, displayed, or changed.

# AI Credential Readiness

This status record intentionally contains **no credential values**. It reflects non-generative metadata checks performed on 17 August 2026.

| Integration | Readiness result | Required action before workflow activation |
| --- | --- | --- |
| OpenAI | Ready — metadata request authenticated successfully (HTTP 200). | No replacement currently indicated. |
| Anthropic | Ready — metadata request authenticated successfully (HTTP 200). | No replacement currently indicated. |
| Google Gemini | Blocked — the configured value does not have the required Google `AIza...` API-key format. | Replace it with a valid Google AI Studio Generative Language API key. |
| xAI / Grok | Blocked — the metadata request returned HTTP 403. | Replace the key or resolve account-side API access, then re-test before enabling a workflow. |
| Local n8n session | Reauthentication required — credential metadata endpoint returned HTTP 401. | Sign in to the local n8n instance again before changing or validating credentials in its UI/API. |

No credential values were read, written, displayed, committed, or passed to application clients during this assessment.

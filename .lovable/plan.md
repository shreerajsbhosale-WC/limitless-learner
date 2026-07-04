## Goal

Capture a screenshot of every route in the app and deliver them as image artifacts you can preview.

## Routes to capture

Public:
- `/` — landing
- `/auth` — sign-in / sign-up
- `/study` — study kit generator

Authenticated (uses your injected session):
- `/assistant`
- `/flowchart`
- `/focus`
- `/groups`
- `/habits`
- `/library`
- `/weekly`

I'll skip `/library/$kitId` since it needs an existing kit id; if you want it too, say so and I'll pick the first kit from your library.

## How

1. Launch headless Chromium via Playwright against `http://localhost:8080` at 1280×1800.
2. Restore your Supabase session (cookies + localStorage) so authenticated pages render as you.
3. Visit each route, wait for network idle, save `pageName.png` to `/mnt/documents/pages/`.
4. Return each screenshot as a `<presentation-artifact>` in the reply.

No code files change. Nothing is edited in the project.

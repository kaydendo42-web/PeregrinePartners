# Tablet dashboard and remembered sessions implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ship the approved tablet adaptation and explicit 30-day session persistence.
**Architecture:** A shared pure cookie-policy module keeps server, proxy and browser refreshes consistent. Existing Supabase identity, MFA and RLS remain authoritative; provider session lifetime is documented separately for rollout. Responsive console styles and a disclosure navigation adapt the existing screens.
**Tech Stack:** Next.js 16.3.2, React 19, Supabase SSR 0.12.7, TypeScript, CSS.
**Spec:** `docs/superpowers/specs/2026-10-25-tablet-and-remembered-sessions-design.md` (approved in chat).

## Global constraints

- Preserve existing design, tenant isolation, independent auth projects and MFA policies.
- Checkbox unchecked by default; fixed 30 days, normal short JWT lifetime.
- Existing sessions retain their cookie behaviour until explicit sign-in.
- No production booking writes during testing, no provider setting changes during preview.
- Keep other client consoles working; tablet controls at least 44px.

## Review focus

- Expired, missing and malformed policy values, including deletion of cookie chunks.
- Browser refreshes must not restore persistent cookies to unchecked sessions.
- Founder fallback, email callbacks and password recovery must retain the right project.
- Sign-out affects this device/project, not independent sessions.
- Long data and mixed booking statuses must not push actions off the tablet viewport.

### Task 1: Consistent remembered-session lifecycle

**Files:** Create `lib/auth/session-policy.ts`, `lib/auth/session-preference.ts`, `tests/crm/session-policy.test.ts`; modify `lib/supabase/{server,browser}.ts`, `proxy.ts`, `app/sign-in/{actions,page}.tsx` (actions is `.ts`), `app/auth/confirm/route.ts`, `components/forms/sign-in-form.tsx`, `lib/content.ts`, `lib/auth/next.ts`.
**Interfaces:** Pure helpers name policy cookies by Supabase project URL, parse preferences, create a fixed expiry, adapt auth cookie options and filter expired session cookies. Server helpers persist/clear preferences; sign-in routing uses safeDestination and existing authProject.

- [x] Write tests for fixed expiry, unchecked session cookies, deletion preservation, project separation, legacy sessions, malformed/expired policy and returning-session routing; run and observe failure.
- [x] Implement the shared policy and integrate every cookie writer, sign-in path and local sign-out. Add the unchecked checkbox and trusted-device copy. Do not change provider settings in preview.
- [x] Run targeted tests, existing MFA/project tests and TypeScript; commit.

### Task 2: Tablet navigation and working layouts

**Files:** Modify `app/console/[venue]/{layout,nav}.tsx`, `app/console/console.css`, booking and dinner list classes as needed. Add responsive fixture verification under `tests/console/` if needed.
**Interfaces:** Existing console routes/actions/data unchanged; semantic navigation disclosure and console-table variants preserve keyboard/touch use.

- [x] Use the recorded 1024px overflow and 768px density failures as visual regression cases.
- [x] Implement tablet navigation, compact grouped booking/dinner rows, wrapping date controls, two-column forms and 44px touch controls; contain timeline/floor scrolling.
- [x] Run demo locally without production credentials; batch-check both tablet orientations, phone and desktop. Fix material findings once, confirm and commit.

### Task 3: Verify and deliver

**Files:** Add rollout/check results to `docs/console-setup.md` and update spec status.

- [x] Run test suite, lint, Next type generation, TypeScript, build and Impeccable detector on modified UI.
- [x] Obtain an independent whole-branch review, fix material findings with regression tests.
- [ ] Push feature branch, create a PR and Vercel preview, verify preview access and report provider setting requirements accurately. Kayden merges.

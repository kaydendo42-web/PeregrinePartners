# Peacock tablet dashboard and remembered sessions

Status: proposed; awaiting Kayden's scope approval.

## Intent

Make The Peacock's existing venue console comfortable to operate on a tablet
during service. Add an explicit sign-in option to retain a verified session for
up to 30 days on the same browser, reducing unnecessary authenticator prompts.

The client console is in `kaydendo42-web/PeregrinePartners`, served at
`https://www.peregrineoffice.space/console/the-peacock`. The older
`www.peregrinepartners.space` address redirects there. The public Peacock
website is a separate repository and deployment.

## Evidence

- At an emulated 1024 × 768 viewport, the booking list makes the document
  1153px wide. Its action buttons begin at x=1074.84, outside the viewport.
- The sidebar consumes 220px at that width. Action buttons are only 32px tall.
- At 768 × 1024, navigation becomes a horizontally scrolling strip and every
  booking becomes a long single-column card.
- The current sign-in page renders the login form without first routing an
  already authenticated member into the appropriate workspace.
- The booking database contains 15 sessions, 11 at `aal2`, with no individual
  `not_after` values. Its Android session refreshed across more than one day.
  This does not establish why any particular user had to sign in again.

## Tablet experience

Preserve the current Peregrine console palette, typography, page order and
booking behaviour. This is an adaptation of the current interface.

Prioritise Android landscape provisionally, based on the existing onboarding
notes. Support portrait as well. Check 768, 820, 1024 and 1280px widths, plus a
phone and desktop regression check.

Use compact, accessible tablet navigation with every destination reachable
without a long horizontal strip. Keep the venue and New booking action clear.
Bookings and dinner orders must show their important fields and actions inside
the available width. Use compact grouped rows/cards at widths where the full
table no longer fits. Long names, notes and email addresses must wrap without
covering actions. Core actions and form controls need at least 44px touch
targets. New/edit booking forms should use two columns where useful on tablets,
and one on phones. Calendar, timeline, floor, customer and settings screens
receive a compatibility pass; any intentional scrolling stays inside its own
labelled region rather than making the page overflow.

Do not create, seat, move, cancel or otherwise change real bookings during UI
verification. Use local demo/fixture data for interactions.

## Remembered sign-in

Add an unchecked checkbox labelled **Keep me signed in for 30 days**, with
brief copy explaining that it is for a trusted device. Unchecked means a
browser-session cookie policy; browser session restoration remains controlled
by the browser.

Apply the preference consistently to password sign-in, the MFA step, email-link
sign-in, server cookie writes, proxy refreshes and browser SDK refreshes.
Maintain separate policy state for the booking and internal Supabase projects.
The existing founder fallback must carry the preference into the correct
project without creating a cross-project session.

A remembered session keeps the normal short-lived access token and refresh
mechanism. It requires the existing authentication/MFA policy when established.
A checkbox or preference cookie never establishes identity, raises assurance,
or substitutes for a verified Supabase session. Preserve venue membership,
tenant isolation and existing RLS/MFA requirements. Preserve the barber shop's
existing MFA policy, rather than adding or removing MFA for that role.

The 30-day period is fixed from creation of the authenticated session;
refreshes must not silently extend it indefinitely. The implementation choice
is Supabase's supported **Time-box user sessions** setting at 30 days as the
provider-enforced ceiling, together with consistent browser cookie persistence.
Verify the current settings and plan support for both auth projects before
implementation; the provider feature requires Pro or higher. Do not claim a
strict provider expiry based on a deadline cookie alone: browser SDK and
Realtime access also use the provider session.

This ceiling affects all sessions in each configured auth project, including
barber shop members in the shared booking project. Existing sessions retain
their provider start time and expire at that ceiling on refresh (plus the
normal remaining JWT lifetime), rather than all being revoked at deployment.
Keep existing sessions' current cookie behaviour until their next explicit
sign-in; only new sign-ins use the checkbox. Document that choosing unchecked
changes the current persistent-cookie default. Keep the existing short JWT
lifetime and RLS. Include the provider setting change and its affected projects
in the rollout instructions; do not apply it silently during preview work.

Returning members with a valid session go directly to a safe, authorised
destination. Sessions still needing MFA go to verification. Signing out clears
the current project's cookies and remembered preference and ends its session;
use current-session (`local`) sign-out rather than Supabase's global default,
so another signed-in device and the independent project keep their sessions.
After expiry,
revocation or cleared cookies, require normal sign-in again. Password recovery
must keep its dedicated flow and cannot be redirected past it.

This feature remembers an already verified session. It does not bypass MFA
after a user explicitly signs out, loses cookies or starts a fresh login.

## Verification and delivery

- Regression tests for preference parsing, project separation, a fixed expiry,
  refresh cookie handling, valid-session routing, sign-out, and MFA preservation.
- Existing tests, lint, route type generation, TypeScript and production build.
- A batched browser check of the tablet screens in both orientations and a
  confirmation pass after fixing material findings. Distinguish viewport
  emulation from a physical-device touch test.
- A preview and reviewable PR in PeregrinePartners. Kayden merges. Keep the
  public site's Square credential blocker separate and on hold pending Jenny.

No PWA, push notifications, booking workflow redesign or marketing-site redesign
is included in this change.

References: [Supabase session lifetime settings](https://supabase.com/docs/guides/auth/sessions),
[MFA assurance and enforcement](https://supabase.com/docs/guides/auth/auth-mfa).

# Founder dashboard and client CRM continuation

The user authorised a HighLevel-inspired redesign and continued CRM work for Peregrine and its clients on 2026-10-06.

## Design

Use a compact navy sidebar (#14213d), blue actions (#2563eb), a cool workspace (#f4f6fa), white panels (#ffffff), slate text (#172b4d) and green connection states (#16815d). Existing Inter is the interface face; existing mono is reserved for references and numerical utilities. Compact dashboard headings replace oversized forms. The signature is a working agency/client switcher leading to client performance, with account editing in separate tabs. No decorative controls or invented figures.

The overview combines saved outreach stages, action queues, client accounts and booking reports. Client accounts open on booking performance; account, services, billing and activity remain editable behind tabs. Service availability, recorded subscriptions and verified reporting access are different states.

## Client CRM first slice

Reuse a venue-scoped customer module inside the existing authenticated console: booking-derived profiles, booking history, append-only notes and dated follow-up tasks. Founders with existing venue membership can open the same tool. No new user memberships are granted. Clients remain unable to access internal outreach or commercial records.

Profiles group bookings by email, then phone; a booking without either remains a separate profile. Notes/tasks anchor to an existing booking, so no copied guest database or background synchronisation is needed. Show booked guests and booking records rather than claiming confirmed reservations were attended visits.

All reports and entries use the signed-in client, existing venue membership and two-step authentication. New functions are security invoker. New entry tables have RLS, restricted column grants, immutable attribution, retry identity and optimistic task versions. Existing booking policies and public website writes are unchanged. Realtime invalidates reads and catches up on focus/reconnect; counts and series aggregate in the database.

## Validation

Check anonymous/non-member/aal1 denial, cross-venue references, author spoofing, safe retries, concurrent task versions, booking date boundaries, customer grouping and private/internal separation. Verify desktop/mobile views and deployed authenticated founder/client-tool reads. Do not create fake production bookings or send customer messages. Actual multi-founder collaboration remains a launch gate until independent accounts are available.

The migration file matches the provider's applied timestamp. It depends only on the earlier booking baseline and authentication functions, so it can precede the internal CRM migrations on a fresh database. Applied database history is preserved.

"use client";

/**
 * When a console page can't load — the database is unreachable, or a session
 * expired mid-shift. Nothing is lost: bookings live in the database, not here.
 */
export default function ConsoleError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="console-page">
      <div className="console-problem console-problem--block" role="alert">
        <p className="console-strong">This page didn&rsquo;t load.</p>
        <p className="console-muted">
          Your bookings are safe. Check your connection and try again. If it keeps happening, sign out and back in.
        </p>
        <div>
          <button className="console-btn console-btn--sm console-btn--primary" onClick={() => retry()}>
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

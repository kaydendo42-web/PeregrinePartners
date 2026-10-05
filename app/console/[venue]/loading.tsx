/**
 * Shown while a console page fetches its day from the database. It keeps the
 * shape of the page (day bar, summary, rows) so nothing jumps when it lands.
 */
export default function Loading() {
  return (
    <div className="console-page" aria-busy="true">
      <span className="sr-only" role="status">
        Loading
      </span>
      <div className="console-skel console-skel--bar" />
      <div className="console-skel console-skel--line" />
      <div className="console-skel-rows">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="console-skel console-skel--row" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  );
}

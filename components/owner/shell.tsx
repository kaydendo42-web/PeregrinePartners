import type { ReactNode } from "react";

export function OwnerShell({
  displayName,
  navigation,
  status,
  signOutControl,
  workspaceControl,
  children,
}: {
  displayName: string;
  navigation: ReactNode;
  status: ReactNode;
  signOutControl: ReactNode;
  workspaceControl?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="owner-shell">
      <a className="owner-skip" href="#owner-content">
        Skip to content
      </a>
      <aside className="owner-sidebar">
        <div className="owner-brand">
          <span className="owner-brand-mark" aria-hidden="true">
            P↗
          </span>
          <span>
            Peregrine<span className="owner-brand-sub">Partners</span>
          </span>
        </div>
        {workspaceControl ?? (
          <div className="owner-workspace">
            <span className="owner-workspace-icon" aria-hidden="true">
              P
            </span>
            <span>
              Founder workspace<small>Peregrine Partners</small>
            </span>
            <span aria-hidden="true">⌄</span>
          </div>
        )}
        {navigation}
        <div className="owner-sidebar-bottom">
          <div className="owner-person">
            <span className="owner-avatar">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <span>
              {displayName}
              <small>Owner</small>
            </span>
          </div>
          {signOutControl}
        </div>
      </aside>
      <main id="owner-content" className="owner-main">
        <header className="owner-header">
          <span>
            <strong>Peregrine Partners</strong>{" "}
            <span className="owner-muted">/</span> Agency workspace
          </span>
          <div className="dash-header-actions">
            <form action="/owner/clients" className="dash-header-search">
              <input
                name="q"
                placeholder="Find a client…"
                aria-label="Find a client"
              />
              <button aria-label="Search clients">⌕</button>
            </form>
            {status}
          </div>
        </header>
        <div className="owner-content">{children}</div>
      </main>
    </div>
  );
}

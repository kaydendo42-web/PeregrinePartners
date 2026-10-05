import type { ReactNode } from "react";

export function OwnerShell({
  displayName,
  navigation,
  status,
  signOutControl,
  children,
}: {
  displayName: string;
  navigation: ReactNode;
  status: ReactNode;
  signOutControl: ReactNode;
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
        <div className="owner-workspace">
          <span className="owner-workspace-icon" aria-hidden="true">
            P
          </span>
          <span>
            Founder workspace<small>Peregrine Partners</small>
          </span>
          <span aria-hidden="true">⌄</span>
        </div>
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
            Workspace <span className="owner-muted">/</span> Peregrine Partners
          </span>
          {status}
        </header>
        <div className="owner-content">{children}</div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { Workspace, WorkspaceMember } from "@/lib/workspaces";
import "./workspace-menu.css";

/**
 * The avatar in the top-left corner of both dashboards. Opens a list of every
 * workspace this browser is signed in to: Peregrine Office and each venue.
 * Plain links, so switching loads the other project's session fresh.
 */
export function WorkspaceMenu({
  me,
  workspaces,
  current,
}: {
  me: WorkspaceMember;
  workspaces: Workspace[];
  current: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const here = workspaces.find((w) => w.key === current);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div className="wsm" ref={root}>
      <button
        type="button"
        className="wsm-trigger"
        aria-expanded={open}
        aria-controls="wsm-panel"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="wsm-avatar" aria-hidden="true">
          {me.initial}
        </span>
        <span className="wsm-label">
          <strong>{here?.name ?? "Workspaces"}</strong>
          <small>{me.name}</small>
        </span>
        <span className="wsm-caret" aria-hidden="true">
          ⌄
        </span>
        <span className="sr-only">Switch workspace</span>
      </button>

      {open ? (
        <div className="wsm-panel" id="wsm-panel">
          {me.email ? <p className="wsm-email">{me.email}</p> : null}
          <ul>
            {workspaces.map((w) => (
              <li key={w.key}>
                <a
                  href={w.href}
                  aria-current={w.key === current ? "page" : undefined}
                >
                  <span className="wsm-icon" aria-hidden="true">
                    {w.kind === "office" ? "P" : w.name.slice(0, 1)}
                  </span>
                  <span className="wsm-name">
                    {w.name}
                    <small>
                      {w.kind === "office" ? "Founder workspace" : "Venue"}
                      {w.signedIn ? "" : " · Sign in"}
                    </small>
                  </span>
                  {w.key === current ? (
                    <span className="wsm-tick" aria-hidden="true">
                      ✓
                    </span>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

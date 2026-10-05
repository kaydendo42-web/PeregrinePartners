import type { Metadata } from 'next';
import { requireOwner } from '@/lib/owner/access';
import { signOut } from '@/app/sign-in/actions';
import { OwnerNav } from './nav';
import './owner.css';

export const metadata:Metadata={title:'Owner workspace',robots:{index:false,follow:false}};
export default async function OwnerLayout({children}:{children:React.ReactNode}) {
  const {context}=await requireOwner();
  return <div className="owner-shell">
    <a className="owner-skip" href="#owner-content">Skip to content</a>
    <aside className="owner-sidebar">
      <div className="owner-brand"><span className="owner-brand-mark" aria-hidden="true">P↗</span><span>Peregrine<span className="owner-brand-sub">Partners</span></span></div>
      <div className="owner-workspace"><span className="owner-workspace-icon" aria-hidden="true">P</span><span>Founder workspace<small>Peregrine Partners</small></span><span aria-hidden="true">⌄</span></div>
      <OwnerNav />
      <div className="owner-sidebar-bottom"><div className="owner-person"><span className="owner-avatar">{context.displayName.slice(0,1).toUpperCase()}</span><span>{context.displayName}<small>Owner</small></span></div><form action={signOut}><button className="owner-signout">Sign out <span aria-hidden="true">↗</span></button></form></div>
    </aside>
    <main id="owner-content" className="owner-main"><header className="owner-header"><span>Workspace <span className="owner-muted">/</span> Peregrine Partners</span><span className="owner-private">Private workspace</span></header><div className="owner-content">{children}</div></main>
  </div>;
}

import Link from 'next/link';
import {requireOwner} from '@/lib/owner/access';
export default async function Overview() {
 await requireOwner();
 return <><div className="owner-page-head"><div><p className="owner-eyebrow">Peregrine Partners</p><h1>Overview</h1><p className="owner-muted">Your clients, outreach and next steps, together.</p></div><Link className="owner-button" href="/owner/outreach/import">Import businesses <span aria-hidden="true">↗</span></Link></div><section className="owner-panel owner-empty"><span className="owner-empty-icon" aria-hidden="true">↗</span><h2>Make room for your next client.</h2><p>Import your business list to start a shared outreach pipeline, or add your first client.</p><div className="owner-actions"><Link className="owner-button" href="/owner/outreach/import">Import a CSV</Link><Link className="owner-button owner-button-secondary" href="/owner/clients">Add a client</Link></div></section></>;
}

'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useState} from 'react';
const entries=[['Overview','/owner','M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z'],['Clients','/owner/clients','M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'],['Outreach','/owner/outreach','M22 2 9 15 M22 2l-7 20-6-7-7-6Z'],['Follow-ups','/owner/follow-ups','M9 11l3 3 8-8 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],['Tools','/owner/tools','M12 3l9 5-9 5-9-5 9-5Z M3 12l9 5 9-5 M3 16l9 5 9-5']];
export function OwnerNav() {
 const path=usePathname();const [open,setOpen]=useState(false);
 return <><button className="owner-menu" aria-expanded={open} aria-controls="owner-nav" onClick={()=>setOpen(!open)}>Workspace menu <span aria-hidden="true">{open?'−':'+'}</span></button><nav id="owner-nav" className={'owner-nav'+(open?' owner-nav-open':'')} aria-label="Owner workspace"><p className="owner-nav-label">Manage</p>{entries.map(([label,href,icon])=>{const active=href==='/owner'?path===href:path.startsWith(href);return <Link key={href} href={href} aria-current={active?'page':undefined} onClick={()=>setOpen(false)}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icon}/></svg>{label}{active?<span className="owner-nav-dot"/>:null}</Link>;})}</nav></>;
}

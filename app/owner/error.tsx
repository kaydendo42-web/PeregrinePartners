'use client';
export default function OwnerError({reset}:{reset:()=>void}){return <section className="owner-panel owner-empty" role="alert"><h2>We couldn’t load this page.</h2><p>Check your connection and try again. If this workspace is new, its account setup may still be needed.</p><button className="owner-button" onClick={reset}>Try again</button></section>;}

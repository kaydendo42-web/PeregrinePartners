import Link from "next/link";
import { requireOwner } from "@/lib/owner/access";
import { listBusinesses, listMembers } from "@/lib/crm/query";
import { parseQuery } from "@/lib/crm/validation";
import { boardStages } from "@/lib/crm/queues";
import type { Stage, Business, PageResult } from "@/lib/crm/types";
import { Filters } from "@/components/crm/filters";
import { BusinessTable } from "@/components/crm/table";
import { BusinessBoard } from "@/components/crm/board";
export default async function Outreach({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { context } = await requireOwner();
  let query;
  try {
    query = parseQuery(params);
  } catch {
    return (
      <section className="owner-panel owner-empty">
        <h1>Check your filters</h1>
        <p>A filter or page number is invalid.</p>
        <Link className="owner-button" href="/owner/outreach">
          Reset filters
        </Link>
      </section>
    );
  }
  const [members, page] = await Promise.all([
    listMembers(context),
    listBusinesses(context, query),
  ]);
  const base = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (typeof value === "string" && key !== "page") base.set(key, value);
  const url = "/owner/outreach?" + base.toString();
  const toggle = (view: string) => {
    const next = new URLSearchParams(base);
    for (const key of [...next.keys()])
      if (key.startsWith("p_")) next.delete(key);
    next.set("view", view);
    return "/owner/outreach?" + next;
  };
  const columns =
    query.view === "board"
      ? (Object.fromEntries(
          (await Promise.all(
            boardStages(query).map(async (stage) => [
              stage,
              await listBusinesses(context, {
                ...query,
                stage,
                page: query.boardPages[stage] ?? 1,
              }),
            ]),
          )) as [Stage, PageResult<Business>][],
        ) as Record<Stage, PageResult<Business>>)
      : null;
  return (
    <>
      <div className="owner-page-head">
        <div>
          <p className="owner-eyebrow">Grow together</p>
          <h1>{query.stopped ? "Stopped outreach" : "Outreach"}</h1>
          <p className="owner-muted">
            One shared pipeline. Every conversation in context.
          </p>
        </div>
        <div className="owner-actions">
          <Link
            className="owner-button owner-button-secondary"
            href="/owner/outreach/new"
          >
            Add business
          </Link>
          <Link className="owner-button" href="/owner/outreach/import">
            Import CSV ↗
          </Link>
        </div>
      </div>
      <div className="owner-shortcuts">
        <Link href="/owner/outreach?tag=top-100&sort=source_row">
          Top 100 leads
        </Link>
        <Link href="/owner/outreach?tag=top-500&sort=source_row">
          Top 500 leads
        </Link>
        <Link href="/owner/outreach?tag=direct-contact&sort=source_row">
          Email or phone available
        </Link>
        <Link href={"/owner/outreach?owner=" + context.userId}>
          My prospects
        </Link>
        <Link href="/owner/outreach?owner=unassigned">Unassigned</Link>
        <Link href="/owner/outreach?stage=replied">Replies</Link>
        <Link href="/owner/outreach?due=1">Follow-ups due</Link>
        <Link href="/owner/outreach?incomplete=1">Incomplete contact</Link>
        <Link href="/owner/outreach?stopped=1">Stopped outreach</Link>
      </div>
      <section className="owner-panel">
        <Filters query={query} members={members} />
        <div className="owner-panel-head">
          <span className="owner-small owner-muted">
            {page.total} businesses
          </span>
          <div className="owner-view-toggle">
            <Link
              aria-current={query.view === "table" ? "page" : undefined}
              href={toggle("table")}
            >
              Table
            </Link>
            <Link
              aria-current={query.view === "board" ? "page" : undefined}
              href={toggle("board")}
            >
              Board
            </Link>
          </div>
        </div>
        {columns ? (
          <BusinessBoard
            columns={columns}
            url={url}
            visibleStages={boardStages(query)}
          />
        ) : page.rows.length ? (
          <BusinessTable
            rows={page.rows}
            members={members}
            timezone={context.timezone}
          />
        ) : (
          <div className="owner-empty">
            <h2>No businesses here yet.</h2>
            <p>Import your list, add a business, or adjust the filters.</p>
            <Link className="owner-button" href="/owner/outreach/import">
              Import businesses
            </Link>
          </div>
        )}
        {query.view === "table" ? (
          <div className="owner-pagination">
            <span>
              Page {page.page} · {page.total} businesses
            </span>
            <div className="owner-actions">
              {page.page > 1 ? (
                <Link
                  className="owner-button owner-button-secondary"
                  href={url + "&page=" + (page.page - 1)}
                >
                  Previous
                </Link>
              ) : null}
              {page.page * 50 < page.total ? (
                <Link
                  className="owner-button owner-button-secondary"
                  href={url + "&page=" + (page.page + 1)}
                >
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}

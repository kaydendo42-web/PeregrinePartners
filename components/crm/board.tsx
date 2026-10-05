import Link from "next/link";
import type { Business, PageResult, Stage } from "@/lib/crm/types";
import { stages, stageLabels } from "@/lib/crm/types";
import { boardPageHref } from "@/lib/crm/queues";
import { leadResearch } from "@/lib/crm/lead-research";
export function BusinessBoard({
  columns,
  url,
  visibleStages = [...stages],
}: {
  columns: Partial<Record<Stage, PageResult<Business>>>;
  url: string;
  visibleStages?: Stage[];
}) {
  return (
    <div className="owner-board">
      {visibleStages.map((stage) => {
        const column = columns[stage];
        if (!column) return null;
        return (
          <section className="owner-board-column" key={stage}>
            <h2>
              {stageLabels[stage]}
              <span>{column.total}</span>
            </h2>
            {column.rows.map((b) => {
              const research = leadResearch(b.source_fields);
              return (
                <Link
                  className="owner-board-card"
                  key={b.id}
                  href={"/owner/outreach/" + b.id}
                >
                  <strong>{b.name}</strong>
                  {research.rank ? <small>Rank {research.rank}</small> : null}
                  <span>{b.location || "Location not entered"}</span>
                  {b.do_not_contact ? (
                    <span className="owner-badge-danger">Do not contact</span>
                  ) : null}
                  <small>{b.priority} priority</small>
                </Link>
              );
            })}
            {!column.rows.length ? (
              <p className="owner-muted owner-small">
                No businesses in this stage.
              </p>
            ) : null}
            <div className="owner-board-pagination">
              {column.page > 1 ? (
                <Link href={boardPageHref(url, stage, column.page - 1)}>
                  ← Previous
                </Link>
              ) : null}
              {column.page * 50 < column.total ? (
                <Link href={boardPageHref(url, stage, column.page + 1)}>
                  Next →
                </Link>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}

"use client";
import type { ImportPreview, ImportDecision } from "@/lib/crm/import/types";
import type { DecisionInput } from "@/lib/crm/import/controller";
export function Preview({
  preview,
  pending,
  onDecision,
  onPage,
}: {
  preview: ImportPreview;
  pending: boolean;
  onDecision: (decision: DecisionInput) => void;
  onPage: (page: number) => void;
}) {
  return (
    <>
      <div className="owner-table-scroll">
        <table className="owner-table owner-import-table">
          <thead>
            <tr>
              <th>Row</th>
              <th>Business / contact</th>
              <th>Review</th>
              <th>Your decision</th>
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row) => (
              <tr key={row.rowNumber}>
                <td>{row.rowNumber}</td>
                <td>
                  <strong>
                    {row.business.name || "Missing business name"}
                  </strong>
                  <small>
                    {row.business.location} · {row.business.industry}
                  </small>
                  <small>
                    {row.contact.name} {row.contact.email} {row.contact.phone}
                  </small>
                  <details>
                    <summary>Original values and extra fields</summary>
                    <pre className="owner-diff">
                      {JSON.stringify(
                        { source: row.source, extra: row.extra },
                        null,
                        2,
                      )}
                    </pre>
                  </details>
                </td>
                <td>
                  {row.exactDuplicate ? (
                    <span className="owner-badge">
                      Exact duplicate — skipped at import
                    </span>
                  ) : null}
                  {row.issues.map((i, index) => (
                    <p
                      className={
                        i.severity === "error"
                          ? "owner-import-error"
                          : "owner-muted"
                      }
                      key={index}
                    >
                      {i.message}
                    </p>
                  ))}
                  {row.candidates.map((c) => (
                    <p
                      className="owner-muted"
                      key={c.id ?? "row:" + c.rowNumber}
                    >
                      {c.name} · {c.location || "No location"}
                      {c.rowNumber ? ` · source row ${c.rowNumber}` : ""}
                      <br />
                      Possible match: {c.reasons.join(", ")}
                    </p>
                  ))}
                </td>
                <td>
                  <label className="owner-field">
                    Decision
                    <select
                      disabled={pending}
                      value={row.decision}
                      onChange={(e) =>
                        onDecision({
                          rowNumber: row.rowNumber,
                          decision: e.target.value as ImportDecision,
                          targetBusinessId:
                            e.target.value === "link_contact"
                              ? (row.candidates.find(
                                  (c) => c.linkable !== false,
                                )?.id ?? null)
                              : null,
                          targetSourceRow:
                            e.target.value === "link_contact"
                              ? (row.candidates.find(
                                  (c) => c.linkable !== false,
                                )?.rowNumber ?? null)
                              : null,
                          targetContactId: null,
                        })
                      }
                    >
                      <option value="import">Keep as separate business</option>
                      <option value="skip">Skip this row</option>
                      <option
                        value="link_contact"
                        disabled={
                          !row.candidates.some((c) => c.linkable !== false)
                        }
                      >
                        Add contact to a reviewed business
                      </option>
                    </select>
                  </label>
                  {row.decision === "link_contact" ? (
                    <label className="owner-field">
                      Business to attach this contact to
                      <select
                        disabled={pending}
                        value={
                          row.targetSourceRow
                            ? "row:" + row.targetSourceRow
                            : row.targetBusinessId
                              ? "business:" + row.targetBusinessId
                              : ""
                        }
                        onChange={(e) =>
                          onDecision({
                            rowNumber: row.rowNumber,
                            decision: "link_contact",
                            targetBusinessId: e.target.value.startsWith(
                              "business:",
                            )
                              ? e.target.value.slice(9)
                              : null,
                            targetSourceRow: e.target.value.startsWith("row:")
                              ? Number(e.target.value.slice(4))
                              : null,
                            targetContactId: null,
                          })
                        }
                      >
                        {row.candidates.map((c) => (
                          <option
                            key={c.id ?? "row:" + c.rowNumber}
                            disabled={c.linkable === false}
                            value={
                              c.id ? "business:" + c.id : "row:" + c.rowNumber
                            }
                          >
                            {c.name} · {c.location}
                            {c.rowNumber ? ` · source row ${c.rowNumber}` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="owner-pagination owner-import-pagination">
        <span>
          Page {preview.page} · {preview.total} source rows
        </span>
        <form
          className="owner-actions"
          onSubmit={(event) => {
            event.preventDefault();
            onPage(Number(new FormData(event.currentTarget).get("page")));
          }}
        >
          <label className="owner-field">
            Go to page
            <input
              key={preview.page}
              name="page"
              type="number"
              min={1}
              max={Math.ceil(preview.total / 50)}
              required
              defaultValue={preview.page}
              disabled={pending}
            />
          </label>
          <button
            className="owner-button owner-button-secondary"
            disabled={pending}
          >
            Go
          </button>
        </form>
        <div className="owner-actions">
          <button
            type="button"
            className="owner-button owner-button-secondary"
            disabled={pending || preview.page <= 1}
            onClick={() => onPage(preview.page - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            className="owner-button owner-button-secondary"
            disabled={pending || preview.page * 50 >= preview.total}
            onClick={() => onPage(preview.page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}

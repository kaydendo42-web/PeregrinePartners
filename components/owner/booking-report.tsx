import type { ReactNode } from "react";
import type { BookingReport } from "@/lib/booking/report";
import { displayTime } from "@/lib/crm/time";
export function BookingChart({ report }: { report: BookingReport }) {
  const max = Math.max(2, ...report.series.map((d) => d.bookings));
  return (
    <div
      className="dash-chart"
      role="img"
      aria-label={`Bookings by sitting date, ${report.from} to ${report.to}. ${report.bookings} bookings in total.`}
    >
      <div className="dash-chart-axis">
        <span>{max}</span>
        <span>{max / 2}</span>
        <span>0</span>
      </div>
      <div className="dash-chart-plot">
        <div className="dash-chart-grid" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="dash-chart-bars">
          {report.series.map((d) => (
            <div
              key={d.day}
              className="dash-chart-bar"
              style={{ height: `${(d.bookings / max) * 100}%` }}
              title={`${d.day}: ${d.bookings} bookings, ${d.guests} booked guests`}
            >
              <span className="dash-chart-tip">
                {d.day}
                <br />
                {d.bookings} bookings
              </span>
            </div>
          ))}
        </div>
        {!report.bookings ? (
          <p className="dash-chart-zero">No bookings in this period</p>
        ) : null}
      </div>
      <div className="dash-chart-dates">
        <span>{report.from}</span>
        <span>{report.to}</span>
      </div>
    </div>
  );
}
export function BookingReportView({
  report,
  actions,
  compact = false,
}: {
  report: BookingReport;
  actions?: ReactNode;
  compact?: boolean;
}) {
  return (
    <>
      {!compact ? (
        <div className="owner-grid dash-metrics">
          {[
            ["Booking records", report.bookings, "By sitting date"],
            ["Booked guests", report.guests, "Confirmed and seated bookings"],
            [
              "Upcoming bookings",
              report.upcoming,
              "All future confirmed and seated",
            ],
            [
              "Cancelled / no-show",
              `${report.cancelled} / ${report.no_shows}`,
              "In this reporting period",
            ],
          ].map(([label, value, caption]) => (
            <div className="owner-panel owner-stat" key={label}>
              <p className="owner-stat-label">{label}</p>
              <p className="owner-stat-value">{value}</p>
              <p className="owner-stat-caption">{caption}</p>
            </div>
          ))}
        </div>
      ) : null}
      <section className="owner-panel owner-section dash-report">
        <div className="owner-panel-head">
          <div>
            <h2>Booking performance</h2>
            <p className="owner-muted owner-small">
              {report.from} – {report.to} · {report.timezone}
            </p>
          </div>
          {actions}
        </div>
        <div className="dash-report-body">
          <div>
            <BookingChart report={report} />
          </div>
          <div className="dash-source-list">
            <h3>Booking sources</h3>
            {report.sources.length ? (
              report.sources.map((s) => (
                <div key={s.source}>
                  <span>{s.source.replaceAll("_", " ")}</span>
                  <strong>{s.bookings}</strong>
                  <i
                    style={{
                      width: `${(s.bookings / Math.max(report.bookings, 1)) * 100}%`,
                    }}
                  />
                </div>
              ))
            ) : (
              <p className="owner-muted owner-small">
                Sources appear as bookings come in.
              </p>
            )}
          </div>
        </div>
        <div className="owner-panel-foot">
          <span>Read {displayTime(report.checked_at, report.timezone)}</span>
          <span>
            {report.last_booking_update
              ? `Last booking change ${displayTime(report.last_booking_update, report.timezone)}`
              : "No booking records yet"}
          </span>
        </div>
      </section>
    </>
  );
}

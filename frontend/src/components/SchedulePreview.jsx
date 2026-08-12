import React from "react";
import { daysInMonth, weekdayAbbrOfDay, MONTHS_PT } from "../lib/date-utils";

// Live preview of the printable A4 table, matching the model exactly.
// Uses CSS transform to fit in a preview container width.
export const SchedulePreview = React.forwardRef(function SchedulePreview(
  { year, month, settings, monthData, scale = 1 },
  ref,
) {
  const dim = daysInMonth(year, month);
  const rows = [];
  for (let d = 1; d <= dim; d++) {
    const data = monthData?.[d] || {};
    const isFilled = !!(data.division || data.activity || data.place || data.time);
    rows.push({
      day: d,
      wd: weekdayAbbrOfDay(year, month, d),
      division: data.division || "",
      activity: data.activity || "",
      place: data.place || "",
      time: data.time || "",
      isFilled,
    });
  }

  return (
    <div
      ref={ref}
      data-testid="schedule-preview"
      style={{
        width: 720,
        padding: 16,
        background: "#fff",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <div className="preview-header">
        <div className="h-title">
          {settings.header.title} - {MONTHS_PT[month]}
        </div>
        <div className="h-sub">{settings.header.community}</div>
        <div className="h-quote">
          {year} - {settings.header.quote}
        </div>
      </div>

      <table className="preview-table">
        <thead>
          <tr>
            <th colSpan={2} style={{ width: 80 }}>
              DATA
            </th>
            <th style={{ width: 70 }}>DIVISÃO</th>
            <th>ATIVIDADE</th>
            <th style={{ width: 150 }}>LOCAL</th>
            <th style={{ width: 60 }}>HORÁRIO</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.day} className={r.isFilled ? "filled" : ""}>
              <td style={{ width: 30, fontWeight: 600 }}>{r.day}</td>
              <td style={{ width: 50 }}>{r.wd}</td>
              <td>{r.division}</td>
              <td>{r.activity}</td>
              <td>{r.place}</td>
              <td>{r.time}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="preview-footer">{settings.footer}</div>
    </div>
  );
});

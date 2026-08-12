import React from "react";
import { daysInMonth, weekdayAbbrOfDay, MONTHS_PT } from "../lib/date-utils";

// Live preview of the printable A4 table. DATA and DIA are independent
// columns, while repeated activities for the same day keep both cells merged.
export const SchedulePreview = React.forwardRef(function SchedulePreview(
  { year, month, settings, monthData, scale = 1 },
  ref,
) {
  const dim = daysInMonth(year, month);

  const rows = [];
  for (let d = 1; d <= dim; d++) {
    const entries = monthData?.[d];
    const wd = weekdayAbbrOfDay(year, month, d);
    if (Array.isArray(entries) && entries.length > 0) {
      entries.forEach((e, idx) => {
        rows.push({
          day: d,
          wd,
          isFirst: idx === 0,
          rowSpan: entries.length,
          division: e.division || "",
          activity: e.activity || "",
          place: e.place || "",
          time: e.time || "",
          isFilled: true,
        });
      });
    } else {
      rows.push({
        day: d,
        wd,
        isFirst: true,
        rowSpan: 1,
        division: "",
        activity: "",
        place: "",
        time: "",
        isFilled: false,
      });
    }
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
            <th style={{ width: 38 }}>DATA</th>
            <th style={{ width: 48 }}>DIA</th>
            <th style={{ width: 72 }}>DIVISÃO</th>
            <th>ATIVIDADE</th>
            <th style={{ width: 130 }}>LOCAL</th>
            <th style={{ width: 72 }}>HORÁRIO</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={r.isFilled ? "filled" : ""}>
              {r.isFirst && (
                <td
                  rowSpan={r.rowSpan}
                  style={{ width: 38, fontWeight: 600 }}
                >
                  {r.day}
                </td>
              )}
              {r.isFirst && (
                <td rowSpan={r.rowSpan} style={{ width: 48 }}>
                  {r.wd}
                </td>
              )}
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

import React from "react";
import { daysInMonth, weekdayAbbrOfDay, MONTHS_PT } from "../lib/date-utils";

const COL_DATA = 58;
const COL_DIA = 42;
const COL_DIVISAO = 58;
const COL_LOCAL = 105;
const COL_HORARIO = 56;

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
      entries.forEach((e, idx) => rows.push({ day: d, wd, isFirst: idx === 0, rowSpan: entries.length, division: e.division || "", activity: e.activity || "", place: e.place || "", time: e.time || "", isFilled: true }));
    } else rows.push({ day: d, wd, isFirst: true, rowSpan: 1, division: "", activity: "", place: "", time: "", isFilled: false });
  }

  const title = `Programação do Mês de ${MONTHS_PT[month]} de ${year}`;

  return (
    <div ref={ref} data-testid="schedule-preview" style={{ width: 720, padding: 16, background: "#fff", transform: `scale(${scale})`, transformOrigin: "top left" }}>
      <div className="preview-header">
        <div className="h-title">{title}</div>
        <div className="h-sub">{settings.header.community}</div>
        <div className="h-quote">{settings.header.quote}</div>
      </div>
      <table className="preview-table">
        <colgroup>
          <col style={{ width: COL_DATA }} />
          <col style={{ width: COL_DIA }} />
          <col style={{ width: COL_DIVISAO }} />
          <col />
          <col style={{ width: COL_LOCAL }} />
          <col style={{ width: COL_HORARIO }} />
        </colgroup>
        <thead><tr><th style={{ width: COL_DATA, textAlign: "center" }}>DATA</th><th style={{ width: COL_DIA }}>DIA</th><th style={{ width: COL_DIVISAO }}>DIVISÃO</th><th>ATIVIDADE</th><th style={{ width: COL_LOCAL }}>LOCAL</th><th style={{ width: COL_HORARIO }}>HORÁRIO</th></tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className={r.isFilled ? "filled" : ""}>{r.isFirst && <td rowSpan={r.rowSpan} style={{ width: COL_DATA, fontWeight: 600 }}>{r.day}</td>}{r.isFirst && <td rowSpan={r.rowSpan} style={{ width: COL_DIA }}>{r.wd}</td>}<td style={{ width: COL_DIVISAO }}>{r.division}</td><td>{r.activity}</td><td style={{ width: COL_LOCAL }}>{r.place}</td><td style={{ width: COL_HORARIO }}>{r.time}</td></tr>)}</tbody>
      </table>
      <div className="preview-footer" style={{ fontWeight: 400, fontStyle: "normal" }}>{settings.footer}</div>
    </div>
  );
});

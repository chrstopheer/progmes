import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { SettingsDialog } from "../components/SettingsDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Settings2, FileText, Archive } from "lucide-react";
import { MONTHS_PT, WEEKDAY_ABBR_PT, daysInMonth, firstWeekday, yearsRange } from "../lib/date-utils";
import { loadMonth, listSavedMonths } from "../lib/storage";

export default function Home() {
  const now = new Date();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlYear = parseInt(searchParams.get("year") || "", 10);
  const urlMonth = parseInt(searchParams.get("month") || "", 10);
  const [year, setYear] = useState(Number.isFinite(urlYear) ? urlYear : now.getFullYear());
  const [month, setMonth] = useState(Number.isFinite(urlMonth) && urlMonth >= 0 && urlMonth <= 11 ? urlMonth : now.getMonth());
  const [openSettings, setOpenSettings] = useState(false);
  const [monthData, setMonthData] = useState({});
  const [savedMonths, setSavedMonths] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setSearchParams({ year: String(year), month: String(month) }, { replace: true });
  }, [year, month, setSearchParams]);

  useEffect(() => {
    setMonthData(loadMonth(year, month));
    setSavedMonths(listSavedMonths());
  }, [year, month]);

  const refreshData = () => {
    setMonthData(loadMonth(year, month));
    setSavedMonths(listSavedMonths());
  };

  const dim = daysInMonth(year, month);
  const firstWD = firstWeekday(year, month);
  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstWD; i += 1) arr.push(null);
    for (let d = 1; d <= dim; d += 1) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [dim, firstWD]);

  const activeCount = Object.values(monthData).reduce(
    (sum, entries) => sum + (Array.isArray(entries) ? entries.length : 1),
    0,
  );

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader
        right={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpenSettings(true)}
              data-testid="open-settings-btn"
              aria-label="Ajustes"
              className="bg-[var(--brand-yellow)] text-[var(--ink)] hover:bg-[var(--brand-yellow)]"
            >
              <Settings2 className="h-4 w-4 mr-1" /> Ajustes
            </Button>
          </div>
        }
      />

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <section className="rounded-2xl bg-white border shadow-sm p-5 sm:p-6" style={{ borderColor: "var(--hairline)" }} data-testid="month-selectors">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--brand-red)" }}>Escolha o mês</div>
              <h1 className="font-display text-3xl sm:text-4xl mt-1" data-testid="month-heading">
                {MONTHS_PT[month]} <span style={{ color: "var(--brand-blue)" }}>{year}</span>
              </h1>
              <div className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
                {activeCount === 0 ? "Nenhuma atividade cadastrada ainda." : `${activeCount} atividade${activeCount > 1 ? "s" : ""} cadastrada${activeCount > 1 ? "s" : ""}.`}
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="flex flex-col">
                <label className="text-xs font-medium mb-1" style={{ color: "var(--ink-soft)" }}>Mês</label>
                <Select value={String(month)} onValueChange={(value) => setMonth(parseInt(value, 10))}>
                  <SelectTrigger className="w-40" data-testid="month-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS_PT.map((m, i) => (
                      <SelectItem key={m} value={String(i)} data-testid={`month-option-${i}`}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium mb-1" style={{ color: "var(--ink-soft)" }}>Ano</label>
                <Select value={String(year)} onValueChange={(value) => setYear(parseInt(value, 10))}>
                  <SelectTrigger className="w-28" data-testid="year-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {yearsRange(6).map((y) => (
                      <SelectItem key={y} value={String(y)} data-testid={`year-option-${y}`}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white border shadow-sm p-4 sm:p-6" style={{ borderColor: "var(--hairline)" }} data-testid="calendar-grid-section">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {WEEKDAY_ABBR_PT.map((wd) => (
              <div key={wd} className="text-center text-[11px] sm:text-xs font-semibold uppercase tracking-wider py-2" style={{ color: "var(--brand-blue)" }}>{wd}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2" data-testid="calendar-grid">
            {cells.map((d, idx) => {
              if (d === null) return <div key={idx} className="aspect-square" />;
              const filled = !!monthData[d];
              const today = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              const dayActivities = monthData[d];
              const activityLabel = Array.isArray(dayActivities) && dayActivities.length > 1
                ? `${dayActivities.length} atividades`
                : dayActivities?.[0]?.division || "•";
              return (
                <button
                  key={idx}
                  onClick={() => navigate(`/atividade/${year}/${month}/${d}`)}
                  data-testid={`day-${d}`}
                  className="calendar-cell-btn aspect-square rounded-xl border flex flex-col items-center justify-center p-1 relative"
                  style={{ borderColor: today ? "var(--brand-red)" : "var(--hairline)", background: filled ? "var(--brand-blue-soft)" : "white", borderWidth: today ? 2 : 1 }}
                >
                  <span className="text-base sm:text-lg font-semibold leading-none" style={{ color: filled ? "var(--brand-blue)" : "var(--ink)" }}>{d}</span>
                  {filled && <span className="mt-1 text-[9px] sm:text-[10px] font-medium truncate max-w-full px-1" style={{ color: "var(--ink-soft)" }}>{activityLabel}</span>}
                  {today && <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full" style={{ background: "var(--brand-red)" }} aria-label="Hoje" />}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-5 text-xs" style={{ color: "var(--ink-soft)" }}>
            <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded border" style={{ background: "var(--brand-blue-soft)", borderColor: "var(--hairline)" }} />Dia com atividade</div>
            <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: "var(--brand-red)" }} />Hoje</div>
          </div>
        </section>

        <section className="flex flex-col sm:flex-row gap-3 sm:justify-between">
          <Button onClick={() => navigate(`/programacao/${year}/${month}`)} data-testid="view-schedule-btn" className="flex-1" style={{ background: "var(--brand-red)", color: "white" }}>
            <FileText className="h-4 w-4 mr-2" /> Ver programação de {MONTHS_PT[month]}
          </Button>
        </section>

        {savedMonths.length > 0 && (
          <section className="rounded-2xl bg-white border shadow-sm p-5" style={{ borderColor: "var(--hairline)" }} data-testid="saved-months-section">
            <div className="flex items-center gap-2 mb-3">
              <Archive className="h-4 w-4" style={{ color: "var(--brand-blue)" }} />
              <h2 className="font-display text-lg">Programações salvas</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedMonths.map((sm) => (
                <button
                  key={sm.key}
                  onClick={() => { setYear(sm.year); setMonth(sm.month); }}
                  data-testid={`saved-month-${sm.key}`}
                  className="rounded-lg border px-3 py-2 text-sm hover:shadow-sm transition"
                  style={{ borderColor: "var(--hairline)", background: sm.year === year && sm.month === month ? "var(--brand-yellow-soft)" : "white" }}
                >
                  <span className="font-medium">{MONTHS_PT[sm.month]} {sm.year}</span>
                  <Badge variant="secondary" className="ml-2" style={{ background: "var(--brand-blue-soft)", color: "var(--brand-blue)" }}>{sm.count}</Badge>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <SettingsDialog open={openSettings} onOpenChange={setOpenSettings} onSaved={refreshData} selectedYear={year} selectedMonth={month} />
    </div>
  );
}

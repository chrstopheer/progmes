export const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Model uses abbreviations: Sab. Dom. Seg. Ter. Qua. Qui. Sex.
export const WEEKDAY_ABBR_PT = ["Dom.", "Seg.", "Ter.", "Qua.", "Qui.", "Sex.", "Sab."];
export const WEEKDAY_FULL_PT = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function firstWeekday(year, month) {
  return new Date(year, month, 1).getDay();
}

export function weekdayAbbrOfDay(year, month, day) {
  return WEEKDAY_ABBR_PT[new Date(year, month, day).getDay()];
}

export function weekdayFullOfDay(year, month, day) {
  return WEEKDAY_FULL_PT[new Date(year, month, day).getDay()];
}

export const yearsRange = (span = 6) => {
  const now = new Date().getFullYear();
  const out = [];
  for (let y = now - 1; y <= now + span; y++) out.push(y);
  return out;
};

// LocalStorage-based data layer for the offline PWA.
// Data model:
//   settings: { header: {title, community, quote}, footer: string, divisions: string[] }
//   activities: { [ym: 'YYYY-MM']: { [day: number]: { division, activity, place, time } } }

const SETTINGS_KEY = "prog_ong_settings_v1";
const ACTIVITIES_KEY = "prog_ong_activities_v1";

export const DEFAULT_DIVISIONS = ["DE", "DFJ", "DMJ", "DF", "DS", "5 Div."];

export const DEFAULT_SETTINGS = {
  header: {
    title: "Programação de Atividades",
    community: "",
    quote:
      '\"Ano do Vibrante Desenvolvimento da Soka Gakkai de Força Jovem Mundial\"',
  },
  footer: "Todas as Segundas - Daimoku das Hortências",
  divisions: DEFAULT_DIVISIONS,
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    const storedHeader = parsed.header || {};
    // Migrate the old default value so existing users also see an empty field.
    const community = storedHeader.community === "Comunidade"
      ? ""
      : storedHeader.community ?? "";
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      header: { ...DEFAULT_SETTINGS.header, ...storedHeader, community },
      divisions: Array.isArray(parsed.divisions) && parsed.divisions.length
        ? parsed.divisions
        : DEFAULT_DIVISIONS,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  // Notify listeners (e.g. AppHeader) in the same tab
  try {
    window.dispatchEvent(new Event("prog-ong:settings-updated"));
  } catch {}
}

function loadAllActivities() {
  try {
    const raw = localStorage.getItem(ACTIVITIES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function saveAllActivities(data) {
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(data));
}

export function ymKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function loadMonth(year, month) {
  const all = loadAllActivities();
  const raw = all[ymKey(year, month)] || {};
  // Normalize: every day value is an array of activity objects.
  // Backward-compat: wrap legacy single-object entries into an array.
  const normalized = {};
  for (const [day, val] of Object.entries(raw)) {
    if (Array.isArray(val)) {
      const clean = val.filter((a) => a && typeof a === "object");
      if (clean.length) normalized[day] = clean;
    } else if (val && typeof val === "object") {
      normalized[day] = [val];
    }
  }
  return normalized;
}

export function saveActivities(year, month, day, list) {
  const all = loadAllActivities();
  const k = ymKey(year, month);
  const monthData = all[k] || {};
  const clean = (Array.isArray(list) ? list : []).filter(
    (a) => a && (a.activity || "").trim(),
  );
  if (clean.length === 0) {
    delete monthData[day];
  } else {
    monthData[day] = clean;
  }
  if (Object.keys(monthData).length === 0) delete all[k];
  else all[k] = monthData;
  saveAllActivities(all);
}

// Returns unique activity/place values already saved by the user, ranked by
// prefix matches first and then by substring matches.
export function getSavedSuggestions(field, query, limit = 6) {
  if (field !== "activity" && field !== "place") return [];
  const q = String(query || "").trim().toLocaleLowerCase("pt-BR");
  if (!q) return [];

  const all = loadAllActivities();
  const values = [];
  for (const monthData of Object.values(all)) {
    for (const dayEntries of Object.values(monthData || {})) {
      const entries = Array.isArray(dayEntries) ? dayEntries : [dayEntries];
      for (const entry of entries) {
        const value = String(entry?.[field] || "").trim();
        if (value) values.push(value);
      }
    }
  }

  const unique = [...new Map(values.map((value) => [value.toLocaleLowerCase("pt-BR"), value])).values()];
  const prefix = [];
  const contains = [];
  for (const value of unique) {
    const lower = value.toLocaleLowerCase("pt-BR");
    if (lower.startsWith(q)) prefix.push(value);
    else if (lower.includes(q)) contains.push(value);
  }
  return [...prefix, ...contains].slice(0, limit);
}

// Legacy single-activity helper kept for compatibility with older code paths.
export function saveActivity(year, month, day, activity) {
  saveActivities(year, month, day, [activity]);
}

export function deleteActivity(year, month, day) {
  const all = loadAllActivities();
  const k = ymKey(year, month);
  if (all[k]) {
    delete all[k][day];
    if (Object.keys(all[k]).length === 0) delete all[k];
    saveAllActivities(all);
  }
}

export function listSavedMonths() {
  const all = loadAllActivities();
  return Object.entries(all)
    .map(([k, v]) => {
      const [y, m] = k.split("-");
      const days = Object.values(v || {});
      const total = days.reduce(
        (sum, entries) => sum + (Array.isArray(entries) ? entries.length : 1),
        0,
      );
      return {
        key: k,
        year: parseInt(y, 10),
        month: parseInt(m, 10) - 1,
        count: total,
      };
    })
    .sort((a, b) => (a.key < b.key ? 1 : -1));
}

export function deleteMonth(year, month) {
  const all = loadAllActivities();
  delete all[ymKey(year, month)];
  saveAllActivities(all);
}

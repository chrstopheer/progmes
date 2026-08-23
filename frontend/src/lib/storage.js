import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export const DEFAULT_DIVISIONS = ["DE", "DFJ", "DMJ", "DF", "DS", "DJ", "5 Div."];
export const DEFAULT_SETTINGS = {
  header: { title: "Programação de Atividades", community: "", quote: '"Ano do Vibrante Desenvolvimento da Soka Gakkai de Força Jovem Mundial"' },
  footer: "Todas as Segundas - Daimoku das Hortências",
  divisions: DEFAULT_DIVISIONS,
};

const SETTINGS_KEY = "prog_ong_settings_v1";
const ACTIVITIES_KEY = "prog_ong_activities_v1";
const LOCAL_MODE_KEY = "progmes_local_mode_v1";
let activeUser = null;
let localMode = false;
let cache = null;

export function setStorageUser(user) { activeUser = user || null; if (user) localMode = false; cache = null; }
export function setLocalMode(enabled) { localMode = Boolean(enabled); if (localMode) activeUser = null; cache = null; try { if (localMode) sessionStorage.setItem(LOCAL_MODE_KEY, "1"); else sessionStorage.removeItem(LOCAL_MODE_KEY); } catch {} }
export function getLocalMode() { try { return sessionStorage.getItem(LOCAL_MODE_KEY) === "1"; } catch { return false; } }

export function ymKey(year, month) { return `${year}-${String(month + 1).padStart(2, "0")}`; }

function normalizeSettings(parsed = {}) {
  const storedHeader = parsed.header || {};
  const community = storedHeader.community === "Comunidade" ? "" : storedHeader.community ?? "";
  let divisions = Array.isArray(parsed.divisions) && parsed.divisions.length ? [...parsed.divisions] : [...DEFAULT_DIVISIONS];
  if (!divisions.includes("DJ")) { const index = divisions.indexOf("5 Div."); if (index >= 0) divisions.splice(index, 0, "DJ"); else divisions.push("DJ"); }
  return { ...DEFAULT_SETTINGS, ...parsed, header: { ...DEFAULT_SETTINGS.header, ...storedHeader, community }, divisions };
}

function normalizeActivities(all = {}) {
  const normalizedAll = {};
  for (const [key, rawMonth] of Object.entries(all || {})) {
    const normalized = {};
    for (const [day, val] of Object.entries(rawMonth || {})) {
      if (Array.isArray(val)) { const clean = val.filter((a) => a && typeof a === "object"); if (clean.length) normalized[day] = clean; }
      else if (val && typeof val === "object") normalized[day] = [val];
    }
    if (Object.keys(normalized).length) normalizedAll[key] = normalized;
  }
  return normalizedAll;
}

function loadLocalSnapshot() {
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    const activities = JSON.parse(localStorage.getItem(ACTIVITIES_KEY) || "{}");
    return { settings: settings ? normalizeSettings(settings) : null, activities: normalizeActivities(activities) };
  } catch { return { settings: null, activities: {} }; }
}

function hasLocalData(local) { return Boolean(local?.settings) || Object.keys(local?.activities || {}).length > 0; }

async function readSnapshot() {
  if (cache) return cache;
  if (localMode) {
    const local = loadLocalSnapshot();
    cache = { settings: normalizeSettings(local.settings || DEFAULT_SETTINGS), activities: normalizeActivities(local.activities) };
    return cache;
  }
  if (!activeUser || !db) return { settings: { ...DEFAULT_SETTINGS }, activities: {} };
  const ref = doc(db, "users", activeUser.uid);
  const snapshot = await getDoc(ref);
  const remote = snapshot.exists() ? snapshot.data() : {};
  if (!snapshot.exists()) {
    const local = loadLocalSnapshot();
    if (hasLocalData(local)) {
      const shouldImport = window.confirm("Encontramos dados do Progmes salvos neste aparelho. Deseja importar esses dados para a sua conta Google?");
      if (shouldImport) {
        cache = { settings: normalizeSettings(local.settings || DEFAULT_SETTINGS), activities: normalizeActivities(local.activities) };
        await setDoc(ref, cache, { merge: true });
        return cache;
      }
    }
  }
  cache = { settings: normalizeSettings(remote.settings || DEFAULT_SETTINGS), activities: normalizeActivities(remote.activities || {}) };
  return cache;
}

async function writeSnapshot(next) {
  cache = { settings: normalizeSettings(next.settings), activities: normalizeActivities(next.activities) };
  if (localMode) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(cache.settings));
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(cache.activities));
    window.dispatchEvent(new Event("prog-ong:data-updated"));
    return;
  }
  if (!activeUser || !db) throw new Error("É necessário estar autenticado para salvar.");
  await setDoc(doc(db, "users", activeUser.uid), cache, { merge: true });
  window.dispatchEvent(new Event("prog-ong:data-updated"));
}

export async function loadSettings() { return (await readSnapshot()).settings; }
export async function saveSettings(settings) { const current = await readSnapshot(); await writeSnapshot({ ...current, settings: normalizeSettings(settings) }); }
export async function loadMonth(year, month) { const all = (await readSnapshot()).activities; return all[ymKey(year, month)] || {}; }
export async function saveActivities(year, month, day, list) { const current = await readSnapshot(); const activities = { ...current.activities }; const key = ymKey(year, month); const monthData = { ...(activities[key] || {}) }; const clean = (Array.isArray(list) ? list : []).filter((a) => a && (a.activity || "").trim()); if (clean.length) monthData[day] = clean; else delete monthData[day]; if (Object.keys(monthData).length) activities[key] = monthData; else delete activities[key]; await writeSnapshot({ ...current, activities }); }
export async function saveActivity(year, month, day, activity) { return saveActivities(year, month, day, [activity]); }
export async function deleteActivity(year, month, day) { const current = await readSnapshot(); const activities = { ...current.activities }; const key = ymKey(year, month); if (activities[key]) { const monthData = { ...activities[key] }; delete monthData[day]; if (Object.keys(monthData).length) activities[key] = monthData; else delete activities[key]; await writeSnapshot({ ...current, activities }); } }
export async function listSavedMonths() { const all = (await readSnapshot()).activities; return Object.entries(all).map(([key, value]) => { const [y, m] = key.split("-"); const count = Object.values(value || {}).reduce((sum, entries) => sum + (Array.isArray(entries) ? entries.length : 1), 0); return { key, year: parseInt(y, 10), month: parseInt(m, 10) - 1, count }; }).sort((a, b) => (a.key < b.key ? 1 : -1)); }
export async function deleteMonth(year, month) { const current = await readSnapshot(); const activities = { ...current.activities }; delete activities[ymKey(year, month)]; await writeSnapshot({ ...current, activities }); }
export async function listActivitySuggestions() { const all = (await readSnapshot()).activities; const activities = new Set(); const places = new Set(); Object.values(all).forEach((month) => Object.values(month || {}).forEach((entries) => (Array.isArray(entries) ? entries : [entries]).forEach((entry) => { if (entry?.activity?.trim()) activities.add(entry.activity.trim()); if (entry?.place?.trim()) places.add(entry.place.trim()); }))); return { activities: [...activities].sort(), places: [...places].sort() }; }

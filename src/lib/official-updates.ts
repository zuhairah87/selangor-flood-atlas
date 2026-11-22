import { load } from "cheerio/slim";
import type { Dam, Station } from "./flood-data";

export type RiverReading = { id: string; name: string; updatedAt: string; level: number; normal: number; alert: number; warning: number; danger: number };
export type DamReading = { name: string; updatedAt: string; percent: number; level: number; stored: number };
export type Forecast = { date: string; morning: string; afternoon: string; night: string; min: number; max: number };
export type RainReading = { id: string; name: string; district: string; updatedAt: string; midnightMm: number; hourMm: number };
export type SourceResult<T> = { data: T[]; checkedAt: string; error: string | null; url: string };

function numeric(text: string) {
  if (!/^-?\d+(?:\.\d+)?$/.test(text.trim())) return null;
  const value = Number(text); return Number.isFinite(value) ? value : null;
}
export function parseRainReadings(html: string): RainReading[] {
  // The public page contains malformed row wrappers, so split at its explicit row-number cells.
  if (!html.includes("Taburan Hujan dari Tengah Malam")) return [];
  const readings: RainReading[] = [];
  for (const fragment of html.split(/<td\s+data-th=['"]No['"]>/i).slice(1)) {
    const $ = load(`<table><tr><td>${fragment}</table>`);
    const cells = $("td").map((_, cell) => $(cell).text().trim()).get();
    if (cells.length !== 13) continue;
    const [_, id, name, district, updatedAt] = cells;
    const midnightMm = numeric(cells[11] ?? ""); const hourMm = numeric(cells[12] ?? "");
    if (!name || !district || !updatedAt || midnightMm == null || hourMm == null || midnightMm < 0 || hourMm < 0) continue;
    if (!/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(updatedAt)) continue;
    readings.push({ id: id || name, name, district, updatedAt, midnightMm, hourMm });
  }
  return readings;
}
export function parseRiverReadings(html: string): RiverReading[] {
  const $ = load(html); const readings: RiverReading[] = [];
  $("tr.item").each((_, row) => {
    const get = (field: string) => $(row).find(`td[data-th="${field}"]`).text().trim();
    const values = ["wl", "Normal", "Alert", "Warning", "Danger"].map((field) => numeric(get(field)));
    const [level, normal, alert, warning, danger] = values;
    if (level == null || normal == null || alert == null || warning == null || danger == null || !(normal < alert && alert < warning && warning < danger)) return;
    const updatedAt = get("Last Update");
    if (!/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(updatedAt)) return;
    readings.push({ id: get("Station ID"), name: get("Station Name"), updatedAt, level, normal, alert, warning, danger });
  });
  return readings;
}
export function parseDamReadings(html: string): DamReading[] {
  const $ = load(html); const readings: DamReading[] = [];
  $("table.main_table").filter((_, table) => $(table).text().includes("MAKLUMAT EMPANGAN")).find("tr.tblrow").each((_, row) => {
    const cells = $(row).find("td").map((_, cell) => $(cell).text().replace(/\s+/g, " ").trim()).get();
    const [updatedAt, name, levelText, storedText, percentText] = cells;
    const level = numeric(levelText ?? ""); const stored = numeric(storedText ?? ""); const percent = numeric(percentText ?? "");
    if (!name || !updatedAt || level == null || stored == null || percent == null || percent < 0 || percent > 150) return;
    if (!/^\d{2}-\d{2}-\d{4} \d{2}:\d{2} [AP]M$/.test(updatedAt)) return;
    readings.push({ name, updatedAt, level, stored, percent });
  });
  return readings;
}
export function applyRiverReading(station: Station, readings: RiverReading[]): Station & { observedAt: string | null } {
  // Match the full station name only. Nearby gauges and differently named rivers are not interchangeable.
  const reading = readings.find((row) => row.name.toLowerCase() === station.name.toLowerCase());
  return reading ? { ...station, level: reading.level, normal: reading.normal, alert: reading.alert, warning: reading.warning, danger: reading.danger, observedAt: reading.updatedAt } : { ...station, observedAt: null };
}
const damNames: Record<string, string> = {
  "Empangan Sg. Selangor": "SG SELANGOR", "Empangan Klang Gates": "KLANG GATES", "Empangan Batu": "BATU",
  "Empangan Semenyih": "SEMENYIH", "Empangan Langat": "LANGAT", "Empangan Tinggi": "SG TINGGI",
};
export function applyDamReading(dam: Dam, readings: DamReading[]): Dam & { observedAt: string | null; observedLevel: number | null; observedStored: number | null } {
  const reading = readings.find((row) => row.name === damNames[dam.name]);
  return { ...dam, percent: reading?.percent ?? dam.percent, observedAt: reading?.updatedAt ?? null, observedLevel: reading?.level ?? null, observedStored: reading?.stored ?? null };
}
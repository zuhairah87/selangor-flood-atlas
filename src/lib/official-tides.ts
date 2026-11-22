export type TidePoint = { time: string; heightM: number };
export type TideDay = { date: string; points: TidePoint[]; events: { time: string; heightM: number; high: boolean }[] };
export type TideReading = { heightM: number; sampleTime: string; label: string; surcharge: number };
export const officialTideSource = "https://etide.hydro.gov.my/";

const months: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
export function tideDate(value: string) {
  const match = /^(\d{2})-([A-Za-z]{3})-(\d{2})$/.exec(value);
  if (!match) return null;
  const month = months[match[2] ?? ""];
  if (!month) return null;
  return `20${match[3]}-${month}-${match[1]}`;
}

export function officialTideAt(days: TideDay[], timestamp: string): TideReading | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(timestamp)) return null;
  const day = days.find((entry) => entry.date === timestamp.slice(0, 10));
  if (!day || day.points.length < 2) return null;
  const time = timestamp.slice(11, 16);
  const point = day.points.filter((entry) => entry.time <= time).at(-1);
  if (!point) return null;
  const heights = day.points.map((entry) => entry.heightM);
  const min = Math.min(...heights); const max = Math.max(...heights);
  const fraction = max > min ? (point.heightM - min) / (max - min) : 0;
  // Relative daily height drives only an illustrative drainage surcharge.
  // These bands are not PHN warning thresholds and do not identify spring tides.
  return { heightM: point.heightM, sampleTime: point.time,
    label: fraction >= 0.75 ? "Aras tinggi" : fraction >= 0.25 ? "Aras sederhana" : "Aras rendah",
    surcharge: Math.round(fraction * 200) / 10 };
}
export type Station = { name: string; district: string; lat: number; lng: number; level: number; normal: number; alert: number; warning: number; danger: number };
export type Dam = { name: string; lat: number; lng: number; percent: number };
export type Rain = { name: string; lat: number; lng: number; mm: number };

// Data contoh (bukan data langsung) berdasarkan stesen sebenar.
export const stations: Station[] = [
  { name: "Sg. Klang di Jambatan Sulaiman", district: "Kuala Lumpur", lat: 3.139, lng: 101.694, level: 31.2, normal: 30.5, alert: 32.0, warning: 33.0, danger: 34.0 },
  { name: "Sg. Klang di Kg. Jawa", district: "Klang", lat: 3.010, lng: 101.480, level: 1.9, normal: 1.5, alert: 2.4, warning: 2.8, danger: 3.2 },
  { name: "Sg. Langat di Dengkil", district: "Sepang", lat: 2.857, lng: 101.680, level: 5.1, normal: 4.5, alert: 6.0, warning: 6.8, danger: 7.5 },
  { name: "Sg. Selangor di Rantau Panjang", district: "Kuala Selangor", lat: 3.402, lng: 101.443, level: 4.8, normal: 4.0, alert: 5.5, warning: 6.2, danger: 7.0 },
  { name: "Sg. Bernam di Tanjung Malim", district: "Hulu Selangor", lat: 3.684, lng: 101.519, level: 39.0, normal: 38.0, alert: 40.0, warning: 41.0, danger: 42.0 },
  { name: "Sg. Gombak di Batu Caves", district: "Gombak", lat: 3.237, lng: 101.684, level: 58.6, normal: 58.0, alert: 59.5, warning: 60.2, danger: 61.0 },
  { name: "Sg. Semenyih di Semenyih", district: "Hulu Langat", lat: 2.951, lng: 101.843, level: 22.4, normal: 21.8, alert: 23.5, warning: 24.2, danger: 25.0 },
  { name: "Sg. Damansara di TTDI Jaya", district: "Petaling", lat: 3.105, lng: 101.567, level: 9.8, normal: 9.0, alert: 10.8, warning: 11.5, danger: 12.2 },
];
export const dams: Dam[] = [
  { name: "Empangan Sg. Selangor", lat: 3.615, lng: 101.648, percent: 72 },
  { name: "Empangan Klang Gates", lat: 3.230, lng: 101.752, percent: 85 },
  { name: "Empangan Batu", lat: 3.290, lng: 101.680, percent: 78 },
  { name: "Empangan Semenyih", lat: 3.060, lng: 101.880, percent: 81 },
  { name: "Empangan Langat", lat: 3.020, lng: 101.820, percent: 88 },
  { name: "Empangan Tinggi", lat: 3.620, lng: 101.560, percent: 69 },
];
export const rain: Rain[] = [
  { name: "Shah Alam", lat: 3.073, lng: 101.518, mm: 12 },
  { name: "Petaling Jaya", lat: 3.107, lng: 101.606, mm: 18 },
  { name: "Klang", lat: 3.044, lng: 101.445, mm: 9 },
  { name: "Kajang", lat: 2.993, lng: 101.787, mm: 22 },
  { name: "Rawang", lat: 3.321, lng: 101.575, mm: 6 },
  { name: "Kuala Kubu Bharu", lat: 3.566, lng: 101.659, mm: 30 },
  { name: "Sepang", lat: 2.690, lng: 101.750, mm: 4 },
  { name: "Sabak Bernam", lat: 3.770, lng: 100.990, mm: 2 },
];

/** Paras simulasi: setiap 10 mm hujan tambahan menaikkan paras ~ 8% julat normal→bahaya. */
export function simulatedLevel(s: Station, extraRainMm: number) {
  return s.level + (extraRainMm / 10) * 0.08 * (s.danger - s.normal);
}
export function status(s: Station, level: number) {
  if (level >= s.danger) return { label: "Bahaya", tone: "danger" } as const;
  if (level >= s.warning) return { label: "Amaran", tone: "warning" } as const;
  if (level >= s.alert) return { label: "Waspada", tone: "alert" } as const;
  return { label: "Normal", tone: "normal" } as const;
}

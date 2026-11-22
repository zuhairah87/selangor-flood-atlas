export type Station = { name: string; district: string; lat: number; lng: number; level: number; normal: number; alert: number; warning: number; danger: number };
export type Dam = { name: string; lat: number; lng: number; percent: number; river: string; district: string; capacityMm3: number; maxLevelM: number; yearCompleted: number };
export type Rain = { name: string; lat: number; lng: number; mm: number };
export type Waterway = { name: string; lat: number; lng: number; areaKm2: number; districts: string; dams: string; tributaries: number };
export type Drain = { name: string; stationId: string; district: string; basin: string; lat: number; lng: number; baseFill: number; rainResponse: number };

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
// Kapasiti maksimum, paras tertinggi dan tahun siap merujuk Profil Empangan LUAS.
// Peratus takungan kekal sebagai data contoh, bukan bacaan langsung.
export const dams: Dam[] = [
  { name: "Empangan Sg. Selangor", river: "Sg. Selangor", district: "Hulu Selangor", lat: 3.615, lng: 101.648, percent: 72, capacityMm3: 230, maxLevelM: 220, yearCompleted: 2004 },
  { name: "Empangan Klang Gates", river: "Sg. Klang", district: "Gombak", lat: 3.230, lng: 101.752, percent: 85, capacityMm3: 25.3, maxLevelM: 95.22, yearCompleted: 1959 },
  { name: "Empangan Batu", river: "Sg. Batu", district: "Gombak", lat: 3.290, lng: 101.680, percent: 78, capacityMm3: 32, maxLevelM: 102.7, yearCompleted: 1987 },
  { name: "Empangan Semenyih", river: "Sg. Semenyih", district: "Hulu Langat", lat: 3.060, lng: 101.880, percent: 81, capacityMm3: 61.7, maxLevelM: 111, yearCompleted: 1984 },
  { name: "Empangan Langat", river: "Sg. Langat", district: "Hulu Langat", lat: 3.020, lng: 101.820, percent: 88, capacityMm3: 34.1, maxLevelM: 220.96, yearCompleted: 1979 },
  { name: "Empangan Tinggi", river: "Sg. Tinggi", district: "Hulu Selangor", lat: 3.620, lng: 101.560, percent: 69, capacityMm3: 114.5, maxLevelM: 59.5, yearCompleted: 1997 },
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

// Profil lembangan LUAS (dikemas kini 22 Oktober 2025). Koordinat ialah titik rujukan, bukan laluan sungai.
export const waterways: Waterway[] = [
  { name: "Lembangan Sg. Langat", lat: 2.993, lng: 101.787, areaKm2: 2663, districts: "Kuala Langat, Klang, Sepang & Hulu Langat", dams: "Sg. Langat & Sg. Semenyih", tributaries: 261 },
  { name: "Lembangan Sg. Bernam", lat: 3.77, lng: 101.36, areaKm2: 1450, districts: "Sabak Bernam, Kuala Selangor & Hulu Selangor", dams: "Tiada empangan utama tersenarai", tributaries: 146 },
  { name: "Lembangan Sg. Tengi", lat: 3.43, lng: 101.16, areaKm2: 296.7, districts: "Kuala Selangor & Hulu Selangor", dams: "Tiada empangan utama tersenarai", tributaries: 4 },
  { name: "Lembangan Sg. Selangor", lat: 3.4, lng: 101.32, areaKm2: 2176, districts: "Kuala Selangor, Hulu Selangor & Gombak", dams: "Sg. Tinggi & Sg. Selangor", tributaries: 290 },
  { name: "Lembangan Sg. Buloh", lat: 3.16, lng: 101.52, areaKm2: 607.7, districts: "Kuala Selangor, Klang, Petaling & Gombak", dams: "Tasik Subang", tributaries: 61 },
  { name: "Lembangan Sg. Klang", lat: 3.04, lng: 101.45, areaKm2: 1285, districts: "Klang, Kuala Langat, Sepang, Petaling, WPKL, Hulu Langat & Gombak", dams: "Sg. Batu & Klang Gates", tributaries: 253 },
  { name: "Lembangan Sg. Sepang", lat: 2.69, lng: 101.75, areaKm2: 97.79, districts: "Sepang", dams: "Tiada empangan utama tersenarai", tributaries: 10 },
];

// Nama dan ID stesen merujuk JPS. Peratus isian dan respons hujan ialah parameter simulasi.
export const drains: Drain[] = [
  { name: "Sg. Damansara di TTDI Jaya", stationId: "3015490", district: "Petaling", basin: "Sg. Klang", lat: 3.105, lng: 101.567, baseFill: 64, rainResponse: 0.36 },
  { name: "Sg. Rasau di Taman Desa Kemuning", stationId: "3015402", district: "Klang", basin: "Sg. Klang", lat: 3.013, lng: 101.535, baseFill: 72, rainResponse: 0.3 },
  { name: "Sg. Binjai di Pekan Meru", stationId: "3112401", district: "Klang", basin: "Sg. Klang", lat: 3.087, lng: 101.441, baseFill: 58, rainResponse: 0.4 },
  { name: "Sg. Balak di Kg. Baru Balakong", stationId: "3017408", district: "Hulu Langat", basin: "Sg. Langat", lat: 3.035, lng: 101.745, baseFill: 66, rainResponse: 0.34 },
  { name: "Sg. Rawang di Rawang Tin", stationId: "3315443", district: "Gombak", basin: "Sg. Selangor", lat: 3.307, lng: 101.573, baseFill: 46, rainResponse: 0.32 },
  { name: "Saliran Sg. Aur di Pandamaran", stationId: "3014402", district: "Klang", basin: "Sg. Aur", lat: 3.007, lng: 101.421, baseFill: 76, rainResponse: 0.28 },
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

export function damStatus(p: number) {
  if (p >= 95) return { label: "Hampir limpah", tone: "danger" } as const;
  if (p >= 85) return { label: "Tinggi", tone: "warning" } as const;
  if (p >= 60) return { label: "Normal", tone: "normal" } as const;
  return { label: "Rendah", tone: "alert" } as const;
}

/** Anggaran isi takungan semasa dalam juta meter padu (juta m³). */
export function storageVolume(d: Dam) {
  return d.capacityMm3 * d.percent / 100;
}

/** Peratus isian saliran simulasi; 100% atau lebih bermaksud berisiko limpah. */
export function simulatedDrainFill(d: Drain, extraRainMm: number) {
  return Math.min(120, d.baseFill + extraRainMm * d.rainResponse);
}

export function drainStatus(fill: number) {
  if (fill >= 100) return { label: "Berisiko limpah", tone: "danger" } as const;
  if (fill >= 85) return { label: "Hampir penuh", tone: "warning" } as const;
  if (fill >= 70) return { label: "Pantau", tone: "alert" } as const;
  return { label: "Stabil", tone: "normal" } as const;
}

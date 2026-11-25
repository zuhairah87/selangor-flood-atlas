import { z } from "zod";
import { pointInSelangor } from "./selangor-boundary";
import type { SourceResult } from "./official-updates";

export type FloodHotspot = {
  id: number;
  name: string;
  district: string;
  lat: number;
  lng: number;
  basin: string;
  floodType: string;
};

export const hotspotAnnouncement = {
  date: "4 Nov 2026",
  total: 56,
  url: "https://mediaselangor.com/ms/2026/11/404894",
} as const;
export const hotspotCoordinateRecord = "Rekod koordinat JPS Selangor 2024";
export const hotspotLayerUrl = "https://jpsselgis.selangor.gov.my/gis/rest/services/Hosted/BANJIR_2024/FeatureServer/0";
export const hotspotQueryUrl = `${hotspotLayerUrl}/query?where=1%3D1&outFields=objectid%2Ckawasan_banjir%2Cdaerah%2Csub_lembangan_sg%2Cjenis_banjir&returnGeometry=true&outSR=4326&f=json`;

// Older serialized query snapshots may predate this source. No invented readings or check time.
const unavailableHotspotSource: SourceResult<FloodHotspot> = {
  data: [], checkedAt: "", error: "Data hotspot belum tersedia. Muat semula sumber rasmi.", url: hotspotQueryUrl,
};
export function availableHotspotSource(source: SourceResult<FloodHotspot> | undefined): SourceResult<FloodHotspot> {
  return source ?? unavailableHotspotSource;
}

// Hanya lokasi yang dinamakan dalam pengumuman awam dan mempunyai satu padanan JPS yang tepat.
const announcedLocations = [
  { name: "Kampung Rantau Panjang", district: "Klang" },
  { name: "Taman Rashna", district: "Klang" },
  { name: "Taman Sri Muda", district: "Klang" },
  { name: "Kampung Bukit Kapar", district: "Klang" },
] as const;

const featureSchema = z.object({
  attributes: z.object({
    objectid: z.number().int().positive(),
    kawasan_banjir: z.string(),
    daerah: z.string(),
    sub_lembangan_sg: z.string().nullable(),
    jenis_banjir: z.string().nullable(),
  }),
  geometry: z.object({ x: z.number().finite(), y: z.number().finite() }),
});

export function parseFloodHotspots(text: string): FloodHotspot[] {
  let input: unknown;
  try { input = JSON.parse(text); } catch { return []; }
  const envelope = z.object({ features: z.array(z.unknown()) }).safeParse(input);
  if (!envelope.success) return [];
  const features = envelope.data.features.map((feature) => featureSchema.safeParse(feature)).filter((result) => result.success).map((result) => result.data);

  return announcedLocations.flatMap((location) => {
    const matches = features.filter((feature) => feature.attributes.kawasan_banjir.trim().toLowerCase() === location.name.toLowerCase()
      && feature.attributes.daerah.trim().toLowerCase() === location.district.toLowerCase());
    // Nama serupa atau koordinat yang tidak lengkap tidak boleh digantikan dengan lokasi lain.
    if (matches.length !== 1) return [];
    const feature = matches[0];
    if (!feature) return [];
    const { objectid, sub_lembangan_sg, jenis_banjir } = feature.attributes;
    const { x: lng, y: lat } = feature.geometry;
    if (!pointInSelangor(lat, lng)) return [];
    return [{
      id: objectid,
      name: location.name,
      district: location.district,
      lat,
      lng,
      basin: sub_lembangan_sg?.trim() || "Tidak dinyatakan",
      floodType: jenis_banjir?.trim() || "Tidak dinyatakan",
    }];
  });
}

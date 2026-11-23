import { describe, expect, it } from "vitest";
import { parseFloodHotspots } from "./flood-hotspots";

function feature(objectid: number, name: string, district: string, x: number, y: number) {
  return { attributes: { objectid, kawasan_banjir: name, daerah: district, sub_lembangan_sg: "Sg. Klang", jenis_banjir: "Kilat" }, geometry: { x, y } };
}

const officialFeatures = [
  feature(68, "Kampung Rantau Panjang", "Klang", 101.4216, 3.0626),
  feature(17, "Taman Rashna", "Klang", 101.47802, 3.058161),
  feature(3, "Taman Sri Muda", "Klang", 101.46554, 2.988931),
  feature(89, "Kampung Bukit Kapar", "Klang", 101.414, 3.18314),
];

describe("JPS flood hotspots", () => {
  it("keeps the four exact announced name-and-district matches", () => {
    const result = parseFloodHotspots(JSON.stringify({ features: officialFeatures }));
    expect(result.map((row) => row.id)).toEqual([68, 17, 3, 89]);
    expect(result[0]).toMatchObject({ name: "Kampung Rantau Panjang", district: "Klang", lat: 3.0626, lng: 101.4216 });
  });

  it("does not merge a same-named hotspot from another district", () => {
    const result = parseFloodHotspots(JSON.stringify({ features: [...officialFeatures, feature(231, "Kampung Rantau Panjang", "Hulu Langat", 101.8173874, 3.112589)] }));
    expect(result).toHaveLength(4);
    expect(result.filter((row) => row.name === "Kampung Rantau Panjang")).toHaveLength(1);
  });

  it("does not substitute Jalan Kebun Nenas for Kampung Jalan Kebun", () => {
    const result = parseFloodHotspots(JSON.stringify({ features: [feature(6, "Jalan Kebun Nenas", "Klang", 101.49028, 2.996297)] }));
    expect(result).toEqual([]);
  });

  it("rejects missing geometry and malformed JSON instead of inventing coordinates", () => {
    expect(parseFloodHotspots(JSON.stringify({ features: [{ attributes: officialFeatures[0]!.attributes }] }))).toEqual([]);
    expect(parseFloodHotspots("not json")).toEqual([]);
  });
});

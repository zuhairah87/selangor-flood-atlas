import { describe, it, expect } from "vitest";
import { pointInSelangor, selangorBounds, selangorOutlineParts, selangorParts } from "./selangor-boundary";
import { stations, dams, rain, waterways, drains } from "./flood-data";

describe("sempadan negeri Selangor", () => {
  it("bounding box Selangor dalam julat yang diharapkan", () => {
    expect(selangorBounds).toEqual([[2.5946, 100.8096], [3.8702, 101.9712]]);
  });

  it("setiap empangan, titik hujan, lembangan dan saliran berada dalam Selangor", () => {
    for (const d of dams) expect(pointInSelangor(d.lat, d.lng)).toBe(true);
    for (const r of rain) expect(pointInSelangor(r.lat, r.lng)).toBe(true);
    for (const w of waterways) expect(pointInSelangor(w.lat, w.lng)).toBe(true);
    for (const d of drains) expect(pointInSelangor(d.lat, d.lng)).toBe(true);
  });

  it("hanya dua stesen paras air berada di luar Selangor", () => {
    const luar = stations.filter((s) => !pointInSelangor(s.lat, s.lng)).map((s) => s.name);
    expect(luar).toEqual(["Sg. Klang di Jambatan Sulaiman", "Sg. Bernam di Tanjung Malim"]);
  });

  it("titik jauh di luar negeri dikira luar", () => {
    expect(pointInSelangor(6.5, 100.2)).toBe(false); // Alor Setar, Kedah
    expect(pointInSelangor(1.3, 103.8)).toBe(false); // Singapura
    expect(pointInSelangor(3.145, 101.695)).toBe(false); // dalam KL, enklaf
  });

  it("setiap bahagian mempunyai sekurang-kurangnya satu cincin luar", () => {
    expect(selangorParts.length).toBeGreaterThan(0);
    for (const p of selangorParts) expect(p.length).toBeGreaterThanOrEqual(1);
  });
});

describe("garisan sempadan di semua pulau", () => {
  it("semua enam garisan pulau dibuang dan hanya tanah besar dilukis", () => {
    const islandStarts = selangorParts.slice(0, 6).map((part) => part[0]?.[0]);
    const outlineStarts = selangorOutlineParts.map((part) => part[0]?.[0]);
    for (const start of islandStarts) expect(outlineStarts).not.toContainEqual(start);
    expect(selangorOutlineParts).toHaveLength(1);
    expect(selangorOutlineParts[0]).toBe(selangorParts[6]);
  });

  it.each([
    { name: "Pulau Carey", lat: 2.92, lng: 101.32 },
    { name: "Pulau Ketam", lat: 3.025, lng: 101.25 },
    { name: "Pulau Indah", lat: 3.02, lng: 101.31 },
  ])("$name kekal dalam geometri Selangor", ({ lat, lng }) => {
    expect(pointInSelangor(lat, lng)).toBe(true);
  });
});

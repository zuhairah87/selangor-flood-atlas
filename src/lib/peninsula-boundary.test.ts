import { describe, expect, it } from "vitest";
import { dams, rain, stations } from "./flood-data";
import { peninsulaRings } from "./peninsula-boundary";
import type { Ring } from "./selangor-boundary";

function pointInPeninsula(lat: number, lng: number) {
  let inside = false;
  for (const ring of peninsulaRings) {
    if (inRing(ring, lat, lng)) inside = !inside;
  }
  return inside;
}

function inRing(ring: Ring, lat: number, lng: number) {
  let inside = false;
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    if (!a || !b) continue;
    const [y1, x1] = a;
    const [y2, x2] = b;
    if (y1 > lat !== y2 > lat) {
      const x = x1 + ((lat - y1) * (x2 - x1)) / (y2 - y1);
      if (lng < x) inside = !inside;
    }
  }
  return inside;
}

describe("topeng Semenanjung Malaysia", () => {
  it("merangkumi semua titik pemantauan banjir Selangor", () => {
    for (const point of [...stations, ...dams, ...rain]) {
      expect(pointInPeninsula(point.lat, point.lng), point.name).toBe(true);
    }
  });

  it("merangkumi Semenanjung tetapi mengecualikan Singapura dan Sabah", () => {
    expect(pointInPeninsula(6.121, 100.369)).toBe(true); // Alor Setar
    expect(pointInPeninsula(1.492, 103.741)).toBe(true); // Johor Bahru
    expect(pointInPeninsula(1.352, 103.82)).toBe(false); // Singapura
    expect(pointInPeninsula(5.98, 116.07)).toBe(false); // Kota Kinabalu
  });
});

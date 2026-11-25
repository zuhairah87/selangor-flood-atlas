import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import L from "leaflet";
import FloodMap, { type Layers } from "./FloodMap";
import type { FloodHotspot } from "@/lib/flood-hotspots";

const layers: Layers = { rivers: true, dams: true, rain: true, waterways: true, drains: true, terrain: false, hotspots: true };
const props = { layers, extra: 0, mapStyle: "light" as const, tide: null, simulationTime: "", currentStations: [], currentDams: [], drainReadings: [] };
const hotspot: FloodHotspot = { id: 68, name: "Kampung Rantau Panjang", district: "Klang", lat: 3.0626, lng: 101.4216, basin: "Sg. Klang", floodType: "Kilat" };

// jsdom lacks SVG capability detection; Leaflet's SVG renderer still works here.
const originalSvg = L.Browser.svg;
beforeAll(() => { Object.defineProperty(L.Browser, "svg", { value: true, configurable: true }); });
afterEach(cleanup);
afterAll(() => { Object.defineProperty(L.Browser, "svg", { value: originalSvg, configurable: true }); });

describe("Flood map hotspot availability", () => {
  it("keeps the map running when an older caller has no hotspot data", () => {
    // Simulate the pre-hotspot caller that can survive a live preview update.
    const legacyProps = { ...props, hotspots: undefined } as unknown as Parameters<typeof FloodMap>[0];
    const { container } = render(<FloodMap {...legacyProps} />);
    expect(container.querySelector(".leaflet-container")).not.toBeNull();
    expect(container.querySelectorAll(".waterway-marker")).toHaveLength(7);
    expect(container.querySelectorAll(".hotspot-marker")).toHaveLength(0);
  });

  it("adds verified hotspots after data arrives and removes them when disabled", () => {
    const { container, rerender } = render(<FloodMap {...props} hotspots={[]} />);
    rerender(<FloodMap {...props} hotspots={[hotspot]} />);
    expect(container.querySelectorAll(".hotspot-marker")).toHaveLength(1);
    rerender(<FloodMap {...props} layers={{ ...layers, hotspots: false }} hotspots={[hotspot]} />);
    expect(container.querySelectorAll(".hotspot-marker")).toHaveLength(0);
  });
});
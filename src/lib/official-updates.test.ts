import { describe, it, expect } from "vitest";
import { applyRiverReading, applyDamReading, parseDamReadings, parseRiverReadings, parseRainReadings } from "./official-updates";
import { stations, dams } from "./flood-data";

describe("official readings without fabricated values", () => {
  it("keeps rainfall since midnight separate from the latest one-hour total", () => {
    const html = "Taburan Hujan dari Tengah Malam<table><td data-th='No'>1</td><td>ID1</td><td>USJ 1</td><td>Petaling</td><td>22/11/2026 19:00:00</td><td>6.5</td><td>47</td><td>6</td><td>1.5</td><td>0.5</td><td>11.5</td><td>27.5</td><td>5</td></table>";
    expect(parseRainReadings(html)[0]?.midnightMm).toBe(27.5);
    expect(parseRainReadings(html)[0]?.hourMm).toBe(5);
  });
  it("missing or nonnumeric water levels are not converted to zero", () => {
    expect(parseRiverReadings('<tr class="item"><td data-th="wl">Tiada Data</td></tr>')).toEqual([]);
  });
  it("official river level and all thresholds replace the sample together", () => {
    const station = stations.find((row) => row.name === "Sg. Damansara di TTDI Jaya");
    if (!station) throw new Error("Missing station");
    const result = applyRiverReading(station, [{ id: "3015490", name: station.name, updatedAt: "22/11/2026 18:45", level: 3.82, normal: 3.5, alert: 7.3, warning: 7.8, danger: 8.3 }]);
    expect([result.level, result.normal, result.alert, result.warning, result.danger]).toEqual([3.82, 3.5, 7.3, 7.8, 8.3]);
  });
  it("does not substitute Sg. Batu for the Sg. Gombak sample", () => {
    const station = stations.find((row) => row.name === "Sg. Gombak di Batu Caves");
    if (!station) throw new Error("Missing station");
    expect(applyRiverReading(station, [{ id: "3216467", name: "Sg. Batu di Batu Caves", updatedAt: "22/11/2026 19:00", level: 48.98, normal: 48.9, alert: 51, warning: 51.5, danger: 52 }]).observedAt).toBeNull();
  });
  it("preserves LUAS measured stored volume instead of recalculating it", () => {
    const dam = dams.find((row) => row.name === "Empangan Semenyih");
    if (!dam) throw new Error("Missing dam");
    const result = applyDamReading(dam, [{ name: "SEMENYIH", updatedAt: "22-11-2026 07:00 AM", level: 110.47, stored: 57.19, percent: 96.81 }]);
    expect(result.observedStored).toBe(57.19);
    expect(result.percent).toBe(96.81);
  });
  it("LUAS percentages above 100% are retained rather than silently clamped", () => {
    const html = '<table class="main_table"><tr><td>MAKLUMAT EMPANGAN</td></tr><tr class="tblrow"><td>22-11-2026 08:00 AM</td><td>BATU</td><td>103.11</td><td>32.87</td><td>102.81</td><td>0.00</td></tr></table>';
    expect(parseDamReadings(html)[0]?.percent).toBe(102.81);
  });
});
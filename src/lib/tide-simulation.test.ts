import { describe, expect, it } from "vitest";
import { drains, simulatedDrainFill } from "./flood-data";
import { combinedDrainFill } from "./tide-simulation";
import { officialTideAt, tideDate, type TideDay, type TideReading } from "./official-tides";

const low: TideReading = { heightM: 1, sampleTime: "10:00", label: "Aras rendah", surcharge: 0 };
const high: TideReading = { heightM: 4, sampleTime: "16:00", label: "Aras tinggi", surcharge: 20 };

function drainById(id: string) {
  const drain = drains.find((entry) => entry.stationId === id);
  if (!drain) throw new Error(`Missing drain ${id}`);
  return drain;
}

describe("faktor air pasang dalam simulasi", () => {
  it("surut mengekalkan senario hujan sahaja", () => {
    const drain = drainById("3014402");
    expect(combinedDrainFill(drain, 50, low)).toBe(simulatedDrainFill(drain, 50));
  });
  it("tambahan contoh 10 mata peratus pada Pandamaran", () => {
    expect(combinedDrainFill(drainById("3014402"), 0, { ...high, surcharge: 10 })).toBe(86);
  });
  it("pasang besar bersama hujan boleh menaikkan risiko limpah", () => {
    expect(combinedDrainFill(drainById("3014402"), 25, high)).toBe(103);
  });
  it("saliran yang tidak dipilih untuk senario pesisir tidak berubah", () => {
    const drain = drainById("3015490");
    expect(combinedDrainFill(drain, 50, high)).toBe(simulatedDrainFill(drain, 50));
  });
  it("isian gabungan tidak melebihi had simulasi 120%", () => {
    expect(combinedDrainFill(drainById("3015402"), 150, high)).toBe(120);
  });
  it("tiada jadual tidak menggunakan faktor laut", () => {
    expect(combinedDrainFill(drainById("3014402"), 25, null)).toBe(83);
  });
});

describe("jadual rasmi mengikut masa MYT", () => {
  const days: TideDay[] = [{ date: "2026-11-22", events: [], points: [
    { time: "00:00", heightM: 2 }, { time: "10:20", heightM: 1.46 }, { time: "16:20", heightM: 4.34 }, { time: "18:00", heightM: 3.75 },
  ] }];
  it("mengekalkan tarikh rasmi dalam format PHN", () => {
    expect(tideDate("22-Nov-26")).toBe("2026-11-22");
  });
  it("masa 18:05 menggunakan sampel terakhir 18:00, bukan bacaan rekaan", () => {
    expect(officialTideAt(days, "2026-11-22T18:05")?.heightM).toBe(3.75);
    expect(officialTideAt(days, "2026-11-22T18:05")?.sampleTime).toBe("18:00");
  });
  it("tiada ramalan untuk tarikh di luar liputan", () => {
    expect(officialTideAt(days, "2026-12-01T18:00")).toBeNull();
  });
});
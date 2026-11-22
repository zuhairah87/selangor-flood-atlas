import { describe, expect, it } from "vitest";
import { dams, drains, drainStatus, simulatedDrainFill, status, storageVolume, waterways, type Station } from "./flood-data";

const station: Station = {
  name: "Stesen ujian",
  district: "Selangor",
  lat: 3,
  lng: 101,
  level: 1,
  normal: 1,
  alert: 2,
  warning: 3,
  danger: 4,
};

describe("maklumat takungan empangan", () => {
  it("72% daripada kapasiti 230 juta m³ bersamaan 165.6 juta m³", () => {
    const dam = dams.find((d) => d.name === "Empangan Sg. Selangor");
    if (!dam) throw new Error("Empangan Sg. Selangor tiada dalam data");
    expect(dam.capacityMm3).toBe(230);
    expect(storageVolume(dam)).toBeCloseTo(165.6, 5);
  });

  it("jumlah kapasiti maksimum enam empangan ialah 497.6 juta m³", () => {
    expect(dams.reduce((total, dam) => total + dam.capacityMm3, 0)).toBeCloseTo(497.6, 5);
  });
});

describe("warna status paras sungai", () => {
  it("paras bawah ambang alert ialah Normal (biru)", () => {
    expect(status(station, 1.99)).toEqual({ label: "Normal", tone: "normal" });
  });

  it("paras pada ambang alert ialah Waspada (kuning)", () => {
    expect(status(station, 2)).toEqual({ label: "Waspada", tone: "alert" });
  });

  it("paras pada ambang warning ialah Amaran (oren)", () => {
    expect(status(station, 3)).toEqual({ label: "Amaran", tone: "warning" });
  });

  it("paras pada ambang bahaya ialah Bahaya (merah)", () => {
    expect(status(station, 4)).toEqual({ label: "Bahaya", tone: "danger" });
  });
});

describe("tali air utama dan risiko saliran", () => {
  it("memaparkan tujuh lembangan utama dalam Profil Lembangan Sungai LUAS", () => {
    expect(waterways).toHaveLength(7);
    expect(waterways.map((w) => w.name)).toContain("Lembangan Sg. Tengi");
  });

  it("100 mm hujan menaikkan Sg. Damansara daripada 64% kepada 100%", () => {
    const drain = drains.find((d) => d.stationId === "3015490");
    if (!drain) throw new Error("Stesen Sg. Damansara tiada");
    expect(simulatedDrainFill(drain, 100)).toBe(100);
  });

  it("isian bawah 70% ialah Stabil", () => {
    expect(drainStatus(69.99)).toEqual({ label: "Stabil", tone: "normal" });
  });

  it("isian 70% ialah Pantau", () => {
    expect(drainStatus(70)).toEqual({ label: "Pantau", tone: "alert" });
  });

  it("isian 85% ialah Hampir penuh", () => {
    expect(drainStatus(85)).toEqual({ label: "Hampir penuh", tone: "warning" });
  });

  it("isian 100% ialah Berisiko limpah", () => {
    expect(drainStatus(100)).toEqual({ label: "Berisiko limpah", tone: "danger" });
  });
});

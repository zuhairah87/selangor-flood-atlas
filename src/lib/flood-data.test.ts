import { describe, expect, it } from "vitest";
import { dams, status, storageVolume, type Station } from "./flood-data";

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

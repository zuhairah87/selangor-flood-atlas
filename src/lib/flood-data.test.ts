import { describe, expect, it } from "vitest";
import { status, type Station } from "./flood-data";

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

import { describe, expect, it } from "vitest";
import { stationIconSvg, toneOrder } from "./station-icon";
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

describe("ikon stesen pada petunjuk", () => {
  it("tiap nada status mempunyai padanan warna pin sendiri", () => {
    expect(stationIconSvg({ tone: "normal" })).toContain('fill="var(--normal)"');
    expect(stationIconSvg({ tone: "alert" })).toContain('fill="var(--alert)"');
    expect(stationIconSvg({ tone: "warning" })).toContain('fill="var(--warn)"');
    expect(stationIconSvg({ tone: "danger" })).toContain('fill="var(--danger)"');
  });

  it("nada yang dipulangkan status() semuanya disokong ikon", () => {
    const nada = new Set(toneOrder);
    for (const level of [1, 2, 3, 4]) expect(nada.has(status(station, level).tone)).toBe(true);
  });

  it("stesen luar sempadan berputus-putus, stesen dalam tidak", () => {
    expect(stationIconSvg({ tone: "normal", luar: true })).toContain('stroke-dasharray="3,3"');
    expect(stationIconSvg({ tone: "normal", luar: false })).not.toContain("stroke-dasharray");
  });

  it("nada cair memakai aksara gelap, nada gelap memakai aksara cerah", () => {
    // Warna aksara gelombang sahaja yang diuji, bukan garisan luar pin.
    const glyph = (tone: "normal" | "alert" | "warning" | "danger") =>
      stationIconSvg({ tone }).match(/fill="none" stroke="var\((--[\w-]+)\)"/)?.[1];
    expect(glyph("alert")).toBe("--foreground");
    expect(glyph("warning")).toBe("--foreground");
    expect(glyph("normal")).toBe("--background");
    expect(glyph("danger")).toBe("--background");
  });
});

import type { Tone } from "./station-icon";

const toneVar: Record<Tone, string> = {
  normal: "--normal",
  alert: "--alert",
  warning: "--warn",
  danger: "--danger",
};

const glyphVar: Record<Tone, string> = {
  normal: "--background",
  alert: "--foreground",
  warning: "--foreground",
  danger: "--background",
};

/** Ikon lembangan: tiga aliran air dalam bingkai bulat. */
export function waterwayIconSvg(size = 24) {
  return (
    `<svg class="waterway-glyph" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">` +
    `<rect x="1.5" y="1.5" width="21" height="21" rx="10.5" fill="var(--normal)" stroke="var(--foreground)" stroke-width="1.4"/>` +
    `<path d="M5 8c1.3-1.2 2.6-1.2 3.9 0s2.6 1.2 3.9 0 2.6-1.2 3.9 0 2.6 1.2 3.9 0M5 12c1.3-1.2 2.6-1.2 3.9 0s2.6 1.2 3.9 0 2.6-1.2 3.9 0 2.6 1.2 3.9 0M5 16c1.3-1.2 2.6-1.2 3.9 0s2.6 1.2 3.9 0 2.6-1.2 3.9 0 2.6 1.2 3.9 0" fill="none" stroke="var(--background)" stroke-width="1.4" stroke-linecap="round"/>` +
    `</svg>`
  );
}

/** Ikon saliran: portal saliran dengan paras air yang berubah mengikut status. */
export function drainIconSvg({ tone, size = 24 }: { tone: Tone; size?: number }) {
  const fill = `var(${toneVar[tone]})`;
  const glyph = `var(${glyphVar[tone]})`;
  return (
    `<svg class="drain-glyph" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">` +
    `<rect x="1.5" y="1.5" width="21" height="21" rx="4" fill="${fill}" stroke="var(--foreground)" stroke-width="1.4"/>` +
    `<path d="M6 18v-6a6 6 0 0 1 12 0v6M9 18v-6a3 3 0 0 1 6 0v6" fill="none" stroke="${glyph}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<path d="M5 19c1.3-1 2.6-1 3.9 0s2.6 1 3.9 0 2.6-1 3.9 0 2.6 1 3.9 0" fill="none" stroke="${glyph}" stroke-width="1.4" stroke-linecap="round"/>` +
    `</svg>`
  );
}

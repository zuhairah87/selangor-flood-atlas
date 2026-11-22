import type { Tone } from "./station-icon";

// Satu sumber kebenaran untuk ikon empangan pada peta, petunjuk dan panel maklumat.
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

/** Ikon empangan: air berombak di sebelah hulu dan dinding empangan di sebelah hilir. */
export function damIconSvg({ tone, size = 24 }: { tone: Tone; size?: number }) {
  const fill = `var(${toneVar[tone]})`;
  const glyph = `var(${glyphVar[tone]})`;
  return (
    `<svg class="dam-glyph" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">` +
    `<rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="${fill}" stroke="var(--foreground)" stroke-width="1.5"/>` +
    `<path d="M5.5 7c1.2-1.2 2.4-1.2 3.6 0s2.4 1.2 3.6 0 2.4-1.2 3.6 0 2.4 1.2 3.6 0" fill="none" stroke="${glyph}" stroke-width="1.4" stroke-linecap="round"/>` +
    `<path d="M5.5 10c1.2-1.2 2.4-1.2 3.6 0s2.4 1.2 3.6 0 2.4-1.2 3.6 0 2.4 1.2 3.6 0" fill="none" stroke="${glyph}" stroke-width="1.4" stroke-linecap="round"/>` +
    `<path d="M7 13h10l2 6H5l2-6Z M12 13v6" fill="none" stroke="${glyph}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `</svg>`
  );
}

export type Tone = "normal" | "alert" | "warning" | "danger";

// Satu sumber kebenaran untuk rupa penanda stesen: peta (divIcon) dan petunjuk (legend) memakainya bersama.
const toneVar: Record<Tone, string> = {
  normal: "--normal",
  alert: "--alert",
  warning: "--warn",
  danger: "--danger",
};

// Padanan warna aksara mengikut konvensyen label paras sungai dalam styles.css.
const glyphVar: Record<Tone, string> = {
  normal: "--background",
  alert: "--foreground",
  warning: "--foreground",
  danger: "--background",
};

export const toneOrder: Tone[] = ["normal", "alert", "warning", "danger"];

/**
 * Ikon stesen paras air: pin dengan dua gelombang (stesen pemantauan air),
 * sempadan berputus-putus untuk stesen di luar negeri Selangor.
 */
export function stationIconSvg({ tone, luar = false, size = 22 }: { tone: Tone; luar?: boolean; size?: number }) {
  const fill = `var(${toneVar[tone]})`;
  const glyph = `var(${glyphVar[tone]})`;
  const dash = luar ? ' stroke-dasharray="3,3"' : "";
  const opacity = luar ? ' opacity="0.65"' : "";
  return (
    `<svg class="station-glyph" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"${opacity}>` +
    `<path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" fill="${fill}" stroke="var(--foreground)" stroke-width="1.8" stroke-linejoin="round"${dash}/>` +
    `<path d="M8.2 7.8c1.2-1.4 2.5-1.4 3.7 0s2.5 1.4 3.7 0" fill="none" stroke="${glyph}" stroke-width="1.7" stroke-linecap="round"/>` +
    `<path d="M8.2 11.2c1.2-1.4 2.5-1.4 3.7 0s2.5 1.4 3.7 0" fill="none" stroke="${glyph}" stroke-width="1.7" stroke-linecap="round"/>` +
    `</svg>`
  );
}

import { simulatedDrainFill, type Drain } from "./flood-data";
import type { TideReading } from "./official-tides";

// Illustrative scenario selection, not a surveyed tidal influence boundary.
// Surcharges are percentage points of synthetic fill, not metres of sea level.
const coastalDrainIds = new Set(["3015402", "3112401", "3014402"]);
export function isTideScenarioDrain(drain: Drain) {
  return coastalDrainIds.has(drain.stationId);
}

export function combinedDrainFill(drain: Drain, rainMm: number, tide: TideReading | null) {
  const surcharge = isTideScenarioDrain(drain) ? tide?.surcharge ?? 0 : 0;
  return Math.min(120, simulatedDrainFill(drain, rainMm) + surcharge);
}
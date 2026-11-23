import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { parseDamReadings, parseRiverReadings, parseRainReadings, type SourceResult, type Forecast } from "./official-updates";
import { hotspotQueryUrl, parseFloodHotspots } from "./flood-hotspots";

async function source<T>(url: string, parse: (text: string) => T[]): Promise<SourceResult<T>> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
    if (!response.ok) {
      console.error("Official source failed", url, response.status, (await response.text()).slice(0, 500));
      return { data: [], checkedAt: new Date().toISOString(), error: `Sumber tidak tersedia (${response.status}).`, url };
    }
    const data = parse(await response.text());
    if (!data.length) throw new Error("No validated readings returned");
    return { data, checkedAt: new Date().toISOString(), error: null, url };
  } catch (error) {
    console.error("Official source unavailable", url, error);
    return { data: [], checkedAt: new Date().toISOString(), error: "Data tidak dapat disahkan atau sumber tidak dapat dicapai.", url };
  }
}
const forecastSchema = z.array(z.object({
  location: z.object({ location_id: z.string() }), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  morning_forecast: z.string(), afternoon_forecast: z.string(), night_forecast: z.string(), min_temp: z.number(), max_temp: z.number(),
}));
export const getOfficialUpdates = createServerFn({ method: "GET" }).handler(async () => {
  const [rivers, dams, weather, rainfall, hotspots] = await Promise.all([
    source("https://publicinfobanjir.water.gov.my/index.php/aras-air/data-paras-air/aras-air-data/?state=SEL&district=ALL&station=ALL", parseRiverReadings),
    source("https://iwrims.luas.gov.my/", parseDamReadings),
    source<Forecast>("https://api.data.gov.my/weather/forecast?contains=St008@location__location_id", (text) => forecastSchema.parse(JSON.parse(text))
      .filter((row) => row.location.location_id === "St008")
      .map((row) => ({ date: row.date, morning: row.morning_forecast, afternoon: row.afternoon_forecast, night: row.night_forecast, min: row.min_temp, max: row.max_temp }))
      .sort((a, b) => a.date.localeCompare(b.date))),
    source("https://publicinfobanjir.water.gov.my/wp-content/themes/shapely/agency/searchresultrainfall.php?state=SEL&district=ALL&station=ALL&loginStatus=0&language=0", parseRainReadings),
    source(hotspotQueryUrl, parseFloodHotspots),
  ]);
  return { rivers, dams, weather, rainfall, hotspots };
});
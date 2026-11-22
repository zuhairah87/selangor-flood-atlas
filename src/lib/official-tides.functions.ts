import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { tideDate, type TideDay } from "./official-tides";

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const daySchema = z.object({
  data: z.array(z.object({ date: z.string(), time, height: z.number().finite() })).min(2).max(150),
  MAX_LOW_Tide: z.object({ HL: z.array(z.object({ time, height: z.number().finite(), stat: z.union([z.literal(0), z.literal(1)]) })) }),
});
const responseSchema = z.object({ current_day: daySchema, prev_day: daySchema, prev_1_day: daySchema });

export const getOfficialTides = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const response = await fetch("https://etide.hydro.gov.my/functions/q_functions.php", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "fetch_data=&location=klang01", signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      console.error("PHN tides unavailable", response.status, await response.text());
      return { days: [] as TideDay[], error: `Jadual PHN tidak tersedia (${response.status}).`, fetchedAt: new Date().toISOString() };
    }
    const payload = responseSchema.parse(await response.json());
    const days: TideDay[] = Object.values(payload).map((day) => {
      const date = tideDate(day.data[0]?.date ?? "");
      if (!date || day.data.some((point) => tideDate(point.date) !== date)) throw new Error("Invalid PHN dates");
      return { date, points: day.data.map((point) => ({ time: point.time, heightM: point.height })).sort((a, b) => a.time.localeCompare(b.time)),
        events: day.MAX_LOW_Tide.HL.map((event) => ({ time: event.time, heightM: event.height, high: event.stat === 1 })) };
    }).sort((a, b) => a.date.localeCompare(b.date));
    return { days, error: null, fetchedAt: new Date().toISOString() };
  } catch (error) {
    console.error("PHN tide fetch failed", error);
    return { days: [] as TideDay[], error: "Jadual rasmi PHN tidak dapat dimuatkan. Faktor laut tidak digunakan; isian hujan sahaja dipaparkan.", fetchedAt: new Date().toISOString() };
  }
});
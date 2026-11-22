import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Forecast, RainReading } from "@/lib/official-updates";

export function sourceTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-MY", { timeZone: "Asia/Kuala_Lumpur", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(new Date(timestamp));
}

export default function OfficialSourcePanel({ sources, forecasts, rainfall, refreshing, onRefresh }: {
  sources: { name: string; count: string; checkedAt: string; error: string | null; url: string }[];
  forecasts: Forecast[]; rainfall: RainReading[]; refreshing: boolean; onRefresh: () => void;
}) {
  return <section className="space-y-3 border-y border-border py-4" aria-labelledby="official-sources-heading">
    <div className="flex items-center justify-between gap-2">
      <h2 id="official-sources-heading" className="text-sm font-semibold">Sumber rasmi</h2>
      <Button size="sm" variant="outline" disabled={refreshing} onClick={onRefresh}>
        <RefreshCw className={refreshing ? "animate-spin motion-reduce:animate-none" : ""} />{refreshing ? "Mengemas kini…" : "Muat semula semua"}
      </Button>
    </div>
    <ul className="space-y-3 text-xs" aria-live="polite">
      {sources.map((source) => <li key={source.name} className="space-y-1">
        <div className="flex items-start justify-between gap-2"><a href={source.url} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-2">{source.name}</a><span className={source.error ? "text-danger" : "text-muted-foreground"}>{source.error ? "Tidak tersedia" : source.count}</span></div>
        <p className="text-muted-foreground">Disemak: {sourceTime(source.checkedAt)} MYT</p>
        {source.error && <p className="text-danger">{source.error} Data contoh dilabel berasingan.</p>}
      </li>)}
    </ul>
    {forecasts.length > 0 && <details className="border-t border-border pt-3">
      <summary className="cursor-pointer text-xs font-medium">Ramalan MET Malaysia · Selangor</summary>
      <ul className="mt-3 space-y-3 text-xs">{forecasts.map((forecast) => <li key={forecast.date} className="space-y-1">
        <p className="font-medium">{forecast.date} · {forecast.min}–{forecast.max}°C</p>
        <p>Pagi: {forecast.morning}</p><p>Petang: {forecast.afternoon}</p><p>Malam: {forecast.night}</p>
      </li>)}</ul>
    </details>}
    {rainfall.length > 0 && <details className="border-t border-border pt-3">
      <summary className="cursor-pointer text-xs font-medium">Cerapan hujan JPS · {rainfall.length} stesen</summary>
      <ul className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1 text-xs">{rainfall.map((reading, index) => <li key={`${reading.id}-${index}`} className="space-y-1">
        <p className="font-medium">{reading.name} · {reading.district}</p>
        <p>Sejak tengah malam: <b>{reading.midnightMm} mm</b> · 1 jam terkini: <b>{reading.hourMm} mm</b></p>
        <p className="text-muted-foreground">JPS: {reading.updatedAt} MYT</p>
      </li>)}</ul>
    </details>}
    <p className="text-xs text-muted-foreground">Ramalan MET bukan bacaan hujan dalam mm. Masa cerapan dipaparkan pada setiap bacaan; masa semakan bukan masa cerapan. Profil lembangan dan parameter simulasi kekal sebagai rujukan.</p>
  </section>;
}
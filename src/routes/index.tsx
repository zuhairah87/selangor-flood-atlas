import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { stations, dams, waterways, drains, damStatus, simulatedLevel, status, storageVolume, simulatedDrainFill, drainStatus } from "@/lib/flood-data";
import { damIconSvg } from "@/lib/dam-icon";
import { waterwayIconSvg, drainIconSvg } from "@/lib/waterway-icon";
import type { Tone } from "@/lib/station-icon";
import type { Layers, MapStyle } from "@/components/FloodMap";
import { combinedDrainFill, isTideScenarioDrain } from "@/lib/tide-simulation";
import { officialTideAt, officialTideSource } from "@/lib/official-tides";
import { getOfficialTides } from "@/lib/official-tides.functions";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Waves } from "lucide-react";
import OfficialSourcePanel from "@/components/OfficialSourcePanel";
import { getOfficialUpdates } from "@/lib/official-updates.functions";
import { applyDamReading, applyRiverReading } from "@/lib/official-updates";
import { hotspotAnnouncement, hotspotCoordinateRecord, hotspotLayerUrl } from "@/lib/flood-hotspots";
import { hotspotIconSvg } from "@/lib/hotspot-icon";

const FloodMap = lazy(() => import("@/components/FloodMap"));
const tideQueryOptions = queryOptions({ queryKey: ["official-tides", "klang01"], queryFn: () => getOfficialTides(), staleTime: 5 * 60 * 1000 });
const updatesQueryOptions = queryOptions({ queryKey: ["official-updates"], queryFn: () => getOfficialUpdates(), staleTime: 5 * 60 * 1000 });

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const [tides, updates] = await Promise.all([context.queryClient.ensureQueryData(tideQueryOptions), context.queryClient.ensureQueryData(updatesQueryOptions)]);
    return { tides, updates };
  },
  head: () => ({
    meta: [
      { title: "Simulasi Hujan & Banjir Selangor" },
      { name: "description", content: "Peta banjir Selangor dengan simulasi hujan, maklumat empangan dan jadual pasang surut rasmi PHN Pelabuhan Klang." },
      { property: "og:title", content: "Simulasi Hujan & Banjir Selangor" },
      { property: "og:description", content: "Simulasi hujan dan saliran Selangor dengan faktor laut daripada jadual rasmi PHN Pelabuhan Klang." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const toneCls: Record<string, string> = { normal: "bg-normal", alert: "bg-alert", warning: "bg-warn", danger: "bg-danger" };
const mapStyleOptions: { id: MapStyle; label: string; swatch: string }[] = [
  { id: "light", label: "Cerah", swatch: "--outside" },
  { id: "night", label: "Biru malam", swatch: "--outside-night" },
];

function DamIcon({ tone, size = 24 }: { tone: Tone; size?: number }) {
  return <span className="shrink-0" dangerouslySetInnerHTML={{ __html: damIconSvg({ tone, size }) }} />;
}

function WaterwayIcon({ size = 24 }: { size?: number }) {
  return <span className="shrink-0" dangerouslySetInnerHTML={{ __html: waterwayIconSvg(size) }} />;
}

function DrainIcon({ tone, size = 24 }: { tone: Tone; size?: number }) {
  return <span className="shrink-0" dangerouslySetInnerHTML={{ __html: drainIconSvg({ tone, size }) }} />;
}

function HotspotIcon({ size = 24 }: { size?: number }) {
  return <span className="shrink-0" dangerouslySetInnerHTML={{ __html: hotspotIconSvg(size) }} />;
}

function Index() {
  const initialData = Route.useLoaderData();
  const [mapStyle, setMapStyle] = useState<MapStyle>("light");
  const [layers, setLayers] = useState<Layers>({ rivers: true, dams: true, rain: true, waterways: true, drains: true, terrain: false, hotspots: true });
  const [extra, setExtra] = useState(0);
  const { data: officialTides, refetch: refreshTides, isFetching } = useSuspenseQuery({ ...tideQueryOptions, initialData: initialData.tides });
  const { data: officialUpdates, refetch: refreshUpdates, isFetching: updatesFetching } = useSuspenseQuery({ ...updatesQueryOptions, initialData: initialData.updates });
  const [refreshing, setRefreshing] = useState(false);
  const refreshAll = async () => {
    setRefreshing(true);
    try { await Promise.all([refreshUpdates(), refreshTides()]); } finally { setRefreshing(false); }
  };
  const [simulationTime, setSimulationTime] = useState("");
  useEffect(() => {
    setSimulationTime(new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(new Date()).replace(" ", "T"));
  }, []);
  const tide = officialTideAt(officialTides.days, simulationTime);
  const selectedTideDay = officialTides.days.find((day) => day.date === simulationTime.slice(0, 10));
  const currentStations = stations.map((station) => applyRiverReading(station, officialUpdates.rivers.data));
  const currentDams = dams.map((dam) => applyDamReading(dam, officialUpdates.dams.data));
  const rows = currentStations.map((s) => { const lv = simulatedLevel(s, extra); return { s, lv, st: status(s, lv) }; });
  const drainRows = drains.map((d) => { const fill = combinedDrainFill(d, extra, tide); return { d, fill, st: drainStatus(fill) }; });
  const rainOnlyRisk = drains.filter((d) => simulatedDrainFill(d, extra) >= 100).length;
  const riskyDrains = drainRows.filter((row) => row.fill >= 100).length;
  const counts = rows.reduce<Record<string, number>>((a, r) => ((a[r.st.label] = (a[r.st.label] ?? 0) + 1), a), {});
  const totalCapacity = currentDams.reduce((total, dam) => total + dam.capacityMm3, 0);
  const totalStored = currentDams.reduce((total, dam) => total + (dam.observedStored ?? storageVolume(dam)), 0);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground lg:flex-row">
      <aside className="flex w-full flex-col gap-5 overflow-y-auto border-b border-border p-5 lg:w-96 lg:border-b-0 lg:border-r">
        <header>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Selangor · Pemantauan Banjir</p>
          <h1 className="mt-1 font-display text-3xl leading-tight">Simulasi Hujan &amp; Banjir</h1>
        </header>

        <OfficialSourcePanel forecasts={officialUpdates.weather.data} rainfall={officialUpdates.rainfall.data} refreshing={refreshing || updatesFetching || isFetching} onRefresh={() => void refreshAll()} sources={[
          { name: "MET Malaysia", count: `${officialUpdates.weather.data.length} hari ramalan`, ...officialUpdates.weather },
          { name: "LUAS · iWRiMS", count: `${currentDams.filter((dam) => dam.observedAt).length}/6 empangan`, ...officialUpdates.dams },
          { name: "Public Infobanjir", count: `${currentStations.filter((station) => station.observedAt).length}/8 stesen sepadan`, ...officialUpdates.rivers },
          { name: "JPS · saliran", count: `${drains.filter((drain) => officialUpdates.rivers.data.some((row) => row.id === drain.stationId)).length}/6 bacaan stesen`, ...officialUpdates.rivers },
          { name: "JPS · hujan", count: `${officialUpdates.rainfall.data.length} cerapan`, ...officialUpdates.rainfall },
          { name: "JPS · hotspot", count: `${officialUpdates.hotspots.data.length} disahkan`, ...officialUpdates.hotspots },
        ]} />

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Lapisan peta</h2>
          <div className="mb-3 rounded-lg border border-border bg-card p-2">
            <p className="text-xs font-medium text-muted-foreground">Warna peta</p>
            <div className="mt-2 grid grid-cols-2 gap-1" role="group" aria-label="Pilihan warna peta">
              {mapStyleOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={mapStyle === option.id}
                  onClick={() => setMapStyle(option.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors ${mapStyle === option.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-background hover:bg-muted"}`}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-border" style={{ backgroundColor: `var(${option.swatch})` }} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {([["hotspots", "Hotspot banjir (JPS 2026)"], ["rivers", "Paras air sungai (JPS / contoh)"], ["dams", "Aras empangan (LUAS)"], ["rain", "Taburan hujan (contoh simulasi)"], ["waterways", "Tali air utama (rujukan LUAS)"], ["drains", "Saliran berisiko penuh (simulasi)"], ["terrain", "Kawasan rendah & tinggi (topografi)"]] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={layers[k]} onChange={(e) => setLayers({ ...layers, [k]: e.target.checked })} className="accent-primary" />
              {l}
            </label>
          ))}
          {layers.terrain && (
            <p className="text-xs text-muted-foreground">Hijau = kawasan rendah (lebih berisiko banjir), coklat/garisan kontur rapat = kawasan tinggi.</p>
          )}
        </section>

        <section className="space-y-3 rounded-lg border border-border p-4" aria-labelledby="hotspots-heading">
          <div className="flex items-center justify-between gap-2">
            <h2 id="hotspots-heading" className="text-sm font-semibold">Hotspot banjir JPS</h2>
            <span className="rounded bg-danger px-2 py-0.5 text-xs text-danger-foreground">{officialUpdates.hotspots.data.length} disahkan</span>
          </div>
          <p className="text-xs text-muted-foreground">Pengumuman {hotspotAnnouncement.date} menyatakan {hotspotAnnouncement.total} hotspot. Hanya lokasi yang dinamakan secara awam dan mempunyai satu padanan koordinat JPS tepat dipaparkan; lokasi lain tidak diagak.</p>
          <ul className="space-y-2">
            {officialUpdates.hotspots.data.map((hotspot) => <li key={hotspot.id} className="flex items-start gap-2 text-xs">
              <HotspotIcon size={22} />
              <div><p className="font-medium">{hotspot.name}</p><p className="text-muted-foreground">{hotspot.district} · {hotspot.basin} · Banjir {hotspot.floodType.toLowerCase()}</p></div>
            </li>)}
          </ul>
          {officialUpdates.hotspots.data.length === 0 && <p className="text-xs text-danger">Koordinat hotspot tidak dapat disahkan buat masa ini.</p>}
          <p className="text-xs text-muted-foreground">{hotspotCoordinateRecord}. Penanda menunjukkan kawasan berisiko yang dikenal pasti, bukan kejadian banjir semasa.</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <a href={hotspotAnnouncement.url} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">Pengumuman hotspot 2026</a>
            <a href={hotspotLayerUrl} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">Koordinat JPS Selangor</a>
          </div>
        </section>

        <section className="space-y-2 rounded-lg bg-secondary p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Simulasi hujan tambahan</h2>
            <span className="font-mono text-lg">+{extra} mm</span>
          </div>
          <input type="range" min={0} max={150} step={5} value={extra} onChange={(e) => setExtra(+e.target.value)} className="w-full accent-primary" />
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            {["Normal", "Waspada", "Amaran", "Bahaya"].map((l) => (
              <span key={l} className="flex items-center gap-1.5 rounded bg-background px-2 py-1"><span className={`h-2 w-2 rounded-full ${toneCls[{ Normal: "normal", Waspada: "alert", Amaran: "warning", Bahaya: "danger" }[l] ?? "normal"]}`} />{l}: <b>{counts[l] ?? 0}</b></span>
            ))}
          </div>
        </section>

        <section className="space-y-3 border-y border-border py-4" aria-labelledby="tide-heading">
          <div className="flex items-center justify-between gap-2">
            <h2 id="tide-heading" className="flex items-center gap-2 text-sm font-semibold"><Waves className="h-4 w-4 text-primary" />Pasang surut laut</h2>
            <Button variant="ghost" size="icon" aria-label="Muat semula jadual PHN" title="Muat semula jadual PHN" disabled={isFetching} onClick={() => void refreshTides()}><RefreshCw className={isFetching ? "animate-spin motion-reduce:animate-none" : ""} /></Button>
          </div>
          <p className="text-xs font-medium">Pelabuhan Klang · Ramalan rasmi PHN</p>
          <div className="space-y-1.5">
            <label htmlFor="simulation-time" className="text-xs font-medium">Masa simulasi (MYT · UTC+8)</label>
            <Input id="simulation-time" type="datetime-local" value={simulationTime} onChange={(event) => setSimulationTime(event.target.value)} />
          </div>
          {tide ? <div role="status" className="border-l-2 border-primary pl-3">
            <p className="font-mono text-lg">{tide.heightM.toFixed(2)} m <span className="text-xs text-muted-foreground">Datum Carta (LAT)</span></p>
            <p className="text-xs">{tide.label} · sampel ramalan {tide.sampleTime} MYT</p>
          </div> : <p role="status" className="text-xs text-muted-foreground">{officialTides.error ?? "Tiada jadual rasmi bagi masa dipilih. Faktor laut tidak digunakan; isian hujan sahaja dipaparkan."}</p>}
          {officialTides.days.length > 0 && <p className="text-xs text-muted-foreground">Liputan jadual: {officialTides.days[0]?.date} hingga {officialTides.days.at(-1)?.date}. Sampel setiap 10 minit; bukan cerapan langsung.</p>}
          {selectedTideDay && <table className="w-full text-left text-xs">
            <caption className="mb-2 text-left font-medium">Waktu pasang dan surut · {selectedTideDay.date}</caption>
            <thead><tr className="border-b border-border text-muted-foreground"><th className="py-1 font-normal">Masa MYT</th><th className="font-normal">Keadaan</th><th className="text-right font-normal">Aras (m LAT)</th></tr></thead>
            <tbody>{selectedTideDay.events.map((event) => <tr key={event.time}><td className="py-1 font-mono">{event.time}</td><td>{event.high ? "Pasang" : "Surut"}</td><td className="text-right font-mono">{event.heightM.toFixed(2)}</td></tr>)}</tbody>
          </table>}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><p className="text-muted-foreground">Hujan sahaja</p><p className="mt-1 font-mono">{rainOnlyRisk} saliran berisiko</p></div>
            <div><p className="text-muted-foreground">{tide ? "Hujan + faktor laut" : "Faktor laut tidak tersedia"}</p><p className="mt-1 font-mono">{riskyDrains} saliran berisiko</p></div>
          </div>
          <p className="text-xs text-muted-foreground">Kesan saliran masih anggaran: +0 hingga +20 mata peratus untuk Rasau, Binjai dan Aur mengikut aras relatif dalam jadual harian. Kategori aras ialah perbandingan dalam aplikasi, bukan amaran PHN. Datum laut tidak dicampur dengan paras sungai; empangan tidak berubah.</p>
          <a href={officialTideSource} target="_blank" rel="noreferrer" className="inline-block text-xs text-primary underline underline-offset-2">Jadual rasmi Pusat Hidrografi Nasional (PHN)</a>
          <a href="http://water.selangor.gov.my/galeri-foto/lawatan-dato-menteri-besar-selangor-ke-pps-sk-sungai-binjai" target="_blank" rel="noreferrer" className="inline-block text-xs text-primary underline underline-offset-2">Rujukan JPS: hujan lebat dan air pasang besar</a>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Tali air utama (LUAS)</h2>
            <span className="text-xs text-muted-foreground">7 lembangan</span>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">Penanda pada peta ialah titik rujukan lembangan, bukan laluan sungai.</p>
          <ul className="space-y-2">
            {waterways.map((w) => (
              <li key={w.name} className="rounded-lg border border-border p-3 text-xs">
                <div className="flex items-start gap-2">
                  <WaterwayIcon size={26} />
                  <div>
                    <div className="text-sm font-medium">{w.name}</div>
                    <div className="mt-0.5 font-mono">{w.areaKm2.toLocaleString("ms-MY")} km² · {w.tributaries} anak sungai</div>
                  </div>
                </div>
                <p className="mt-2 text-muted-foreground"><strong className="text-foreground">Daerah:</strong> {w.districts}</p>
                <p className="mt-1 text-muted-foreground"><strong className="text-foreground">Empangan:</strong> {w.dams}</p>
              </li>
            ))}
          </ul>
          <a href="https://www.luas.gov.my/ms/maklumat-sumber-air/profil-lembangan-sungai" target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary underline underline-offset-2">Rujukan: Profil Lembangan Sungai LUAS</a>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Saliran berisiko penuh</h2>
            <span className={`rounded px-2 py-0.5 text-xs ${riskyDrains > 0 ? "bg-danger text-background" : "bg-secondary"}`}>{riskyDrains} berisiko limpah</span>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">Nama dan ID merujuk stesen JPS. Peratus isian ialah simulasi, bukan ukuran kapasiti sebenar atau pengisytiharan banjir.</p>
          <ul className="space-y-3">
            {drainRows.map(({ d, fill, st }) => {
              const badgeText = st.tone === "alert" || st.tone === "warning" ? "text-foreground" : "text-background";
              const reading = officialUpdates.rivers.data.find((row) => row.id === d.stationId);
              return (
                <li key={d.stationId} className="rounded-lg border border-border p-3 text-xs">
                  <div className="flex items-start gap-2">
                    <DrainIcon tone={st.tone} size={27} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{d.name}</div>
                      <div className="mt-0.5 text-muted-foreground">ID {d.stationId} · {d.district} · Lembangan {d.basin}</div>
                      {isTideScenarioDrain(d) && <p className="mt-1 flex items-center gap-1 text-primary"><Waves className="h-3 w-3 shrink-0" />{tide ? `Faktor laut contoh · +${tide.surcharge} mata peratus` : "Faktor laut tidak tersedia"}</p>}
                    </div>
                    <div className="text-right">
                      <div className="font-mono">{fill.toFixed(0)}%</div>
                      <span className={`inline-block rounded px-1.5 ${badgeText} ${toneCls[st.tone]}`}>{st.label}</span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded bg-secondary"><div className={`h-full rounded ${toneCls[st.tone]}`} style={{ width: `${Math.min(fill, 100)}%` }} /></div>
                  <p className="mt-2 text-muted-foreground">{reading ? `Cerapan JPS: ${reading.level.toFixed(2)} m · ${reading.updatedAt} MYT` : "Cerapan JPS tidak tersedia"}</p>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Ambang simulasi: 70% Pantau · 85% Hampir penuh · 100% Berisiko limpah.</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <a href="https://publicinfobanjir.water.gov.my/" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">Stesen JPS</a>
            <a href="https://storm.water.gov.my/about-pisma" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">Penilaian kapasiti saliran JPS</a>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Empangan &amp; takungan (LUAS)</h2>
            <span className="text-xs text-muted-foreground">6 empangan</span>
          </div>
          <div className="mb-3 space-y-2 rounded-lg border border-border bg-card p-3 text-xs">
            <div className="flex items-start gap-2">
              <DamIcon tone="normal" size={28} />
              <div>
              <p className="font-semibold">Jumlah takungan {currentDams.every((dam) => dam.observedAt) ? "LUAS" : "(termasuk contoh)"}</p>
                <p className="font-mono text-base">{totalStored.toFixed(1)} / {totalCapacity.toFixed(1)} juta m³</p>
                <p className="text-muted-foreground">{((totalStored / totalCapacity) * 100).toFixed(1)}% daripada jumlah kapasiti</p>
              </div>
            </div>
            <p className="border-t border-border pt-2 text-muted-foreground">
              <strong className="text-foreground">Takungan</strong> ialah isi air yang disimpan. Anggaran isi semasa = kapasiti maksimum × peratus takungan.
            </p>
            <p className="text-muted-foreground">Bacaan iWRiMS menggunakan isi takungan terukur; yang tidak tersedia dilabel contoh. Kapasiti maksimum merujuk Profil Empangan LUAS.</p>
          </div>
          <ul className="space-y-3 text-sm">
            {currentDams.map((d) => {
              const st = damStatus(d.percent);
              const stored = d.observedStored ?? storageVolume(d);
              const badgeText = st.tone === "alert" || st.tone === "warning" ? "text-foreground" : "text-background";
              return (
                <li key={d.name} className="rounded-lg border border-border p-3">
                  <div className="flex items-start gap-2">
                    <DamIcon tone={st.tone} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.river} · {d.district}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">{d.percent}%</div>
                      <span className={`inline-block rounded px-1.5 text-xs ${badgeText} ${toneCls[st.tone]}`}>{st.label}</span>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-secondary p-2">
                      <div className="text-muted-foreground">{d.observedStored == null ? "Anggaran isi contoh" : "Isi takungan LUAS"}</div>
                      <div className="mt-0.5 font-mono font-semibold">{stored.toFixed(1)} juta m³</div>
                    </div>
                    <div className="rounded bg-secondary p-2">
                      <div className="text-muted-foreground">Kapasiti maksimum</div>
                      <div className="mt-0.5 font-mono font-semibold">{d.capacityMm3} juta m³</div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded bg-secondary"><div className={`h-full rounded ${toneCls[st.tone]}`} style={{ width: `${Math.min(d.percent, 100)}%` }} /></div>
                  <p className="mt-2 text-xs text-muted-foreground">Siap {d.yearCompleted} · Paras air tertinggi {d.maxLevelM} m</p>
                  <p className="mt-1 text-xs text-muted-foreground">{d.observedAt ? `LUAS: ${d.observedLevel?.toFixed(2)} m MSL · ${d.observedAt} MYT` : "Data contoh · bacaan LUAS tidak tersedia"}</p>
                </li>
              );
            })}
          </ul>
          <a href="https://www.luas.gov.my/ms/maklumat-sumber-air/profil-empangan" target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-primary underline underline-offset-2">Rujukan: Profil Empangan LUAS</a>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">Stesen paras air</h2>
          <ul className="divide-y divide-border text-sm">
            {rows.map(({ s, lv, st }) => (
              <li key={s.name} className="flex items-center justify-between gap-2 py-2">
                <div><div>{s.name}</div><div className="text-xs text-muted-foreground">{s.district}</div><p className="mt-1 text-xs text-muted-foreground">{s.observedAt ? `JPS: ${s.observedAt} MYT${extra ? " · + simulasi hujan" : ""}` : "Data contoh · tiada padanan stesen rasmi"}</p></div>
                <div className="text-right">
                  <div className="font-mono">{lv.toFixed(2)} m</div>
                  <span className={`inline-block rounded px-1.5 text-xs text-background ${toneCls[st.tone]}`}>{st.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <p className="text-xs text-muted-foreground">Peta dan navigasi dihadkan kepada seluruh Semenanjung Malaysia, dengan lapisan banjir Selangor dikekalkan. Zum masuk ke Selangor untuk melihat nama empangan dan bacaan paras sungai.</p>
        <p className="text-xs text-muted-foreground">Nota: cerapan sungai JPS dan takungan LUAS dilabel dengan masa sumber. Hujan dalam mm, isian saliran dan stesen tanpa padanan masih data contoh. Ramalan MET dipaparkan berasingan. Tambahan hujan dan kesan laut ialah simulasi, bukan ramalan banjir rasmi.</p>
      </aside>
      <main className="relative min-h-[60vh] flex-1">
        <ClientOnly fallback={<div className="p-6 text-muted-foreground">Memuatkan peta…</div>}>
          <Suspense fallback={<div className="p-6 text-muted-foreground">Memuatkan peta…</div>}>
            <FloodMap layers={layers} extra={extra} mapStyle={mapStyle} tide={tide} simulationTime={simulationTime} currentStations={currentStations} currentDams={currentDams} drainReadings={officialUpdates.rivers.data} hotspots={officialUpdates.hotspots.data} />
          </Suspense>
        </ClientOnly>
      </main>
    </div>
  );
}

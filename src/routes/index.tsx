import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { stations, dams, damStatus, simulatedLevel, status, storageVolume } from "@/lib/flood-data";
import { damIconSvg } from "@/lib/dam-icon";
import type { Tone } from "@/lib/station-icon";
import type { Layers, MapStyle } from "@/components/FloodMap";

const FloodMap = lazy(() => import("@/components/FloodMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Simulasi Hujan & Banjir Selangor" },
      { name: "description", content: "Peta berlapis Selangor: paras air sungai, aras empangan dan taburan hujan dengan simulasi banjir." },
      { property: "og:title", content: "Simulasi Hujan & Banjir Selangor" },
      { property: "og:description", content: "Paras sungai, aras empangan dan hujan di Selangor dalam satu peta." },
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
  { id: "forest", label: "Hijau hutan", swatch: "--outside-forest" },
];

function DamIcon({ tone, size = 24 }: { tone: Tone; size?: number }) {
  return <span className="shrink-0" dangerouslySetInnerHTML={{ __html: damIconSvg({ tone, size }) }} />;
}

function Index() {
  const [mapStyle, setMapStyle] = useState<MapStyle>("light");
  const [layers, setLayers] = useState<Layers>({ rivers: true, dams: true, rain: true, terrain: false });
  const [extra, setExtra] = useState(0);
  const rows = stations.map((s) => { const lv = simulatedLevel(s, extra); return { s, lv, st: status(s, lv) }; });
  const counts = rows.reduce<Record<string, number>>((a, r) => ((a[r.st.label] = (a[r.st.label] ?? 0) + 1), a), {});
  const totalCapacity = dams.reduce((total, dam) => total + dam.capacityMm3, 0);
  const totalStored = dams.reduce((total, dam) => total + storageVolume(dam), 0);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground lg:flex-row">
      <aside className="flex w-full flex-col gap-5 overflow-y-auto border-b border-border p-5 lg:w-96 lg:border-b-0 lg:border-r">
        <header>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Selangor · Pemantauan Banjir</p>
          <h1 className="mt-1 font-display text-3xl leading-tight">Simulasi Hujan &amp; Banjir</h1>
        </header>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Lapisan peta</h2>
          <div className="mb-3 rounded-lg border border-border bg-card p-2">
            <p className="text-xs font-medium text-muted-foreground">Warna peta</p>
            <div className="mt-2 grid grid-cols-3 gap-1" role="group" aria-label="Pilihan warna peta">
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
          {([["rivers", "Paras air sungai (publicinfobanjir)"], ["dams", "Aras empangan (LUAS)"], ["rain", "Taburan hujan (MET Malaysia)"], ["terrain", "Kawasan rendah & tinggi (topografi)"]] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={layers[k]} onChange={(e) => setLayers({ ...layers, [k]: e.target.checked })} className="accent-primary" />
              {l}
            </label>
          ))}
          {layers.terrain && (
            <p className="text-xs text-muted-foreground">Hijau = kawasan rendah (lebih berisiko banjir), coklat/garisan kontur rapat = kawasan tinggi.</p>
          )}
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

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Empangan &amp; takungan (LUAS)</h2>
            <span className="text-xs text-muted-foreground">6 empangan</span>
          </div>
          <div className="mb-3 space-y-2 rounded-lg border border-border bg-card p-3 text-xs">
            <div className="flex items-start gap-2">
              <DamIcon tone="normal" size={28} />
              <div>
                <p className="font-semibold">Jumlah takungan contoh</p>
                <p className="font-mono text-base">{totalStored.toFixed(1)} / {totalCapacity.toFixed(1)} juta m³</p>
                <p className="text-muted-foreground">{((totalStored / totalCapacity) * 100).toFixed(1)}% daripada jumlah kapasiti</p>
              </div>
            </div>
            <p className="border-t border-border pt-2 text-muted-foreground">
              <strong className="text-foreground">Takungan</strong> ialah isi air yang disimpan. Anggaran isi semasa = kapasiti maksimum × peratus takungan.
            </p>
            <p className="text-muted-foreground">Kapasiti maksimum merujuk Profil Empangan LUAS; peratus dan isi semasa di bawah ialah data contoh.</p>
          </div>
          <ul className="space-y-3 text-sm">
            {dams.map((d) => {
              const st = damStatus(d.percent);
              const stored = storageVolume(d);
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
                      <div className="text-muted-foreground">Anggaran isi semasa</div>
                      <div className="mt-0.5 font-mono font-semibold">{stored.toFixed(1)} juta m³</div>
                    </div>
                    <div className="rounded bg-secondary p-2">
                      <div className="text-muted-foreground">Kapasiti maksimum</div>
                      <div className="mt-0.5 font-mono font-semibold">{d.capacityMm3} juta m³</div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded bg-secondary"><div className={`h-full rounded ${toneCls[st.tone]}`} style={{ width: `${Math.min(d.percent, 100)}%` }} /></div>
                  <p className="mt-2 text-xs text-muted-foreground">Siap {d.yearCompleted} · Paras air tertinggi {d.maxLevelM} m</p>
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
                <div><div>{s.name}</div><div className="text-xs text-muted-foreground">{s.district}</div></div>
                <div className="text-right">
                  <div className="font-mono">{lv.toFixed(2)} m</div>
                  <span className={`inline-block rounded px-1.5 text-xs text-background ${toneCls[st.tone]}`}>{st.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <p className="text-xs text-muted-foreground">Peta dan navigasi dihadkan kepada seluruh Semenanjung Malaysia, dengan lapisan banjir Selangor dikekalkan. Zum masuk ke Selangor untuk melihat nama empangan dan bacaan paras sungai.</p>
        <p className="text-xs text-muted-foreground">Nota: peratus takungan, paras sungai dan hujan ialah data contoh. Kapasiti maksimum serta profil empangan merujuk LUAS. Sumber lain: publicinfobanjir.water.gov.my, met.gov.my.</p>
      </aside>
      <main className="relative min-h-[60vh] flex-1">
        <ClientOnly fallback={<div className="p-6 text-muted-foreground">Memuatkan peta…</div>}>
          <Suspense fallback={<div className="p-6 text-muted-foreground">Memuatkan peta…</div>}>
            <FloodMap layers={layers} extra={extra} mapStyle={mapStyle} />
          </Suspense>
        </ClientOnly>
      </main>
    </div>
  );
}

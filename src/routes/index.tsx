import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { stations, dams, damStatus, simulatedLevel, status } from "@/lib/flood-data";
import type { Layers } from "@/components/FloodMap";

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

function Index() {
  const [layers, setLayers] = useState<Layers>({ rivers: true, dams: true, rain: true, terrain: false });
  const [extra, setExtra] = useState(0);
  const rows = stations.map((s) => { const lv = simulatedLevel(s, extra); return { s, lv, st: status(s, lv) }; });
  const counts = rows.reduce<Record<string, number>>((a, r) => ((a[r.st.label] = (a[r.st.label] ?? 0) + 1), a), {});

  return (
    <div className="flex h-screen flex-col bg-background text-foreground lg:flex-row">
      <aside className="flex w-full flex-col gap-5 overflow-y-auto border-b border-border p-5 lg:w-96 lg:border-b-0 lg:border-r">
        <header>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Selangor · Pemantauan Banjir</p>
          <h1 className="mt-1 font-display text-3xl leading-tight">Simulasi Hujan &amp; Banjir</h1>
        </header>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Lapisan peta</h2>
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
          <h2 className="mb-2 text-sm font-semibold">Paras empangan (LUAS)</h2>
          <ul className="space-y-3 text-sm">
            {dams.map((d) => {
              const st = damStatus(d.percent);
              return (
                <li key={d.name}>
                  <div className="flex justify-between gap-2">
                    <div><div>{d.name}</div><div className="text-xs text-muted-foreground">{d.river} · {d.district}</div></div>
                    <div className="text-right">
                      <div className="font-mono">{d.percent}%</div>
                      <span className={`inline-block rounded px-1.5 text-xs text-background ${toneCls[st.tone]}`}>{st.label}</span>
                    </div>
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-secondary"><div className="h-full rounded bg-primary" style={{ width: `${d.percent}%` }} /></div>
                </li>
              );
            })}
          </ul>
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
        <p className="text-xs text-muted-foreground">Peta dihadkan kepada negeri Selangor — kawasan di luar sempadan negeri ditutup, dan gelung serta seret tidak boleh keluar daripadanya.</p>
        <p className="text-xs text-muted-foreground">Nota: angka ialah data contoh dan jalur sungai ialah lakaran ringkas. Sumber rasmi: publicinfobanjir.water.gov.my, luas.gov.my, met.gov.my.</p>
      </aside>
      <main className="relative min-h-[60vh] flex-1">
        <ClientOnly fallback={<div className="p-6 text-muted-foreground">Memuatkan peta…</div>}>
          <Suspense fallback={<div className="p-6 text-muted-foreground">Memuatkan peta…</div>}>
            <FloodMap layers={layers} extra={extra} />
          </Suspense>
        </ClientOnly>
      </main>
    </div>
  );
}

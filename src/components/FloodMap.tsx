import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { stations, dams, rain, simulatedLevel, status } from "@/lib/flood-data";
import { selangorParts, pointInSelangor } from "@/lib/selangor-boundary";
import { peninsulaRings } from "@/lib/peninsula-boundary";

export type Layers = { rivers: boolean; dams: boolean; rain: boolean; terrain: boolean };
const toneVar: Record<string, string> = { normal: "--normal", alert: "--alert", warning: "--warn", danger: "--danger" };
const damLabelDirections = ["right", "right", "left", "left", "left", "left"] as const;
const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

// Paparan dan navigasi merangkumi seluruh Semenanjung Malaysia; data pemantauan kekal di Selangor.
const peninsulaBounds: [[number, number], [number, number]] = [[1.26618, 99.64049], [6.72609, 104.54098]];
const world: L.LatLngExpression[] = [[-90, -540], [-90, 540], [90, 540], [90, -540]];
const maskRings: L.LatLngExpression[][] = [world, ...peninsulaRings];

export default function FloodMap({ layers, extra }: { layers: Layers; extra: number }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const terrain = useRef<L.TileLayer | null>(null);
  const groups = useRef<Record<"rain" | "dams" | "rivers", L.LayerGroup> | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    const bounds = L.latLngBounds(peninsulaBounds);
    const m = L.map(el.current, { minZoom: 5, maxBounds: bounds.pad(0.08), maxBoundsViscosity: 1 });
    m.createPane("mask");
    m.getPane("mask")!.style.zIndex = "450";
    m.createPane("outline");
    m.getPane("outline")!.style.zIndex = "460";

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(m);
    terrain.current = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", { maxZoom: 17, opacity: 0.65, attribution: "© OpenTopoMap (CC-BY-SA)" });

    // Kawasan luar Semenanjung ditimbus; garisan Selangor dikekalkan sebagai rujukan.
    L.polygon(maskRings, { pane: "mask", stroke: false, fillColor: css("--outside"), fillOpacity: 1, interactive: false }).addTo(m);
    selangorParts.forEach((part) =>
      L.polygon(part, { pane: "outline", fill: false, color: css("--primary"), weight: 2, opacity: 0.9, interactive: false }).addTo(m),
    );
    m.attributionControl.addAttribution("Sempadan: geoBoundaries (ODbL)");

    groups.current = { rain: L.layerGroup().addTo(m), dams: L.layerGroup().addTo(m), rivers: L.layerGroup().addTo(m) };
    m.fitBounds(bounds);
    const updateDetailedLabels = () => el.current?.classList.toggle("hide-detailed-labels", m.getZoom() < 11);
    m.on("zoomend", updateDetailedLabels);
    updateDetailedLabels();
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const g = groups.current; const m = map.current; if (!m || !g) return;
    Object.values(g).forEach((x) => x.clearLayers());
    rain.forEach((r) => {
      const mm = r.mm + extra;
      L.circle([r.lat, r.lng], { radius: 3000 + mm * 250, color: css("--rain"), fillColor: css("--rain"), fillOpacity: Math.min(0.15 + mm / 150, 0.6), weight: 1 })
        .bindPopup(`<b>${r.name}</b><br/>Hujan: ${mm} mm`).addTo(g.rain);
    });
    dams.forEach((d, i) => {
      const direction = damLabelDirections[i] ?? "top";
      const offset: [number, number] = direction === "right" ? [12, 0] : direction === "left" ? [-12, 0] : [0, -10];
      L.marker([d.lat, d.lng], { icon: L.divIcon({ className: "", html: `<div class="dam-pin">${d.percent}%</div>` }) })
        .bindTooltip(d.name, { permanent: true, direction, offset, className: "dam-name-label" })
        .bindPopup(`<b>${d.name}</b><br/>${d.river}, ${d.district}<br/>Aras: ${d.percent}%`).addTo(g.dams);
    });
    stations.forEach((s) => {
      const lv = simulatedLevel(s, extra); const st = status(s, lv);
      const luar = !pointInSelangor(s.lat, s.lng);
      L.circleMarker([s.lat, s.lng], { pane: "markerPane", radius: 9, color: css("--foreground"), weight: luar ? 2 : 1.5, dashArray: luar ? "3,3" : undefined, fillColor: css(toneVar[st.tone] ?? "--normal"), fillOpacity: luar ? 0.25 : 1 })
        .bindTooltip(`${lv.toFixed(2)} m`, { permanent: true, direction: "bottom", offset: [0, 10], className: `river-level-label level-${st.tone}` })
        .bindPopup(`<b>${s.name}</b><br/>${s.district}<br/>Paras: ${lv.toFixed(2)} m — <b>${st.label}</b><br/>Waspada ${s.alert} / Amaran ${s.warning} / Bahaya ${s.danger}${luar ? "<br/><i>Stesen di luar negeri Selangor</i>" : ""}`).addTo(g.rivers);
    });
    if (terrain.current) { if (layers.terrain) terrain.current.addTo(m).bringToFront(); else terrain.current.remove(); }
    (["rivers", "dams", "rain"] as const).forEach((k) => layers[k] ? g[k].addTo(m) : g[k].remove());
  }, [layers, extra]);

  return (
    <div className="relative h-full w-full">
      <div ref={el} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg border border-border bg-background/95 px-3 py-2 text-xs shadow-sm">
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Petunjuk</p>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2"><span className="h-0.5 w-5 shrink-0 rounded bg-primary" />Sempadan negeri Selangor</li>
          <li className="flex items-center gap-2"><span className="h-3 w-5 shrink-0 rounded bg-outside" />Luar Semenanjung Malaysia</li>
          {layers.rivers && (
            <>
              <li className="flex items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full border border-foreground bg-normal" />Stesen dalam sempadan</li>
              <li className="flex items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full border-2 border-dashed border-foreground bg-normal/25" />Stesen di luar sempadan</li>
            </>
          )}
        </ul>
        {layers.rivers && (
          <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-border pt-2">
            {([["Normal", "bg-normal"], ["Waspada", "bg-alert"], ["Amaran", "bg-warn"], ["Bahaya", "bg-danger"]] as const).map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { stations, dams, rain, simulatedLevel, status } from "@/lib/flood-data";
import { selangorParts, selangorBounds, pointInSelangor } from "@/lib/selangor-boundary";

export type Layers = { rivers: boolean; dams: boolean; rain: boolean; terrain: boolean };
const toneVar: Record<string, string> = { normal: "--ok", alert: "--alert", warning: "--warn", danger: "--danger" };
const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

// Cincin yang menutupi seluruh dunia, kemudian dilubangi dengan sempadan Selangor
// (fill-rule even-odd) supaya hanya negeri Selangor yang kelihatan pada peta.
const world: L.LatLngExpression[] = [[-90, -540], [-90, 540], [90, 540], [90, -540]];
const holes: L.LatLngExpression[][] = selangorParts.flat();
const maskRings: L.LatLngExpression[][] = [world, ...holes];

export default function FloodMap({ layers, extra }: { layers: Layers; extra: number }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const terrain = useRef<L.TileLayer | null>(null);
  const groups = useRef<Record<"rain" | "dams" | "rivers", L.LayerGroup> | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    const bounds = L.latLngBounds(selangorBounds);
    const m = L.map(el.current, { maxBounds: bounds.pad(0.06), maxBoundsViscosity: 1 });
    m.createPane("mask");
    m.getPane("mask")!.style.zIndex = "450";
    m.createPane("outline");
    m.getPane("outline")!.style.zIndex = "460";

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(m);
    terrain.current = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", { maxZoom: 17, opacity: 0.65, attribution: "© OpenTopoMap (CC-BY-SA)" });

    // Segalanya di luar Selangor ditimbus; garisan sempadan dilukis di atasnya.
    L.polygon(maskRings, { pane: "mask", stroke: false, fillColor: css("--outside"), fillOpacity: 1, interactive: false }).addTo(m);
    selangorParts.forEach((part) =>
      L.polygon(part, { pane: "outline", fill: false, color: css("--primary"), weight: 2, opacity: 0.9, interactive: false }).addTo(m),
    );
    m.attributionControl.addAttribution("Sempadan: geoBoundaries (ODbL)");

    groups.current = { rain: L.layerGroup().addTo(m), dams: L.layerGroup().addTo(m), rivers: L.layerGroup().addTo(m) };
    m.fitBounds(bounds, { padding: [18, 18] });
    m.setMinZoom(Math.max(8, m.getZoom() - 1));
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
    dams.forEach((d) => {
      L.marker([d.lat, d.lng], { icon: L.divIcon({ className: "", html: `<div class="dam-pin">${d.percent}%</div>` }) })
        .bindPopup(`<b>${d.name}</b><br/>${d.river}, ${d.district}<br/>Aras: ${d.percent}%`).addTo(g.dams);
    });
    stations.forEach((s) => {
      const lv = simulatedLevel(s, extra); const st = status(s, lv);
      const luar = !pointInSelangor(s.lat, s.lng);
      L.circleMarker([s.lat, s.lng], { pane: "markerPane", radius: 9, color: css("--foreground"), weight: 1.5, fillColor: css(toneVar[st.tone] ?? "--ok"), fillOpacity: 1 })
        .bindPopup(`<b>${s.name}</b><br/>${s.district}<br/>Paras: ${lv.toFixed(2)} m — <b>${st.label}</b><br/>Waspada ${s.alert} / Amaran ${s.warning} / Bahaya ${s.danger}${luar ? "<br/><i>Stesen di luar negeri Selangor</i>" : ""}`).addTo(g.rivers);
    });
    if (terrain.current) { if (layers.terrain) terrain.current.addTo(m).bringToFront(); else terrain.current.remove(); }
    (["rivers", "dams", "rain"] as const).forEach((k) => layers[k] ? g[k].addTo(m) : g[k].remove());
  }, [layers, extra]);

  return <div ref={el} className="h-full w-full" />;
}

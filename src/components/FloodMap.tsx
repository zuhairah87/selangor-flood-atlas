import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { stations, dams, rain, waterways, drains, simulatedLevel, status, damStatus, storageVolume, simulatedDrainFill, drainStatus } from "@/lib/flood-data";
import { stationIconSvg, type Tone } from "@/lib/station-icon";
import { damIconSvg } from "@/lib/dam-icon";
import { waterwayIconSvg, drainIconSvg } from "@/lib/waterway-icon";
import { selangorBounds, selangorOutlineParts, pointInSelangor } from "@/lib/selangor-boundary";
import { peninsulaRings } from "@/lib/peninsula-boundary";

export type Layers = { rivers: boolean; dams: boolean; rain: boolean; waterways: boolean; drains: boolean; terrain: boolean };
export type MapStyle = "light" | "night";
const stationSize = 22;
const damLabelDirections = ["right", "right", "left", "left", "left", "left"] as const;
const outsideTokens: Record<MapStyle, string> = { light: "--outside", night: "--outside-night" };
const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

// Petunjuk memakai ikon yang sama dengan penanda di peta.
function StationIcon({ tone, luar = false, size = 17 }: { tone: Tone; luar?: boolean; size?: number }) {
  return <span className="shrink-0" dangerouslySetInnerHTML={{ __html: stationIconSvg({ tone, luar, size }) }} />;
}

function DamIcon({ tone, size = 20 }: { tone: Tone; size?: number }) {
  return <span className="shrink-0" dangerouslySetInnerHTML={{ __html: damIconSvg({ tone, size }) }} />;
}

function WaterwayIcon({ size = 17 }: { size?: number }) {
  return <span className="shrink-0" dangerouslySetInnerHTML={{ __html: waterwayIconSvg(size) }} />;
}

function DrainIcon({ tone, size = 17 }: { tone: Tone; size?: number }) {
  return <span className="shrink-0" dangerouslySetInnerHTML={{ __html: drainIconSvg({ tone, size }) }} />;
}

// Paparan dan navigasi merangkumi seluruh Semenanjung Malaysia; data pemantauan kekal di Selangor.
const peninsulaBounds: [[number, number], [number, number]] = [[1.26618, 99.64049], [6.72609, 104.54098]];
const world: L.LatLngExpression[] = [[-90, -540], [-90, 540], [90, 540], [90, -540]];
const maskRings: L.LatLngExpression[][] = [world, ...peninsulaRings];

export default function FloodMap({ layers, extra, mapStyle }: { layers: Layers; extra: number; mapStyle: MapStyle }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const terrain = useRef<L.TileLayer | null>(null);
  const mask = useRef<L.Polygon | null>(null);
  const boundaryLines = useRef<L.Polygon[]>([]);
  const groups = useRef<Record<"rain" | "dams" | "rivers" | "waterways" | "drains", L.LayerGroup> | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    const bounds = L.latLngBounds(peninsulaBounds);
    const m = L.map(el.current, { minZoom: 5, maxBounds: bounds.pad(0.08), maxBoundsViscosity: 1 });
    m.createPane("mask");
    m.getPane("mask")!.style.zIndex = "450";
    m.createPane("outline");
    m.getPane("outline")!.style.zIndex = "460";

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { className: "base-tiles", attribution: "© OpenStreetMap contributors" }).addTo(m);
    terrain.current = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", { className: "terrain-tiles", maxZoom: 17, opacity: 0.65, attribution: "© OpenTopoMap (CC-BY-SA)" });

    // Kawasan luar Semenanjung ditimbus; garisan Selangor dikekalkan sebagai rujukan.
    mask.current = L.polygon(maskRings, { pane: "mask", stroke: false, fillColor: css("--outside"), fillOpacity: 1, interactive: false }).addTo(m);
    boundaryLines.current = selangorOutlineParts.map((part) =>
      L.polygon(part, { pane: "outline", fill: false, color: css("--boundary"), weight: 2, opacity: 0.9, interactive: false }).addTo(m),
    );
    m.attributionControl.addAttribution("Sempadan: geoBoundaries (ODbL)");

    groups.current = { rain: L.layerGroup().addTo(m), dams: L.layerGroup().addTo(m), rivers: L.layerGroup().addTo(m), waterways: L.layerGroup().addTo(m), drains: L.layerGroup().addTo(m) };
    m.fitBounds(selangorBounds, { padding: [24, 24] });
    const updateDetailedLabels = () => el.current?.classList.toggle("hide-detailed-labels", m.getZoom() < 11);
    m.on("zoomend", updateDetailedLabels);
    updateDetailedLabels();
    map.current = m;
    return () => { m.remove(); map.current = null; mask.current = null; boundaryLines.current = []; };
  }, []);

  useEffect(() => {
    mask.current?.setStyle({ fillColor: css(outsideTokens[mapStyle]) });
    const boundaryColor = css(mapStyle === "night" ? "--boundary-night" : "--boundary");
    boundaryLines.current.forEach((line) => line.setStyle({ color: boundaryColor }));
  }, [mapStyle]);

  useEffect(() => {
    const g = groups.current; const m = map.current; if (!m || !g) return;
    Object.values(g).forEach((x) => x.clearLayers());
    rain.forEach((r) => {
      const mm = r.mm + extra;
      L.circle([r.lat, r.lng], { radius: 3000 + mm * 250, color: css("--rain"), fillColor: css("--rain"), fillOpacity: Math.min(0.15 + mm / 150, 0.6), weight: 1 })
        .bindPopup(`<b>${r.name}</b><br/>Hujan: ${mm} mm`).addTo(g.rain);
    });
    waterways.forEach((w) => {
      L.marker([w.lat, w.lng], {
        icon: L.divIcon({ className: "waterway-marker", html: waterwayIconSvg(24), iconSize: [24, 24], iconAnchor: [12, 12] }),
      })
        .bindTooltip(w.name, { permanent: true, direction: "top", offset: [0, -12], className: "waterway-name-label" })
        .bindPopup(`<b>${w.name}</b><br/>Keluasan: <b>${w.areaKm2.toLocaleString("ms-MY")} km²</b><br/>Daerah: ${w.districts}<br/>Empangan: ${w.dams}<br/>Anak sungai: <b>${w.tributaries}</b><br/><i>Penanda ialah titik rujukan lembangan, bukan laluan sungai.</i>`).addTo(g.waterways);
    });
    drains.forEach((d) => {
      const fill = simulatedDrainFill(d, extra); const st = drainStatus(fill);
      const html = `<div class="drain-marker">${drainIconSvg({ tone: st.tone, size: 25 })}<span class="drain-fill">${fill.toFixed(0)}%</span></div>`;
      L.marker([d.lat, d.lng], { icon: L.divIcon({ className: "drain-marker-icon", html, iconSize: [80, 28], iconAnchor: [12, 14], popupAnchor: [0, -14] }) })
        .bindTooltip(d.name, { direction: "top", offset: [0, -12] })
        .bindPopup(`<b>${d.name}</b><br/>ID stesen JPS: ${d.stationId}<br/>${d.district} · Lembangan ${d.basin}<br/>Isian simulasi: <b>${fill.toFixed(0)}%</b><br/>Status: <b>${st.label}</b><br/><i>Peratus ini bukan ukuran kapasiti sebenar atau pengisytiharan banjir.</i>`).addTo(g.drains);
    });
    dams.forEach((d, i) => {
      const direction = damLabelDirections[i] ?? "top";
      const offset: [number, number] = direction === "right" ? [12, 0] : direction === "left" ? [-12, 0] : [0, -10];
      const st = damStatus(d.percent);
      const stored = storageVolume(d).toFixed(1);
      const html = `<div class="dam-marker">${damIconSvg({ tone: st.tone, size: 26 })}<span class="dam-pin">${d.percent}%</span></div>`;
      L.marker([d.lat, d.lng], { icon: L.divIcon({ className: "", html }) })
        .bindTooltip(d.name, { permanent: true, direction, offset, className: "dam-name-label" })
        .bindPopup(`<b>${d.name}</b><br/>${d.river}, ${d.district}<br/>Siap: ${d.yearCompleted} · Paras tertinggi: ${d.maxLevelM} m<br/>Takungan: <b>${stored} / ${d.capacityMm3} juta m³ (${d.percent}%)</b><br/>Status: <b>${st.label}</b><br/><i>Isi takungan ialah anggaran daripada peratus contoh.</i>`).addTo(g.dams);
    });
    stations.forEach((s) => {
      const lv = simulatedLevel(s, extra); const st = status(s, lv);
      const luar = !pointInSelangor(s.lat, s.lng);
      L.marker([s.lat, s.lng], {
        pane: "markerPane",
        icon: L.divIcon({
          className: "station-marker",
          html: stationIconSvg({ tone: st.tone, luar, size: stationSize }),
          iconSize: [stationSize, stationSize],
          iconAnchor: [stationSize / 2, stationSize],
          popupAnchor: [0, -stationSize],
        }),
      })
        .bindTooltip(`${lv.toFixed(2)} m`, { permanent: true, direction: "bottom", offset: [0, 6], className: `river-level-label level-${st.tone}` })
        .bindPopup(`<b>${s.name}</b><br/>${s.district}<br/>Paras: ${lv.toFixed(2)} m — <b>${st.label}</b><br/>Waspada ${s.alert} / Amaran ${s.warning} / Bahaya ${s.danger}${luar ? "<br/><i>Stesen di luar negeri Selangor</i>" : ""}`).addTo(g.rivers);
    });
    if (terrain.current) { if (layers.terrain) terrain.current.addTo(m).bringToFront(); else terrain.current.remove(); }
    (["rivers", "dams", "rain", "waterways", "drains"] as const).forEach((k) => layers[k] ? g[k].addTo(m) : g[k].remove());
  }, [layers, extra]);

  return (
    <div className="relative h-full w-full">
      <div ref={el} className="flood-map h-full w-full" data-map-style={mapStyle} />
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg border border-border bg-background/95 px-3 py-2 text-xs shadow-sm">
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Petunjuk</p>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2"><span className="boundary-legend h-0.5 w-5 shrink-0 rounded" style={{ backgroundColor: `var(${mapStyle === "night" ? "--boundary-night" : "--boundary"})` }} />Sempadan negeri Selangor</li>
          <li className="flex items-center gap-2"><span className="h-3 w-5 shrink-0 rounded" style={{ backgroundColor: `var(${outsideTokens[mapStyle]})` }} />Luar Semenanjung Malaysia</li>
          {layers.waterways && <li className="flex items-center gap-2"><WaterwayIcon />Tali air utama</li>}
          {layers.drains && <li className="flex items-center gap-2"><DrainIcon tone="normal" />Saliran (isian simulasi)</li>}
          {layers.dams && <li className="flex items-center gap-2"><DamIcon tone="normal" />Empangan &amp; takungan</li>}
          {layers.rivers && (
            <>
              <li className="flex items-center gap-2"><StationIcon tone="normal" />Stesen dalam sempadan</li>
              <li className="flex items-center gap-2"><StationIcon tone="normal" luar />Stesen di luar sempadan</li>
            </>
          )}
        </ul>
        {layers.dams && (
          <div className="mt-2 border-t border-border pt-2">
            <p className="mb-1.5 text-[10px] text-muted-foreground">Status takungan empangan</p>
            <div className="grid grid-cols-2 gap-1.5">
              {([["Normal", "normal"], ["Rendah", "alert"], ["Tinggi", "warning"], ["Hampir limpah", "danger"]] as const).map(([label, tone]) => (
                <span key={label} className="flex items-center gap-1.5"><DamIcon tone={tone} size={15} />{label}</span>
              ))}
            </div>
          </div>
        )}
        {layers.drains && (
          <div className="mt-2 border-t border-border pt-2">
            <p className="mb-1.5 text-[10px] text-muted-foreground">Status isian saliran</p>
            <div className="grid grid-cols-2 gap-1.5">
              {([["Stabil", "normal"], ["Pantau", "alert"], ["Hampir penuh", "warning"], ["Berisiko limpah", "danger"]] as const).map(([label, tone]) => (
                <span key={label} className="flex items-center gap-1.5"><DrainIcon tone={tone} size={15} />{label}</span>
              ))}
            </div>
          </div>
        )}
        {layers.rivers && (
          <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-border pt-2">
            {([["Normal", "normal"], ["Waspada", "alert"], ["Amaran", "warning"], ["Bahaya", "danger"]] as const).map(([label, tone]) => (
              <span key={label} className="flex items-center gap-1.5"><StationIcon tone={tone} size={15} />{label}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

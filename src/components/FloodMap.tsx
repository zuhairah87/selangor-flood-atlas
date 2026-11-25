import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { rain, waterways, drains, simulatedLevel, status, damStatus, storageVolume, drainStatus } from "@/lib/flood-data";
import type { applyRiverReading, applyDamReading, RiverReading } from "@/lib/official-updates";
import { combinedDrainFill, isTideScenarioDrain } from "@/lib/tide-simulation";
import type { TideReading } from "@/lib/official-tides";
import { stationIconSvg, type Tone } from "@/lib/station-icon";
import { damIconSvg } from "@/lib/dam-icon";
import { waterwayIconSvg, drainIconSvg } from "@/lib/waterway-icon";
import { selangorBounds, selangorOutlineParts, pointInSelangor } from "@/lib/selangor-boundary";
import type { FloodHotspot } from "@/lib/flood-hotspots";
import { hotspotAnnouncement, hotspotCoordinateRecord } from "@/lib/flood-hotspots";
import { hotspotIconSvg } from "@/lib/hotspot-icon";

export type Layers = { rivers: boolean; dams: boolean; rain: boolean; waterways: boolean; drains: boolean; terrain: boolean; hotspots: boolean };
export type MapStyle = "light" | "night";
const stationSize = 22;
const emptyHotspots: FloodHotspot[] = [];
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

function HotspotIcon({ size = 19 }: { size?: number }) {
  return <span className="shrink-0" dangerouslySetInnerHTML={{ __html: hotspotIconSvg(size) }} />;
}

// Paparan dan navigasi merangkumi seluruh Semenanjung Malaysia; data pemantauan kekal di Selangor.
const peninsulaBounds: [[number, number], [number, number]] = [[1.26618, 99.64049], [6.72609, 104.54098]];
const seaAreas = [
  { name: "Selat Melaka", lat: 3.35, lng: 100.0 },
  { name: "Laut China Selatan", lat: 4.05, lng: 103.55 },
  { name: "Selat Johor", lat: 1.44, lng: 103.9 },
] as const;

export default function FloodMap({ layers, extra, mapStyle, tide, simulationTime, currentStations, currentDams, drainReadings, hotspots = emptyHotspots }: { layers: Layers; extra: number; mapStyle: MapStyle; tide: TideReading | null; simulationTime: string; currentStations: ReturnType<typeof applyRiverReading>[]; currentDams: ReturnType<typeof applyDamReading>[]; drainReadings: RiverReading[]; hotspots?: FloodHotspot[] }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const terrain = useRef<L.TileLayer | null>(null);
  const boundaryLines = useRef<L.Polygon[]>([]);
  const groups = useRef<Record<"rain" | "dams" | "rivers" | "waterways" | "drains" | "hotspots", L.LayerGroup> | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    const bounds = L.latLngBounds(peninsulaBounds);
    const m = L.map(el.current, { minZoom: 5, maxBounds: bounds.pad(0.08), maxBoundsViscosity: 1 });
    m.createPane("sea-labels");
    m.getPane("sea-labels")!.style.zIndex = "350";
    m.getPane("sea-labels")!.style.pointerEvents = "none";
    m.createPane("outline");
    m.getPane("outline")!.style.zIndex = "460";

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { className: "base-tiles", attribution: "© OpenStreetMap contributors" }).addTo(m);
    terrain.current = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", { className: "terrain-tiles", maxZoom: 17, opacity: 0.65, attribution: "© OpenTopoMap (CC-BY-SA)" });

    // Laut kekal kelihatan; label nama hanya membantu mengenal pasti perairan utama.
    seaAreas.forEach((sea) => {
      L.marker([sea.lat, sea.lng], {
        pane: "sea-labels",
        interactive: false,
        keyboard: false,
        icon: L.divIcon({ className: "sea-label-marker", html: `<span class="sea-label">${sea.name}</span>`, iconSize: [180, 30], iconAnchor: [90, 15] }),
      }).addTo(m);
    });
    boundaryLines.current = selangorOutlineParts.map((part) =>
      L.polygon(part, { pane: "outline", fill: false, color: css("--boundary"), weight: 2, opacity: 0.9, interactive: false }).addTo(m),
    );
    m.attributionControl.addAttribution("Sempadan: geoBoundaries (ODbL)");

    groups.current = { rain: L.layerGroup().addTo(m), dams: L.layerGroup().addTo(m), rivers: L.layerGroup().addTo(m), waterways: L.layerGroup().addTo(m), drains: L.layerGroup().addTo(m), hotspots: L.layerGroup().addTo(m) };
    m.fitBounds(selangorBounds, { padding: [24, 24] });
    const updateLabels = () => {
      el.current?.classList.toggle("hide-detailed-labels", m.getZoom() < 11);
      el.current?.classList.toggle("hide-sea-labels", m.getZoom() >= 11);
    };
    m.on("zoomend", updateLabels);
    updateLabels();
    map.current = m;
    return () => { m.remove(); map.current = null; boundaryLines.current = []; };
  }, []);

  useEffect(() => {
    const boundaryColor = css(mapStyle === "night" ? "--boundary-night" : "--boundary");
    boundaryLines.current.forEach((line) => line.setStyle({ color: boundaryColor }));
  }, [mapStyle]);

  useEffect(() => {
    const g = groups.current; const m = map.current; if (!m || !g) return;
    Object.values(g).forEach((x) => x.clearLayers());
    rain.forEach((r) => {
      const mm = r.mm + extra;
      L.circle([r.lat, r.lng], { radius: 3000 + mm * 250, color: css("--rain"), fillColor: css("--rain"), fillOpacity: Math.min(0.15 + mm / 150, 0.6), weight: 1 })
        .bindPopup(`<b>${r.name}</b><br/>Hujan contoh + simulasi: ${mm} mm<br/><i>Bukan cerapan MET Malaysia.</i>`).addTo(g.rain);
    });
    waterways.forEach((w) => {
      L.marker([w.lat, w.lng], {
        icon: L.divIcon({ className: "waterway-marker", html: waterwayIconSvg(24), iconSize: [24, 24], iconAnchor: [12, 12] }),
      })
        .bindTooltip(w.name, { permanent: true, direction: "top", offset: [0, -12], className: "waterway-name-label" })
        .bindPopup(`<b>${w.name}</b><br/>Keluasan: <b>${w.areaKm2.toLocaleString("ms-MY")} km²</b><br/>Daerah: ${w.districts}<br/>Empangan: ${w.dams}<br/>Anak sungai: <b>${w.tributaries}</b><br/><i>Penanda ialah titik rujukan lembangan, bukan laluan sungai.</i>`).addTo(g.waterways);
    });
    drains.forEach((d) => {
      const reading = drainReadings.find((row) => row.id === d.stationId);
      const observedNote = reading ? `<br/>Cerapan JPS: <b>${reading.level.toFixed(2)} m</b> · ${reading.updatedAt} MYT` : "<br/>Cerapan JPS tidak tersedia";
      const fill = combinedDrainFill(d, extra, tide); const st = drainStatus(fill);
      const tideNote = isTideScenarioDrain(d) ? tide ? `<br/>Ramalan PHN Klang: <b>${tide.heightM.toFixed(2)} m LAT</b> pada ${tide.sampleTime} MYT<br/>Faktor laut contoh: +${tide.surcharge} mata peratus` : "<br/>Faktor laut tidak tersedia; hujan sahaja." : "";
      const html = `<div class="drain-marker">${drainIconSvg({ tone: st.tone, size: 25 })}<span class="drain-fill">${fill.toFixed(0)}%</span></div>`;
      L.marker([d.lat, d.lng], { icon: L.divIcon({ className: "drain-marker-icon", html, iconSize: [80, 28], iconAnchor: [12, 14], popupAnchor: [0, -14] }) })
        .bindTooltip(d.name, { direction: "top", offset: [0, -12] })
        .bindPopup(`<b>${d.name}</b><br/>ID stesen JPS: ${d.stationId}<br/>${d.district} · Lembangan ${d.basin}${observedNote}<br/>Isian simulasi: <b>${fill.toFixed(0)}%</b><br/>Status simulasi: <b>${st.label}</b>${tideNote}<br/><i>Peratus ini bukan ukuran kapasiti sebenar atau pengisytiharan banjir.</i>`).addTo(g.drains);
    });
    hotspots.forEach((hotspot) => {
      L.marker([hotspot.lat, hotspot.lng], {
        icon: L.divIcon({ className: "hotspot-marker", html: hotspotIconSvg(28), iconSize: [28, 28], iconAnchor: [14, 24], popupAnchor: [0, -24] }),
      })
        .bindTooltip(hotspot.name, { permanent: true, direction: "top", offset: [0, -22], className: "hotspot-name-label" })
        .bindPopup(`<b>${hotspot.name}</b><br/>Daerah: ${hotspot.district}<br/>Lembangan: ${hotspot.basin}<br/>Jenis dalam rekod JPS: ${hotspot.floodType}<br/>Hotspot diumumkan: <b>${hotspotAnnouncement.date}</b><br/><i>${hotspotCoordinateRecord}. Ini kawasan berisiko yang dikenal pasti, bukan kejadian banjir semasa.</i>`).addTo(g.hotspots);
    });
    currentDams.forEach((d, i) => {
      const direction = damLabelDirections[i] ?? "top";
      const offset: [number, number] = direction === "right" ? [12, 0] : direction === "left" ? [-12, 0] : [0, -10];
      const st = damStatus(d.percent);
      const stored = (d.observedStored ?? storageVolume(d)).toFixed(1);
      const html = `<div class="dam-marker">${damIconSvg({ tone: st.tone, size: 26 })}<span class="dam-pin">${d.percent}%</span></div>`;
      L.marker([d.lat, d.lng], { icon: L.divIcon({ className: "", html }) })
        .bindTooltip(d.name, { permanent: true, direction, offset, className: "dam-name-label" })
        .bindPopup(`<b>${d.name}</b><br/>${d.river}, ${d.district}<br/>Siap: ${d.yearCompleted} · Paras tertinggi: ${d.maxLevelM} m<br/>Takungan: <b>${stored} / ${d.capacityMm3} juta m³ (${d.percent}%)</b><br/>Status kategori aplikasi: <b>${st.label}</b><br/><i>${d.observedAt ? `LUAS: ${d.observedLevel?.toFixed(2)} m MSL · ${d.observedAt} MYT` : "Isi takungan ialah anggaran daripada peratus contoh."}</i>`).addTo(g.dams);
    });
    currentStations.forEach((s) => {
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
        .bindPopup(`<b>${s.name}</b><br/>${s.district}<br/>Paras${extra ? " simulasi" : ""}: ${lv.toFixed(2)} m — <b>${st.label}</b><br/>Waspada ${s.alert} / Amaran ${s.warning} / Bahaya ${s.danger}<br/><i>${s.observedAt ? `Cerapan JPS: ${s.level.toFixed(2)} m · ${s.observedAt} MYT` : "Data contoh; tiada padanan stesen rasmi"}</i>${luar ? "<br/><i>Stesen di luar negeri Selangor</i>" : ""}`).addTo(g.rivers);
    });
    if (terrain.current) { if (layers.terrain) terrain.current.addTo(m).bringToFront(); else terrain.current.remove(); }
    (["rivers", "dams", "rain", "waterways", "drains", "hotspots"] as const).forEach((k) => layers[k] ? g[k].addTo(m) : g[k].remove());
  }, [layers, extra, tide, currentStations, currentDams, drainReadings, hotspots]);

  return (
    <div className="relative h-full w-full">
      <div ref={el} className="flood-map h-full w-full" data-map-style={mapStyle} />
      <div className="pointer-events-none absolute right-3 top-3 z-[500] max-w-[calc(100%-5rem)] rounded-md border border-border bg-background/95 px-3 py-2 text-xs shadow-sm">
        <p className="font-semibold">{tide ? `PHN Klang: ${tide.heightM.toFixed(2)} m LAT · ${tide.label}` : "PHN Klang: tiada jadual untuk masa dipilih"}</p>
        {simulationTime && <p className="mt-1 text-muted-foreground">{simulationTime.replace("T", " ")} MYT</p>}
        {tide && <p className="mt-1 text-muted-foreground">Sampel ramalan {tide.sampleTime} · kesan saliran anggaran</p>}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg border border-border bg-background/95 px-3 py-2 text-xs shadow-sm">
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Petunjuk</p>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2"><span className="boundary-legend h-0.5 w-5 shrink-0 rounded" style={{ backgroundColor: `var(${mapStyle === "night" ? "--boundary-night" : "--boundary"})` }} />Sempadan negeri Selangor</li>
          <li className="flex items-center gap-2"><span className="h-3 w-5 shrink-0 rounded border border-border" style={{ backgroundColor: `var(${outsideTokens[mapStyle]})` }} />Laut sekitar Semenanjung</li>
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

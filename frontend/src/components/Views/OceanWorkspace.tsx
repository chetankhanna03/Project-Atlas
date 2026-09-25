import {
  ArrowUpRight,
  Download,
  MapPin,
  SlidersHorizontal,
  Waves,
  Fish,
  Ship,
  Thermometer,
  Compass,
} from "lucide-react";
import type { Scope } from "../../services/atlas";
import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Rectangle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapAreaSelection, validArea, type Area } from "./MapAreaSelection";
import { safeSourceUrl } from "../../services/atlas";

type Layer = "argo" | "obis" | "sst" | "gfw";
type Result = { layer: Layer; data?: any; error?: string };
type Point = {
  lat: number;
  lon: number;
  label: string;
  detail: string;
  source?: string;
  color: string;
};
type Query = {
  west: number;
  south: number;
  east: number;
  north: number;
  start: string;
  end: string;
  parameter: string;
  species: string;
  layers: Layer[];
};
const today = () => new Date().toISOString().slice(0, 10);
const initial: Query = {
  west: 50,
  south: 5,
  east: 78,
  north: 25,
  start: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
  end: today(),
  parameter: "temperature",
  species: "",
  layers: ["argo", "obis"],
};
let saved: { query: Query; results: Result[]; loaded: string } | null = null;
const names: Record<Layer, string> = {
  argo: "ARGO profiles",
  obis: "OBIS occurrences",
  sst: "Satellite SST",
  gfw: "Fishing effort",
};
const colors = {
  argo: "#0e7490",
  obis: "#7c3aed",
  sst: "#d97706",
  gfw: "#e11d48",
};

export async function loadLayer(
  layer: Layer,
  q: Query,
  signal: AbortSignal,
): Promise<Result> {
  const box = [q.west, q.south, q.east, q.north].join(",");
  const p = new URLSearchParams({ bbox: box, start: q.start, end: q.end });
  let path = "";
  if (layer === "argo") {
    p.set("parameter", q.parameter);
    p.set("limit", "3");
    path = "/oceanography/argo/gdac";
  }
  if (layer === "obis") {
    p.delete("start");
    p.delete("end");
    p.set("limit", "100");
    if (q.species.trim()) p.set("species", q.species.trim());
    path = "/biodiversity/obis";
  }
  if (layer === "gfw") path = "/fisheries/effort";
  if (layer === "sst") {
    p.delete("bbox");
    p.delete("start");
    p.delete("end");
    p.set("lat", String((q.south + q.north) / 2));
    p.set("lon", String((q.west + q.east) / 2));
    p.set("days", "7");
    path = "/oceanography/erddap/sst";
  }
  try {
    const response = await fetch("/api" + path + "?" + p, { signal });
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        typeof data.detail === "string"
          ? data.detail
          : `Source unavailable (${response.status}).`,
      );
    return { layer, data };
  } catch (error) {
    if (signal.aborted) throw error;
    return {
      layer,
      error: error instanceof Error ? error.message : "Source unavailable",
    };
  }
}

function Series({
  title,
  unit,
  rows,
}: {
  title: string;
  unit: string;
  rows: { x: string; y: number }[];
}) {
  if (!rows.length) return null;
  const min = Math.min(...rows.map((r) => r.y)),
    max = Math.max(...rows.map((r) => r.y));
  const xs = rows.map((r) =>
    r.x.endsWith("dbar") ? parseFloat(r.x) : Date.parse(r.x),
  );
  const xmin = Math.min(...xs),
    xmax = Math.max(...xs);
  const coords = rows
    .map(
      (r, i) =>
        `${45 + ((xs[i] - xmin) * 490) / (xmax - xmin || 1)},${125 - ((r.y - min) * 95) / (max - min || 1)}`,
    )
    .join(" ");
  return (
    <article className="rounded-xl border bg-white p-5">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-xs text-slate-500 my-1">
        {rows.length} returned values · {unit}
      </p>
      <svg
        viewBox="0 0 560 160"
        className="w-full"
        role="img"
        aria-label={title}
      >
        <path d="M45 20V130H540" fill="none" stroke="#cbd5e1" />
        <polyline
          points={coords}
          fill="none"
          stroke="#0e7490"
          strokeWidth="2.5"
        />
        {rows.length === 1 && <circle cx="45" cy="125" r="4" fill="#0e7490" />}
        <text x="0" y="30" fontSize="10">
          {max.toFixed(2)}
        </text>
        <text x="0" y="128" fontSize="10">
          {min.toFixed(2)}
        </text>
        <text x="45" y="150" fontSize="10">
          {rows[0].x}
        </text>
        <text x="540" y="150" textAnchor="end" fontSize="10">
          {rows.at(-1)?.x}
        </text>
      </svg>
      <details className="text-xs">
        <summary className="cursor-pointer text-cyan-800">View values</summary>
        <div className="max-h-48 overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Time / pressure</th>
                <th>{unit}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.x}</td>
                  <td>{r.y.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </article>
  );
}

export function OceanWorkspace({
  mode = "dashboard",
  onAskAtlas,
}: {
  mode?: "dashboard" | "map" | "analytics";
  onAskAtlas?: (question: string, scope: Scope) => void;
}) {
  const [q, setQ] = useState<Query>(saved?.query || initial),
    [results, setResults] = useState<Result[]>(saved?.results || []);
  const [applied, setApplied] = useState<Query>(saved?.query || initial),
    [loaded, setLoaded] = useState(saved?.loaded || "");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [visible, setVisible] = useState<Layer[]>(["argo", "obis", "sst", "gfw"]);
  const controller = useRef<AbortController | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [areaMethod, setAreaMethod] = useState("");
  const [focusArea, setFocusArea] = useState<Area>(() => ({
    west: applied.west,
    south: applied.south,
    east: applied.east,
    north: applied.north,
  }));
  const mapSection = useRef<HTMLElement>(null);
  const draftArea = {
    west: q.west,
    south: q.south,
    east: q.east,
    north: q.north,
  };
  function selectArea(area: Area, method: string, focus = false) {
    setQ((previous) => ({ ...previous, ...area }));
    setAreaMethod(method);
    setError("");
    setDrawing(false);
    if (focus) setFocusArea(area);
  }
  function clearArea() {
    const area = {
      west: applied.west,
      south: applied.south,
      east: applied.east,
      north: applied.north,
    };
    setQ((previous) => ({ ...previous, ...area }));
    setAreaMethod("");
    setFocusArea(area);
    setError("");
  }
  const update = (key: keyof Query, value: any) =>
    setQ((prev) => ({ ...prev, [key]: value }));
  async function refresh() {
    if (
      ![q.west, q.south, q.east, q.north].every(Number.isFinite) ||
      q.west >= q.east ||
      q.south >= q.north ||
      q.west < -180 ||
      q.east > 180 ||
      q.south < -90 ||
      q.north > 90 ||
      !q.start ||
      !q.end ||
      q.start > q.end ||
      !q.layers.length
    ) {
      setError(
        "Choose valid bounds, dates and at least one source. Split areas crossing the date line.",
      );
      return;
    }
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setBusy(true);
    setError("");
    setResults([]);
    setLoaded("");
    setApplied({ ...q });
    saved = null;
    const timer = setTimeout(() => current.abort(), 65000);
    try {
      const next = await Promise.all(
        q.layers.map((layer) => loadLayer(layer, q, current.signal)),
      );
      if (current.signal.aborted) return;
      const time = new Date().toISOString();
      setResults(next);
      setLoaded(time);
      saved = { query: { ...q }, results: next, loaded: time };
    } catch {
      if (controller.current === current)
        setError(
          "Request cancelled or timed out. Narrow the area and try again.",
        );
    } finally {
      clearTimeout(timer);
      if (controller.current === current) setBusy(false);
    }
  }
  useEffect(() => {
    if (!saved) void refresh();
    return () => {
      controller.current?.abort();
      controller.current = null;
    };
  }, []);
  const points: Point[] = [],
    series: {
      title: string;
      unit: string;
      rows: { x: string; y: number }[];
    }[] = [];
  for (const result of results) {
    const d = result.data;
    if (!d) continue;
    if (result.layer === "argo")
      for (const p of d.profiles || []) {
        if (visible.includes("argo"))
          points.push({
            lat: p.latitude,
            lon: p.longitude,
            label: `ARGO ${p.float_id} · cycle ${p.cycle}`,
            detail: `${p.time} | ${p.matching_levels} QC-approved levels | mode ${p.data_mode}`,
            source: p.url,
            color: colors.argo,
          });
        series.push({
          title: `${p.float_id}: ${p.parameter} profile`,
          unit: p.unit,
          rows: p.levels.map((v: any) => ({
            x: `${v.pressure_dbar.toFixed(1)} dbar`,
            y: v.value,
          })),
        });
      }
    if (result.layer === "obis" && visible.includes("obis"))
      for (const p of d.results || [])
        points.push({
          lat: p.latitude,
          lon: p.longitude,
          label: p.scientific_name || "Unidentified taxon",
          detail: `Observed: ${p.event_date || "date not supplied"} | ${p.license || "see source license"}`,
          source: d.provenance?.url,
          color: colors.obis,
        });
    if (result.layer === "sst" && d.data?.length) {
      const p = d.data.at(-1);
      if (visible.includes("sst"))
        points.push({
          lat: p.latitude,
          lon: p.longitude,
          label: `SST ${p.sst_celsius.toFixed(2)} °C`,
          detail: p.time,
          source: d.provenance?.url,
          color: colors.sst,
        });
      series.push({
        title: "Satellite SST at sampled grid cell",
        unit: "°C",
        rows: d.data.map((p: any) => ({
          x: p.time.slice(0, 10),
          y: p.sst_celsius,
        })),
      });
    }
    if (result.layer === "gfw" && d.results?.length) {
      const daily: Record<string, number> = {};
      for (const p of d.results)
        daily[p.date] = (daily[p.date] || 0) + p.apparent_fishing_hours;
      series.push({
        title: "AIS apparent fishing effort in selected area",
        unit: "hours",
        rows: Object.keys(daily)
          .sort()
          .map((x) => ({ x, y: daily[x] })),
      });
    }
  }
  function download() {
    const blob = new Blob(
      [
        JSON.stringify(
          { query: applied, requested_at: loaded, results },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "atlas-observations.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const dirty = JSON.stringify(q) !== JSON.stringify(applied);
  return (
    <div className="ocean-workspace">
      <div className="explore-layout">
        <header className="explore-heading">
          <div>
            <p className="tiny-label">
              <span className="coral-dash" /> OCEAN DISCOVERY, GROUNDED IN
              EVIDENCE
            </p>
            <h1>
              A new perspective
              <br className="mobile-only" /> on our ocean<span>.</span>
            </h1>
            <p>
              Choose a place. Explore the observations. Find the story in the
              science.
            </p>
          </div>
          <button
            disabled={!loaded || busy}
            onClick={download}
            className="export-button"
          >
            <Download size={16} /> Export data
          </button>
        </header>
        <section aria-label="Data query" className="query-panel">
          <div className="query-title">
            <Compass size={19} />
            <h2>Make it your exploration</h2>
          </div>
          <p className="query-description">
            Set your area and choose what you want to discover.
          </p>
          <div className="query-step">
            <span>01</span> Where are we looking?
          </div>
          <div className="region-options">
            {[
              ["Arabian Sea", 50, 5, 78, 25],
              ["Bay of Bengal", 80, 5, 100, 23],
            ].map(([name, w, s, e, n]) => (
              <button
                key={name}
                aria-label={String(name)}
                aria-pressed={
                  q.west === +w &&
                  q.south === +s &&
                  q.east === +e &&
                  q.north === +n
                }
                onClick={() =>
                  selectArea(
                    { west: +w, south: +s, east: +e, north: +n },
                    String(name),
                    true,
                  )
                }
                className={`rounded-full px-4 py-2 text-sm font-medium border transition-all hover:shadow-md active:scale-95 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2 ${q.west === +w && q.south === +s && q.east === +e && q.north === +n ? "bg-cyan-800 text-white border-cyan-800 shadow-sm" : "bg-white text-cyan-900 border-cyan-200 hover:bg-cyan-50 hover:border-cyan-500"}`}
              >
                <MapPin size={15} />
                {name}
              </button>
            ))}
          </div>
          <div className="area-actions">
            {mode !== "analytics" && (
              <button
                type="button"
                onClick={() => {
                  setDrawing(true);
                  mapSection.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className="rounded-lg border border-cyan-700 text-cyan-900 px-3 py-2 hover:bg-cyan-50 active:scale-95 transition-all"
              >
                Select area on map
              </button>
            )}
            <span role="status" className="text-slate-600">
              {areaMethod
                ? `${areaMethod}: coordinates updated. Load data when ready.`
                : "Choose a region, edit coordinates, or select an area on the map."}
            </span>
          </div>
          <details className="advanced-filters">
            <summary>
              <SlidersHorizontal size={14} /> Dates & advanced filters
            </summary>
            <div className="grid grid-cols-2 gap-3 pt-4">
              {(["west", "south", "east", "north"] as const).map((key) => (
                <label key={key} className="text-xs text-slate-600 capitalize">
                  {key}
                  <input
                    aria-label={key}
                    type="number"
                    step="any"
                    value={Number.isFinite(q[key]) ? q[key] : ""}
                    onChange={(e) => {
                      update(
                        key,
                        e.target.value === "" ? NaN : Number(e.target.value),
                      );
                      setAreaMethod("Manual coordinates");
                      setDrawing(false);
                    }}
                    className="block w-full rounded-lg border p-2 mt-1 text-sm"
                  />
                </label>
              ))}
              <label className="text-xs">
                From
                <input
                  type="date"
                  value={q.start}
                  onChange={(e) => update("start", e.target.value)}
                  className="block w-full rounded-lg border p-2 mt-1"
                />
              </label>
              <label className="text-xs">
                To
                <input
                  type="date"
                  value={q.end}
                  onChange={(e) => update("end", e.target.value)}
                  className="block w-full rounded-lg border p-2 mt-1"
                />
              </label>
              <label className="text-xs">
                ARGO variable
                <select
                  value={q.parameter}
                  onChange={(e) => update("parameter", e.target.value)}
                  className="block w-full rounded-lg border p-2 mt-1"
                >
                  <option value="temperature">Temperature</option>
                  <option value="salinity">Salinity</option>
                </select>
              </label>
              <label className="text-xs">
                Species (OBIS)
                <input
                  placeholder="Scientific name"
                  value={q.species}
                  onChange={(e) => update("species", e.target.value)}
                  className="block w-full rounded-lg border p-2 mt-1"
                />
              </label>
            </div>
          </details>
          <div className="query-step">
            <span>02</span> What would you like to explore?
          </div>
          <div className="source-options">
            {(Object.keys(names) as Layer[]).map((layer) => (
              <label
                className={`source-option ${q.layers.includes(layer) ? "selected" : ""}`}
                key={layer}
              >
                <input
                  aria-label={names[layer]}
                  type="checkbox"
                  checked={q.layers.includes(layer)}
                  onChange={() =>
                    update(
                      "layers",
                      q.layers.includes(layer)
                        ? q.layers.filter((l) => l !== layer)
                        : [...q.layers, layer],
                    )
                  }
                />
                <span className={`source-icon ${layer}`}>
                  {layer === "argo" ? (
                    <Waves size={19} />
                  ) : layer === "obis" ? (
                    <Fish size={19} />
                  ) : layer === "sst" ? (
                    <Thermometer size={19} />
                  ) : (
                    <Ship size={19} />
                  )}
                </span>
                <span className="source-option-copy">
                  {names[layer]}
                  <small>
                    {
                      {
                        argo: "Temperature & salinity",
                        obis: "Recorded marine life",
                        sst: "Surface temperature",
                        gfw: "Apparent fishing activity",
                      }[layer]
                    }
                  </small>
                </span>
              </label>
            ))}
            <button
              disabled={busy}
              onClick={() => void refresh()}
              className="atlas-primary load-button"
            >
              {busy ? (
                <>
                  <span className="loading-spinner" /> Exploring your area...
                </>
              ) : (
                <>
                  Load data <ArrowUpRight size={17} />
                </>
              )}
            </button>
            {busy && (
              <button
                onClick={() => controller.current?.abort()}
                className="text-sm underline"
              >
                Cancel
              </button>
            )}
          </div>
          <details className="coverage-note">
            <summary>What these sources can tell you</summary>
            <p>
              Dates apply to ARGO and fishing effort. OBIS shows an undated
              occurrence sample. SST shows the latest seven available days at
              the area centre. Fishing effort is a regional aggregate, not
              vessel positions.
            </p>
          </details>
          <div className="query-footnote">
            <span /> Real sources. Visible limitations.
          </div>
        </section>
        {error && (
          <p
            role="alert"
            className="workspace-notice rounded-lg bg-red-50 text-red-800 p-4"
          >
            {error}
          </p>
        )}
        {dirty && loaded && (
          <p className="workspace-notice text-sm bg-amber-50 text-amber-900 p-3 rounded-lg">
            Filters changed. Press Load data to update the results below.
          </p>
        )}
        <div className="evidence-overview">
          <div className="section-heading">
            <div>
              <span className="tiny-label">FROM THE SOURCES</span>
              <h2>Evidence in your area</h2>
            </div>
            {loaded && onAskAtlas && (
              <button
                className="text-link"
                disabled={dirty || busy}
                title={
                  dirty
                    ? "Load your current selection first"
                    : "Explore the loaded area with Atlas"
                }
                onClick={() =>
                  onAskAtlas(
                    `Help me understand ocean conditions and marine biodiversity within west ${applied.west}, south ${applied.south}, east ${applied.east}, north ${applied.north}, during ${applied.start} to ${applied.end}. Retrieve supporting evidence and explain coverage limitations; do not assume the selected datasets establish a trend.`,
                    {
                      bbox: [
                        applied.west,
                        applied.south,
                        applied.east,
                        applied.north,
                      ],
                      start_date: applied.start,
                      end_date: applied.end,
                      parameter: applied.parameter,
                      species: applied.species || null,
                    },
                  )
                }
              >
                Ask Atlas about this area <ArrowUpRight size={15} />
              </button>
            )}
          </div>
          <div className="evidence-cards">
            {results.map((r) => (
              <article key={r.layer} className={`evidence-card ${r.layer}`}>
                <h2 className="text-sm font-semibold">{names[r.layer]}</h2>
                <p
                  className="mt-2 text-lg font-semibold"
                  style={{ color: r.error ? "#b91c1c" : colors[r.layer] }}
                >
                  {r.error
                    ? "Unavailable"
                    : r.data.status === "no_data"
                      ? "No matching records"
                      : r.data.status === "unavailable"
                        ? "Unavailable"
                        : r.layer === "gfw"
                          ? `${r.data.total_apparent_fishing_hours.toFixed(2)} hours`
                          : r.layer === "obis"
                            ? `${(r.data.results || []).length} records shown`
                            : `${(r.data.profiles || r.data.results || r.data.data || []).length} ${r.layer === "argo" ? "profiles" : "records"}`}
                </p>
                {r.layer === "obis" &&
                  r.data &&
                  r.data.status !== "unavailable" && (
                    <p className="text-xs text-slate-600 mt-2">
                      Up to 100 records per query. This is a limited sample, not
                      the total occurrences or number of fish in the selected
                      area.
                    </p>
                  )}
                {r.error && <p className="text-xs mt-2">{r.error}</p>}
                {r.data && (
                  <details className="text-xs mt-2">
                    <summary className="cursor-pointer">
                      Source and coverage
                    </summary>
                    <p>Status: {r.data.status}</p>
                    {(r.data.limitations || []).map((s: string) => (
                      <p className="mt-1" key={s}>
                        {s}
                      </p>
                    ))}
                    {(r.data.errors || []).map((e: any, i: number) => (
                      <p key={i}>{e.detail || e.code}</p>
                    ))}
                    <p className="mt-2">
                      Retrieved:{" "}
                      {r.data.provenance?.retrieved_at ||
                        r.data.profiles?.[0]?.retrieved_at ||
                        "Not supplied"}
                    </p>
                    {safeSourceUrl(
                      r.data.provenance?.url || r.data.index?.url,
                    ) && (
                      <a
                        className="underline"
                        href={safeSourceUrl(
                          r.data.provenance?.url || r.data.index?.url,
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Original source
                      </a>
                    )}
                  </details>
                )}
              </article>
            ))}
          </div>
        </div>
        {!busy && !results.length && (
          <p className="workspace-notice p-6 text-center text-slate-500 border rounded-xl bg-white">
            Choose sources and load data. No demonstration observations are
            displayed.
          </p>
        )}
        {mode !== "analytics" && (
          <section
            ref={mapSection}
            aria-label="Ocean map"
            className="map-panel scroll-mt-4"
          >
            <div className="map-panel-title">
              <div>
                <span className="map-status-dot" />
                <strong>Your ocean, in view</strong>
              </div>
              <span>Drag to explore / Select to investigate</span>
            </div>
            <div className="map-legend">
              {(Object.keys(names) as Layer[]).map((layer) => (
                <label key={layer} className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={visible.includes(layer)}
                    onChange={() =>
                      setVisible(
                        visible.includes(layer)
                          ? visible.filter((x) => x !== layer)
                          : [...visible, layer],
                      )
                    }
                  />
                  <span style={{ color: colors[layer] }}>{names[layer]}</span>
                </label>
              ))}
              <span className="ml-auto">
                {points.length} returned locations
              </span>
            </div>
            <div
              style={{
                height: "clamp(380px, 52vh, 580px)",
                position: "relative",
                zIndex: 0,
              }}
            >
              <MapContainer
                center={[15, 65]}
                zoom={4}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapAreaSelection
                  area={areaMethod && validArea(draftArea) ? draftArea : null}
                  focus={focusArea}
                  drawing={drawing}
                  setDrawing={setDrawing}
                  onSelect={selectArea}
                  onClear={clearArea}
                />
                {loaded && (
                  <Rectangle
                    interactive={false}
                    bounds={[
                      [applied.south, applied.west],
                      [applied.north, applied.east],
                    ]}
                    pathOptions={{
                      color:
                        visible.includes("gfw") &&
                        results.some(
                          (r) => r.layer === "gfw" && r.data?.results?.length,
                        )
                          ? colors.gfw
                          : "#64748b",
                      weight: 1,
                      dashArray: "5 5",
                      fillOpacity: 0.03,
                    }}
                  />
                )}
                {points.map((p, i) => (
                  <CircleMarker
                    key={i}
                    center={[p.lat, p.lon]}
                    radius={5}
                    pathOptions={{ color: p.color, fillOpacity: 0.8 }}
                  >
                    <Popup>
                      <strong>{p.label}</strong>
                      <p>{p.detail}</p>
                      <p>
                        {p.lat.toFixed(4)}, {p.lon.toFixed(4)}
                      </p>
                      {safeSourceUrl(p.source) && (
                        <a
                          href={safeSourceUrl(p.source)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Source record
                        </a>
                      )}
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
            <p className="px-4 py-2 text-xs text-slate-500">
              Basemap: OpenStreetMap. Coloured markers are API records. The
              dashed rectangle marks the last loaded area; cyan marks your
              selected area. Selection does not fetch data. SST samples the
              selected area centre.
            </p>
          </section>
        )}
        <section className="measurements-section">
          <div className="section-heading">
            <div>
              <span className="tiny-label">LOOK A LITTLE CLOSER</span>
              <h2>The observations behind the map</h2>
            </div>
            <span className="muted-note">Measured values, with context</span>
          </div>
          {series.length ? (
            <div className="grid lg:grid-cols-2 gap-4">
              {series.map((s, i) => (
                <Series key={i} {...s} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 p-5 border rounded-xl bg-white">
              No numerical series returned. Select ARGO, SST or fishing effort
              to request measurements.
            </p>
          )}
        </section>
        {points.length > 0 && (
          <details className="records-section bg-white border rounded-xl p-4 text-sm">
            <summary className="cursor-pointer font-medium">
              Inspect {points.length} mapped records
            </summary>
            <div className="overflow-auto max-h-80 mt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr>
                    <th>Record</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Observation details</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p, i) => (
                    <tr className="border-t" key={i}>
                      <td className="py-2">{p.label}</td>
                      <td>{p.lat.toFixed(4)}</td>
                      <td>{p.lon.toFixed(4)}</td>
                      <td>{p.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
        {loaded && (
          <p className="workspace-footer text-xs text-slate-500">
            Last query completed {new Date(loaded).toLocaleString()}.
            Observations may be historical or revised; source timestamps are
            shown above.
          </p>
        )}
      </div>
    </div>
  );
}

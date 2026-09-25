import React, { useEffect, useState } from "react";
import { Waves, Fish, Ship, Dna, ArrowUpRight, Activity } from "lucide-react";
import {
  getSources,
  safeSourceUrl,
  type SourceInfo,
} from "../../services/atlas";
import type { OceanSnapshot } from "./OceanWorkspace";

async function api(path: string, init?: RequestInit) {
  const response = await fetch(`/api${path}`, init);
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : `Invalid request (${response.status}). Check the required fields and units.`,
    );
  return data;
}
function Header({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <header className="domain-header">
      <span className="tiny-label">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </header>
  );
}
function Notice({ children }: { children: React.ReactNode }) {
  return <p className="domain-notice">{children}</p>;
}
function Link({ url, children }: { url?: string; children: React.ReactNode }) {
  const href = safeSourceUrl(url);
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="text-link">
      {children} <ArrowUpRight size={12} />
    </a>
  ) : (
    <span>Source URL not supplied</span>
  );
}
export function DataTable({
  rows,
  columns,
}: {
  rows: any[];
  columns: [string, string][];
}) {
  return (
    <div className="domain-table">
      <table>
        <thead>
          <tr>
            {columns.map(([key, label]) => (
              <th key={key}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(([key]) => (
                <td key={key}>
                  {row[key] == null
                    ? "Not supplied"
                    : typeof row[key] === "object"
                      ? JSON.stringify(row[key])
                      : String(row[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <Notice>
          No records returned. No sample data has been substituted.
        </Notice>
      )}
    </div>
  );
}
export function Summary({ snapshot }: { snapshot: OceanSnapshot | null }) {
  if (!snapshot)
    return (
      <Notice>
        Load an area in Explore to see returned data across domains.
      </Notice>
    );
  const argo = snapshot.results.find((r) => r.layer === "argo")?.data,
    obis = snapshot.results.find((r) => r.layer === "obis")?.data,
    gfw = snapshot.results.find((r) => r.layer === "gfw")?.data;
  const counts = [
    ["ARGO profiles", argo?.profiles?.length],
    [
      "QC measurement levels",
      argo?.profiles?.reduce((n: number, p: any) => n + p.levels.length, 0),
    ],
    ["OBIS records in sample", obis?.results?.length],
    [
      "Named taxa in sample",
      obis
        ? new Set(
            obis.results?.map((r: any) => r.scientific_name).filter(Boolean),
          ).size
        : null,
    ],
    ["AIS effort hours", gfw?.total_apparent_fishing_hours],
  ];
  return (
    <>
      <div className="domain-stats">
        {counts.map(([name, value]) => (
          <article key={name}>
            <span>{name}</span>
            <strong>
              {value == null
                ? "Not loaded"
                : typeof value === "number"
                  ? Number(value.toFixed(2)).toLocaleString()
                  : value}
            </strong>
          </article>
        ))}
      </div>
      <Notice>
        Returned samples, not regional totals or population estimates. Query
        completed {new Date(snapshot.loaded).toLocaleString()}.
      </Notice>
    </>
  );
}
export function Overview({
  snapshot,
  onExplore,
  onAsk,
}: {
  snapshot: OceanSnapshot | null;
  onExplore: (domain: string) => void;
  onAsk: () => void;
}) {
  const [sources, setSources] = useState<SourceInfo[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    getSources(c.signal)
      .then((r) => setSources(r.sources))
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, []);
  return (
    <div className="domain-page">
      <Header
        eyebrow="PROJECT ATLAS / UNIFIED MARINE INTELLIGENCE"
        title="One ocean. Connected understanding."
        text="Oceanographic, fisheries and molecular biodiversity evidence in one scientific workspace."
      />
      <div className="domain-launchers">
        {[
          [
            "ocean",
            "Oceanography",
            "Profiles, surface conditions and model data",
            Waves,
          ],
          [
            "fisheries",
            "Fisheries",
            "Fishing activity and environmental context",
            Ship,
          ],
          [
            "biodiversity",
            "Biodiversity",
            "Occurrences, taxonomy and specimen records",
            Fish,
          ],
        ].map(([id, title, text, Icon]: any) => (
          <button key={id} onClick={() => onExplore(id)}>
            <Icon size={25} />
            <h2>{title}</h2>
            <p>{text}</p>
            <span>
              Explore this domain <ArrowUpRight size={15} />
            </span>
          </button>
        ))}
      </div>
      <section className="domain-card">
        <div className="section-heading">
          <h2>What is available?</h2>
          <button className="text-link" onClick={onAsk}>
            Ask Atlas <ArrowUpRight size={14} />
          </button>
        </div>
        {error && <Notice>{error}</Notice>}
        {!sources.length && !error && (
          <Notice>Reading source configuration...</Notice>
        )}
        <div className="availability-grid">
          {sources
            .filter((s) =>
              ["argo", "gfw", "obis", "worms", "copernicus", "edna"].includes(
                s.id,
              ),
            )
            .map((s) => (
              <article key={s.id}>
                <strong>{s.name}</strong>
                <span>{s.status.replaceAll("_", " ")}</span>
              </article>
            ))}
        </div>
        <Notice>
          These are configuration states, not a claim that providers are online
          or synchronized. Molecular and morphology records require a validated
          import.
        </Notice>
      </section>
      <h2 className="domain-subtitle">Your most recent exploration</h2>
      <Summary snapshot={snapshot} />
    </div>
  );
}
export function Fisheries({
  snapshot,
  onExplore,
}: {
  snapshot: OceanSnapshot | null;
  onExplore: () => void;
}) {
  const [region, setRegion] = useState("India"),
    [species, setSpecies] = useState(""),
    [rows, setRows] = useState<any[] | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const effort = snapshot?.results.find((r) => r.layer === "gfw")?.data;
  async function load(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setRows(
        await api(
          `/fisheries/landings?region=${encodeURIComponent(region)}&species=${encodeURIComponent(species)}&limit=100`,
        ),
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="domain-page">
      <Header
        eyebrow="FISHERIES"
        title="Activity is only part of the story."
        text="Inspect apparent fishing effort separately from reported catch. Neither is a direct fish population estimate."
      />
      <button className="atlas-primary" onClick={onExplore}>
        Select an area for fishing effort <ArrowUpRight size={15} />
      </button>
      <section className="domain-card">
        <h2>Apparent fishing effort in your loaded area</h2>
        {effort ? (
          <>
            <DataTable
              rows={effort.results || []}
              columns={[
                ["date", "Date"],
                ["apparent_fishing_hours", "Apparent fishing hours"],
              ]}
            />
            <Link url={effort.provenance?.url}>
              Global Fishing Watch source
            </Link>
            <Notice>{effort.limitations?.join(" ")}</Notice>
          </>
        ) : (
          <Notice>
            Load Fishing effort in Explore. Credentials and provider coverage
            determine availability.
          </Notice>
        )}
      </section>
      <section className="domain-card">
        <h2>Reported landings</h2>
        <form className="domain-form" onSubmit={load}>
          <label>
            Reporting region
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
            />
          </label>
          <label>
            Species filter
            <input
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="Optional"
            />
          </label>
          <button className="atlas-primary" disabled={busy}>
            {busy ? "Loading..." : "Find landings"}
          </button>
        </form>
        {error && <Notice>{error}</Notice>}
        {rows && (
          <DataTable
            rows={rows}
            columns={[
              ["region", "Region"],
              ["species", "Species"],
              ["year", "Year"],
              ["landings", "Reported tonnes"],
            ]}
          />
        )}
        <Notice>
          Local imported landings have not been independently verified. No
          records are seeded; an empty result means catch data has not been
          loaded for that query.
        </Notice>
      </section>
    </div>
  );
}
function Specimens({
  kind,
  onTaxonomy,
}: {
  kind: "edna" | "otolith";
  onTaxonomy: (name: string) => void;
}) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [key, setKey] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState<string>("");
  async function refresh() {
    try {
      setData(await api(`/science/records/${kind}`));
    } catch (e) {
      setError(String(e));
    }
  }
  useEffect(() => {
    setData(null);
    setError("");
    void refresh();
  }, [kind]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      setError("Use a JSON file under 2 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = JSON.parse(await file.text());
      const result = await api(`/science/records/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": key },
        body: JSON.stringify(body),
      });
      setError(
        `${result.imported} validated records imported. No classification was performed.`,
      );
      setKey("");
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }
  return (
    <>
      <Notice>
        {kind === "edna"
          ? "Sequence storage and supplied taxonomy annotations. Similarity matching, reference databases and confidence scoring are not configured."
          : "Recorded morphometrics and a local image viewer. Species classification and automatic contour extraction are not configured."}
      </Notice>
      <section className="domain-card">
        <h2>
          {kind === "edna"
            ? "eDNA sample register"
            : "Otolith specimen register"}
        </h2>
        {!data && !error && <Notice>Loading records...</Notice>}
        {error && (
          <p role="status" className="domain-notice">
            {error}
          </p>
        )}
        {data?.records?.map((r: any) => (
          <details className="specimen-record" key={r.data.record_id}>
            <summary>
              {r.data.record_id} /{" "}
              {r.data.reported_taxon || "Taxon not assigned"} /{" "}
              {r.data.sampled_on}
            </summary>
            <p>
              Location: {r.data.latitude}, {r.data.longitude}. Imported:{" "}
              {r.imported_at}. License: {r.data.license}.
            </p>
            <Link url={r.data.source_url}>Source record</Link>
            {r.data.reported_taxon && (
              <button
                className="text-link"
                onClick={() => onTaxonomy(r.data.reported_taxon)}
              >
                Resolve reported taxon
              </button>
            )}
            {kind === "edna" ? (
              <>
                <p>
                  {r.data.sequence_length} bases / Marker:{" "}
                  {r.data.marker || "Not supplied"}
                </p>
                <pre className="sequence-text">{r.data.sequence}</pre>
              </>
            ) : (
              <DataTable
                rows={[r.data]}
                columns={[
                  ["length_mm", "Length mm"],
                  ["width_mm", "Width mm"],
                  ["area_mm2", "Area mm?"],
                  ["perimeter_mm", "Perimeter mm"],
                  ["aspect_ratio", "Aspect ratio"],
                  ["circularity", "Circularity"],
                ]}
              />
            )}
          </details>
        ))}
        {data?.count === 0 && (
          <Notice>
            No records imported. This register is ready for validated source
            data.
          </Notice>
        )}
      </section>
      {kind === "otolith" && (
        <section className="domain-card">
          <h2>Inspect a specimen image</h2>
          <label className="file-control">
            Open local PNG or JPEG
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (
                  f &&
                  ["image/png", "image/jpeg"].includes(f.type) &&
                  f.size <= 10_000_000
                )
                  setPreview(URL.createObjectURL(f));
                else setError("Use a PNG or JPEG below 10 MB.");
              }}
            />
          </label>
          {preview && (
            <img
              src={preview}
              alt="User-selected otolith specimen, not classified"
              className="specimen-image"
            />
          )}
          <Notice>
            Image remains in this browser session. Measurements are not inferred
            from an uncalibrated image.
          </Notice>
        </section>
      )}
      <details className="domain-card">
        <summary>
          Import validated {kind} metadata / administrator access
        </summary>
        <p>
          JSON object with a records array (up to 100). Required: record_id,
          source_url, license, sampled_on (YYYY-MM-DD), latitude, longitude.{" "}
          {kind === "edna"
            ? "Also sequence: IUPAC DNA without FASTA headers. Optional marker and reported_taxon."
            : "Also length_mm and width_mm. Optional area_mm2, perimeter_mm, reported_taxon and image_reference."}
        </p>
        <label>
          Administrator key
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
          />
        </label>
        <label className="file-control">
          {busy ? "Importing..." : "Choose JSON file"}
          <input
            type="file"
            accept=".json,application/json"
            disabled={!key || busy}
            onChange={upload}
          />
        </label>
        <Notice>
          Writes require ADMIN_API_KEY configured on the backend. Missing
          configuration is reported explicitly; keys are not stored by the
          browser.
        </Notice>
      </details>
    </>
  );
}
export function Biodiversity({
  snapshot,
  onExplore,
  onAsk,
}: {
  snapshot: OceanSnapshot | null;
  onExplore: () => void;
  onAsk: (q: string) => void;
}) {
  const [tab, setTab] = useState("occurrences"),
    [name, setName] = useState(""),
    [result, setResult] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const occurrences = snapshot?.results.find((r) => r.layer === "obis")?.data;
  const [filter, setFilter] = useState("");
  async function resolve(e?: React.FormEvent) {
    e?.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      setResult(
        await api(`/taxonomy/resolve?name=${encodeURIComponent(name.trim())}`),
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  const taxonomy = (name: string) => {
    setName(name);
    setResult(null);
    setTab("taxonomy");
  };
  return (
    <div className="domain-page">
      <Header
        eyebrow="BIODIVERSITY / TAXONOMY / MOLECULAR"
        title="From observations to identity."
        text="Explore recorded marine life, resolve scientific names, and manage molecular and morphology evidence."
      />
      <div className="source-tabs">
        {["occurrences", "taxonomy", "edna", "otolith"].map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {
              {
                occurrences: "Species observations",
                taxonomy: "Taxonomy",
                edna: "eDNA",
                otolith: "Otolith",
              }[t]
            }
          </button>
        ))}
      </div>
      {tab === "occurrences" && (
        <>
          <Summary snapshot={snapshot} />
          <div className="domain-form">
            <label>
              Filter returned species
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Scientific name"
              />
            </label>
            <button className="atlas-primary" onClick={onExplore}>
              Query biodiversity on the map
            </button>
          </div>
          <Notice>
            Named taxa below are distinct labels in a capped, undated occurrence
            sample. They are not an estimate of total species richness.
          </Notice>
          <div className="species-grid">
            {Array.from(
              new Set<string>(
                (occurrences?.results || [])
                  .map((r: any) => r.scientific_name)
                  .filter(Boolean),
              ),
            )
              .filter((n) => n.toLowerCase().includes(filter.toLowerCase()))
              .map((n) => (
                <article className="domain-card" key={n}>
                  <h3>{n}</h3>
                  <p>
                    {
                      occurrences.results.filter(
                        (r: any) => r.scientific_name === n,
                      ).length
                    }{" "}
                    records in the returned sample
                  </p>
                  <button className="text-link" onClick={() => taxonomy(n)}>
                    Resolve taxonomy
                  </button>
                  <button
                    className="text-link"
                    onClick={() =>
                      onAsk(
                        `Find scientific literature about ${n}. Separate known ecology from observed population change.`,
                      )
                    }
                  >
                    Scientific literature / Ask Atlas
                  </button>
                  <details>
                    <summary>Observation records and provenance</summary>
                    <DataTable
                      rows={occurrences.results.filter(
                        (r: any) => r.scientific_name === n,
                      )}
                      columns={[
                        ["record_id", "Record ID"],
                        ["latitude", "Latitude"],
                        ["longitude", "Longitude"],
                        ["event_date", "Observed"],
                        ["license", "License"],
                      ]}
                    />
                    <Link url={occurrences.provenance?.url}>
                      OBIS query source
                    </Link>
                  </details>
                </article>
              ))}
          </div>
          {!occurrences && (
            <Notice>Load OBIS in Explore to populate this view.</Notice>
          )}
        </>
      )}
      {tab === "taxonomy" && (
        <section className="domain-card">
          <h2>Resolve a scientific name</h2>
          <form className="domain-form" onSubmit={resolve}>
            <label>
              Exact scientific name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Thunnus albacares"
              />
            </label>
            <button className="atlas-primary" disabled={busy}>
              {busy ? "Resolving..." : "Search WoRMS"}
            </button>
          </form>
          {error && <Notice>{error}</Notice>}
          {result && (
            <>
              <DataTable
                rows={result.matches || result.results || []}
                columns={[
                  ["scientific_name", "Submitted name"],
                  ["accepted_name", "Accepted name"],
                  ["status", "Status"],
                  ["aphia_id", "Aphia ID"],
                  ["rank", "Rank"],
                  ["kingdom", "Kingdom"],
                  ["phylum", "Phylum"],
                  ["class_name", "Class"],
                  ["order_name", "Order"],
                  ["family", "Family"],
                  ["genus", "Genus"],
                  ["authority", "Authority"],
                ]}
              />
              <Link url={result.provenance?.url}>WoRMS source</Link>
              <Notice>
                Only returned hierarchy and accepted-name fields are shown.
                Synonym lists and related-species inference are not fabricated.
              </Notice>
            </>
          )}
        </section>
      )}
      {(tab === "edna" || tab === "otolith") && (
        <Specimens key={tab} kind={tab} onTaxonomy={taxonomy} />
      )}
    </div>
  );
}
export function Analytics({
  snapshot,
  onExplore,
}: {
  snapshot: OceanSnapshot | null;
  onExplore: () => void;
}) {
  const [result, setResult] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [custom, setCustom] = useState<any>(null);
  const sst = snapshot?.results.find((r) => r.layer === "sst")?.data,
    effort = snapshot?.results.find((r) => r.layer === "gfw")?.data;
  const byDay = new Map<string, number>();
  for (const r of effort?.results || [])
    byDay.set(r.date, (byDay.get(r.date) || 0) + r.apparent_fishing_hours);
  const pairs = (sst?.data || [])
    .filter((r: any) => byDay.has(r.time.slice(0, 10)))
    .map((r: any) => ({
      date: r.time.slice(0, 10),
      x: r.sst_celsius,
      y: byDay.get(r.time.slice(0, 10)),
    }));
  async function compare() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(
        await api("/science/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            custom || {
              x_label: "SST at selected centre (C)",
              y_label: "Regional apparent fishing hours",
              spatial_scope:
                "Point SST and regional effort, aligned by date only; spatial resolutions differ.",
              sources: [sst?.provenance?.url, effort?.provenance?.url].filter(
                Boolean,
              ),
              pairs,
            },
          ),
        }),
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="domain-page">
      <Header
        eyebrow="CROSS-DOMAIN ANALYTICS"
        title="Compare the evidence. Keep the context."
        text="Inspect source coverage first, then explore relationships using explicitly aligned measurements."
      />
      <Summary snapshot={snapshot} />
      <section className="domain-card">
        <h2>Temperature and fishing activity</h2>
        <p>
          Compare point SST with regional AIS apparent fishing effort on dates
          returned by both sources.
        </p>
        <Notice>
          These have different spatial resolutions. The result is an exploratory
          time-aligned comparison, not a spatial correlation, causal
          attribution, or fish abundance model. Missing days are excluded, never
          filled with zeros.
        </Notice>
        <div className="domain-form">
          <button className="text-link" onClick={onExplore}>
            Load SST and fishing activity in Explore
          </button>
          <span>{pairs.length} overlapping dates</span>
          <button
            className="atlas-primary"
            disabled={busy || (!custom && pairs.length < 3)}
            onClick={compare}
          >
            {busy ? "Calculating..." : "Generate comparison"}
          </button>
        </div>
        <details>
          <summary>Compare your own aligned variables</summary>
          <p>
            Import JSON with x_label, y_label (include units), spatial_scope,
            sources (URL array), pairs (date, x, y). At least three unique
            dates; no automatic join is assumed. Region A/B comparisons require
            the same variables, dates and documented comparable sampling.
          </p>
          <input
            type="file"
            accept=".json"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                if (f.size > 1_000_000) throw Error("Maximum 1 MB.");
                setCustom(JSON.parse(await f.text()));
                setResult(null);
                setError(
                  "Custom input selected. Source metadata and paired values will be validated when you generate the comparison.",
                );
              } catch (err) {
                setError(String(err));
              }
            }}
          />
          {custom && (
            <button
              className="text-link"
              onClick={() => {
                setCustom(null);
                setResult(null);
              }}
            >
              Return to loaded ocean data
            </button>
          )}
        </details>
        {error && (
          <p role="status" className="domain-notice">
            {error}
          </p>
        )}
      </section>
      {result && (
        <section className="domain-card">
          <h2>
            {result.x_label} / {result.y_label}
          </h2>
          <p>
            {result.n} aligned pairs / Pearson r:{" "}
            <strong>
              {result.pearson_r == null
                ? "Undefined (constant variable)"
                : result.pearson_r.toFixed(3)}
            </strong>
          </p>
          <Scatter
            pairs={result.pairs}
            xLabel={result.x_label}
            yLabel={result.y_label}
          />
          <Notice>
            {result.method} {result.spatial_scope}{" "}
            {result.limitations.join(" ")}
          </Notice>
          <DataTable
            rows={result.pairs}
            columns={[
              ["date", "Date"],
              ["x", result.x_label],
              ["y", result.y_label],
            ]}
          />
          {result.sources.map((url: string) => (
            <Link key={url} url={url}>
              Source
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
function Scatter({
  pairs,
  xLabel,
  yLabel,
}: {
  pairs: any[];
  xLabel: string;
  yLabel: string;
}) {
  const xs = pairs.map((p) => p.x),
    ys = pairs.map((p) => p.y),
    xmin = Math.min(...xs),
    xmax = Math.max(...xs),
    ymin = Math.min(...ys),
    ymax = Math.max(...ys);
  return (
    <svg
      viewBox="0 0 620 285"
      role="img"
      aria-label={`${xLabel} versus ${yLabel}`}
      className="comparison-plot"
    >
      <path d="M70 20V230H600" fill="none" stroke="#8aa596" />
      {pairs.map((p, i) => (
        <circle
          key={i}
          cx={70 + ((p.x - xmin) * 510) / (xmax - xmin || 1)}
          cy={225 - ((p.y - ymin) * 195) / (ymax - ymin || 1)}
          r="5"
          fill="#3d806c"
        >
          <title>
            {p.date}: {p.x}, {p.y}
          </title>
        </circle>
      ))}
      <text x="70" y="250" fontSize="11">
        {xmin.toFixed(2)}
      </text>
      <text x="580" y="250" fontSize="11" textAnchor="end">
        {xmax.toFixed(2)}
      </text>
      <text x="60" y="25" fontSize="11" textAnchor="end">
        {ymax.toFixed(2)}
      </text>
      <text x="60" y="230" fontSize="11" textAnchor="end">
        {ymin.toFixed(2)}
      </text>
      <text x="310" y="276" fontSize="11" textAnchor="middle">
        {xLabel}
      </text>
    </svg>
  );
}
export function Administration() {
  const [sources, setSources] = useState<SourceInfo[]>([]),
    [status, setStatus] = useState<any>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    Promise.all([
      getSources(c.signal),
      api("/ai/status", { signal: c.signal }),
      api("/research/okf", { signal: c.signal }),
    ])
      .then(([s, a, k]) => {
        setSources(s.sources);
        setStatus({ ...a, ...k });
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(String(e));
      });
    return () => c.abort();
  }, []);
  return (
    <div className="domain-page">
      <Header
        eyebrow="DATA OPERATIONS"
        title="Know what is connected."
        text="Inspect configuration, import readiness and knowledge retrieval without exposing credentials."
      />
      {error && <Notice>{error}</Notice>}
      <div className="pipeline-stages">
        {[
          "Source",
          "Validation",
          "Standardization",
          "Metadata",
          "Repository",
          "Knowledge",
        ].map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
      <Notice>
        This is the ingestion architecture, not a live progress indicator.
        Per-provider synchronization jobs and schedules are not implemented.
      </Notice>
      <DataTable
        rows={sources}
        columns={[
          ["name", "Source"],
          ["domain", "Domain"],
          ["access", "Access"],
          ["status", "Configuration"],
          ["required_settings", "Required configuration"],
        ]}
      />
      {status && (
        <section className="domain-card">
          <h2>Knowledge engine</h2>
          <p>
            Retrieval: {status.retrieval} / OKF {status.version} /{" "}
            {status.concepts} research concepts from {status.documents} document
            parts.
          </p>
          <p>
            Model: {status.model}. Format conversion does not assert scientific
            verification.
          </p>
          <a className="atlas-primary" href="/api/research/okf/bundle" download>
            Export OKF bundle
          </a>
          <Notice>
            The bundle includes the shared research passages and source
            attribution. Keep publisher permissions when sharing.
          </Notice>
        </section>
      )}
    </div>
  );
}

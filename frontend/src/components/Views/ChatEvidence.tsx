import React from "react";
import {
  ChatResponse,
  safeSourceUrl,
  Visualization,
} from "../../services/atlas";

function DataView({ view }: { view: Visualization }) {
  const points = view.points.filter(
    (point) => typeof point.value === "number" && Number.isFinite(point.value),
  );
  const values = points.map((point) => point.value!);
  const min = Math.min(...values),
    max = Math.max(...values);
  const path = points
    .map(
      (point, index) =>
        `${20 + (index * 460) / Math.max(1, points.length - 1)},${100 - ((point.value! - min) / Math.max(0.1, max - min)) * 70}`,
    )
    .join(" ");
  return (
    <figure className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <figcaption className="text-xs font-semibold text-[#001b3d]">
        {view.title} [{view.evidence_id}]
      </figcaption>
      {view.type === "timeseries" && points.length > 0 ? (
        <>
          <svg
            viewBox="0 0 500 125"
            role="img"
            aria-label={`${view.title}: ${min} to ${max} ${view.unit}`}
            className="mt-2 w-full max-h-40"
          >
            <line x1="20" y1="105" x2="480" y2="105" stroke="#cbd5e1" />
            <polyline
              points={path}
              fill="none"
              stroke="#008ebe"
              strokeWidth="2.5"
            />
            {points.map((point, index) => (
              <circle
                key={index}
                cx={20 + (index * 460) / Math.max(1, points.length - 1)}
                cy={
                  100 - ((point.value! - min) / Math.max(0.1, max - min)) * 70
                }
                r="3"
                fill="#001b3d"
              >
                <title>
                  {point.time}: {point.value} {view.unit}
                </title>
              </circle>
            ))}
          </svg>
          <p className="text-[11px] text-slate-600">
            {points[0].time} — {points[points.length - 1].time} · Range {min}–
            {max} {view.unit}
          </p>
        </>
      ) : null}
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-[#006d91]">
          View retrieved values ({view.points.length})
        </summary>
        <div className="max-h-52 overflow-auto mt-2">
          <table className="w-full text-left">
            <thead>
              <tr>
                {view.type === "timeseries" ? (
                  <>
                    <th>Time (UTC)</th>
                    <th>{view.unit}</th>
                  </>
                ) : (
                  <>
                    <th>Reported taxon</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {view.points.map((point, index) => (
                <tr key={index} className="border-t border-slate-200">
                  {view.type === "timeseries" ? (
                    <>
                      <td className="py-1">{point.time}</td>
                      <td>{point.value}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-1">{point.label || "Unknown"}</td>
                      <td>{point.latitude}</td>
                      <td>{point.longitude}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

export function ChatEvidence({ result }: { result: ChatResponse }) {
  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-data-mono">
        <span className="rounded bg-slate-100 px-2 py-1">
          Planner · {result.plan.planner_mode}
        </span>
        {result.agents.map((agent) => (
          <span
            key={agent.domain}
            className={`rounded px-2 py-1 ${agent.status === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}
          >
            {agent.domain} · {agent.status.replaceAll("_", " ")} ·{" "}
            {agent.elapsed_ms} ms
          </span>
        ))}
      </div>
      {result.visualizations.map((view, index) => (
        <DataView key={index} view={view} />
      ))}
      {result.knowledge_graph?.edges.length > 0 && (
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer font-semibold">
            Evidence relationships ({result.knowledge_graph.edges.length})
          </summary>
          <p className="mt-2 text-slate-500">
            Source links and explicit mentions; these do not establish
            causation.
          </p>
          <ul className="mt-2 space-y-1">
            {result.knowledge_graph.edges.slice(0, 20).map((edge, index) => (
              <li key={index}>
                {
                  result.knowledge_graph.nodes.find(
                    (node) => node.id === edge.source,
                  )?.label
                }{" "}
                → {edge.kind.toLowerCase().replaceAll("_", " ")} →{" "}
                {
                  result.knowledge_graph.nodes.find(
                    (node) => node.id === edge.target,
                  )?.label
                }
              </li>
            ))}
          </ul>
        </details>
      )}
      {result.citations.length > 0 && (
        <details className="mt-4 border-t border-slate-200 pt-3" open>
          <summary className="text-xs font-semibold cursor-pointer">
            Evidence & sources ({result.citations.length})
          </summary>
          <div className="mt-2 space-y-3">
            {result.citations.map((citation) => (
              <div
                key={citation.id}
                className="text-xs border-l-2 border-[#00BFFF] pl-3"
              >
                <div className="font-semibold">
                  [{citation.id}]{" "}
                  {safeSourceUrl(citation.url) ? (
                    <a
                      className="text-[#006d91] underline"
                      href={safeSourceUrl(citation.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {citation.title}
                    </a>
                  ) : (
                    citation.title
                  )}
                </div>
                <p className="text-slate-500 mt-1">
                  {citation.source}
                  {citation.year ? ` · ${citation.year}` : ""}
                  {citation.page ? ` · page ${citation.page}` : ""}
                  {citation.kind === "local_unverified"
                    ? " · Unverified import"
                    : ""}
                </p>
                {citation.retrieved_at && (
                  <p className="text-slate-500">
                    Retrieved/indexed{" "}
                    {new Date(citation.retrieved_at).toLocaleString()}
                  </p>
                )}
                <details className="mt-1">
                  <summary className="cursor-pointer text-slate-600">
                    Read source passage
                  </summary>
                  <p className="whitespace-pre-wrap mt-2 text-slate-700 leading-relaxed">
                    {citation.text}
                  </p>
                </details>
              </div>
            ))}
          </div>
        </details>
      )}
      {result.limitations.length > 0 && (
        <div className="mt-4 rounded bg-amber-50 px-3 py-2 text-xs text-amber-950">
          <p className="font-semibold mb-1">Scope & limitations</p>
          <ul className="list-disc pl-4 space-y-1">
            {result.limitations.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

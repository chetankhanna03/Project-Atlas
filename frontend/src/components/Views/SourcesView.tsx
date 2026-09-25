import React, { useEffect, useRef, useState } from "react";
import { ActiveTab } from "../../types";
import { getSources, safeSourceUrl, SourceInfo } from "../../services/atlas";

interface SourcesViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onSyncClick: () => void;
}

const labels: Record<string, string> = {
  public_access: "Public access",
  configured: "Credentials configured",
  needs_credentials: "Credentials needed",
  index_available: "Local index available",
  needs_index: "Index setup needed",
  requires_import: "Import data to use",
  needs_product_selection: "Specific dataset needed",
};

export const SourcesView: React.FC<SourcesViewProps> = ({
  setActiveTab,
  onSyncClick,
}) => {
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [filter, setFilter] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<AbortController | null>(null);
  async function refresh() {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setError("");
    try {
      const result = await getSources(controller.signal);
      if (!controller.signal.aborted) {
        setSources(result.sources);
        setNote(result.note);
      }
    } catch (err) {
      if (!controller.signal.aborted)
        setError(
          err instanceof Error
            ? err.message
            : "Could not read source configuration.",
        );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
    return () => pending.current?.abort();
  }, []);
  return (
    <div className="flex-1 overflow-y-auto bg-[#f7f9fb] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white border rounded p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#001b3d]">
              Marine data sources
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              {note || "Reading backend configuration..."}
            </p>
          </div>
          <button
            onClick={() => void refresh()}
            disabled={loading}
            className="bg-[#001b3d] text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh configuration"}
          </button>
        </div>
        {error && (
          <p role="alert" className="bg-red-50 text-red-800 border p-4 rounded">
            {error}
          </p>
        )}
        <label className="domain-form">
          Find datasets by name or domain
          <input
            aria-label="Find datasets"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Oceanography, OBIS, molecular..."
            className="border rounded-lg p-3 bg-white"
          />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources
            .filter((s) =>
              (s.name + " " + s.domain)
                .toLowerCase()
                .includes(filter.toLowerCase()),
            )
            .map((source) => (
              <article
                key={source.id}
                className="bg-white border rounded p-5 space-y-3"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <h2 className="font-bold text-[#001b3d]">{source.name}</h2>
                  <span className="text-xs bg-slate-100 rounded px-2 py-1">
                    {labels[source.status] || source.status}
                  </span>
                </div>
                <p className="text-xs uppercase text-slate-500">
                  {source.domain} | {source.access.replaceAll("_", " ")}
                </p>
                <p className="text-sm text-slate-700">{source.limitations}</p>
                {source.endpoint && (
                  <code className="block text-xs break-all">
                    {source.endpoint}
                  </code>
                )}
                {source.required_settings.length > 0 && (
                  <p className="text-xs text-slate-600 break-words">
                    Backend settings: {source.required_settings.join(", ")}
                  </p>
                )}
                {safeSourceUrl(source.source_url) && (
                  <a
                    href={safeSourceUrl(source.source_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-700 underline"
                  >
                    Provider website
                  </a>
                )}
              </article>
            ))}
        </div>
        <div className="flex gap-4 pb-6">
          <button
            onClick={() => setActiveTab("floatchat")}
            className="bg-[#001b3d] text-white px-4 py-2 rounded"
          >
            Open FloatChat
          </button>
          <button onClick={onSyncClick} className="border px-4 py-2 rounded">
            Knowledge library status
          </button>
        </div>
      </div>
    </div>
  );
};

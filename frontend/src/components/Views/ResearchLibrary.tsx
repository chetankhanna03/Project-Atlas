import React, { useEffect, useRef, useState } from "react";
import {
  getDocuments,
  LibraryDocument,
  uploadDocument,
} from "../../services/atlas";

export function ResearchLibrary({
  selected,
  onSelect,
  expanded,
}: {
  selected: string[];
  onSelect: (ids: string[]) => void;
  expanded?: boolean;
}) {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState("");
  const controller = useRef<AbortController | null>(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const initial = new AbortController();
    getDocuments(initial.signal)
      .then((data) => setDocuments(data.documents))
      .catch((error) => {
        if (!initial.signal.aborted) {
          setNotice(error.message);
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (!initial.signal.aborted) setLoading(false);
      });
    return () => {
      initial.abort();
      controller.current?.abort();
    };
  }, []);
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const body = new FormData(event.currentTarget);
    body.set("use_embeddings", body.get("use_embeddings") ? "true" : "false");
    controller.current = new AbortController();
    setBusy(true);
    setNotice("Indexing document…");
    try {
      const result = await uploadDocument(body, key, controller.current.signal);
      const data = await getDocuments(controller.current.signal);
      setDocuments(data.documents);
      setNotice(
        `${result.title}: ${result.retrieval_mode.replaceAll("_", " ")}. ${result.limitations.join(" ")}`,
      );
      setKey("");
      form.current?.reset();
    } catch (error) {
      if (!controller.current.signal.aborted)
        setNotice(
          error instanceof Error ? error.message : "Document import failed.",
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details
      open={expanded}
      className="border-b border-slate-200 bg-white px-4 md:px-8 py-3"
    >
      <summary className="cursor-pointer text-xs font-semibold text-[#001b3d]">
        Scientific knowledge library ·{" "}
        {loading
          ? "Loading papers..."
          : loadFailed
            ? "Unavailable"
            : `${documents.length} documents`}
        {selected.length ? ` · ${selected.length} selected` : ""}
      </summary>
      <div className="max-h-[55vh] overflow-auto pt-3 space-y-3">
        <p className="text-xs text-slate-500">
          Select documents to restrict retrieval. With none selected, FloatChat
          searches the shared curated library.
        </p>
        {!loading && !loadFailed && documents.length === 0 && (
          <p className="text-xs text-slate-600">
            No documents indexed yet. A library administrator can import
            permitted scientific text below.
          </p>
        )}
        <div className="grid sm:grid-cols-2 gap-2">
          {documents.map((doc) => (
            <label
              key={doc.id}
              className="flex gap-2 p-2 rounded border border-slate-200 text-xs"
            >
              <input
                type="checkbox"
                checked={selected.includes(doc.id)}
                onChange={(event) =>
                  onSelect(
                    event.target.checked
                      ? [...selected, doc.id].slice(0, 20)
                      : selected.filter((id) => id !== doc.id),
                  )
                }
              />
              <span>
                {doc.title}
                <span className="block text-slate-500">
                  {doc.chunks} passages · {doc.embedded_chunks} embedded
                </span>
              </span>
            </label>
          ))}
        </div>
        <details className="text-xs">
          <summary className="cursor-pointer font-semibold">
            Import a document · administrator access
          </summary>
          <form
            ref={form}
            onSubmit={upload}
            className="mt-3 grid sm:grid-cols-2 gap-3 rounded bg-slate-50 p-3"
          >
            <label>
              Document title
              <input
                required
                name="title"
                maxLength={300}
                className="block w-full border rounded p-2 mt-1"
              />
            </label>
            <label>
              Source URL
              <input
                required
                name="source_url"
                type="url"
                placeholder="https://…"
                className="block w-full border rounded p-2 mt-1"
              />
            </label>
            <label>
              License / permission
              <input
                required
                name="license"
                maxLength={200}
                placeholder="e.g. CC BY 4.0"
                className="block w-full border rounded p-2 mt-1"
              />
            </label>
            <label>
              Library access key
              <input
                required
                type="password"
                autoComplete="off"
                value={key}
                onChange={(event) => setKey(event.target.value)}
                className="block w-full border rounded p-2 mt-1"
              />
            </label>
            <label className="sm:col-span-2">
              Document file · PDF, TXT or Markdown, up to 4 MB
              <input
                required
                name="file"
                type="file"
                accept=".pdf,.txt,.md"
                className="block mt-2"
              />
            </label>
            <label className="sm:col-span-2 flex items-start gap-2">
              <input type="checkbox" name="use_embeddings" />
              <span>
                Create semantic embeddings. This sends document text to the
                configured model provider. Otherwise, text stays in the local
                library for keyword retrieval.
              </span>
            </label>
            <p className="sm:col-span-2 text-slate-500">
              Imports are shared with other Atlas users. The access key is kept
              only in this form and cleared after a successful import.
            </p>
            <button
              disabled={busy || !key}
              className="bg-[#001b3d] text-white rounded px-3 py-2 disabled:opacity-50"
            >
              {busy ? "Indexing…" : "Import document"}
            </button>
          </form>
        </details>
        {notice && (
          <p role="status" className="text-xs text-slate-600">
            {notice}
          </p>
        )}
      </div>
    </details>
  );
}

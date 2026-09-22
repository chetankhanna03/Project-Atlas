export interface Scope {
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bbox?: number[] | null;
  species?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  days?: number;
  parameter?: string;
}

export interface Evidence {
  id: string;
  title: string;
  source: string;
  text: string;
  url?: string | null;
  retrieved_at?: string | null;
  year?: number | null;
  page?: number | null;
  authors: string[];
  kind: string;
}

export interface Visualization {
  type: "timeseries" | "locations";
  title: string;
  unit?: string;
  evidence_id: string;
  points: Array<{
    time?: string;
    value?: number;
    latitude?: number;
    longitude?: number;
    label?: string;
  }>;
}

export interface ChatResponse {
  request_id: string;
  status: string;
  answer: string;
  mode: "model" | "evidence_only";
  plan: { domains: string[]; scope: Scope; planner_mode: string };
  citations: Evidence[];
  agents: Array<{ domain: string; status: string; elapsed_ms: number }>;
  limitations: string[];
  follow_ups: string[];
  visualizations: Visualization[];
  knowledge_graph: {
    nodes: Array<{ id: string; kind: string; label: string }>;
    edges: Array<{ source: string; target: string; kind: string }>;
    persistence: string;
    limitations: string[];
  };
  elapsed_ms: number;
}

export interface AIStatus {
  provider: string;
  model: string;
  model_configured: boolean;
  literature_search_configured: boolean;
}

export interface LibraryDocument {
  id: string;
  title: string;
  chunks: number;
  embedded_chunks: number;
  source_url: string;
}

// Use the same-origin /api proxy in development and deployment. No provider keys in the browser.
async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init);
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body = await response.json();
      if (typeof body.detail === "string") message = body.detail;
      else if (response.status === 422)
        message =
          "Check your question, document metadata, or selected filters.";
    } catch {
      /* Preserve the HTTP status when a proxy returns HTML. */
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export const getAIStatus = (signal?: AbortSignal) =>
  jsonRequest<AIStatus>("/ai/status", { signal });

export interface SourceInfo {
  id: string;
  name: string;
  domain: string;
  access: string;
  status: string;
  endpoint?: string;
  source_url?: string;
  limitations: string;
  required_settings: string[];
}

export const getSources = (signal?: AbortSignal) =>
  jsonRequest<{ sources: SourceInfo[]; note: string }>("/sources", { signal });
export const getDocuments = (signal?: AbortSignal) =>
  jsonRequest<{ documents: LibraryDocument[] }>("/research/documents", {
    signal,
  });

export function sendChat(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  context: Scope | null,
  documentIds: string[],
  useLiterature: boolean,
  signal: AbortSignal,
) {
  return jsonRequest<ChatResponse>("/chat", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: history.slice(-8),
      context,
      document_ids: documentIds,
      use_literature_search: useLiterature,
    }),
  });
}

export function uploadDocument(
  body: FormData,
  key: string,
  signal?: AbortSignal,
) {
  return jsonRequest<{
    title: string;
    retrieval_mode: string;
    limitations: string[];
  }>("/research/documents/upload", {
    method: "POST",
    headers: { "X-API-Key": key },
    body,
    signal,
  });
}

export function safeSourceUrl(value?: string | null): string | undefined {
  try {
    const url = new URL(value || "");
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

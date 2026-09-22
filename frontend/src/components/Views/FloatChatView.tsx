import React, { useEffect, useRef, useState } from "react";
import { ActiveTab } from "../../types";
import {
  AIStatus,
  ChatResponse,
  getAIStatus,
  Scope,
  sendChat,
} from "../../services/atlas";
import { ChatEvidence } from "./ChatEvidence";
import { ResearchLibrary } from "./ResearchLibrary";

interface Props {
  setActiveTab: (tab: ActiveTab) => void;
  initialQuery?: string;
}
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: ChatResponse;
  error?: boolean;
}
const suggestions = [
  "Show SST at latitude 15, longitude 65",
  "Which species have been observed in the Arabian Sea?",
  "Find scientific literature about ocean warming and fisheries",
];

export const FloatChatView: React.FC<Props> = ({ initialQuery }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialQuery || "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [connectionError, setConnectionError] = useState("");
  const [context, setContext] = useState<Scope | null>(null);
  const [documents, setDocuments] = useState<string[]>([]);
  const [useLiterature, setUseLiterature] = useState(false);
  const pending = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    getAIStatus(controller.signal)
      .then(setStatus)
      .catch(() => {
        if (!controller.signal.aborted)
          setConnectionError(
            "Cannot reach the Atlas backend. Start it on port 8000 and retry.",
          );
      });
    return () => {
      controller.abort();
      pending.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (initialQuery) setInput(initialQuery);
  }, [initialQuery]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);
  async function send(value = input) {
    const question = value.trim();
    if (!question || pending.current || question.length > 2000) return;
    const controller = new AbortController();
    pending.current = controller;
    const history = messages
      .filter((message) => !message.error)
      .slice(-8)
      .map((message) => ({
        role: message.role,
        content: message.content.slice(0, 6000),
      }));
    setMessages((previous) => [
      ...previous,
      { id: crypto.randomUUID(), role: "user", content: question },
    ]);
    setInput("");
    setBusy(true);
    setConnectionError("");
    const timeout = window.setTimeout(
      () => controller.abort("timeout"),
      130000,
    );
    try {
      const result = await sendChat(
        question,
        history,
        context,
        documents,
        useLiterature,
        controller.signal,
      );
      if (!controller.signal.aborted) {
        setContext(result.plan.scope);
        setMessages((previous) => [
          ...previous,
          {
            id: result.request_id,
            role: "assistant",
            content: result.answer,
            result,
          },
        ]);
      }
    } catch (error) {
      if (
        !controller.signal.aborted ||
        controller.signal.reason === "timeout"
      ) {
        const content = controller.signal.aborted
          ? "The request timed out. Try a narrower question."
          : error instanceof Error
            ? error.message
            : "Could not retrieve an answer.";
        setMessages((previous) => [
          ...previous,
          { id: crypto.randomUUID(), role: "assistant", content, error: true },
        ]);
      }
    } finally {
      window.clearTimeout(timeout);
      if (pending.current === controller) {
        pending.current = null;
        setBusy(false);
      }
    }
  }
  function cancel() {
    pending.current?.abort();
    pending.current = null;
    setBusy(false);
  }
  function reset() {
    cancel();
    setMessages([]);
    setContext(null);
    setInput("");
  }
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f7f9fb]">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#008ebe]">
              forum
            </span>
            <h1 className="font-bold text-lg text-[#001b3d]">FloatChat</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ocean questions. Retrieved evidence. Traceable answers.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
            {status
              ? status.model_configured
                ? "Model configured"
                : "Evidence-only mode"
              : "Connecting..."}
          </span>
          <button
            type="button"
            onClick={reset}
            className="border border-slate-300 rounded px-3 py-1.5 hover:bg-slate-50"
          >
            New conversation
          </button>
        </div>
      </header>
      {connectionError && (
        <p
          role="alert"
          className="bg-amber-50 px-4 md:px-8 py-3 text-xs text-amber-900"
        >
          {connectionError}
        </p>
      )}
      {status && !status.model_configured && (
        <p className="bg-sky-50 px-4 md:px-8 py-2 text-xs text-sky-900">
          A model is not configured yet. Atlas can retrieve data and quote
          indexed documents; generated scientific explanations remain disabled.
        </p>
      )}
      <ResearchLibrary selected={documents} onSelect={setDocuments} />
      <div
        className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar"
        role="log"
        aria-label="FloatChat conversation"
        aria-live="polite"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="py-8 md:py-14">
              <span className="font-label-caps text-[#008ebe]">
                ATLAS OCEAN INTELLIGENCE
              </span>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#001b3d] mt-3">
                Start with a question about the ocean.
              </h2>
              <p className="max-w-xl text-sm text-slate-600 mt-3 leading-relaxed">
                Explore observations, biodiversity and scientific literature.
                Atlas selects the relevant agents and shows what each source can
                support.
              </p>
              <div className="grid md:grid-cols-3 gap-3 mt-7">
                {suggestions.map((query) => (
                  <button
                    key={query}
                    onClick={() => send(query)}
                    className="text-left text-xs leading-relaxed rounded-lg border border-slate-200 bg-white p-4 hover:border-[#008ebe] transition-colors"
                  >
                    {query}
                    <span
                      aria-hidden="true"
                      className="block text-[#008ebe] mt-3"
                    >
                      Ask Atlas &rarr;
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-5">
                No evidence? Atlas will say so. Point observations and
                correlations do not establish regional effects or causation.
              </p>
            </div>
          )}
          {messages.map((message) => (
            <article
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded-xl p-4 md:p-5 ${message.role === "user" ? "max-w-xl bg-[#001b3d] text-white" : "w-full bg-white border border-slate-200 text-slate-800"}`}
              >
                <div
                  className={`mb-2 text-[10px] uppercase tracking-wider font-semibold ${message.role === "user" ? "text-sky-200" : "text-slate-500"}`}
                >
                  {message.role === "user" ? "You" : "Atlas"}
                  {message.result
                    ? ` | ${message.result.mode === "model" ? "Cited synthesis" : "Retrieved evidence"} | ${message.result.status.replaceAll("_", " ")}`
                    : ""}
                </div>
                <p
                  className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${message.error ? "text-red-800" : ""}`}
                >
                  {message.content}
                </p>
                {message.result && <ChatEvidence result={message.result} />}
              </div>
            </article>
          ))}
          {busy && (
            <div
              className="flex items-center gap-3 text-sm text-slate-600"
              role="status"
            >
              <span className="material-symbols-outlined animate-spin text-[#008ebe]">
                progress_activity
              </span>
              Planning and retrieving supporting evidence...
              <button onClick={cancel} className="ml-auto text-xs underline">
                Cancel
              </button>
            </div>
          )}
          <div ref={end} />
        </div>
      </div>
      <footer className="shrink-0 border-t border-slate-200 bg-white p-4 md:px-8">
        <form
          className="max-w-4xl mx-auto"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <div className="flex items-end gap-3">
            <label className="flex-1">
              <span className="sr-only">Ask Atlas</span>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="Ask about ocean data or scientific evidence..."
                className="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm focus:outline-none focus:border-[#008ebe]"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
              />
            </label>
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="mb-1 bg-[#001b3d] text-white rounded-lg px-5 py-3 text-sm disabled:opacity-40"
            >
              Ask
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-[11px] text-slate-500">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useLiterature}
                disabled={!status?.literature_search_configured}
                onChange={(event) => setUseLiterature(event.target.checked)}
              />
              Search OpenAlex abstracts
              {!status?.literature_search_configured ? " | not configured" : ""}
            </label>
            <span>
              {documents.length
                ? `${documents.length} selected documents`
                : "Shared knowledge library"}{" "}
              | {input.length}/2000
            </span>
          </div>
          {context && (
            <p className="text-[11px] text-slate-500 mt-1">
              Follow-up context:{" "}
              {context.region ||
                (context.latitude != null
                  ? `${context.latitude}, ${context.longitude}`
                  : "no location")}{" "}
              | {context.parameter || "unspecified parameter"}
              {context.start_date
                ? ` | ${context.start_date} to ${context.end_date || "latest"}`
                : ""}
            </p>
          )}
        </form>
      </footer>
    </div>
  );
};

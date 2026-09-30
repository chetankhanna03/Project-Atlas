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
import { MessageCircle, ArrowUp, RotateCcw, LoaderCircle, BookOpen, Waves } from 'lucide-react';

interface Props {
  onResponse?: (result: ChatResponse) => void;
  setActiveTab: (tab: ActiveTab) => void;
  initialQuery?: string;
  initialScope?: Scope | null;
  initialDocumentIds?: string[];
}
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: ChatResponse;
  error?: boolean;
  retryQuestion?: string;
}

function AnswerText({text}: {text:string}) {
  const inline = (line:string) => line.split(/(\*\*[^*]+\*\*)/g).map((part,i) => part.startsWith('**') ? <strong key={i}>{part.slice(2,-2)}</strong> : part);
  return <div className="atlas-answer-text">{text.split(/\n\s*\n/).map((block,i) => {
    const lines=block.split('\n');
    if(lines.length>2 && /^\s*\|/.test(lines[0]) && /^\s*\|?\s*:?-{3,}/.test(lines[1])) {
      const cells=(line:string)=>line.trim().replace(/^\||\|$/g,'').split('|').map(cell=>cell.trim());
      return <div key={i} className="overflow-x-auto"><table><thead><tr>{cells(lines[0]).map((cell,j)=><th key={j}>{inline(cell)}</th>)}</tr></thead><tbody>{lines.slice(2).map((line,j)=><tr key={j}>{cells(line).map((cell,k)=><td key={k}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>;
    }
    if(lines.every(line=>/^\s*(?:[-*]|\d+[.)])\s/.test(line))) return <ul key={i}>{lines.map((line,j)=><li key={j}>{inline(line.replace(/^\s*(?:[-*]|\d+[.)])\s/,''))}</li>)}</ul>;
    return <p key={i}>{inline(block.replace(/^#{1,6}\s/gm,''))}</p>;
  })}</div>;
}
const suggestions = [
  "How does warmer water affect fish?",
  "Show SST at latitude 15, longitude 65",
  "Which species have been observed in the Arabian Sea?",
  "Find scientific literature about ocean warming and fisheries",
];

export const FloatChatView: React.FC<Props> = ({
  initialQuery,
  initialScope,
  initialDocumentIds,
  onResponse,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialQuery || "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [connectionError, setConnectionError] = useState("");
  const [context, setContext] = useState<Scope | null>(initialScope || null);
  const [documents, setDocuments] = useState<string[]>(
    initialDocumentIds || [],
  );
  useEffect(() => {
    if (initialDocumentIds) setDocuments(initialDocumentIds);
  }, [initialDocumentIds]);
  const [useLiterature, setUseLiterature] = useState(false);
  const [answerMode, setAnswerMode] = useState<'auto' | 'conversation' | 'research'>('auto');
  const [elapsed, setElapsed] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!busy) return;
    setElapsed(0);
    const timer=window.setInterval(()=>setElapsed(s=>s+1),1000);
    return ()=>window.clearInterval(timer);
  },[busy]);
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
    const log=logRef.current;
    if(log) log.scrollTop=log.scrollHeight;
  }, [messages, busy]);
  useEffect(() => {
    if (initialScope) setContext(initialScope);
  }, [initialScope]);
  async function send(value = input, retryId?: string) {
    const question = value.trim();
    if (!question || pending.current || question.length > 2000) return;
    const controller = new AbortController();
    pending.current = controller;
    const conversation = retryId && messages.at(-1)?.id === retryId ? messages.slice(0,-2) : messages;
    const history = conversation
      .filter((message) => !message.error)
      .slice(-8)
      .map((message) => ({
        role: message.role,
        content: message.content.slice(0, 6000),
      }));
    setMessages([
      ...conversation,
      { id: crypto.randomUUID(), role: "user", content: question },
    ]);
    setInput("");
    setBusy(true);
    setConnectionError("");
    const timeout = window.setTimeout(
      () => controller.abort("timeout"),
      250000,
    );
    try {
      const result = await sendChat(
        question,
        history,
        context,
        documents,
        useLiterature,
        controller.signal,
        answerMode,
      );
      if (!controller.signal.aborted) {
        if(result.status !== 'unavailable') {
          onResponse?.(result);
          setContext(result.plan.scope);
        }
        setMessages((previous) => [
          ...previous,
          {
            id: result.request_id,
            role: "assistant",
            content: result.answer,
            result,
            error: result.status === 'unavailable',
            retryQuestion: result.status === 'unavailable' ? question : undefined,
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
          { id: crypto.randomUUID(), role: "assistant", content, error: true, retryQuestion: question },
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
    setDocuments([]);
    setUseLiterature(false);
  }
  return (
    <div className="atlas-chat flex-1 flex flex-col h-full overflow-hidden bg-[#f7f9fb]">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MessageCircle size={24} className="text-[#27655b]" />
            <h1 className="font-bold text-lg text-[#001b3d]">Ask Atlas</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ask simply, explore ocean data, or dig into the literature.
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
      {context?.bbox && (
        <div className="chat-area-context">
          <span>Exploring your selected area</span>
          <small>
            {context.bbox.map((n) => n.toFixed(2)).join(" / ")} (W / S / E / N)
          </small>
          <button onClick={() => setContext(null)}>Clear area context</button>
        </div>
      )}
      <div
        ref={logRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar"
        role="log"
        aria-label="FloatChat conversation"
        aria-live="polite"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="atlas-chat-welcome py-8 md:py-14">
              <div className="atlas-chat-emblem"><Waves size={32}/></div>
              <span className="font-label-caps text-[#008ebe]">
                ATLAS OCEAN INTELLIGENCE
              </span>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#001b3d] mt-3">
                A little curiosity. A deeper understanding.
              </h2>
              <p className="max-w-xl text-sm text-slate-600 mt-3 leading-relaxed">
                Start with a simple question. Follow your curiosity, explore a place,
                or ask for an explanation backed by research.
              </p>
              <div className="atlas-chat-suggestions grid md:grid-cols-2 gap-3 mt-7">
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
                    ? ` | ${message.result.mode === "conversation" ? "Conversation · not source-verified" : message.result.mode === "model" ? "Cited synthesis" : "Retrieved evidence"} | ${message.result.status.replaceAll("_", " ")}`
                    : ""}
                </div>
                <div className={message.error ? 'text-red-800' : ''}><AnswerText text={message.content}/></div>
                {message.retryQuestion && message.id === messages.at(-1)?.id && <button className="atlas-chat-retry" disabled={busy} onClick={()=>send(message.retryQuestion,message.id)}><RotateCcw size={14}/> Retry question</button>}
                {message.result && message.result.mode !== 'conversation' && <details className="atlas-chat-evidence"><summary><BookOpen size={15}/> Sources and answer details ({message.result.citations.length})</summary><ChatEvidence result={message.result} /></details>}
              </div>
            </article>
          ))}
          {busy && (
            <div
              className="flex items-center gap-3 text-sm text-slate-600"
              role="status"
            >
              <LoaderCircle size={18} className="animate-spin"/>
              <span>{elapsed >= 20 ? 'Still waiting for the model or sources… You can cancel.' : 'Atlas is working on your answer…'} <small>{elapsed}s</small></span>
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
          <label className="atlas-chat-mode block text-xs text-slate-600 mb-3">
            Answer mode{' '}
            <select aria-label="Answer mode" value={answerMode} disabled={busy} onChange={e=>setAnswerMode(e.target.value as typeof answerMode)} className="border rounded-lg p-2 bg-white">
              <option value="auto">Auto — conversation, data or literature</option>
              <option value="conversation">Conversation — general explanations</option>
              <option value="research">Research — retrieved sources and citations</option>
            </select>
            <span className="block mt-1">{answerMode === 'conversation' ? 'General answers · no source retrieval' : answerMode === 'research' ? 'Retrieved evidence with source citations' : 'Simple questions answered directly · ask for sources to use research'}</span>
          </label>
          <div className="flex items-end gap-3">
            <label className="flex-1">
              <span className="sr-only">Ask Atlas</span>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="Ask a question, follow up, or ask for sources..."
                className="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm focus:outline-none focus:border-[#008ebe]"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
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
              <ArrowUp size={19} aria-hidden="true"/> <span>Ask</span>
            </button>
          </div>
          <details className="atlas-chat-options"><summary>Research options {documents.length > 0 ? `· ${documents.length} selected papers` : ''}</summary>
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
          </details>
          {context && (context.region || context.bbox || context.latitude != null) && (
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

import React, { useState } from "react";
import {
  Compass,
  Waves,
  MessageCircle,
  Layers3,
  ArrowUpRight,
  BookOpen,
  X,
  Menu,
  ArrowLeft,
  Globe2,
  Home,
  Fish,
  Ship,
  Activity,
  Settings2,
} from "lucide-react";
import {
  Overview,
  Fisheries,
  Biodiversity,
  Analytics,
  Administration,
} from "./components/Views/DomainViews";
import type { OceanSnapshot } from "./components/Views/OceanWorkspace";
import { OceanWorkspace } from "./components/Views/OceanWorkspace";
import { FloatChatView } from "./components/Views/FloatChatView";
import { SourcesView } from "./components/Views/SourcesView";
import { ResearchLibrary } from "./components/Views/ResearchLibrary";
import type { ActiveTab } from "./types";
import type { Scope } from "./services/atlas";
import "./atlas.css";

export default function App() {
  const [tab, setTab] = useState<ActiveTab>("home");
  const [snapshot, setSnapshot] = useState<OceanSnapshot | null>(null);
  const [domain, setDomain] = useState("");
  const [exploreVisited, setExploreVisited] = useState(false);
  const [menu, setMenu] = useState(false);
  const [question, setQuestion] = useState("");
  const [scope, setScope] = useState<Scope | null>(null);
  const [chatVisited, setChatVisited] = useState(false);
  const [library, setLibrary] = useState(false);
  const [documents, setDocuments] = useState<string[]>([]);
  const navigate = (next: ActiveTab) => {
    setTab(["dashboard", "map", "landing"].includes(next) ? "explore" : next);
    if (["explore", "dashboard", "map", "landing"].includes(next))
      setExploreVisited(true);
    if (next === "floatchat") setChatVisited(true);
    setMenu(false);
  };
  const ask = (text: string, context: Scope) => {
    setQuestion(text);
    setScope(context);
    navigate("floatchat");
  };
  const exploreDomain = (value: string) => {
    setDomain(value);
    navigate("explore");
  };
  const items = [
    { id: "home", title: "Home", detail: "The connected platform", icon: Home },
    {
      id: "explore",
      title: "Explore",
      detail: "Your ocean workspace",
      icon: Compass,
    },
    {
      id: "floatchat",
      title: "Ask Atlas",
      detail: "Questions to understanding",
      icon: MessageCircle,
    },
    {
      id: "analytics",
      title: "Analytics",
      detail: "Compare domain evidence",
      icon: Activity,
    },
    {
      id: "fisheries",
      title: "Fisheries",
      detail: "Effort, catch and context",
      icon: Ship,
    },
    {
      id: "biodiversity",
      title: "Biodiversity",
      detail: "Taxonomy, eDNA and otoliths",
      icon: Fish,
    },
    {
      id: "sources",
      title: "Data catalog",
      detail: "Follow the evidence",
      icon: Layers3,
    },
    {
      id: "admin",
      title: "Data operations",
      detail: "Ingestion and knowledge",
      icon: Settings2,
    },
  ] as const;
  const title = items.find((item) => item.id === tab)?.title || "About Atlas";
  return (
    <div className="atlas-app">
      {menu && (
        <button
          className="atlas-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`atlas-sidebar ${menu ? "is-open" : ""}`}>
        <button
          className="atlas-brand"
          onClick={() => navigate("home")}
          aria-label="Atlas home"
        >
          <span className="brand-mark">
            <Waves size={25} />
          </span>
          <span>
            atlas<span className="brand-period">.</span>
            <small>OCEAN INTELLIGENCE</small>
          </span>
        </button>
        <p className="nav-eyebrow">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {items.map(({ id, title, detail, icon: Icon }) => (
            <button
              key={id}
              aria-label={title}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => navigate(id)}
              className={`atlas-nav-item ${tab === id ? "active" : ""}`}
            >
              <Icon size={20} />
              <span>
                {title}
                <small>{detail}</small>
              </span>
              {tab === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="contour-art">
            <Globe2 size={76} strokeWidth={0.65} />
          </div>
          <span className="tiny-label">ONE CONNECTED OCEAN</span>
          <h3>
            Better questions.
            <br />
            Deeper understanding.
          </h3>
          <p>Explore ocean observations and the science behind them.</p>
          <button onClick={() => navigate("about")}>
            Meet Project Atlas <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <span className="small-compass">
            <Compass size={16} />
          </span>
          <div>
            Project Atlas<small>Built for ocean discovery</small>
          </div>
        </div>
      </aside>
      <div className="atlas-main">
        <header className="atlas-topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              aria-label="Open Navigation Menu"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span>Workspace</span>
            <span className="slash">/</span>
            <strong>{title}</strong>
          </div>
          <button
            className="library-shortcut"
            onClick={() => {
              navigate("sources");
              setLibrary(true);
            }}
          >
            <BookOpen size={16} />
            <span>Research library</span>
            <ArrowUpRight size={14} />
          </button>
        </header>
        <main className="atlas-canvas">
          {tab === "home" && (
            <Overview
              snapshot={snapshot}
              onExplore={(value) =>
                value === "biodiversity"
                  ? navigate("biodiversity")
                  : exploreDomain(value)
              }
              onAsk={() => navigate("floatchat")}
            />
          )}
          {exploreVisited && (
            <div hidden={tab !== "explore"} className="atlas-screen">
              <OceanWorkspace
                mode="map"
                onAskAtlas={ask}
                onSnapshot={setSnapshot}
                domain={domain}
              />
            </div>
          )}
          {tab === "analytics" && (
            <Analytics
              snapshot={snapshot}
              onExplore={() => exploreDomain("fisheries")}
            />
          )}
          {tab === "fisheries" && (
            <Fisheries
              snapshot={snapshot}
              onExplore={() => exploreDomain("fisheries")}
            />
          )}
          {tab === "biodiversity" && (
            <Biodiversity
              snapshot={snapshot}
              onExplore={() => exploreDomain("biodiversity")}
              onAsk={(text) => ask(text, {})}
            />
          )}
          {tab === "admin" && <Administration />}
          {chatVisited && (
            <div
              hidden={tab !== "floatchat"}
              className="atlas-screen chat-screen"
            >
              <FloatChatView
                setActiveTab={navigate}
                initialQuery={question}
                initialScope={scope}
                initialDocumentIds={documents}
              />
            </div>
          )}
          {tab === "sources" && (
            <div className="atlas-screen sources-screen">
              <div className="source-intro">
                <span className="tiny-label">THE EVIDENCE BEHIND ATLAS</span>
                <h1>
                  Every insight starts
                  <br />
                  with a source.
                </h1>
                <p>
                  Explore connected datasets and the research that gives
                  observations context.
                </p>
                <div className="source-tabs">
                  <button
                    aria-pressed={!library}
                    onClick={() => setLibrary(false)}
                  >
                    Data connections
                  </button>
                  <button
                    aria-pressed={library}
                    onClick={() => setLibrary(true)}
                  >
                    Research papers
                  </button>
                </div>
              </div>
              {library ? (
                <div className="library-page">
                  <ResearchLibrary
                    expanded
                    selected={documents}
                    onSelect={setDocuments}
                  />
                  <button
                    className="atlas-primary"
                    onClick={() => navigate("floatchat")}
                  >
                    Ask a question about the research <ArrowUpRight size={16} />
                  </button>
                  <p>Selected papers will be carried into your conversation.</p>
                </div>
              ) : (
                <SourcesView
                  setActiveTab={navigate}
                  onSyncClick={() => setLibrary(true)}
                />
              )}
            </div>
          )}
          {tab === "about" && (
            <div className="about-screen">
              <button className="text-link" onClick={() => navigate("explore")}>
                <ArrowLeft size={16} /> Back to Explore
              </button>
              <span className="tiny-label">PROJECT ATLAS</span>
              <h1>
                Our ocean is connected.
                <br />
                Our understanding
                <br />
                should be too.
              </h1>
              <p>
                Atlas brings ocean conditions, biodiversity records, fishing
                activity and scientific literature into one workspace. Start
                with a place, inspect the observations, then ask what the
                evidence supports.
              </p>
              <div className="about-grid">
                {[
                  [
                    "01",
                    "Observe",
                    "Query real sources in your selected area. Every returned record keeps its origin.",
                  ],
                  [
                    "02",
                    "Understand",
                    "Use charts and cited research to explore patterns and their limitations.",
                  ],
                  [
                    "03",
                    "Stay curious",
                    "A sample is not a census. Atlas keeps coverage and uncertainty visible.",
                  ],
                ].map(([n, t, d]) => (
                  <article key={n}>
                    <span>{n}</span>
                    <h2>{t}</h2>
                    <p>{d}</p>
                  </article>
                ))}
              </div>
              <button
                className="atlas-primary"
                onClick={() => navigate("explore")}
              >
                Explore the ocean <ArrowUpRight size={16} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

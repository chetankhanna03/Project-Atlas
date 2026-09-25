import React from "react";
import { ActiveTab } from "../../types";
export const LandingView: React.FC<{
  setActiveTab: (tab: ActiveTab) => void;
  onExploreDataClick: () => void;
  onAskAtlasClick: () => void;
}> = ({ setActiveTab, onExploreDataClick, onAskAtlasClick }) => (
  <main className="flex-1 bg-slate-50 px-6 py-20">
    <div className="max-w-5xl mx-auto">
      <p className="text-cyan-700 font-semibold tracking-widest text-sm uppercase">
        Project Atlas
      </p>
      <h1 className="text-4xl md:text-6xl font-bold text-slate-900 max-w-3xl mt-5 leading-tight">
        Explore ocean data.
        <br />
        Trace every answer.
      </h1>
      <p className="mt-7 max-w-2xl text-lg text-slate-600">
        Compare source observations on an interactive map and ask questions
        grounded in your research library. Coverage, dates and limitations stay
        visible.
      </p>
      <div className="flex flex-wrap gap-3 mt-9">
        <button
          className="rounded-xl bg-cyan-800 text-white px-6 py-3"
          onClick={() => setActiveTab("dashboard")}
        >
          Open dashboard
        </button>
        <button
          className="rounded-xl border bg-white px-6 py-3"
          onClick={onAskAtlasClick}
        >
          Ask FloatChat
        </button>
        <button
          className="rounded-xl border bg-white px-6 py-3"
          onClick={onExploreDataClick}
        >
          Browse sources
        </button>
      </div>
    </div>
  </main>
);

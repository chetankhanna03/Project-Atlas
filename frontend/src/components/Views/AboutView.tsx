import React from 'react';
import { ActiveTab } from '../../types';

interface AboutViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ setActiveTab }) => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#f7f9fb] p-4 md:p-8 custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Mission Card */}
        <div className="bg-[#001b3d] text-white rounded p-8 border border-[#001b3d] relative overflow-hidden shadow-md">
          <div
            className="absolute inset-0 z-0 opacity-15"
            style={{
              backgroundImage:
                'radial-gradient(circle at 80% 20%, #00BFFF 0%, transparent 60%)',
            }}
          />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 font-label-caps text-[11px] text-[#00BFFF] border border-[#00BFFF] px-3 py-0.5 rounded uppercase">
              Scientific Architecture
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              About Project Atlas
            </h1>
            <p className="text-sm md:text-base text-[#d5e3ff] leading-relaxed">
              Project Atlas is an open ocean intelligence platform built to unify disparate marine observation networks—ranging from NOAA/Copernicus satellite constellations to autonomous ARGO profiling arrays and Global Fishing Watch vessel telemetry.
            </p>
          </div>
        </div>

        {/* Multi-Agent Architecture */}
        <div className="bg-white border border-[#c4c6cf] rounded p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-[#001b3d] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00BFFF]">hub</span>
            Multi-Agent Knowledge Orchestration
          </h2>
          <p className="text-xs text-[#44474e] leading-relaxed">
            Atlas implements a modular multi-agent retrieval pipeline composed of three primary micro-agents:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-[#f7f9fb] border border-[#c4c6cf] rounded p-4">
              <span className="font-label-caps text-[10px] text-[#00BFFF] bg-[#001b3d] px-2 py-0.5 rounded uppercase font-bold">
                Agent 01
              </span>
              <h3 className="font-bold text-sm text-[#001b3d] mt-2 mb-1">Planner Agent</h3>
              <p className="text-xs text-[#44474e] leading-relaxed">
                Deconstructs natural language oceanographic hypotheses into targeted spatial-temporal bounding queries.
              </p>
            </div>

            <div className="bg-[#f7f9fb] border border-[#c4c6cf] rounded p-4">
              <span className="font-label-caps text-[10px] text-[#008ebe] bg-[#e0f2fe] px-2 py-0.5 rounded uppercase font-bold">
                Agent 02
              </span>
              <h3 className="font-bold text-sm text-[#001b3d] mt-2 mb-1">Ocean RAG Agent</h3>
              <p className="text-xs text-[#44474e] leading-relaxed">
                Retrieves peer-reviewed oceanographic citations, NetCDF parameter schemas, and in-situ ARGO profiles.
              </p>
            </div>

            <div className="bg-[#f7f9fb] border border-[#c4c6cf] rounded p-4">
              <span className="font-label-caps text-[10px] text-[#2e7d32] bg-[#e8f5e9] px-2 py-0.5 rounded uppercase font-bold">
                Agent 03
              </span>
              <h3 className="font-bold text-sm text-[#001b3d] mt-2 mb-1">Fisheries &amp; Eco Model</h3>
              <p className="text-xs text-[#44474e] leading-relaxed">
                Correlates SST anomalies with trophic shifts, biomass depletion indices, and AIS fishing vessel displacements.
              </p>
            </div>
          </div>
        </div>

        {/* Data Standards & Compliance */}
        <div className="bg-white border border-[#c4c6cf] rounded p-6 shadow-xs space-y-3">
          <h2 className="text-lg font-bold text-[#001b3d] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00BFFF]">verified_user</span>
            Data Standards &amp; Interoperability
          </h2>
          <p className="text-xs text-[#44474e] leading-relaxed">
            All data streams processed by Project Atlas conform strictly to Climate and Forecast (CF) Metadata Conventions (v1.8), OGC WMS/WCS standards, and Darwin Core Archives for biodiversity tracking.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="font-data-mono text-[11px] bg-[#f2f4f6] text-[#001b3d] px-3 py-1 rounded border border-[#c4c6cf]">NetCDF-4 / HDF5</span>
            <span className="font-data-mono text-[11px] bg-[#f2f4f6] text-[#001b3d] px-3 py-1 rounded border border-[#c4c6cf]">GeoParquet</span>
            <span className="font-data-mono text-[11px] bg-[#f2f4f6] text-[#001b3d] px-3 py-1 rounded border border-[#c4c6cf]">ERDDAP RESTful API</span>
            <span className="font-data-mono text-[11px] bg-[#f2f4f6] text-[#001b3d] px-3 py-1 rounded border border-[#c4c6cf]">OGC GeoTIFF</span>
          </div>
        </div>

        {/* Navigation Quick Links */}
        <div className="flex justify-between items-center bg-[#f2f4f6] p-4 rounded border border-[#c4c6cf]">
          <span className="text-xs text-[#44474e]">Ready to start exploring oceanic datasets?</span>
          <button
            onClick={() => setActiveTab('explore')}
            className="px-4 py-2 bg-[#001b3d] hover:bg-[#002d66] text-white text-xs font-label-caps uppercase rounded transition-colors"
          >
            Go to Data Catalog
          </button>
        </div>
      </div>
    </div>
  );
};

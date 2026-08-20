import React from 'react';
import { ActiveTab } from '../../types';

interface LandingViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onExploreDataClick: () => void;
  onAskAtlasClick: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  setActiveTab,
  onExploreDataClick,
  onAskAtlasClick,
}) => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full min-h-[720px] md:min-h-[820px] flex items-center justify-center border-b border-[#c4c6cf] overflow-hidden bg-[#001b3d]">
        {/* Abstract GIS Background */}
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
          <div
            className="bg-cover bg-center w-full h-full"
            style={{
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBvj9oLXjzeeu5ZY2BAvRcddlcSxt3F5Q7hugZbUbFTaek6HgN_hRlGcA8cKHg7n90gURlGaq-i1ODEkO96zrHUweD9EFgsiORxKRD0VDauQzKF4RkWDR0bxjClqe1r5OA-cTtyqBbWZ_XQRQ7970TDDK-roER1yZhsQruExN-1tetVpvAWOG3eT8u7ZHMxI22vBWgVgUJuD5CYGLsJ3QJEFGVRYkw8WdOS_gFBBcyTFv8UQbKYitDKJg')`,
            }}
          />
        </div>

        {/* Subtle Grid Overlay */}
        <div
          className="absolute inset-0 z-10 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#e0e3e5 1px, transparent 1px), linear-gradient(90deg, #e0e3e5 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center gap-6 py-16">
          <div className="inline-flex items-center gap-2 font-label-caps text-[12px] text-[#00BFFF] tracking-widest border border-[#00BFFF] px-3.5 py-1 rounded bg-[#001B3D]/70 backdrop-blur-sm shadow-[0_0_10px_rgba(0,191,255,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#00BFFF] animate-pulse" />
            <span>System Online</span>
          </div>

          <h1 className="text-white text-4xl sm:text-5xl md:text-[64px] font-bold leading-tight tracking-tight max-w-3xl">
            Unified Intelligence for a Changing Ocean
          </h1>

          <p className="text-[#d5e3ff] text-base md:text-lg max-w-2xl text-center leading-relaxed">
            Project Atlas aggregates, analyzes, and predicts critical marine data layers. Engineered for scientific rigor and geospatial precision.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <button
              onClick={onExploreDataClick}
              className="bg-[#00BFFF] hover:bg-[#33ccff] text-[#001b3d] font-label-caps text-[12px] uppercase tracking-wider px-7 py-3.5 rounded transition-all shadow-[0_0_20px_rgba(0,191,255,0.35)] font-bold active:scale-[0.98] cursor-pointer"
            >
              Explore Ocean Data
            </button>
            <button
              onClick={onAskAtlasClick}
              className="bg-transparent hover:bg-white/10 text-white border border-white font-label-caps text-[12px] uppercase tracking-wider px-7 py-3.5 rounded transition-all active:scale-[0.98] cursor-pointer"
            >
              Ask Atlas
            </button>
          </div>
        </div>
      </section>

      {/* Active Data Streams Marquee */}
      <section className="py-8 border-b border-[#c4c6cf] bg-white overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 mb-4 flex justify-between items-center">
          <h3 className="font-label-caps text-[11px] text-[#44474e] uppercase tracking-widest">
            Active Data Streams
          </h3>
          <span className="font-data-mono text-[11px] text-[#006633] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#006633] animate-ping" />
            5 Pipelines Ingesting
          </span>
        </div>

        <div className="flex items-center gap-12 md:gap-16 px-4 md:px-8 overflow-x-auto no-scrollbar py-2">
          <div className="font-data-mono text-[13px] text-[#44474e] hover:text-[#001b3d] flex items-center gap-2 whitespace-nowrap bg-[#f7f9fb] px-3.5 py-2 rounded border border-[#e0e3e5] transition-colors cursor-pointer" onClick={() => setActiveTab('explore')}>
            <span className="material-symbols-outlined text-[18px] text-[#00BFFF]">satellite_alt</span>
            <span>NOAA NESDIS</span>
          </div>
          <div className="font-data-mono text-[13px] text-[#44474e] hover:text-[#001b3d] flex items-center gap-2 whitespace-nowrap bg-[#f7f9fb] px-3.5 py-2 rounded border border-[#e0e3e5] transition-colors cursor-pointer" onClick={() => setActiveTab('explore')}>
            <span className="material-symbols-outlined text-[18px] text-[#00BFFF]">radar</span>
            <span>ESA COPERNICUS</span>
          </div>
          <div className="font-data-mono text-[13px] text-[#44474e] hover:text-[#001b3d] flex items-center gap-2 whitespace-nowrap bg-[#f7f9fb] px-3.5 py-2 rounded border border-[#e0e3e5] transition-colors cursor-pointer" onClick={() => setActiveTab('map')}>
            <span className="material-symbols-outlined text-[18px] text-[#00BFFF]">water</span>
            <span>ARGO FLOATS</span>
          </div>
          <div className="font-data-mono text-[13px] text-[#44474e] hover:text-[#001b3d] flex items-center gap-2 whitespace-nowrap bg-[#f7f9fb] px-3.5 py-2 rounded border border-[#e0e3e5] transition-colors cursor-pointer" onClick={() => setActiveTab('analytics')}>
            <span className="material-symbols-outlined text-[18px] text-[#00BFFF]">directions_boat</span>
            <span>GLOBAL FISHING WATCH</span>
          </div>
          <div className="font-data-mono text-[13px] text-[#44474e] hover:text-[#001b3d] flex items-center gap-2 whitespace-nowrap bg-[#f7f9fb] px-3.5 py-2 rounded border border-[#e0e3e5] transition-colors cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <span className="material-symbols-outlined text-[18px] text-[#00BFFF]">science</span>
            <span>INCOIS</span>
          </div>
        </div>
      </section>

      {/* Capabilities Bento Grid */}
      <section className="py-16 px-4 md:px-8 max-w-[1440px] mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#001b3d] tracking-tight">
            Core Capabilities
          </h2>
          <p className="text-sm text-[#44474e] mt-1.5 max-w-xl">
            Modular intelligence tools designed for multifaceted oceanic analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Physical Oceanography (Span 2) */}
          <div 
            onClick={() => setActiveTab('explore')}
            className="bg-white border border-[#c4c6cf] rounded p-5 md:col-span-2 hover:border-[#00BFFF] transition-all group flex flex-col justify-between min-h-[300px] cursor-pointer shadow-xs"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-label-caps text-[12px] uppercase text-[#001b3d] group-hover:text-[#00BFFF] transition-colors">
                Ocean Intelligence
              </h3>
              <span className="material-symbols-outlined text-[#44474e] group-hover:text-[#00BFFF] transition-colors">
                waves
              </span>
            </div>

            <div className="mt-auto">
              <div className="mb-4 h-36 bg-[#eceef0] w-full rounded border border-[#c4c6cf] relative overflow-hidden">
                <div
                  className="bg-cover bg-center w-full h-full opacity-85 mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                  style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDf6WNKO-PEfZ6Wc6x2GG7a2Iw2Iwl6VdjZgOzJ0ADVj2solUfNWkham1n4J4IMufyQxE1humQ0fAivXx1g5RyZ0K8crrb6oClrHEwJub9Fzet3J-u67dvcj3KknThD4R9fIvGHejRjros6CjMXYmzMpYKgHR7Vo7lblSEcmSFzCAECHylCes0TZn-BX6wpKcmVeUGEKZDZW54p981HcxIYHJAV6Jd4a9PFCY9Al_NBPtEKrtFTKeO24A')`,
                  }}
                />
              </div>
              <p className="text-sm text-[#191c1e] leading-relaxed">
                Real-time mapping of physical oceanography, including SST, salinity gradients, and surface currents derived from multi-sensor satellite arrays.
              </p>
            </div>
          </div>

          {/* Card 2: Vessel Tracking */}
          <div 
            onClick={() => setActiveTab('analytics')}
            className="bg-white border border-[#c4c6cf] rounded p-5 hover:border-[#00BFFF] transition-all group flex flex-col justify-between min-h-[300px] cursor-pointer shadow-xs"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-label-caps text-[12px] uppercase text-[#001b3d] group-hover:text-[#00BFFF] transition-colors">
                Fisheries Intelligence
              </h3>
              <span className="material-symbols-outlined text-[#44474e] group-hover:text-[#00BFFF] transition-colors">
                sailing
              </span>
            </div>
            <div className="mt-auto">
              <div className="h-24 bg-[#f2f4f6] rounded border border-[#e0e3e5] mb-3 p-3 flex flex-col justify-between">
                <span className="font-data-mono text-[11px] text-[#44474e]">AIS Active Fleets</span>
                <span className="font-bold text-xl text-[#001b3d]">1,402 Tracked</span>
                <span className="text-[10px] text-[#006633] font-data-mono">Dark fleet anomaly alerts: 3</span>
              </div>
              <p className="text-sm text-[#191c1e] leading-relaxed">
                Advanced AIS tracking and predictive trajectory modeling to identify dark fleets and monitor global fishing efforts.
              </p>
            </div>
          </div>

          {/* Card 3: eDNA */}
          <div 
            onClick={() => setActiveTab('explore')}
            className="bg-white border border-[#c4c6cf] rounded p-5 hover:border-[#00BFFF] transition-all group flex flex-col justify-between min-h-[300px] cursor-pointer shadow-xs"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-label-caps text-[12px] uppercase text-[#001b3d] group-hover:text-[#00BFFF] transition-colors">
                Biodiversity &amp; eDNA
              </h3>
              <span className="material-symbols-outlined text-[#44474e] group-hover:text-[#00BFFF] transition-colors">
                biotech
              </span>
            </div>
            <div className="mt-auto">
              <div className="h-24 bg-[#f2f4f6] rounded border border-[#e0e3e5] mb-3 p-3 flex flex-col justify-between">
                <span className="font-data-mono text-[11px] text-[#44474e]">Sequencing Records</span>
                <span className="font-bold text-xl text-[#001b3d]">48.2k Markers</span>
                <span className="text-[10px] text-[#74777f] font-data-mono">Coverage: Indo-Pacific</span>
              </div>
              <p className="text-sm text-[#191c1e] leading-relaxed">
                Spatial distribution mapping of genetic markers to track species presence and ecosystem health indices.
              </p>
            </div>
          </div>

          {/* Card 4: Scientific RAG */}
          <div 
            onClick={() => setActiveTab('floatchat')}
            className="bg-white border border-[#c4c6cf] rounded p-5 hover:border-[#00BFFF] transition-all group flex flex-col justify-between min-h-[300px] cursor-pointer shadow-xs"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-label-caps text-[12px] uppercase text-[#001b3d] group-hover:text-[#00BFFF] transition-colors">
                Scientific RAG
              </h3>
              <span className="material-symbols-outlined text-[#44474e] group-hover:text-[#00BFFF] transition-colors">
                library_books
              </span>
            </div>
            <div className="mt-auto">
              <div className="h-24 bg-[#f2f4f6] rounded border border-[#e0e3e5] mb-3 p-3 flex flex-col justify-between">
                <span className="font-data-mono text-[11px] text-[#44474e]">Indexed Corpus</span>
                <span className="font-bold text-xl text-[#001b3d]">3.8M Papers</span>
                <span className="text-[10px] text-[#008ebe] font-data-mono">Nature, NOAA, ICES, FAO</span>
              </div>
              <p className="text-sm text-[#191c1e] leading-relaxed">
                Natural language querying across millions of peer-reviewed marine science publications and internal agency reports.
              </p>
            </div>
          </div>

          {/* Card 5: AI Modeling (Span 2) */}
          <div 
            onClick={() => setActiveTab('analytics')}
            className="bg-[#001b3d] border border-[#001b3d] rounded p-5 md:col-span-2 group flex flex-col justify-between min-h-[300px] relative overflow-hidden cursor-pointer shadow-md"
          >
            <div
              className="absolute inset-0 z-0 opacity-15"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 100% 100%, #00BFFF 0%, transparent 60%)',
              }}
            />
            <div className="relative z-10 flex justify-between items-start mb-4">
              <h3 className="font-label-caps text-[12px] uppercase text-[#00BFFF]">
                AI-Powered Analysis
              </h3>
              <span className="material-symbols-outlined text-[#00BFFF] text-[24px]">
                hub
              </span>
            </div>
            <div className="relative z-10 mt-auto">
              <p className="text-white text-base md:text-lg mb-4 max-w-xl font-normal leading-relaxed">
                Predictive modeling for anomaly detection, automated target recognition, and forecasting of marine heatwaves.
              </p>
              <button className="text-white text-sm font-medium flex items-center gap-2 hover:text-[#00BFFF] transition-colors group-hover:translate-x-1 duration-200">
                <span>View Model Metrics</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

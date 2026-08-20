import React, { useState } from 'react';
import { SCIENTIFIC_CITATIONS } from '../../data/oceanData';
import { ActiveTab } from '../../types';

interface AnalyticsViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ setActiveTab }) => {
  const [citationFilter, setCitationFilter] = useState('');
  const [selectedZone, setSelectedZone] = useState<'A' | 'B' | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const filteredCitations = SCIENTIFIC_CITATIONS.filter(
    (c) =>
      c.title.toLowerCase().includes(citationFilter.toLowerCase()) ||
      c.extractedInsight.toLowerCase().includes(citationFilter.toLowerCase()) ||
      c.refId.toLowerCase().includes(citationFilter.toLowerCase())
  );

  const triggerExport = (format: 'CSV' | 'PDF') => {
    setExportNotice(`Exporting ${format} Report for QRY-2023-89B...`);
    setTimeout(() => {
      const blob = new Blob([
        `Project Atlas Marine Analysis - QRY-2023-89B\nTitle: Impact of Heatwaves on Fisheries\nPearson Correlation: -0.78\nData Integrity: 0.92\nCausal Link: 0.74\nZones: Zone A (Critical, +3.8C), Zone B (Elevated, +1.9C)`
      ], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Atlas-Analytics-QRY-2023-89B.${format.toLowerCase() === 'csv' ? 'csv' : 'txt'}`;
      a.click();
      setExportNotice(null);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f7f9fb]">
      {/* Export Notification Toast */}
      {exportNotice && (
        <div className="fixed top-20 right-8 z-50 bg-[#001b3d] text-white px-4 py-3 rounded shadow-xl border border-[#00BFFF] flex items-center gap-3">
          <span className="material-symbols-outlined text-[#00BFFF] animate-spin">sync</span>
          <span className="text-xs font-medium">{exportNotice}</span>
        </div>
      )}

      {/* Analytics Header Toolbar */}
      <div className="bg-white border-b border-[#c4c6cf] px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1 text-[#44474e]">
            <span className="font-label-caps text-[11px] uppercase tracking-wider">Query ID: </span>
            <span className="font-data-mono text-[12px] text-[#001b3d] bg-[#eceef0] px-2 py-0.5 rounded font-bold">
              QRY-2023-89B
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#001b3d] tracking-tight">
            Impact of Heatwaves on Fisheries
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => triggerExport('CSV')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#003366] text-[#003366] rounded hover:bg-[#f7f9fb] transition-colors flex-1 sm:flex-none justify-center font-label-caps text-[11px] uppercase tracking-wider font-semibold active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>CSV Data</span>
          </button>

          <button
            onClick={() => triggerExport('PDF')}
            className="flex items-center gap-2 px-4 py-2 bg-[#001b3d] text-white rounded hover:bg-[#002d66] transition-colors flex-1 sm:flex-none justify-center font-label-caps text-[11px] uppercase tracking-wider font-semibold active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      {/* Scrollable Content Canvas */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-[1440px] mx-auto space-y-4">
          {/* Top Row: GIS Visualization + AI Reasoning */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[480px]">
            {/* GIS Visualization Map (Takes up 2 cols on wide screens) */}
            <div className="lg:col-span-2 bg-white border border-[#c4c6cf] rounded flex flex-col overflow-hidden shadow-xs">
              <div className="px-5 py-3 border-b border-[#c4c6cf] flex justify-between items-center bg-[#f7f9fb]">
                <span className="font-label-caps text-[11px] text-[#001b3d] uppercase tracking-wider">
                  Geospatial Correlation Analysis
                </span>
                <div className="flex gap-2">
                  <button className="material-symbols-outlined text-[#44474e] hover:text-[#001b3d] text-[18px]" title="Layers">
                    layers
                  </button>
                  <button className="material-symbols-outlined text-[#44474e] hover:text-[#001b3d] text-[18px]" title="Filter">
                    filter_alt
                  </button>
                  <button 
                    onClick={() => setActiveTab('map')}
                    className="material-symbols-outlined text-[#44474e] hover:text-[#001b3d] text-[18px]" 
                    title="Fullscreen Map"
                  >
                    fullscreen
                  </button>
                </div>
              </div>

              <div className="flex-1 relative bg-[#e0e3e5] min-h-[300px]">
                {/* Map Background */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBsHq_y0b_VlkLFS42zZei8KClTBrx3cS4_ypxfjDTUtkdHAPdFLxGeTo1OOv91cStoOeSgn7N4oud00GcMaNA0h2140qudYh5Xp2fTqg80__7nsvEobcbAeVgHx4DqDaGxyfMEiiIlVX7fePVbLoVJ4WFzNzLpDLh4rabWNJDuFOIMx5DVW4hDkVTbpa-_6Q_bQimwPSMMqX1vZeOQmIzy34kpm2jTxmyyDD5Md0zTl--Vy2t4J4NkJw')`,
                  }}
                />

                {/* Map Legend */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border border-[#c4c6cf] p-3 rounded shadow-sm flex flex-col gap-1.5 z-10">
                  <span className="font-label-caps text-[10px] text-[#001b3d] uppercase">
                    SST Anomaly (°C)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-data-mono text-[10px] text-[#44474e]">-2.0</span>
                    <div className="w-32 h-2.5 rounded-full bg-gradient-to-r from-[#001b3d] via-[#008ebe] to-[#ba1a1a]" />
                    <span className="font-data-mono text-[10px] text-[#ba1a1a] font-bold">+4.0</span>
                  </div>
                </div>

                {/* Map Markers */}
                <button
                  onClick={() => setSelectedZone(selectedZone === 'A' ? null : 'A')}
                  className="absolute top-1/4 left-1/3 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 cursor-pointer group"
                >
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[12px] border-b-[#ba1a1a] drop-shadow-md group-hover:scale-125 transition-transform" />
                  <div className="bg-white border border-[#c4c6cf] px-2 py-1 mt-1 rounded shadow-sm">
                    <span className="font-data-mono text-[10px] text-[#001b3d] font-bold">
                      Zone A: Critical (+3.8°C)
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedZone(selectedZone === 'B' ? null : 'B')}
                  className="absolute top-1/2 left-2/3 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 cursor-pointer group"
                >
                  <div className="w-3.5 h-3.5 bg-[#008ebe] transform rotate-45 border-2 border-white shadow-md group-hover:scale-125 transition-transform" />
                  <div className="bg-white border border-[#c4c6cf] px-2 py-1 mt-1 rounded shadow-sm">
                    <span className="font-data-mono text-[10px] text-[#001b3d] font-bold">
                      Zone B: Elevated (+1.9°C)
                    </span>
                  </div>
                </button>
              </div>

              <div className="px-5 py-2 bg-[#f7f9fb] border-t border-[#c4c6cf] text-[11px] text-[#44474e] flex justify-between">
                <span>Source: NOAA Coral Reef Watch</span>
                <span className="font-data-mono text-[#001b3d]">Layer: SST_ANOM_7D</span>
              </div>
            </div>

            {/* AI Reasoning Panel */}
            <div className="bg-white border border-[#c4c6cf] rounded flex flex-col h-full shadow-xs">
              <div className="px-5 py-3 border-b border-[#c4c6cf] flex items-center gap-2 bg-[#f7f9fb]">
                <span className="material-symbols-outlined text-[#00BFFF] text-[20px]">smart_toy</span>
                <span className="font-label-caps text-[11px] text-[#001b3d] uppercase tracking-wider">
                  Atlas AI Reasoning
                </span>
              </div>

              <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
                <p className="text-[#191c1e] leading-relaxed">
                  Analysis of longitudinal Sea Surface Temperature (SST) data against reported catch volumes indicates a{' '}
                  <strong className="text-[#001b3d]">strong negative correlation</strong> (-0.78 Pearson) between sustained thermal anomalies and pelagic fish yields in Sector 7.
                </p>

                <div className="border-l-2 border-[#00BFFF] pl-3 py-2 bg-[#f2f4f6] rounded-r">
                  <span className="font-data-mono text-[10px] text-[#44474e] block mb-1">
                    Primary Vector Identified:
                  </span>
                  <span className="text-[#001b3d] font-medium text-[12px] leading-snug block">
                    Thermal displacement of primary prey (zooplankton) causing cascading trophic failure.
                  </span>
                </div>

                <p className="text-[#191c1e] leading-relaxed">
                  The model observed a lag time of approximately 14 days between a Category 3 Marine Heatwave event and a statistically significant drop in CPUE (Catch Per Unit Effort) for target species.
                </p>

                <div className="mt-4 pt-4 border-t border-[#c4c6cf]">
                  <span className="font-label-caps text-[10px] text-[#44474e] block mb-2 uppercase">
                    Confidence Matrix
                  </span>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-data-mono text-[11px] text-[#001b3d]">Data Integrity</span>
                        <span className="font-data-mono text-[11px] text-[#008ebe] font-bold">High (0.92)</span>
                      </div>
                      <div className="w-full bg-[#e0e3e5] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#001b3d] h-full w-[92%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-data-mono text-[11px] text-[#001b3d]">Causal Link</span>
                        <span className="font-data-mono text-[11px] text-[#008ebe] font-bold">Med (0.74)</span>
                      </div>
                      <div className="w-full bg-[#e0e3e5] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#001b3d] h-full w-[74%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Temporal Trends & Relationship Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Temporal Chart */}
            <div className="bg-white border border-[#c4c6cf] rounded flex flex-col shadow-xs">
              <div className="px-5 py-3 border-b border-[#c4c6cf] flex justify-between items-center bg-[#f7f9fb]">
                <span className="font-label-caps text-[11px] text-[#001b3d] uppercase tracking-wider">
                  Temporal Trends: Temp vs. Catch Volume
                </span>
                <span className="material-symbols-outlined text-[#44474e] text-[20px]">
                  timeline
                </span>
              </div>

              <div className="p-5 flex-1 min-h-[260px] flex items-center justify-center relative">
                <div className="w-full h-full border-l border-b border-[#c4c6cf] relative min-h-[220px] pt-4 pl-2">
                  {/* Y Axis Labels */}
                  <div className="absolute -left-6 top-0 bottom-6 flex flex-col justify-between text-right font-data-mono text-[10px] text-[#74777f]">
                    <span>30°</span>
                    <span>25°</span>
                    <span>20°</span>
                    <span>15°</span>
                  </div>

                  {/* X Axis Labels */}
                  <div className="absolute -bottom-5 left-0 right-0 flex justify-between font-data-mono text-[10px] text-[#74777f] px-4">
                    <span>Q1 (Baseline)</span>
                    <span>Q2 (Pre-Heatwave)</span>
                    <span>Q3 (Peak SSTA)</span>
                    <span>Q4 (Recovery)</span>
                  </div>

                  {/* SVG Chart Polyline */}
                  <svg className="w-full h-44" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <polyline
                      fill="none"
                      points="0,80 25,70 50,25 75,30 100,55"
                      stroke="#ba1a1a"
                      strokeWidth="2.5"
                    />
                    <polyline
                      fill="none"
                      points="0,30 25,35 50,75 75,85 100,60"
                      stroke="#008ebe"
                      strokeWidth="2.5"
                    />
                  </svg>

                  {/* Legend */}
                  <div className="absolute top-2 right-2 bg-white/95 border border-[#c4c6cf] p-2 rounded flex flex-col gap-1 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-[2.5px] bg-[#ba1a1a]" />
                      <span className="font-data-mono text-[10px] text-[#191c1e]">SST Anomalies (°C)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-[2.5px] bg-[#008ebe]" />
                      <span className="font-data-mono text-[10px] text-[#191c1e]">Catch Vol (t)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Extracted Entities & Relationships */}
            <div className="bg-white border border-[#c4c6cf] rounded flex flex-col shadow-xs">
              <div className="px-5 py-3 border-b border-[#c4c6cf] bg-[#f7f9fb] flex items-center justify-between">
                <span className="font-label-caps text-[11px] text-[#001b3d] uppercase tracking-wider">
                  Extracted Entities &amp; Relationships
                </span>
                <span className="font-data-mono text-[10px] bg-[#eceef0] px-2 py-0.5 rounded text-[#44474e] font-bold">
                  n=3
                </span>
              </div>

              <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar">
                {/* Card 1 */}
                <div className="border border-[#c4c6cf] rounded p-3 hover:border-[#00BFFF] transition-colors bg-[#f7f9fb]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-label-caps text-[10px] text-[#ba1a1a] bg-[#ffdad6] px-2 py-0.5 rounded uppercase">
                      Event
                    </span>
                    <span className="material-symbols-outlined text-[#74777f] text-[14px]">arrow_forward</span>
                    <span className="font-label-caps text-[10px] text-[#003366] bg-[#d5e3ff] px-2 py-0.5 rounded uppercase">
                      Impact
                    </span>
                  </div>
                  <h3 className="font-semibold text-xs text-[#001b3d] mb-1">
                    Marine Heatwave &gt; Pelagic Migration
                  </h3>
                  <p className="text-[12px] text-[#44474e] leading-snug">
                    Prolonged SST anomalies exceeding +2.5°C force target species to migrate poleward or to deeper thermoclines.
                  </p>
                </div>

                {/* Card 2 */}
                <div className="border border-[#c4c6cf] rounded p-3 hover:border-[#00BFFF] transition-colors bg-[#f7f9fb]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-label-caps text-[10px] text-[#001b3d] bg-[#e0e3e5] px-2 py-0.5 rounded uppercase">
                      Variable
                    </span>
                    <span className="material-symbols-outlined text-[#74777f] text-[14px]">arrow_forward</span>
                    <span className="font-label-caps text-[10px] text-[#003366] bg-[#d5e3ff] px-2 py-0.5 rounded uppercase">
                      Outcome
                    </span>
                  </div>
                  <h3 className="font-semibold text-xs text-[#001b3d] mb-1">
                    Thermocline Depth &gt; Catch Efficiency
                  </h3>
                  <p className="text-[12px] text-[#44474e] leading-snug">
                    Deepening of the mixed layer reduces the effectiveness of standard purse seine nets by 34%.
                  </p>
                </div>

                {/* Card 3 */}
                <div className="border border-[#c4c6cf] rounded p-3 hover:border-[#00BFFF] transition-colors bg-[#f7f9fb]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-label-caps text-[10px] text-[#008ebe] bg-[#c3e8ff] px-2 py-0.5 rounded uppercase">
                      Entity
                    </span>
                    <span className="material-symbols-outlined text-[#74777f] text-[14px]">arrow_forward</span>
                    <span className="font-label-caps text-[10px] text-[#001b3d] bg-[#e0e3e5] px-2 py-0.5 rounded uppercase">
                      Constraint
                    </span>
                  </div>
                  <h3 className="font-semibold text-xs text-[#001b3d] mb-1">
                    Artisanal Fleet &gt; Operational Range
                  </h3>
                  <p className="text-[12px] text-[#44474e] leading-snug">
                    Smaller vessels lack the operational capacity to follow displaced shoals beyond the 50nm exclusion zone.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Scientific Evidence Database */}
          <div className="bg-white border border-[#c4c6cf] rounded flex flex-col shadow-xs mb-8">
            <div className="px-5 py-3 border-b border-[#c4c6cf] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-[#f7f9fb]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#001b3d] text-[20px]">library_books</span>
                <span className="font-label-caps text-[11px] text-[#001b3d] uppercase tracking-wider">
                  Scientific Evidence Database (RAG Extracted)
                </span>
              </div>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={citationFilter}
                  onChange={(e) => setCitationFilter(e.target.value)}
                  placeholder="Filter citations..."
                  className="w-full text-xs border border-[#c4c6cf] rounded px-3 py-1.5 text-[#191c1e] focus:border-[#00BFFF] focus:ring-0 outline-none bg-white placeholder:text-[#74777f]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#001b3d] text-white">
                    <th className="font-label-caps text-[11px] px-5 py-3 w-28 uppercase">Ref ID</th>
                    <th className="font-label-caps text-[11px] px-5 py-3 uppercase">Source Title</th>
                    <th className="font-label-caps text-[11px] px-5 py-3 uppercase">Extracted Insight</th>
                    <th className="font-label-caps text-[11px] px-5 py-3 w-28 uppercase text-center">Relevance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCitations.map((citation, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-[#eceef0] hover:bg-[#f7f9fb] transition-colors"
                    >
                      <td className="px-5 py-3.5 font-data-mono text-[11px] text-[#44474e] font-semibold">
                        {citation.refId}
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="font-medium text-[#001b3d] text-[12px]">{citation.title}</div>
                        <div className="text-[11px] text-[#74777f] mt-0.5">{citation.publication} • {citation.authors}</div>
                      </td>
                      <td className="px-5 py-3.5 text-[#191c1e] text-[12px] leading-relaxed">
                        "{citation.extractedInsight}"
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-block bg-[#d6e3ff] text-[#001b3d] font-data-mono text-[11px] px-2.5 py-1 rounded font-bold">
                          {citation.relevanceScore.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ARGO_FLOATS, FISHING_VESSELS } from '../../data/oceanData';
import { ArgoFloat, FishingVessel, ActiveTab } from '../../types';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onGenerateReport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onGenerateReport,
}) => {
  const [layers, setLayers] = useState({
    sst: true,
    salinity: false,
    fisheries: true,
    biodiversity: false,
    argo: true,
  });

  const [selectedTimeRange, setSelectedTimeRange] = useState<'30d' | '12m'>('30d');
  const [selectedFloat, setSelectedFloat] = useState<ArgoFloat | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<FishingVessel | null>(null);
  const [reportGeneratedToast, setReportGeneratedToast] = useState(false);

  const handleToggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerateReportClick = () => {
    setReportGeneratedToast(true);
    setTimeout(() => setReportGeneratedToast(false), 3500);
    onGenerateReport();
  };

  // Bar chart data for Sea Level Trends
  const trendData30d = [30, 40, 35, 50, 60, 55, 70, 80, 75, 90, 85, 100];
  const trendData12m = [45, 52, 48, 62, 58, 71, 65, 82, 88, 92, 95, 104];
  const currentTrendData = selectedTimeRange === '30d' ? trendData30d : trendData12m;

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden relative min-h-full">
      {/* Toast Notification */}
      {reportGeneratedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#001b3d] text-white px-4 py-3 rounded shadow-xl border border-[#00BFFF] flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-[#00BFFF]">verified</span>
          <div>
            <div className="font-label-caps text-[11px] uppercase text-[#00BFFF]">Report Generated</div>
            <div className="text-[12px]">Atlas Deep Marine Assessment initialized.</div>
          </div>
        </div>
      )}

      {/* Full Bleed Map Background */}
      <div className="absolute inset-0 z-0 bg-[#E0F2FE]">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuADbRFUwQuJ8sNWohc3d2VTsC1YC76-ov-U41mFOxdMIE4kr4ej_qFbpdmNLXPC8l4aC-f9nhKn6HB44KQVRuIZObwvyM8inNd-I_Qs8luYz3exrWdDRWo009hhZ24zlXa2INwfJOKQ0QgMckszrdPcvTvwsWsphqa45MlbXYdSndpKcjywiPfF2W_-YSJaUHxJdzX2lP9raHZZ9PVeUWojDRqks4Ff8FDSeMD-cMr-027njUVNrOHxww"
          alt="Geospatial Map of Indian Ocean"
          className="w-full h-full object-cover opacity-60"
        />

        {/* SST Thermal Gradient Layer Overlay (if toggled) */}
        {layers.sst && (
          <div className="absolute inset-0 bg-radial from-red-500/15 via-cyan-500/10 to-transparent pointer-events-none mix-blend-color-burn" />
        )}

        {/* Salinity layer overlay (if toggled) */}
        {layers.salinity && (
          <div className="absolute inset-0 bg-radial from-emerald-500/15 via-blue-500/10 to-transparent pointer-events-none" />
        )}

        {/* Simulated ARGO Floats (Geometric Markers on Map) */}
        {layers.argo &&
          ARGO_FLOATS.map((float) => (
            <button
              key={float.id}
              onClick={() => {
                setSelectedFloat(float);
                setSelectedVessel(null);
              }}
              style={{ top: `${float.topPct}%`, left: `${float.leftPct}%` }}
              className="absolute w-3.5 h-3.5 bg-[#00BFFF] rotate-45 border-2 border-white shadow-md hover:scale-150 transition-all cursor-pointer z-10 group"
              title={`Argo Float #${float.wmoId}`}
            >
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#001b3d] text-white text-[10px] font-data-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Float {float.wmoId} ({float.temp}°C)
              </span>
            </button>
          ))}

        {/* Simulated Fisheries Vessels */}
        {layers.fisheries &&
          FISHING_VESSELS.map((vessel) => (
            <button
              key={vessel.id}
              onClick={() => {
                setSelectedVessel(vessel);
                setSelectedFloat(null);
              }}
              style={{ top: `${vessel.topPct}%`, left: `${vessel.leftPct}%` }}
              className="absolute w-3 h-3 bg-[#001b3d] border-2 border-white shadow-md hover:scale-150 transition-all cursor-pointer z-10 group"
              title={`Vessel ${vessel.name}`}
            >
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#001b3d] text-white text-[10px] font-data-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {vessel.name}
              </span>
            </button>
          ))}

        {/* Selected Float / Vessel Modal Floating on Map */}
        {selectedFloat && (
          <div
            style={{
              top: `${Math.min(selectedFloat.topPct + 5, 70)}%`,
              left: `${Math.min(selectedFloat.leftPct, 65)}%`,
            }}
            className="absolute z-30 bg-white border border-[#00BFFF] rounded shadow-xl p-3 w-64 text-[#191c1e] text-xs pointer-events-auto"
          >
            <div className="flex justify-between items-center pb-1.5 border-b border-[#e0e3e5] mb-2">
              <span className="font-bold text-[#001b3d]">Argo Float #{selectedFloat.wmoId}</span>
              <button
                onClick={() => setSelectedFloat(null)}
                className="text-[#74777f] hover:text-black font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 font-data-mono text-[11px]">
              <div>Temp: <span className="font-bold text-[#001b3d]">{selectedFloat.temp}°C</span></div>
              <div>Salinity: <span className="font-bold text-[#001b3d]">{selectedFloat.salinity} PSU</span></div>
              <div>Profile Depth: <span className="text-[#44474e]">{selectedFloat.depth} dbar</span></div>
              <div>Cycle: <span className="text-[#44474e]">{selectedFloat.cycleNumber}</span></div>
              <div className="text-[10px] text-[#74777f] pt-1">Transmitted: {selectedFloat.lastProfileDate}</div>
            </div>
            <button
              onClick={() => setActiveTab('explore')}
              className="mt-2 w-full bg-[#001b3d] hover:bg-[#002d66] text-white text-[10px] py-1 rounded font-label-caps uppercase"
            >
              Inspect Telemetry Stream
            </button>
          </div>
        )}

        {selectedVessel && (
          <div
            style={{
              top: `${Math.min(selectedVessel.topPct + 5, 70)}%`,
              left: `${Math.min(selectedVessel.leftPct, 65)}%`,
            }}
            className="absolute z-30 bg-white border border-[#001b3d] rounded shadow-xl p-3 w-64 text-[#191c1e] text-xs pointer-events-auto"
          >
            <div className="flex justify-between items-center pb-1.5 border-b border-[#e0e3e5] mb-2">
              <span className="font-bold text-[#001b3d]">{selectedVessel.name}</span>
              <button
                onClick={() => setSelectedVessel(null)}
                className="text-[#74777f] hover:text-black font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 font-data-mono text-[11px]">
              <div>Flag: <span className="font-bold text-[#001b3d]">{selectedVessel.flag}</span></div>
              <div>Type: <span className="text-[#44474e]">{selectedVessel.type}</span></div>
              <div>Speed: <span className="font-bold text-[#001b3d]">{selectedVessel.speedKnots} kn</span></div>
              <div>Gear: <span className="text-[#44474e]">{selectedVessel.gearType}</span></div>
              <div>Status: <span className="text-[#006633] font-bold uppercase">{selectedVessel.status}</span></div>
            </div>
            <button
              onClick={() => setActiveTab('analytics')}
              className="mt-2 w-full bg-[#00BFFF] hover:bg-[#33ccff] text-[#001b3d] font-bold text-[10px] py-1 rounded font-label-caps uppercase"
            >
              Analyze Fishery Impact
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Content Container (Overlaid on Map) */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto p-4 md:p-8 min-h-full flex flex-col gap-4 pointer-events-none">
        {/* KPI Header Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pointer-events-auto">
          {/* KPI Card 1 */}
          <div className="bg-white border border-[#c4c6cf] rounded p-4 md:p-5 hover:border-[#00BFFF] transition-colors shadow-xs">
            <div className="flex justify-between items-start mb-2">
              <span className="font-label-caps text-[11px] text-[#44474e] uppercase tracking-wider">
                Avg SST (Indian Ocean)
              </span>
              <span className="material-symbols-outlined text-[#74777f] text-[18px]">
                thermostat
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl text-[#001b3d] font-semibold">
                28.4
              </span>
              <span className="font-data-mono text-[13px] text-[#44474e]">°C</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[#16A34A] font-data-mono text-[11px]">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>+0.2°C (30d)</span>
            </div>
          </div>

          {/* KPI Card 2 */}
          <div className="bg-white border border-[#c4c6cf] rounded p-4 md:p-5 hover:border-[#00BFFF] transition-colors shadow-xs">
            <div className="flex justify-between items-start mb-2">
              <span className="font-label-caps text-[11px] text-[#44474e] uppercase tracking-wider">
                Surface Salinity
              </span>
              <span className="material-symbols-outlined text-[#74777f] text-[18px]">
                water_drop
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl text-[#001b3d] font-semibold">
                34.8
              </span>
              <span className="font-data-mono text-[13px] text-[#44474e]">PSU</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[#44474e] font-data-mono text-[11px]">
              <span className="material-symbols-outlined text-[14px]">trending_flat</span>
              <span>Stable</span>
            </div>
          </div>

          {/* KPI Card 3 */}
          <div className="bg-white border border-[#c4c6cf] rounded p-4 md:p-5 hover:border-[#00BFFF] transition-colors shadow-xs">
            <div className="flex justify-between items-start mb-2">
              <span className="font-label-caps text-[11px] text-[#44474e] uppercase tracking-wider">
                Biodiversity Index
              </span>
              <span className="material-symbols-outlined text-[#74777f] text-[18px]">
                biotech
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl text-[#001b3d] font-semibold">
                82.1
              </span>
              <span className="font-data-mono text-[13px] text-[#44474e]">/100</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[#ba1a1a] font-data-mono text-[11px]">
              <span className="material-symbols-outlined text-[14px]">trending_down</span>
              <span>-1.4 (YTD)</span>
            </div>
          </div>

          {/* KPI Card 4 */}
          <div className="bg-white border border-[#c4c6cf] rounded p-4 md:p-5 hover:border-[#00BFFF] transition-colors shadow-xs">
            <div className="flex justify-between items-start mb-2">
              <span className="font-label-caps text-[11px] text-[#44474e] uppercase tracking-wider">
                Active Fisheries
              </span>
              <span className="material-symbols-outlined text-[#74777f] text-[18px]">
                directions_boat
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl text-[#001b3d] font-semibold">
                1,402
              </span>
              <span className="font-data-mono text-[13px] text-[#44474e]">Vessels</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[#16A34A] font-data-mono text-[11px]">
              <span className="material-symbols-outlined text-[14px]">radio_button_checked</span>
              <span>Live Tracking</span>
            </div>
          </div>
        </div>

        {/* Main Middle Section (Floating Map Controls & Atlas Insights) */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 mt-2">
          {/* Left Floating Map Layer Panel */}
          <div className="w-full lg:w-64 bg-white border border-[#c4c6cf] rounded shadow-sm flex flex-col pointer-events-auto h-fit">
            <div className="p-3 border-b border-[#c4c6cf] bg-[#f2f4f6] rounded-t flex justify-between items-center">
              <h3 className="font-label-caps text-[11px] text-[#001b3d] font-bold uppercase tracking-wider">
                Map Layers
              </h3>
              <span className="font-data-mono text-[10px] text-[#74777f]">GIS v2</span>
            </div>
            <div className="p-3 flex flex-col gap-1">
              <label className="flex items-center gap-3 p-2 hover:bg-[#f7f9fb] rounded cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={layers.sst}
                  onChange={() => handleToggleLayer('sst')}
                  className="rounded border-[#c4c6cf] text-[#00BFFF] focus:ring-[#00BFFF] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-[#191c1e] font-medium">Temperature (SST)</span>
              </label>

              <label className="flex items-center gap-3 p-2 hover:bg-[#f7f9fb] rounded cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={layers.salinity}
                  onChange={() => handleToggleLayer('salinity')}
                  className="rounded border-[#c4c6cf] text-[#00BFFF] focus:ring-[#00BFFF] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-[#191c1e] font-medium">Salinity Levels</span>
              </label>

              <label className="flex items-center gap-3 p-2 hover:bg-[#f7f9fb] rounded cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={layers.fisheries}
                  onChange={() => handleToggleLayer('fisheries')}
                  className="rounded border-[#c4c6cf] text-[#00BFFF] focus:ring-[#00BFFF] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-[#191c1e] font-medium">Fisheries Activity</span>
              </label>

              <label className="flex items-center gap-3 p-2 hover:bg-[#f7f9fb] rounded cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={layers.biodiversity}
                  onChange={() => handleToggleLayer('biodiversity')}
                  className="rounded border-[#c4c6cf] text-[#00BFFF] focus:ring-[#00BFFF] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-[#191c1e] font-medium">Biodiversity Zones</span>
              </label>

              <div className="h-px bg-[#c4c6cf] my-1" />

              <label className="flex items-center gap-3 p-2 hover:bg-[#f7f9fb] rounded cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={layers.argo}
                  onChange={() => handleToggleLayer('argo')}
                  className="rounded border-[#c4c6cf] text-[#00BFFF] focus:ring-[#00BFFF] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-[#191c1e] font-medium">ARGO Floats Network</span>
              </label>
            </div>
          </div>

          {/* Spacer for Map Visibility */}
          <div className="flex-1 min-h-[220px] lg:min-h-0 pointer-events-none" />

          {/* Right Insights Panel */}
          <div className="w-full lg:w-80 bg-white border border-[#c4c6cf] rounded shadow-sm flex flex-col pointer-events-auto h-fit">
            <div className="p-3 border-b border-[#c4c6cf] bg-[#001b3d] text-white rounded-t flex items-center justify-between">
              <h3 className="font-label-caps text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#00BFFF]">auto_awesome</span>
                Atlas Insights
              </h3>
              <button 
                onClick={() => setActiveTab('analytics')}
                className="text-white/70 hover:text-white" 
                title="View Analytics"
              >
                <span className="material-symbols-outlined text-[18px]">more_vert</span>
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <p className="text-xs text-[#191c1e] leading-relaxed">
                Current view indicates anomalous warming patterns in the central Indian Ocean basin (+0.4°C above decadal average). Correlated with a slight southward shift in primary pelagic fishing fleets over the last 72 hours.
              </p>

              <div className="bg-[#f7f9fb] border border-[#c4c6cf] rounded p-3">
                <h4 className="font-label-caps text-[10px] text-[#44474e] uppercase mb-2">Automated Actions</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[#00BFFF] text-[16px] mt-0.5">check_circle</span>
                    <span className="text-[12px] text-[#191c1e]">Generated alert for regional fisheries management.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[#74777f] text-[16px] mt-0.5">pending</span>
                    <span className="text-[12px] text-[#191c1e]">Recalibrating biomass models (ETA 2h).</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleGenerateReportClick}
                className="w-full border border-[#003366] text-[#003366] hover:bg-[#f7f9fb] font-label-caps text-[11px] uppercase tracking-wider py-2 px-4 rounded transition-colors active:scale-[0.98] cursor-pointer"
              >
                Generate Full Report
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Data Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-auto pointer-events-auto pt-2">
          {/* Chart 1: Sea Level Trends */}
          <div className="bg-white border border-[#c4c6cf] rounded flex flex-col h-64 shadow-xs">
            <div className="p-3 border-b border-[#c4c6cf] flex justify-between items-center bg-[#f7f9fb]">
              <h3 className="font-label-caps text-[11px] text-[#001b3d] font-bold uppercase tracking-wider">
                Sea Level Trends (Bay of Bengal)
              </h3>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as '30d' | '12m')}
                className="text-[11px] font-label-caps border border-[#c4c6cf] rounded bg-white text-[#191c1e] py-1 px-2 focus:outline-none focus:border-[#00BFFF]"
              >
                <option value="30d">Last 30 Days</option>
                <option value="12m">Last 12 Months</option>
              </select>
            </div>

            <div className="flex-1 p-4 relative overflow-hidden flex flex-col justify-end">
              <div className="w-full h-full border-b border-l border-[#74777f] flex items-end gap-1.5 px-2 pb-2">
                {currentTrendData.map((val, idx) => {
                  const isTop = idx >= 10;
                  const isCyan = idx >= 8 && idx < 10;
                  return (
                    <div
                      key={idx}
                      style={{ height: `${val}%` }}
                      className={`flex-1 transition-all duration-500 rounded-t-xs hover:brightness-110 cursor-pointer ${
                        isTop
                          ? 'bg-[#001b3d]'
                          : isCyan
                          ? 'bg-[#00BFFF]'
                          : 'bg-[#495f84] opacity-50'
                      }`}
                      title={`Index: ${val} mm anomaly`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] font-data-mono text-[#74777f] mt-1 px-2">
                <span>T-0</span>
                <span>Midpoint</span>
                <span>Current (Now)</span>
              </div>
            </div>
          </div>

          {/* Chart 2: Regional Biomass Distribution */}
          <div className="bg-white border border-[#c4c6cf] rounded flex flex-col h-64 shadow-xs">
            <div className="p-3 border-b border-[#c4c6cf] flex justify-between items-center bg-[#f7f9fb]">
              <h3 className="font-label-caps text-[11px] text-[#001b3d] font-bold uppercase tracking-wider">
                Regional Biomass Distribution
              </h3>
              <button 
                onClick={() => {
                  const blob = new Blob(["Pelagic: 46%\nDemersal: 34%\nBenthic: 20%"], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'biomass-distribution-model-v4.txt';
                  a.click();
                }}
                className="material-symbols-outlined text-[#74777f] hover:text-[#001b3d] text-[18px] transition-colors"
                title="Download CSV / Report"
              >
                download
              </button>
            </div>

            <div className="flex-1 p-4 flex items-center justify-center relative">
              {/* Abstract Data Vis Gauge */}
              <div className="w-36 h-36 rounded-full border-8 border-[#e0e3e5] relative flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full border-8 border-[#00BFFF]"
                  style={{
                    clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 50%)',
                    transform: 'rotate(45deg)',
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full border-8 border-[#001b3d]"
                  style={{
                    clipPath: 'polygon(50% 50%, 0 0, 100% 0)',
                    transform: 'rotate(-15deg)',
                  }}
                />
                <div className="flex flex-col items-center justify-center font-data-mono text-[#001b3d] font-bold z-10">
                  <span className="text-[13px]">Model V4</span>
                  <span className="text-[10px] text-[#74777f] font-normal">Active</span>
                </div>
              </div>

              <div className="absolute right-4 top-4 flex flex-col gap-2.5 bg-white/90 p-2.5 rounded border border-[#e0e3e5]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#00BFFF] rounded-xs" />
                  <span className="text-[11px] font-label-caps text-[#44474e]">Pelagic (46%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#001b3d] rounded-xs" />
                  <span className="text-[11px] font-label-caps text-[#44474e]">Demersal (34%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#e0e3e5] rounded-xs" />
                  <span className="text-[11px] font-label-caps text-[#44474e]">Benthic (20%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Attribution */}
        <footer className="mt-2 pb-2 flex flex-col sm:flex-row justify-between items-center pointer-events-auto bg-white/90 backdrop-blur-sm px-3 py-2 rounded border border-[#c4c6cf] gap-2">
          <span className="font-label-caps text-[#44474e] text-[11px]">
            System Status: <span className="text-[#006633] font-bold">Nominal</span> | Sync Latency: <span className="font-data-mono">12ms</span>
          </span>
          <span className="font-label-caps text-[#44474e] text-[11px] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-[#00BFFF]">satellite_alt</span>
            Live from INCOIS/Copernicus | Last Update:{' '}
            <span className="font-data-mono text-[#001b3d]">10:42:05 UTC</span>
          </span>
        </footer>
      </div>
    </div>
  );
};

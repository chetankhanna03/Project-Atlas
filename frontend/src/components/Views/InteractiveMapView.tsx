import React, { useState } from 'react';
import { ARGO_FLOATS, FISHING_VESSELS } from '../../data/oceanData';
import { ArgoFloat, FishingVessel, ActiveTab } from '../../types';

interface InteractiveMapViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({ setActiveTab }) => {
  const [activeLayer, setActiveLayer] = useState<'sst' | 'salinity' | 'currents' | 'bathymetry'>('sst');
  const [showFloats, setShowFloats] = useState(true);
  const [showVessels, setShowVessels] = useState(true);
  const [selectedFloat, setSelectedFloat] = useState<ArgoFloat | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<FishingVessel | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#001b3d] relative">
      {/* Map Control Bar */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md border border-[#c4c6cf] rounded shadow-lg p-3 max-w-sm">
        <div className="flex items-center justify-between pb-2 border-b border-[#e0e3e5] mb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00BFFF] text-[20px]">explore</span>
            <span className="font-label-caps text-[11px] text-[#001b3d] uppercase tracking-wider">
              Ocean GIS Navigator
            </span>
          </div>
          <span className="font-data-mono text-[10px] text-[#74777f]">EPSG:4326</span>
        </div>

        {/* Layer Selection */}
        <div className="space-y-2 text-xs">
          <span className="font-label-caps text-[10px] text-[#44474e] uppercase block">Base Layer</span>
          <div className="grid grid-cols-2 gap-1.5 font-label-caps text-[10px]">
            <button
              onClick={() => setActiveLayer('sst')}
              className={`p-1.5 rounded text-left border uppercase ${
                activeLayer === 'sst'
                  ? 'bg-[#001b3d] text-white border-[#001b3d]'
                  : 'bg-[#f7f9fb] text-[#44474e] border-[#c4c6cf]'
              }`}
            >
              SST Thermal
            </button>
            <button
              onClick={() => setActiveLayer('salinity')}
              className={`p-1.5 rounded text-left border uppercase ${
                activeLayer === 'salinity'
                  ? 'bg-[#001b3d] text-white border-[#001b3d]'
                  : 'bg-[#f7f9fb] text-[#44474e] border-[#c4c6cf]'
              }`}
            >
              Salinity PSU
            </button>
            <button
              onClick={() => setActiveLayer('currents')}
              className={`p-1.5 rounded text-left border uppercase ${
                activeLayer === 'currents'
                  ? 'bg-[#001b3d] text-white border-[#001b3d]'
                  : 'bg-[#f7f9fb] text-[#44474e] border-[#c4c6cf]'
              }`}
            >
              OSCAR Currents
            </button>
            <button
              onClick={() => setActiveLayer('bathymetry')}
              className={`p-1.5 rounded text-left border uppercase ${
                activeLayer === 'bathymetry'
                  ? 'bg-[#001b3d] text-white border-[#001b3d]'
                  : 'bg-[#f7f9fb] text-[#44474e] border-[#c4c6cf]'
              }`}
            >
              Bathymetry 3D
            </button>
          </div>

          <div className="pt-2 border-t border-[#e0e3e5] space-y-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFloats}
                onChange={(e) => setShowFloats(e.target.checked)}
                className="text-[#00BFFF] rounded"
              />
              <span className="text-[11px] text-[#191c1e]">ARGO Profiling Network (5 online)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showVessels}
                onChange={(e) => setShowVessels(e.target.checked)}
                className="text-[#00BFFF] rounded"
              />
              <span className="text-[11px] text-[#191c1e]">AIS Pelagic Fishing Fleets (4 active)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Floating Zoom & Compass Controls */}
      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
        <div className="bg-white border border-[#c4c6cf] rounded shadow-md flex flex-col overflow-hidden">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.8))}
            className="p-2 text-[#001b3d] hover:bg-[#f2f4f6] transition-colors"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
          <div className="h-px bg-[#c4c6cf]" />
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
            className="p-2 text-[#001b3d] hover:bg-[#f2f4f6] transition-colors"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <div className="h-px bg-[#c4c6cf]" />
          <button
            onClick={() => setZoomLevel(1)}
            className="p-2 text-[#001b3d] hover:bg-[#f2f4f6] transition-colors text-[10px] font-data-mono"
            title="Reset Zoom"
          >
            1x
          </button>
        </div>
      </div>

      {/* Main GIS Canvas Screen */}
      <div
        className="w-full h-full relative overflow-hidden transition-transform duration-300 ease-out"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuADbRFUwQuJ8sNWohc3d2VTsC1YC76-ov-U41mFOxdMIE4kr4ej_qFbpdmNLXPC8l4aC-f9nhKn6HB44KQVRuIZObwvyM8inNd-I_Qs8luYz3exrWdDRWo009hhZ24zlXa2INwfJOKQ0QgMckszrdPcvTvwsWsphqa45MlbXYdSndpKcjywiPfF2W_-YSJaUHxJdzX2lP9raHZZ9PVeUWojDRqks4Ff8FDSeMD-cMr-027njUVNrOHxww"
          alt="Full GIS Ocean Canvas"
          className="w-full h-full object-cover"
        />

        {/* Heatmap overlay based on active layer */}
        {activeLayer === 'sst' && (
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-cyan-500/10 pointer-events-none mix-blend-color-burn" />
        )}
        {activeLayer === 'salinity' && (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/25 via-sky-500/20 to-blue-900/30 pointer-events-none" />
        )}

        {/* ARGO Float Markers */}
        {showFloats &&
          ARGO_FLOATS.map((float) => (
            <button
              key={float.id}
              onClick={() => {
                setSelectedFloat(float);
                setSelectedVessel(null);
              }}
              style={{ top: `${float.topPct}%`, left: `${float.leftPct}%` }}
              className="absolute w-4 h-4 bg-[#00BFFF] rotate-45 border-2 border-white shadow-xl hover:scale-150 transition-all cursor-pointer z-10 animate-pulse"
              title={`Argo Float #${float.wmoId}`}
            />
          ))}

        {/* Fishing Vessels */}
        {showVessels &&
          FISHING_VESSELS.map((vessel) => (
            <button
              key={vessel.id}
              onClick={() => {
                setSelectedVessel(vessel);
                setSelectedFloat(null);
              }}
              style={{ top: `${vessel.topPct}%`, left: `${vessel.leftPct}%` }}
              className="absolute w-3.5 h-3.5 bg-[#001b3d] border-2 border-white shadow-xl hover:scale-150 transition-all cursor-pointer z-10"
              title={`Vessel ${vessel.name}`}
            />
          ))}
      </div>

      {/* Float Telemetry Modal Dialog */}
      {selectedFloat && (
        <div className="absolute bottom-12 left-4 z-30 bg-white border border-[#00BFFF] rounded shadow-2xl p-4 w-80 text-[#191c1e]">
          <div className="flex justify-between items-center pb-2 border-b border-[#e0e3e5] mb-2">
            <div>
              <span className="font-bold text-sm text-[#001b3d]">Argo Float #{selectedFloat.wmoId}</span>
              <span className="font-data-mono text-[10px] text-[#008ebe] block">Lat {selectedFloat.lat}°N, Lon {selectedFloat.lng}°E</span>
            </div>
            <button
              onClick={() => setSelectedFloat(null)}
              className="text-[#74777f] hover:text-black font-bold p-1"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5 font-data-mono text-xs mb-3">
            <div className="flex justify-between">
              <span className="text-[#74777f]">Temperature:</span>
              <span className="font-bold text-[#001b3d]">{selectedFloat.temp} °C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#74777f]">Salinity:</span>
              <span className="font-bold text-[#001b3d]">{selectedFloat.salinity} PSU</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#74777f]">Max Depth:</span>
              <span className="text-[#001b3d]">{selectedFloat.depth} dbar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#74777f]">Cycle Number:</span>
              <span className="text-[#001b3d]">{selectedFloat.cycleNumber}</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('explore')}
            className="w-full bg-[#001b3d] text-white py-1.5 rounded text-xs font-label-caps uppercase tracking-wider hover:bg-[#002d66]"
          >
            Open Complete Float Profile
          </button>
        </div>
      )}

      {/* Vessel Telemetry Modal Dialog */}
      {selectedVessel && (
        <div className="absolute bottom-12 left-4 z-30 bg-white border border-[#001b3d] rounded shadow-2xl p-4 w-80 text-[#191c1e]">
          <div className="flex justify-between items-center pb-2 border-b border-[#e0e3e5] mb-2">
            <div>
              <span className="font-bold text-sm text-[#001b3d]">{selectedVessel.name}</span>
              <span className="font-data-mono text-[10px] text-[#74777f] block">Flag: {selectedVessel.flag}</span>
            </div>
            <button
              onClick={() => setSelectedVessel(null)}
              className="text-[#74777f] hover:text-black font-bold p-1"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5 font-data-mono text-xs mb-3">
            <div className="flex justify-between">
              <span className="text-[#74777f]">Vessel Type:</span>
              <span className="font-bold text-[#001b3d]">{selectedVessel.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#74777f]">Speed:</span>
              <span className="font-bold text-[#001b3d]">{selectedVessel.speedKnots} knots</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#74777f]">Heading:</span>
              <span className="text-[#001b3d]">{selectedVessel.heading}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#74777f]">Gear Classification:</span>
              <span className="text-[#008ebe]">{selectedVessel.gearType}</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('analytics')}
            className="w-full bg-[#00BFFF] text-[#001b3d] py-1.5 rounded text-xs font-label-caps uppercase tracking-wider font-bold hover:bg-[#33ccff]"
          >
            Run Spatial Fishery Model
          </button>
        </div>
      )}

      {/* Bottom Coordinates Status Banner */}
      <div className="absolute bottom-2 right-4 z-20 bg-black/75 text-white px-3 py-1 rounded font-data-mono text-[11px] backdrop-blur-xs flex items-center gap-4">
        <span>Cursor: 08°24'N 73°07'E</span>
        <span>Resolution: 0.05°</span>
        <span className="text-[#00BFFF]">Live Stream Active</span>
      </div>
    </div>
  );
};

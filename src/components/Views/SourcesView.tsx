import React, { useState } from 'react';
import { ActiveTab } from '../../types';

interface SourcesViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onSyncClick: () => void;
}

export const SourcesView: React.FC<SourcesViewProps> = ({ setActiveTab, onSyncClick }) => {
  const [sourcesList, setSourcesList] = useState([
    {
      name: 'NOAA NESDIS / NCEI',
      type: 'Satellite Constellation & In-situ Grids',
      products: 'SST L4 Blended, Coral Reef Watch, Pathfinder SST',
      latency: '15 mins',
      status: 'operational',
      recordsIngested: '12.4M observations/day',
      endpoint: 'https://coastwatch.noaa.gov/erddap/',
    },
    {
      name: 'Copernicus Marine Environment (CMEMS)',
      type: 'Multi-Mission Satellite & BioGeo Reanalysis',
      products: 'Global Ocean Biogeochemistry, Chlorophyll-a, O2 Levels',
      latency: '30 mins',
      status: 'operational',
      recordsIngested: '8.1M observations/day',
      endpoint: 'https://data.marine.copernicus.eu/api/',
    },
    {
      name: 'Global ARGO Float Profiling Array',
      type: 'Subsurface Autonomous Robotic Profilers',
      products: 'Temperature (0-2000m), Salinity, BGC Profiles',
      latency: 'Hourly Batches',
      status: 'operational',
      recordsIngested: '4,028 Active Floats',
      endpoint: 'https://argo.ucsd.edu/data/api/',
    },
    {
      name: 'Global Fishing Watch (GFW)',
      type: 'Terrestrial & Satellite AIS Marine Telemetry',
      products: 'Apparent Fishing Effort, Vessel Registry, Track Reconstruction',
      latency: '45 mins',
      status: 'operational',
      recordsIngested: '110,000+ Tracked Vessels',
      endpoint: 'https://globalfishingwatch.org/data-download/',
    },
    {
      name: 'INCOIS (Indian National Centre for Ocean Info)',
      type: 'Indo-Pacific Regional Sensor Buoys & RAMA Moorings',
      products: 'High-Resolution Wave Dynamics, Coastal Salinity Gages',
      latency: '10 mins',
      status: 'operational',
      recordsIngested: '1.2M points/day',
      endpoint: 'https://incois.gov.in/portal/erddap/',
    },
  ]);

  const [testedIndex, setTestedIndex] = useState<number | null>(null);

  const testConnection = (index: number) => {
    setTestedIndex(index);
    setTimeout(() => {
      setTestedIndex(null);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#f7f9fb] p-4 md:p-8 custom-scrollbar">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-[#c4c6cf] rounded p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00BFFF] text-[24px]">source</span>
              <h1 className="text-xl md:text-2xl font-bold text-[#001b3d] tracking-tight">
                Federated Data Sources &amp; Pipelines
              </h1>
            </div>
            <p className="text-xs text-[#44474e] mt-1">
              Real-time ingestion pipelines connecting satellite remote sensing, autonomous underwater arrays, and maritime telemetry.
            </p>
          </div>
          <button
            onClick={onSyncClick}
            className="px-5 py-2.5 bg-[#001b3d] hover:bg-[#002d66] text-white rounded font-label-caps text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#00BFFF]">sync</span>
            <span>Force Re-index All</span>
          </button>
        </div>

        {/* Sources Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sourcesList.map((source, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#c4c6cf] rounded p-5 flex flex-col justify-between hover:border-[#00BFFF] transition-all shadow-xs"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-base text-[#001b3d]">{source.name}</h3>
                  <span className="flex items-center gap-1.5 font-data-mono text-[10px] text-[#006633] bg-[#e8f5e9] px-2 py-0.5 rounded border border-[#a5d6a7]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006633] animate-ping" />
                    ONLINE
                  </span>
                </div>
                <div className="font-label-caps text-[11px] text-[#008ebe] mb-2">{source.type}</div>
                <p className="text-xs text-[#44474e] mb-4">
                  <strong className="text-[#001b3d]">Products:</strong> {source.products}
                </p>
              </div>

              <div className="pt-3 border-t border-[#e0e3e5] space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px] font-data-mono bg-[#f7f9fb] p-2.5 rounded">
                  <div>
                    <span className="text-[#74777f] block text-[9px] font-label-caps uppercase">Latency</span>
                    <span className="text-[#001b3d] font-bold">{source.latency}</span>
                  </div>
                  <div>
                    <span className="text-[#74777f] block text-[9px] font-label-caps uppercase">Throughput</span>
                    <span className="text-[#001b3d] font-bold">{source.recordsIngested}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-data-mono text-[#74777f] truncate max-w-xs">
                    {source.endpoint}
                  </span>
                  <button
                    onClick={() => testConnection(idx)}
                    className="text-xs text-[#003366] hover:text-[#00BFFF] font-label-caps uppercase font-semibold flex items-center gap-1"
                  >
                    <span className={`material-symbols-outlined text-[14px] ${testedIndex === idx ? 'animate-spin' : ''}`}>
                      sensors
                    </span>
                    <span>{testedIndex === idx ? 'Testing...' : 'Ping Node'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { DATASETS } from '../../data/oceanData';
import { Dataset, ActiveTab } from '../../types';
import { DatasetDetailModal } from './DatasetDetailModal';

interface ExploreDataViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onQueryDatasetInChat: (datasetTitle: string) => void;
}

export const ExploreDataView: React.FC<ExploreDataViewProps> = ({
  setActiveTab,
  onQueryDatasetInChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedAgency, setSelectedAgency] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'relevant' | 'resolution' | 'updated'>('relevant');
  const [activeModalDataset, setActiveModalDataset] = useState<Dataset | null>(null);

  const domainTabs = ['All', 'Physics', 'Biogeochemistry', 'Fisheries', 'Biodiversity'];

  const filteredDatasets = DATASETS.filter((ds) => {
    const matchesSearch =
      ds.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.sourceAgency.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDomain = selectedDomain === 'All' || ds.domain === selectedDomain;
    const matchesRegion = selectedRegion === 'All' || ds.region.includes(selectedRegion);
    const matchesAgency = selectedAgency === 'All' || ds.sourceAgency.includes(selectedAgency);

    return matchesSearch && matchesDomain && matchesRegion && matchesAgency;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f7f9fb]">
      {/* Detail Modal */}
      {activeModalDataset && (
        <DatasetDetailModal
          dataset={activeModalDataset}
          onClose={() => setActiveModalDataset(null)}
          onQueryInChat={(title) => {
            onQueryDatasetInChat(title);
            setActiveTab('floatchat');
          }}
        />
      )}

      {/* Top Header & Search Bar */}
      <div className="bg-white border-b border-[#c4c6cf] px-4 md:px-8 py-5 shrink-0">
        <div className="max-w-[1440px] mx-auto space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#001b3d] tracking-tight">
                Ocean Data Catalog
              </h1>
              <p className="text-xs text-[#44474e] mt-0.5">
                Standardized multi-layer geospatial data arrays ready for high-performance retrieval
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-data-mono text-xs text-[#001b3d] bg-[#f2f4f6] px-3 py-1.5 rounded border border-[#c4c6cf] font-bold">
                {filteredDatasets.length} of {DATASETS.length} Datasets Active
              </span>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col lg:flex-row gap-3 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#74777f] text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search datasets, CF standard variables, spatial grids, sensors..."
                className="w-full bg-[#f7f9fb] border border-[#c4c6cf] rounded py-2 pl-9 pr-4 text-xs text-[#191c1e] placeholder:text-[#74777f] focus:outline-none focus:border-[#00BFFF] focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74777f] hover:text-[#001b3d]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="text-xs border border-[#c4c6cf] rounded px-3 py-2 bg-white text-[#191c1e] font-label-caps uppercase focus:outline-none focus:border-[#00BFFF]"
              >
                <option value="All">All Regions</option>
                <option value="Global">Global Ocean</option>
                <option value="Indo-Pacific">Indo-Pacific</option>
              </select>

              <select
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                className="text-xs border border-[#c4c6cf] rounded px-3 py-2 bg-white text-[#191c1e] font-label-caps uppercase focus:outline-none focus:border-[#00BFFF]"
              >
                <option value="All">All Agencies</option>
                <option value="NOAA">NOAA NCEI</option>
                <option value="Copernicus">Copernicus Marine</option>
                <option value="NASA">NASA JPL</option>
                <option value="Global Fishing Watch">Global Fishing Watch</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs border border-[#c4c6cf] rounded px-3 py-2 bg-white text-[#191c1e] font-label-caps uppercase focus:outline-none focus:border-[#00BFFF]"
              >
                <option value="relevant">Most Relevant</option>
                <option value="resolution">Highest Resolution</option>
                <option value="updated">Recently Updated</option>
              </select>
            </div>
          </div>

          {/* Domain Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {domainTabs.map((tab) => {
              const isActive = selectedDomain === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedDomain(tab)}
                  className={`px-3.5 py-1.5 rounded text-xs font-label-caps uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#001b3d] text-white font-bold shadow-xs'
                      : 'bg-white border border-[#c4c6cf] text-[#44474e] hover:bg-[#f2f4f6] hover:text-[#001b3d]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dataset Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDatasets.map((ds) => (
              <div
                key={ds.id}
                className="bg-white border border-[#c4c6cf] rounded p-5 hover:border-[#00BFFF] hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Domain & Status badges */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-label-caps text-[10px] text-[#00BFFF] bg-[#001b3d] px-2.5 py-0.5 rounded uppercase font-bold tracking-wider">
                      {ds.domain}
                    </span>
                    <span
                      className={`font-data-mono text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                        ds.status === 'indexed'
                          ? 'bg-[#e8f5e9] text-[#2e7d32] border border-[#a5d6a7]'
                          : 'bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]'
                      }`}
                    >
                      {ds.status}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-base text-[#001b3d] group-hover:text-[#00BFFF] transition-colors line-clamp-2 mb-2">
                    {ds.title}
                  </h3>
                  <p className="text-xs text-[#44474e] leading-relaxed line-clamp-3 mb-4">
                    {ds.description}
                  </p>
                </div>

                {/* Metadata Specs Grid */}
                <div>
                  <div className="grid grid-cols-2 gap-2 bg-[#f7f9fb] p-3 rounded border border-[#e0e3e5] mb-4 text-[11px] font-data-mono">
                    <div>
                      <span className="text-[#74777f] block text-[9px] font-label-caps uppercase">
                        Spatial Res
                      </span>
                      <span className="text-[#001b3d] font-semibold">{ds.resolution}</span>
                    </div>
                    <div>
                      <span className="text-[#74777f] block text-[9px] font-label-caps uppercase">
                        Frequency
                      </span>
                      <span className="text-[#001b3d] font-semibold">{ds.frequency}</span>
                    </div>
                    <div className="col-span-2 mt-1 pt-1 border-t border-[#e0e3e5]">
                      <span className="text-[#74777f] block text-[9px] font-label-caps uppercase">
                        Agency
                      </span>
                      <span className="text-[#001b3d] truncate block">{ds.sourceAgency}</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#e0e3e5]">
                    <button
                      onClick={() => setActiveModalDataset(ds)}
                      className="flex-1 bg-[#f2f4f6] hover:bg-[#001b3d] hover:text-white text-[#001b3d] py-2 rounded text-center font-label-caps text-[11px] uppercase tracking-wider transition-colors font-semibold cursor-pointer"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        onQueryDatasetInChat(ds.title);
                        setActiveTab('floatchat');
                      }}
                      className="bg-[#001b3d] hover:bg-[#002d66] text-white p-2 rounded flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                      title="Analyze with FloatChat"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#00BFFF]">
                        forum
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDatasets.length === 0 && (
            <div className="text-center py-16 bg-white border border-[#c4c6cf] rounded">
              <span className="material-symbols-outlined text-4xl text-[#74777f] mb-2">
                travel_explore
              </span>
              <h3 className="font-bold text-lg text-[#001b3d]">No Datasets Found</h3>
              <p className="text-xs text-[#44474e] mt-1">
                Try adjusting your search keywords or clearing active filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDomain('All');
                  setSelectedRegion('All');
                  setSelectedAgency('All');
                }}
                className="mt-4 px-4 py-2 bg-[#001b3d] text-white text-xs font-label-caps uppercase rounded"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

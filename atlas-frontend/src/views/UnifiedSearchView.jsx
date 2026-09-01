import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Search, 
  MapPin, 
  Compass, 
  Sliders, 
  Layers, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw,
  Fish,
  Activity,
  Dna,
  CloudSun,
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { OceanMap } from '../components/OceanMap';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { SkeletonCard, SkeletonTable } from '../components/SkeletonLoader';
import { apiService } from '../services/api';

export const UnifiedSearchView = () => {
  // Query State
  const [lat, setLat] = useState('12.97');
  const [lon, setLon] = useState('77.59');
  const [radius, setRadius] = useState(250);
  const [species, setSpecies] = useState('');
  const [year, setYear] = useState('all');
  const [selectedDatasets, setSelectedDatasets] = useState(['fisheries', 'argo', 'biodiversity', 'oceanography', 'conservation']);
  
  // Layer toggles on map
  const [activeLayers, setActiveLayers] = useState(['fisheries', 'argo', 'biodiversity', 'conservation']);

  // Results & Loading State
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  // Table pagination & filtering
  const [tableFilter, setTableFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Preset location quick buttons
  const presets = [
    { name: 'Cochin Coast', lat: '9.93', lon: '76.26' },
    { name: 'Mumbai Shelf', lat: '18.96', lon: '72.83' },
    { name: 'Andaman Sea', lat: '11.67', lon: '92.74' },
    { name: 'Lakshadweep', lat: '10.56', lon: '72.63' },
    { name: 'Bay of Bengal', lat: '17.68', lon: '83.21' },
  ];

  // Execute Search
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setCurrentPage(1);
    try {
      const result = await apiService.search({
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        radius,
        datasets: selectedDatasets,
        year,
        species
      });
      setData(result);
      
      // Trigger subtle celebration confetti
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00f2fe', '#4facfe', '#00ffc4', '#ffb703']
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleSearch();
  }, []);

  const toggleDataset = (dsId) => {
    setSelectedDatasets(prev => 
      prev.includes(dsId) ? prev.filter(d => d !== dsId) : [...prev, dsId]
    );
  };

  const toggleLayer = (layerId) => {
    setActiveLayers(prev =>
      prev.includes(layerId) ? prev.filter(l => l !== layerId) : [...prev, layerId]
    );
  };

  // Prepare combined table rows
  const getTableRows = () => {
    if (!data?.results) return [];
    let rows = [];
    if (data.results.fisheries) {
      rows.push(...data.results.fisheries.map(item => ({
        id: item.id,
        dataset: 'Fisheries',
        name: item.species,
        subtitle: item.commonName,
        detail: `${item.landings_tonnes?.toLocaleString()} tonnes`,
        location: `${item.state} (${item.region})`,
        typeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10'
      })));
    }
    if (data.results.argo) {
      rows.push(...data.results.argo.map(item => ({
        id: `argo-${item.platform_id}`,
        dataset: 'ARGO',
        name: `Float #${item.platform_id}`,
        subtitle: `Cycle ${item.cycle_number} | ${item.institution}`,
        detail: `${item.profiles?.[0]?.temperature || 28.5}°C / ${item.profiles?.[0]?.salinity || 35.1} PSU`,
        location: `Lat ${item.latitude}, Lon ${item.longitude}`,
        typeColor: 'text-sky-400 border-sky-500/30 bg-sky-500/10'
      })));
    }
    if (data.results.biodiversity) {
      rows.push(...data.results.biodiversity.map(item => ({
        id: item.id,
        dataset: 'Biodiversity',
        name: item.scientificName,
        subtitle: item.commonName,
        detail: `Status: ${item.status}`,
        location: `${item.source} Record`,
        typeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      })));
    }
    if (data.results.conservation) {
      rows.push(...data.results.conservation.map(item => ({
        id: item.id,
        dataset: 'Conservation',
        name: item.name,
        subtitle: item.designation,
        detail: `Area: ${item.area_km2} km²`,
        location: item.country,
        typeColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10'
      })));
    }

    if (tableFilter !== 'all') {
      rows = rows.filter(r => r.dataset.toLowerCase() === tableFilter.toLowerCase());
    }

    return rows;
  };

  const tableRows = getTableRows();
  const totalPages = Math.ceil(tableRows.length / itemsPerPage) || 1;
  const paginatedRows = tableRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // CSV Export
  const exportCSV = () => {
    if (!tableRows.length) return;
    const headers = 'Dataset,Name,Subtitle,Detail,Location\n';
    const csvContent = 'data:text/csv;charset=utf-8,' + headers + tableRows.map(r => `"${r.dataset}","${r.name}","${r.subtitle}","${r.detail}","${r.location}"`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `project_atlas_search_${lat}_${lon}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Animated Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative text-center py-6 px-4"
      >
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-ocean-500/10 border border-biolum-cyan/30 text-xs font-semibold text-biolum-cyan mb-4 glow-cyan">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>REAL-TIME MULTI-DATASET OCEAN INTELLIGENCE</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Unified Marine Datasets across <span className="text-transparent bg-clip-text bg-gradient-to-r from-biolum-cyan via-sky-300 to-biolum-teal">Indian Ocean Basins</span>
        </h1>
        <p className="mt-3 text-sm md:text-base text-ocean-200/80 max-w-2xl mx-auto">
          Integrate fisheries landings, ARGO float profiles, OBIS/GBIF biodiversity, satellite SST, and WDPA protected marine reserves in a single spatial query.
        </p>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <span className="text-xs text-ocean-300/70 font-mono">Quick Locations:</span>
          {presets.map(p => (
            <button
              key={p.name}
              onClick={() => { setLat(p.lat); setLon(p.lon); }}
              className="px-3 py-1 rounded-full text-xs font-medium bg-ocean-950/80 border border-ocean-500/30 text-ocean-200 hover:text-white hover:border-biolum-cyan transition-all duration-200 flex items-center space-x-1"
            >
              <MapPin className="w-3 h-3 text-biolum-cyan" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Unified Search Control Panel */}
      <motion.form 
        onSubmit={handleSearch}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-panel p-6 rounded-3xl border border-ocean-500/30 shadow-2xl relative overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Latitude */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ocean-200 flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-biolum-cyan" />
              <span>Latitude (°N)</span>
            </label>
            <input 
              type="number"
              step="0.01"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-abyss-950/90 border border-ocean-500/30 text-white font-mono text-sm focus:outline-none focus:border-biolum-cyan transition-all"
              placeholder="e.g. 12.97"
              required
            />
          </div>

          {/* Longitude */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ocean-200 flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-biolum-cyan" />
              <span>Longitude (°E)</span>
            </label>
            <input 
              type="number"
              step="0.01"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-abyss-950/90 border border-ocean-500/30 text-white font-mono text-sm focus:outline-none focus:border-biolum-cyan transition-all"
              placeholder="e.g. 77.59"
              required
            />
          </div>

          {/* Search Radius Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-ocean-200">
              <span className="flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-biolum-teal" />
                <span>Radius (km)</span>
              </span>
              <span className="text-biolum-cyan font-mono">{radius} km</span>
            </div>
            <input 
              type="range"
              min="50"
              max="1000"
              step="25"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full h-2 bg-ocean-950 rounded-lg appearance-none cursor-pointer accent-biolum-cyan"
            />
          </div>

          {/* Species Text Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ocean-200 flex items-center space-x-1.5">
              <Search className="w-3.5 h-3.5 text-biolum-green" />
              <span>Species Filter</span>
            </label>
            <input 
              type="text"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-abyss-950/90 border border-ocean-500/30 text-white text-sm focus:outline-none focus:border-biolum-green transition-all"
              placeholder="e.g. Rastrelliger, Turtle, Coral"
            />
          </div>

        </div>

        {/* Dataset Checkbox Selector Tags */}
        <div className="mt-6 pt-5 border-t border-ocean-500/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ocean-300 mr-2 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-ocean-400" />
              <span>Target Datasets:</span>
            </span>

            {[
              { id: 'fisheries', label: 'Fisheries (CMFRI)', icon: Fish, color: 'text-amber-400 border-amber-500/40' },
              { id: 'argo', label: 'ARGO Floats', icon: Activity, color: 'text-sky-400 border-sky-500/40' },
              { id: 'biodiversity', label: 'OBIS / GBIF', icon: Dna, color: 'text-emerald-400 border-emerald-500/40' },
              { id: 'oceanography', label: 'NOAA SST', icon: CloudSun, color: 'text-indigo-400 border-indigo-500/40' },
              { id: 'conservation', label: 'WDPA Reserves', icon: ShieldAlert, color: 'text-rose-400 border-rose-500/40' },
            ].map((ds) => {
              const isSelected = selectedDatasets.includes(ds.id);
              const Icon = ds.icon;
              return (
                <button
                  type="button"
                  key={ds.id}
                  onClick={() => toggleDataset(ds.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                    isSelected 
                      ? `${ds.color} bg-ocean-950 shadow-md` 
                      : 'border-ocean-500/20 text-ocean-400/50 bg-ocean-950/40 opacity-60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{ds.label}</span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-biolum-cyan ml-1" />}
                </button>
              );
            })}
          </div>

          {/* Submit Search Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-biolum-teal to-ocean-600 text-abyss-950 font-bold text-sm shadow-xl glow-cyan flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{loading ? 'QUERYING OCEAN DATA...' : 'RUN SPATIAL QUERY'}</span>
          </motion.button>

        </div>
      </motion.form>

      {/* Summary Telemetry Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Fisheries Catch', val: data?.summary?.total_fisheries_landings_tonnes || 0, suffix: ' tonnes', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400' },
          { label: 'Active ARGO Floats', val: data?.summary?.active_argo_floats || 0, suffix: ' floats', color: 'from-sky-500/20 to-sky-600/10 border-sky-500/30 text-sky-400' },
          { label: 'Avg SST Temp', val: data?.summary?.avg_sea_surface_temp_c || 28.5, suffix: ' °C', decimals: 1, color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-400' },
          { label: 'Species Records', val: data?.summary?.species_occurrences_count || 0, suffix: ' records', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400' },
          { label: 'Protected Reserves', val: data?.summary?.protected_areas_count || 0, suffix: ' MPAs', color: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400' },
        ].map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            className={`glass-panel p-4 rounded-2xl border bg-gradient-to-br ${card.color}`}
          >
            <p className="text-xs font-semibold text-ocean-200/80">{card.label}</p>
            <h3 className="text-2xl font-black mt-1 font-mono tracking-tight text-white">
              <AnimatedCounter value={card.val} suffix={card.suffix} decimals={card.decimals || 0} />
            </h3>
          </motion.div>
        ))}
      </div>

      {/* Main Interactive Ocean Map */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-biolum-cyan" />
            <h3 className="text-lg font-bold text-white">Interactive Spatial Dataset Map</h3>
          </div>

          {/* Layer visibility pills */}
          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-xs text-ocean-300 font-mono">Map Layers:</span>
            {[
              { id: 'fisheries', label: 'Fisheries', color: 'bg-amber-400' },
              { id: 'argo', label: 'ARGO', color: 'bg-sky-400' },
              { id: 'biodiversity', label: 'Species', color: 'bg-emerald-400' },
              { id: 'conservation', label: 'Protected MPAs', color: 'bg-rose-400' },
            ].map(l => (
              <button
                key={l.id}
                onClick={() => toggleLayer(l.id)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-opacity ${
                  activeLayers.includes(l.id) ? 'border-ocean-400 bg-ocean-950 text-white' : 'border-ocean-800 text-ocean-500 opacity-40'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${l.color}`}></span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        <OceanMap
          center={[parseFloat(lat) || 12.97, parseFloat(lon) || 77.59]}
          zoom={6}
          radiusKm={radius}
          fisheriesData={data?.results?.fisheries || []}
          argoData={data?.results?.argo || []}
          biodiversityData={data?.results?.biodiversity || []}
          conservationData={data?.results?.conservation || []}
          activeLayers={activeLayers}
        />
      </div>

      {/* Unified Sortable & Filterable Results Data Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-panel rounded-3xl border border-ocean-500/30 overflow-hidden shadow-2xl"
      >
        {/* Table Header Controls */}
        <div className="p-5 border-b border-ocean-500/20 flex flex-wrap items-center justify-between gap-4 bg-ocean-950/60">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
              <span>Combined Telemetry Data Records</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-ocean-500/20 text-biolum-cyan border border-biolum-cyan/30 font-mono">
                {tableRows.length} Entries
              </span>
            </h3>
            <p className="text-xs text-ocean-300">Synchronized output from all active marine telemetry streams</p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Filter Pill */}
            <select
              value={tableFilter}
              onChange={(e) => { setTableFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 rounded-xl bg-abyss-950 border border-ocean-500/30 text-xs font-semibold text-ocean-200 focus:outline-none focus:border-biolum-cyan"
            >
              <option value="all">All Datasets</option>
              <option value="fisheries">Fisheries Only</option>
              <option value="argo">ARGO Floats Only</option>
              <option value="biodiversity">Biodiversity Only</option>
              <option value="conservation">Conservation MPAs Only</option>
            </select>

            {/* CSV Export Button */}
            <button
              onClick={exportCSV}
              className="px-3.5 py-1.5 rounded-xl bg-ocean-600/80 hover:bg-ocean-500 text-white font-semibold text-xs transition-all flex items-center space-x-1.5 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={5} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ocean-500/20 text-xs uppercase font-bold text-ocean-300 bg-abyss-950/40">
                  <th className="py-3.5 px-6">Dataset</th>
                  <th className="py-3.5 px-6">Primary Name / Taxon</th>
                  <th className="py-3.5 px-6">Details / Metrics</th>
                  <th className="py-3.5 px-6">Location / Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ocean-500/10 text-sm">
                <AnimatePresence>
                  {paginatedRows.map((row, idx) => (
                    <motion.tr
                      key={row.id || idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.25, delay: idx * 0.05 }}
                      className="hover:bg-ocean-500/10 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${row.typeColor}`}>
                          {row.dataset}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-white">{row.name}</p>
                        <p className="text-xs text-ocean-300">{row.subtitle}</p>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-ocean-200">
                        {row.detail}
                      </td>
                      <td className="py-4 px-6 text-xs text-ocean-300">
                        {row.location}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-ocean-500/20 bg-ocean-950/40 flex items-center justify-between text-xs text-ocean-300">
          <span>Showing page {currentPage} of {totalPages}</span>
          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-1.5 rounded-lg bg-ocean-950 border border-ocean-500/30 text-ocean-200 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-1.5 rounded-lg bg-ocean-950 border border-ocean-500/30 text-ocean-200 hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </motion.div>

    </div>
  );
};

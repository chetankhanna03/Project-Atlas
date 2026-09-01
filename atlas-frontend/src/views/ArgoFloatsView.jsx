import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Search, MapPin, ExternalLink, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiService } from '../services/api';
import { AnimatedCounter } from '../components/AnimatedCounter';

export const ArgoFloatsView = ({ setActiveTab }) => {
  const [floats, setFloats] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchFloats = async () => {
      const res = await apiService.getArgoObservations();
      setFloats(res);
    };
    fetchFloats();
  }, []);

  const filteredFloats = floats.filter(f => 
    f.id.includes(filterText) || f.institution.toLowerCase().includes(filterText.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFloats.length / itemsPerPage) || 1;
  const paginatedFloats = filteredFloats.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          ARGO Float Network
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Autonomous Profiling Ocean Array - Deep Temperature, Salinity & Pressure Telemetry.
        </p>
      </motion.div>

      {/* Top Section Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Active Floats</span>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">
            <AnimatedCounter value={floats.length} suffix=" Floats" />
          </h3>
          <p className="text-[11px] text-sky-600 font-medium mt-1">Indian Ocean Basin</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active CTD Profiles</span>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">1,420+</h3>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">10-day cycle rate</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Latest Observation</span>
          <h3 className="text-xl font-bold text-slate-900 font-mono mt-1">Today, 08:45</h3>
          <p className="text-[11px] text-slate-500 mt-1">Satellite Pass Sync</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Geographic Coverage</span>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">100 %</h3>
          <p className="text-[11px] text-teal-600 font-medium mt-1">High spatial resolution</p>
        </div>
      </div>

      {/* Searchable Data Table */}
      <div className="glass-card rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={filterText}
              onChange={(e) => { setFilterText(e.target.value); setCurrentPage(1); }}
              placeholder="Search Float ID or Institution..."
              className="pl-8 pr-4 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-500 w-64"
            />
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Showing <strong>{filteredFloats.length}</strong> Float Entries
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase font-bold text-slate-400 bg-slate-50/80">
                <th className="py-3 px-5">Float ID</th>
                <th className="py-3 px-5">Latitude</th>
                <th className="py-3 px-5">Longitude</th>
                <th className="py-3 px-5">Observation Time</th>
                <th className="py-3 px-5">Depth</th>
                <th className="py-3 px-5">Temp (°C)</th>
                <th className="py-3 px-5">Salinity</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-xs font-mono">
              {paginatedFloats.map((float) => (
                <tr key={float.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-sky-700">#{float.id}</td>
                  <td className="py-3.5 px-5 text-slate-700">{float.lat}°N</td>
                  <td className="py-3.5 px-5 text-slate-700">{float.lon}°E</td>
                  <td className="py-3.5 px-5 text-slate-500 font-sans">{float.time}</td>
                  <td className="py-3.5 px-5 text-slate-700">{float.depth} m</td>
                  <td className="py-3.5 px-5 text-slate-900 font-bold">{float.temp} °C</td>
                  <td className="py-3.5 px-5 text-teal-700 font-bold">{float.salinity} PSU</td>
                  <td className="py-3.5 px-5">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-sans">
                      {float.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right font-sans">
                    <button
                      onClick={() => setActiveTab('gis')}
                      className="px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs transition-colors flex items-center space-x-1 ml-auto"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>View on Map</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fish, Search, BarChart2, PieChart, MapPin } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart as RePieChart, Pie } from 'recharts';
import { apiService } from '../services/api';

export const FisheriesIntelView = () => {
  const [fisheries, setFisheries] = useState([]);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const res = await apiService.getFisheries();
      setFisheries(res);
    };
    fetchData();
  }, []);

  const filteredFisheries = fisheries.filter(f => 
    f.species.toLowerCase().includes(filterText.toLowerCase()) || 
    f.commonName.toLowerCase().includes(filterText.toLowerCase()) ||
    f.state.toLowerCase().includes(filterText.toLowerCase())
  );

  const chartData = fisheries.map(f => ({
    name: f.commonName,
    tonnes: f.landings_tonnes,
    category: f.category
  }));

  const pieData = [
    { name: 'Pelagic', value: 45 },
    { name: 'Demersal', value: 30 },
    { name: 'Crustaceans', value: 15 },
    { name: 'Molluscs', value: 10 },
  ];

  const colors = ['#0284c7', '#0d9488', '#d97706', '#6366f1'];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Fisheries Intelligence
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          ICAR-CMFRI Commercial Catch Trends & Regional Stock Assessment.
        </p>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Observations</span>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">267,100 t</h3>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Annual Catch Volume</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Species Tracked</span>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">128 Taxa</h3>
          <p className="text-[11px] text-sky-600 font-medium mt-1">Commercial Marine Species</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Regions</span>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">9 Coastal States</h3>
          <p className="text-[11px] text-teal-600 font-medium mt-1">East & West Coasts</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Stream Activity</span>
          <h3 className="text-xl font-bold text-emerald-700 font-mono mt-1">Active Landings</h3>
          <p className="text-[11px] text-slate-500 mt-1">CMFRI Telemetry Sync</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200/80 space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-amber-600" />
            <span>Catch Trends by Species (Tonnes)</span>
          </h3>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b' }} />
                <Bar dataKey="tonnes" radius={[6, 6, 0, 0]}>
                  {chartData.map((e, index) => (
                    <Cell key={`c-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Species Category Distribution Pie */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2 mb-2">
            <PieChart className="w-4 h-4 text-teal-600" />
            <span>Category Distribution</span>
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {pieData.map((e, index) => (
                    <Cell key={`p-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600 border-t border-slate-200/60 pt-3">
            {pieData.map((p, i) => (
              <div key={p.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i] }}></span>
                <span>{p.name}: {p.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Searchable Fisheries Table */}
      <div className="glass-card rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search species or state..."
              className="pl-8 pr-4 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-sky-500 w-64"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono">Landings Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase font-bold text-slate-400 bg-slate-50/80">
                <th className="py-3 px-5">Scientific Name</th>
                <th className="py-3 px-5">Common Name</th>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5">State & Region</th>
                <th className="py-3 px-5 text-right">Landings (Tonnes)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-xs font-sans">
              {filteredFisheries.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5 font-bold italic text-slate-800">{f.species}</td>
                  <td className="py-3.5 px-5 text-sky-700 font-semibold">{f.commonName}</td>
                  <td className="py-3.5 px-5 text-slate-600">{f.category}</td>
                  <td className="py-3.5 px-5 text-slate-500">{f.state} ({f.region})</td>
                  <td className="py-3.5 px-5 text-right font-mono font-bold text-amber-700">{f.landings_tonnes?.toLocaleString()} t</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

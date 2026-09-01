import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fish, Filter, BarChart3, PieChart, MapPin, Layers, Award } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { apiService } from '../services/api';
import { SkeletonCard, SkeletonChart } from '../components/SkeletonLoader';
import { AnimatedCounter } from '../components/AnimatedCounter';

export const FisheriesView = () => {
  const [year, setYear] = useState('all');
  const [region, setRegion] = useState('all');
  const [category, setCategory] = useState('all');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiService.getFisheries({ year, region, category });
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year, region, category]);

  // Aggregate catch by species for bar chart
  const speciesChartData = data.map(item => ({
    name: item.commonName || item.species,
    tonnes: item.landings_tonnes,
    state: item.state,
    category: item.category
  })).sort((a, b) => b.tonnes - a.tonnes);

  const totalLandings = data.reduce((acc, curr) => acc + (curr.landings_tonnes || 0), 0);

  const colors = ['#00f2fe', '#38bdf8', '#00ffc4', '#ffb703', '#ff5964', '#a855f7'];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-amber-500/30 glow-cyan"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Fish className="w-8 h-8 animate-bounce" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">ICAR-CMFRI Marine Fisheries Intelligence</h1>
            <p className="text-xs md:text-sm text-ocean-300">National & State-wise Commercial Catch Landings Breakdown</p>
          </div>
        </div>

        <div className="text-right font-mono bg-abyss-950/80 px-5 py-3 rounded-2xl border border-amber-500/30">
          <p className="text-xs text-amber-400/80 uppercase font-semibold">Total Landings Selected</p>
          <p className="text-2xl font-black text-white">
            <AnimatedCounter value={totalLandings} suffix=" Tonnes" />
          </p>
        </div>
      </motion.div>

      {/* Filter Controls Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-ocean-500/30 flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-ocean-200 uppercase">
            <Filter className="w-4 h-4 text-biolum-amber" />
            <span>Filters:</span>
          </div>

          {/* Year Filter Tabs */}
          <div className="flex items-center space-x-1 bg-abyss-950 p-1 rounded-xl border border-ocean-500/20">
            {['all', '2023', '2022', '2021'].map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  year === y ? 'bg-amber-500 text-abyss-950 shadow-md font-bold' : 'text-ocean-300 hover:text-white'
                }`}
              >
                {y === 'all' ? 'All Years' : y}
              </button>
            ))}
          </div>

          {/* Region Selector */}
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl bg-abyss-950 border border-ocean-500/30 text-xs font-semibold text-white focus:outline-none focus:border-biolum-amber"
          >
            <option value="all">All Coasts</option>
            <option value="West Coast">West Coast</option>
            <option value="East Coast">East Coast</option>
          </select>

          {/* Category Selector */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl bg-abyss-950 border border-ocean-500/30 text-xs font-semibold text-white focus:outline-none focus:border-biolum-amber"
          >
            <option value="all">All Categories</option>
            <option value="Pelagic">Pelagic</option>
            <option value="Demersal">Demersal</option>
            <option value="Crustaceans">Crustaceans</option>
            <option value="Molluscs">Molluscs</option>
          </select>
        </div>

        <div className="text-xs text-ocean-300 font-mono">
          Showing <strong>{data.length}</strong> Species Records
        </div>
      </div>

      {/* Analytics Chart & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Animated Bar Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-ocean-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-biolum-amber" />
              <span>Catch Volume by Commercial Species (Tonnes)</span>
            </h3>
            <span className="text-xs text-ocean-300 font-mono">Animated Data Load</span>
          </div>

          {loading ? (
            <SkeletonChart />
          ) : (
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={speciesChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    tick={{ fontSize: 11 }} 
                    angle={-20} 
                    textAnchor="end" 
                  />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#040b17', borderColor: '#38bdf8', borderRadius: '12px', color: '#fff' }} 
                    formatter={(value) => [`${value.toLocaleString()} tonnes`, 'Landings']}
                  />
                  <Bar dataKey="tonnes" radius={[8, 8, 0, 0]} isAnimationActive={true} animationDuration={1200}>
                    {speciesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* State Catch Leaders Card Grid */}
        <div className="glass-panel p-6 rounded-3xl border border-ocean-500/30 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center space-x-2 mb-4">
              <Award className="w-5 h-5 text-amber-400" />
              <span>State Catch Breakdown</span>
            </h3>

            <div className="space-y-3">
              {data.slice(0, 5).map((item, idx) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-3.5 rounded-2xl bg-abyss-950/80 border border-ocean-500/20 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-extrabold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{item.state}</p>
                      <p className="text-xs text-ocean-300">{item.species} ({item.category})</p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <p className="font-bold text-sm text-amber-400">{item.landings_tonnes?.toLocaleString()} t</p>
                    <p className="text-[10px] text-ocean-400">{item.region}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-ocean-500/20 text-center">
            <span className="text-xs text-ocean-400">Source: ICAR-Central Marine Fisheries Research Institute</span>
          </div>
        </div>

      </div>

    </div>
  );
};

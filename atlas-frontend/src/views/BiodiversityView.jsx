import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dna, Search, ExternalLink, ShieldAlert, Sparkles, Filter, ChevronDown, CheckCircle2 } from 'lucide-react';
import { apiService } from '../services/api';
import { SkeletonCard } from '../components/SkeletonLoader';

export const BiodiversityView = () => {
  const [source, setSource] = useState('all');
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [biodiversityData, setBiodiversityData] = useState([]);
  const [loading, setLoading] = useState(true);

  // WoRMS Taxonomy Lookup state
  const [wormsInput, setWormsInput] = useState('Chelonia mydas');
  const [wormsResult, setWormsResult] = useState(null);
  const [wormsLoading, setWormsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiService.getBiodiversity({ source, species: speciesSearch });
        setBiodiversityData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [source, speciesSearch]);

  // WoRMS Resolution Handler
  const handleWormsLookup = async (e) => {
    if (e) e.preventDefault();
    if (!wormsInput.trim()) return;
    setWormsLoading(true);
    try {
      const res = await apiService.resolveTaxonomy(wormsInput.trim());
      setWormsResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setWormsLoading(false);
    }
  };

  useEffect(() => {
    handleWormsLookup();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-emerald-500/30 glow-green"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Dna className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">OBIS & GBIF Marine Biodiversity</h1>
            <p className="text-xs md:text-sm text-ocean-300">Global Species Occurrence Records & WoRMS Taxonomic Resolution</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-abyss-950/80 px-4 py-2 rounded-2xl border border-emerald-500/30 text-xs font-mono text-emerald-400">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>WoRMS API INTEGRATED</span>
        </div>
      </motion.div>

      {/* WoRMS Taxonomic Resolution Drawer Tool */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-6 rounded-3xl border border-emerald-500/30 shadow-2xl space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
              <Dna className="w-5 h-5 text-emerald-400" />
              <span>WoRMS Taxonomic Resolution Tool</span>
            </h3>
            <p className="text-xs text-ocean-300">Verify marine species classification, authority, status & AphiaID</p>
          </div>

          {/* Quick Lookup Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {['Chelonia mydas', 'Rhincodon typus', 'Rastrelliger kanagurta'].map((sp) => (
              <button
                key={sp}
                onClick={() => { setWormsInput(sp); apiService.resolveTaxonomy(sp).then(setWormsResult); }}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-abyss-950 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
              >
                {sp}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleWormsLookup} className="flex gap-3">
          <input 
            type="text"
            value={wormsInput}
            onChange={(e) => setWormsInput(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-abyss-950/90 border border-ocean-500/30 text-white text-sm focus:outline-none focus:border-emerald-400"
            placeholder="Enter Scientific Marine Taxon Name..."
          />
          <button
            type="submit"
            disabled={wormsLoading}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-abyss-950 font-bold text-sm hover:bg-emerald-400 transition-all flex items-center space-x-1.5 shadow-lg"
          >
            <Search className="w-4 h-4" />
            <span>{wormsLoading ? 'RESOLVING...' : 'RESOLVE TAXONOMY'}</span>
          </button>
        </form>

        {/* WoRMS Classification Result Display */}
        {wormsResult && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-5 rounded-2xl bg-abyss-950/90 border border-emerald-500/30 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ocean-500/20 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-white italic">{wormsResult.scientificName}</span>
                  <span className="text-xs text-ocean-400">{wormsResult.authority}</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Status: {wormsResult.status}
                  </span>
                  <span className="text-xs text-ocean-300 font-mono">AphiaID: {wormsResult.aphiaID}</span>
                </div>
              </div>

              <a
                href={wormsResult.wormsUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-ocean-600/60 hover:bg-ocean-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <span>View on WoRMS Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Taxonomic Hierarchy Tree */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ocean-300 mb-2">Taxonomic Lineage Rank:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 font-mono text-xs">
                {[
                  { rank: 'Kingdom', val: wormsResult.hierarchy?.kingdom },
                  { rank: 'Phylum', val: wormsResult.hierarchy?.phylum },
                  { rank: 'Class', val: wormsResult.hierarchy?.class },
                  { rank: 'Order', val: wormsResult.hierarchy?.order },
                  { rank: 'Family', val: wormsResult.hierarchy?.family },
                  { rank: 'Genus', val: wormsResult.hierarchy?.genus },
                  { rank: 'Species', val: wormsResult.hierarchy?.species },
                ].map((t) => (
                  <div key={t.rank} className="p-2 rounded-xl bg-ocean-950/80 border border-ocean-500/20">
                    <span className="text-[10px] text-emerald-400/80 uppercase font-bold block">{t.rank}</span>
                    <span className="text-white truncate block">{t.val || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Filter Controls & Species Card Grid */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 px-1">
          <h3 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span>OBIS & GBIF Species Occurrence Cards</span>
          </h3>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-abyss-950 p-1 rounded-xl border border-ocean-500/20 text-xs">
              {['all', 'OBIS', 'GBIF'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    source === s ? 'bg-emerald-500 text-abyss-950 font-bold' : 'text-ocean-300 hover:text-white'
                  }`}
                >
                  {s === 'all' ? 'All Sources' : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Species Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {biodiversityData.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="glass-panel rounded-3xl border border-ocean-500/30 overflow-hidden shadow-xl flex flex-col justify-between group"
              >
                {/* Species Image */}
                <div className="relative h-44 w-full overflow-hidden bg-abyss-950">
                  <img 
                    src={item.image} 
                    alt={item.scientificName} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-abyss-950 via-transparent to-transparent"></div>
                  
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-abyss-950/80 backdrop-blur border border-emerald-500/40 text-emerald-300">
                    {item.source} Record
                  </span>

                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 backdrop-blur border border-rose-500/40 text-rose-300 flex items-center space-x-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>{item.status}</span>
                  </span>
                </div>

                {/* Species Info */}
                <div className="p-5 space-y-3">
                  <div>
                    <h4 className="text-lg font-extrabold text-white italic">{item.scientificName}</h4>
                    <p className="text-xs text-emerald-400 font-semibold">{item.commonName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-ocean-300 pt-2 border-t border-ocean-500/20">
                    <div>Class: <strong>{item.class}</strong></div>
                    <div>Recorded Depth: <strong>{item.depth} m</strong></div>
                    <div>Observed Date: <strong>{item.date}</strong></div>
                    <div>Lat/Lon: <strong>{item.latitude}, {item.longitude}</strong></div>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="p-4 border-t border-ocean-500/20 bg-ocean-950/40">
                  <button
                    onClick={() => { setWormsInput(item.scientificName); handleWormsLookup(); }}
                    className="w-full py-2 rounded-xl bg-ocean-600/40 hover:bg-ocean-500 text-white font-semibold text-xs transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>Lookup Taxonomy Lineage</span>
                    <Dna className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

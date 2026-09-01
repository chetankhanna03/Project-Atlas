import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, MapPin, ShieldCheck, AlertTriangle, Layers, Calendar, ExternalLink } from 'lucide-react';
import { apiService } from '../services/api';
import { OceanMap } from '../components/OceanMap';
import { SkeletonCard } from '../components/SkeletonLoader';
import { AnimatedCounter } from '../components/AnimatedCounter';

export const ConservationView = () => {
  const [protectedAreas, setProtectedAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMPAs = async () => {
      setLoading(true);
      try {
        const res = await apiService.getProtectedAreas({ radius: 500 });
        setProtectedAreas(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMPAs();
  }, []);

  const totalArea = protectedAreas.reduce((sum, item) => sum + (item.area_km2 || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-rose-500/30 glow-cyan"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">WDPA Marine Protected Areas (MPA)</h1>
            <p className="text-xs md:text-sm text-ocean-300">Protected Oceanic Reserves, IUCN Categories & Marine Sanctuaries</p>
          </div>
        </div>

        <div className="text-right font-mono bg-abyss-950/80 px-5 py-3 rounded-2xl border border-rose-500/30">
          <p className="text-xs text-rose-400/80 uppercase font-semibold">Total Protected Area Coverage</p>
          <p className="text-2xl font-black text-white">
            <AnimatedCounter value={totalArea} suffix=" km²" decimals={1} />
          </p>
        </div>
      </motion.div>

      {/* Map Boundary Visualization */}
      <div className="space-y-3">
        <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-rose-400" />
          <span>MPA Boundary Spatial Overlay</span>
        </h3>

        <OceanMap
          center={[12.97, 77.59]}
          zoom={5}
          radiusKm={450}
          conservationData={protectedAreas}
          activeLayers={['conservation']}
        />
      </div>

      {/* Protected Area Detail Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-rose-400" />
          <span>Protected Area Inventories ({protectedAreas.length} Reserves)</span>
        </h3>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {protectedAreas.map((mpa, idx) => (
              <motion.div
                key={mpa.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="glass-panel p-6 rounded-3xl border border-rose-500/30 shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {mpa.iucn_category}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                      mpa.threat_level === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      mpa.threat_level === 'Moderate' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      Threat: {mpa.threat_level}
                    </span>
                  </div>

                  <h4 className="text-xl font-extrabold text-white">{mpa.name}</h4>
                  <p className="text-xs text-ocean-300 font-semibold">{mpa.designation} | {mpa.country}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-abyss-950/80 border border-ocean-500/20 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-ocean-400 uppercase block">Reserve Area</span>
                    <strong className="text-white text-sm">{mpa.area_km2} km²</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-ocean-400 uppercase block">Designated Year</span>
                    <strong className="text-white text-sm">{mpa.designation_year}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-ocean-400 uppercase block">Latitude</span>
                    <span className="text-ocean-200">{mpa.latitude}°N</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-ocean-400 uppercase block">Longitude</span>
                    <span className="text-ocean-200">{mpa.longitude}°E</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-ocean-500/20 flex items-center justify-between text-xs text-ocean-300">
                  <span>Source: UNEP-WCMC WDPA Database</span>
                  <a 
                    href="https://www.protectedplanet.net" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-rose-400 hover:underline flex items-center space-x-1"
                  >
                    <span>View WDPA Entry</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

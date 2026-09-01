import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map, Layers, Search, Maximize2, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';

// Create soft custom leaflet circular markers
const createSoftMarkerIcon = (colorHex) => {
  return L.divIcon({
    className: 'custom-gis-pin',
    html: `<div style="
      width: 18px; 
      height: 18px; 
      background-color: ${colorHex}; 
      border: 3px solid #ffffff; 
      border-radius: 50%; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10]
  });
};

const mapIcons = {
  argo: createSoftMarkerIcon('#0284c7'),
  fisheries: createSoftMarkerIcon('#d97706'),
  biodiversity: createSoftMarkerIcon('#059669'),
};

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom(), { duration: 1.2 });
  }, [center, map]);
  return null;
}

export const GisExplorerView = () => {
  const [activeLayers, setActiveLayers] = useState(['argo', 'fisheries', 'biodiversity']);
  const [argoData, setArgoData] = useState([]);
  const [fisheriesData, setFisheriesData] = useState([]);
  const [biodiversityData, setBiodiversityData] = useState([]);
  const [searchLocation, setSearchLocation] = useState('');
  const [mapCenter, setMapCenter] = useState([14.25, 76.80]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [a, f, b] = await Promise.all([
          apiService.getArgoObservations(),
          apiService.getFisheries(),
          apiService.getBiodiversity()
        ]);
        setArgoData(a);
        setFisheriesData(f);
        setBiodiversityData(b);
      } catch (err) {
        console.error(err);
      }
    };
    loadAll();
  }, []);

  const toggleLayer = (layerId) => {
    setActiveLayers(prev =>
      prev.includes(layerId) ? prev.filter(l => l !== layerId) : [...prev, layerId]
    );
  };

  const handleLocationSearch = (e) => {
    e.preventDefault();
    if (!searchLocation) return;
    const lower = searchLocation.toLowerCase();
    if (lower.includes('arabian') || lower.includes('goa') || lower.includes('mumbai')) {
      setMapCenter([18.96, 72.83]);
    } else if (lower.includes('andaman') || lower.includes('bay')) {
      setMapCenter([11.67, 92.74]);
    } else if (lower.includes('kerala') || lower.includes('cochin')) {
      setMapCenter([9.93, 76.26]);
    } else {
      setMapCenter([14.25, 76.80]);
    }
  };

  return (
    <div className={`space-y-4 pb-8 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}>
      
      {/* Map Control Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">GIS Ocean Explorer</h2>
            <p className="text-[11px] text-slate-500">Spatial Telemetry & Environmental Vector Overlay</p>
          </div>
        </div>

        {/* Location Search Bar */}
        <form onSubmit={handleLocationSearch} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Search region (e.g. Arabian Sea, Kerala)..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500 w-56"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 rounded-xl bg-sky-600 text-white font-semibold text-xs hover:bg-sky-500">
            Go
          </button>
        </form>

        {/* Layer Controls & Fullscreen */}
        <div className="flex items-center space-x-2">
          {[
            { id: 'argo', label: 'ARGO Floats', color: 'bg-sky-500' },
            { id: 'fisheries', label: 'Fisheries', color: 'bg-amber-500' },
            { id: 'biodiversity', label: 'Biodiversity', color: 'bg-emerald-500' },
          ].map(l => (
            <button
              key={l.id}
              onClick={() => toggleLayer(l.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                activeLayers.includes(l.id) 
                  ? 'bg-white border-slate-300 text-slate-800 shadow-sm' 
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${l.color}`}></span>
              <span>{l.label}</span>
            </button>
          ))}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Toggle Fullscreen Map"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Main Map Container */}
      <div className="w-full h-[540px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-md relative">
        <MapContainer center={mapCenter} zoom={6} className="w-full h-full z-0 bg-slate-100">
          <MapRecenter center={mapCenter} />

          {/* Standard Free World Tiles - No API Key Required */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* ARGO Markers */}
          {activeLayers.includes('argo') && argoData.map((item) => (
            <Marker key={`argo-${item.id}`} position={[item.lat, item.lon]} icon={mapIcons.argo}>
              <Popup>
                <div className="p-2 text-xs font-sans space-y-1">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-sky-100 text-sky-800">ARGO Float #{item.id}</span>
                  <p className="text-slate-500 pt-1">Time: {item.time}</p>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono pt-1 border-t border-slate-200">
                    <div>Temp: <strong>{item.temp}°C</strong></div>
                    <div>Salinity: <strong>{item.salinity} PSU</strong></div>
                    <div>Depth: <strong>{item.depth} m</strong></div>
                    <div>Status: <strong className="text-emerald-600">{item.status}</strong></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Fisheries Markers */}
          {activeLayers.includes('fisheries') && fisheriesData.map((item) => (
            <Marker key={`fish-${item.id}`} position={[item.lat, item.lon]} icon={mapIcons.fisheries}>
              <Popup>
                <div className="p-2 text-xs font-sans space-y-1">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-100 text-amber-800">Fisheries Landing</span>
                  <h4 className="font-bold text-slate-800">{item.species} ({item.commonName})</h4>
                  <p className="text-slate-600">Landings: <strong>{item.landings_tonnes?.toLocaleString()} tonnes</strong></p>
                  <p className="text-slate-500">{item.state} | {item.region}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Biodiversity Markers */}
          {activeLayers.includes('biodiversity') && biodiversityData.map((item) => (
            <Marker key={`bio-${item.id}`} position={[item.lat, item.lon]} icon={mapIcons.biodiversity}>
              <Popup>
                <div className="p-2 text-xs font-sans space-y-1">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800">eDNA Record</span>
                  <h4 className="font-bold text-slate-800">{item.scientificName}</h4>
                  <p className="text-slate-600">{item.commonName}</p>
                  <p className="text-slate-500">Hotspot: {item.hotspot}</p>
                </div>
              </Popup>
            </Marker>
          ))}

        </MapContainer>
      </div>

    </div>
  );
};

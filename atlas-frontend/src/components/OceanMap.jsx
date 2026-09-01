import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix standard Leaflet default marker icon path issue with custom divIcons
const createCustomIcon = (colorHex) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="
      width: 18px; 
      height: 18px; 
      background-color: ${colorHex}; 
      border: 2.5px solid #ffffff; 
      border-radius: 50%; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10]
  });
};

const icons = {
  searchCenter: createCustomIcon('#0284c7'),
  fisheries: createCustomIcon('#d97706'),
  argo: createCustomIcon('#38bdf8'),
  biodiversity: createCustomIcon('#059669'),
  conservation: createCustomIcon('#e11d48'),
};

// Map Recenter Helper Component
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export const OceanMap = ({ 
  center = [12.97, 77.59], 
  zoom = 6, 
  radiusKm = 250, 
  fisheriesData = [], 
  argoData = [], 
  biodiversityData = [], 
  conservationData = [],
  activeLayers = ['fisheries', 'argo', 'biodiversity', 'conservation']
}) => {
  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden shadow-md border border-slate-200 glass-panel">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        className="w-full h-full z-0 bg-slate-100"
      >
        <ChangeView center={center} zoom={zoom} />

        {/* Free World Tile Server - No API Key Required */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Query Radius Circle */}
        {radiusKm > 0 && (
          <Circle
            center={center}
            radius={radiusKm * 1000}
            pathOptions={{
              color: '#0284c7',
              fillColor: '#38bdf8',
              fillOpacity: 0.15,
              weight: 1.5,
              dashArray: '6, 6'
            }}
          />
        )}

        {/* Search Center Pin */}
        <Marker position={center} icon={icons.searchCenter}>
          <Popup className="custom-popup">
            <div className="p-2 font-sans text-xs">
              <strong className="text-sky-700 block mb-1">🔍 Search Center Coordinates</strong>
              <p>Lat: {center[0].toFixed(4)} | Lon: {center[1].toFixed(4)}</p>
              <p>Radius: {radiusKm} km</p>
            </div>
          </Popup>
        </Marker>

        {/* 1. Fisheries Markers */}
        {activeLayers.includes('fisheries') && fisheriesData.map((item, idx) => (
          item.latitude && item.longitude && (
            <Marker key={`fish-${idx}`} position={[item.latitude, item.longitude]} icon={icons.fisheries}>
              <Popup>
                <div className="p-2 text-xs font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-100 text-amber-800">Fisheries Landing</span>
                  <h4 className="font-bold text-sm mt-1 text-slate-800">{item.species} ({item.commonName})</h4>
                  <p className="text-slate-600">Landings: <strong>{item.landings_tonnes?.toLocaleString()} tonnes</strong></p>
                  <p className="text-slate-500">{item.state} | {item.region}</p>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* 2. ARGO Float Markers */}
        {activeLayers.includes('argo') && argoData.map((item, idx) => (
          item.latitude && item.longitude && (
            <Marker key={`argo-${idx}`} position={[item.latitude, item.longitude]} icon={icons.argo}>
              <Popup>
                <div className="p-2 text-xs font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-sky-100 text-sky-800">ARGO Float #{item.platform_id}</span>
                  <h4 className="font-bold text-sm mt-1 text-slate-800">Cycle {item.cycle_number}</h4>
                  <p className="text-slate-600">Surface Temp: <strong>{item.profiles?.[0]?.temperature}°C</strong></p>
                  <p className="text-slate-600">Surface Salinity: <strong>{item.profiles?.[0]?.salinity} PSU</strong></p>
                  <p className="text-slate-500">Inst: {item.institution}</p>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* 3. Biodiversity Occurrences Markers */}
        {activeLayers.includes('biodiversity') && biodiversityData.map((item, idx) => (
          item.latitude && item.longitude && (
            <Marker key={`bio-${idx}`} position={[item.latitude, item.longitude]} icon={icons.biodiversity}>
              <Popup>
                <div className="p-2 text-xs font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800">{item.source} Record</span>
                  <h4 className="font-bold text-sm mt-1 text-slate-800">{item.scientificName}</h4>
                  <p className="text-slate-600">{item.commonName}</p>
                  <p className="text-slate-500">Status: <strong className="text-emerald-700">{item.status}</strong></p>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* 4. Marine Protected Areas Polygons & Markers */}
        {activeLayers.includes('conservation') && conservationData.map((item, idx) => (
          <React.Fragment key={`mpa-${idx}`}>
            {item.coordinates && (
              <Polygon
                positions={item.coordinates}
                pathOptions={{
                  color: '#e11d48',
                  fillColor: '#e11d48',
                  fillOpacity: 0.15,
                  weight: 2
                }}
              />
            )}
            {item.latitude && item.longitude && (
              <Marker position={[item.latitude, item.longitude]} icon={icons.conservation}>
                <Popup>
                  <div className="p-2 text-xs font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-rose-100 text-rose-800">Protected Area</span>
                    <h4 className="font-bold text-sm mt-1 text-slate-800">{item.name}</h4>
                    <p className="text-slate-600">Category: {item.iucn_category}</p>
                    <p className="text-slate-600">Area: <strong>{item.area_km2} km²</strong></p>
                  </div>
                </Popup>
              </Marker>
            )}
          </React.Fragment>
        ))}

      </MapContainer>
    </div>
  );
};

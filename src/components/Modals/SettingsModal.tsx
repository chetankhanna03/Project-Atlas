import React, { useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [tempUnit, setTempUnit] = useState<'C' | 'K' | 'F'>('C');
  const [streamRate, setStreamRate] = useState('10s');
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [mapProjection, setMapProjection] = useState('EPSG:4326');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border border-[#c4c6cf] rounded-lg shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#e0e3e5] mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-[#001b3d]">settings</span>
            <h2 className="font-bold text-base text-[#001b3d]">System &amp; Pipeline Settings</h2>
          </div>
          <button onClick={onClose} className="text-[#74777f] hover:text-black">
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-label-caps text-[10px] text-[#44474e] uppercase block mb-1">
              Temperature Display Unit
            </label>
            <div className="flex gap-2">
              {(['C', 'K', 'F'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setTempUnit(unit)}
                  className={`flex-1 py-1.5 rounded font-data-mono font-bold border transition-colors ${
                    tempUnit === unit
                      ? 'bg-[#001b3d] text-white border-[#001b3d]'
                      : 'bg-[#f7f9fb] text-[#44474e] border-[#c4c6cf]'
                  }`}
                >
                  °{unit}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-label-caps text-[10px] text-[#44474e] uppercase block mb-1">
              Telemetry Polling Frequency
            </label>
            <select
              value={streamRate}
              onChange={(e) => setStreamRate(e.target.value)}
              className="w-full border border-[#c4c6cf] rounded p-2 bg-white text-[#191c1e] font-data-mono"
            >
              <option value="5s">5 seconds (High Frequency)</option>
              <option value="10s">10 seconds (Standard)</option>
              <option value="60s">60 seconds (Low Bandwidth)</option>
            </select>
          </div>

          <div>
            <label className="font-label-caps text-[10px] text-[#44474e] uppercase block mb-1">
              Map Projection
            </label>
            <select
              value={mapProjection}
              onChange={(e) => setMapProjection(e.target.value)}
              className="w-full border border-[#c4c6cf] rounded p-2 bg-white text-[#191c1e] font-data-mono"
            >
              <option value="EPSG:4326">EPSG:4326 (WGS 84 Lat/Lon)</option>
              <option value="EPSG:3857">EPSG:3857 (Web Mercator)</option>
              <option value="EPSG:3031">EPSG:3031 (Antarctic Polar)</option>
            </select>
          </div>

          <label className="flex items-center gap-2 pt-2 border-t border-[#e0e3e5] cursor-pointer">
            <input
              type="checkbox"
              checked={enableAlerts}
              onChange={(e) => setEnableAlerts(e.target.checked)}
              className="text-[#00BFFF] rounded"
            />
            <span className="text-xs text-[#191c1e]">
              Enable real-time Marine Heatwave (MHW) alert notifications
            </span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-[#e0e3e5]">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#c4c6cf] rounded text-xs font-label-caps uppercase text-[#44474e] hover:bg-[#f2f4f6]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-[#001b3d] hover:bg-[#002d66] text-white rounded text-xs font-label-caps uppercase font-bold transition-colors cursor-pointer"
          >
            {saved ? 'Saved!' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

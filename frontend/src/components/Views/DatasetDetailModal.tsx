import React, { useState } from 'react';
import { Dataset } from '../../types';

interface DatasetDetailModalProps {
  dataset: Dataset | null;
  onClose: () => void;
  onQueryInChat: (datasetTitle: string) => void;
}

export const DatasetDetailModal: React.FC<DatasetDetailModalProps> = ({
  dataset,
  onClose,
  onQueryInChat,
}) => {
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!dataset) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://api.project-atlas.ocean/v1/datasets/${dataset.id}/query`);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const handleDownload = () => {
    setDownloadSuccess(true);
    const content = JSON.stringify(dataset, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.id}-metadata.json`;
    a.click();
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white border border-[#c4c6cf] rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#001b3d] text-white p-5 flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-label-caps text-[10px] text-[#00BFFF] bg-[#00285a] px-2 py-0.5 rounded uppercase">
                {dataset.domain}
              </span>
              <span className="font-data-mono text-[11px] text-[#9fc2fe]">
                DOI: {dataset.doi || '10.48670/moi-00165'}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">{dataset.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-[#191c1e]">
          {/* Overview & Grid Info */}
          <div>
            <h3 className="font-label-caps text-[11px] text-[#44474e] uppercase mb-2">Description</h3>
            <p className="text-sm leading-relaxed text-[#191c1e]">{dataset.description}</p>
          </div>

          {/* Metadata Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f7f9fb] p-4 rounded border border-[#c4c6cf]">
            <div>
              <span className="font-label-caps text-[10px] text-[#74777f] uppercase block">Spatial Resolution</span>
              <span className="font-data-mono text-[12px] font-bold text-[#001b3d]">{dataset.spatialResolution}</span>
            </div>
            <div>
              <span className="font-label-caps text-[10px] text-[#74777f] uppercase block">Temporal Frequency</span>
              <span className="font-data-mono text-[12px] font-bold text-[#001b3d]">{dataset.frequency}</span>
            </div>
            <div>
              <span className="font-label-caps text-[10px] text-[#74777f] uppercase block">Source Node</span>
              <span className="font-data-mono text-[12px] font-bold text-[#001b3d]">{dataset.sourceNode}</span>
            </div>
            <div>
              <span className="font-label-caps text-[10px] text-[#74777f] uppercase block">Format</span>
              <span className="font-data-mono text-[12px] font-bold text-[#001b3d]">{dataset.format || 'NetCDF-4'}</span>
            </div>
          </div>

          {/* Geographic Bounding Box Map Preview */}
          <div>
            <h3 className="font-label-caps text-[11px] text-[#44474e] uppercase mb-2">
              Geographic Coverage &amp; Bounding Box
            </h3>
            <div className="h-48 rounded border border-[#c4c6cf] relative overflow-hidden bg-[#e0e3e5]">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbAp36RhgbTbG3_8pEQzrtVi8j2Z9IftmHL2vQ0PhUR3nJk742y5hoUlA5QaxeXNNVmnrieYhqEEuDo8JkGLKVNZNeGyVcR7Pt0RJ-XoqlbhiAxrRe662PanbWlDWhFrdORyzYVl7v06vqi1_BjWQERZtj9EdgsLDyEDonH1UGroyRe0-uL-7d69Lf0edYFLLsPVrlNPNC1jqyfDibiTusuFO30jl4aYKjjxgxQqPvore2NyCfRpCbNA"
                alt="Global Bounding Box Map"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-[10px] font-data-mono text-[#001b3d] border border-[#c4c6cf]">
                Lat: [-90.00°, +90.00°] | Lon: [-180.00°, +180.00°]
              </div>
            </div>
          </div>

          {/* Parameters & Variables Table */}
          {dataset.parameters && (
            <div>
              <h3 className="font-label-caps text-[11px] text-[#44474e] uppercase mb-2">
                Available Variables ({dataset.parameters.length})
              </h3>
              <div className="border border-[#c4c6cf] rounded overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f2f4f6] text-[#001b3d] border-b border-[#c4c6cf]">
                    <tr>
                      <th className="font-label-caps px-4 py-2.5 uppercase">Variable Name</th>
                      <th className="font-label-caps px-4 py-2.5 uppercase">Standard CF Name</th>
                      <th className="font-label-caps px-4 py-2.5 uppercase">Unit</th>
                      <th className="font-label-caps px-4 py-2.5 uppercase">Valid Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.parameters.map((param, i) => (
                      <tr key={i} className="border-b border-[#e0e3e5] last:border-0 hover:bg-[#f7f9fb]">
                        <td className="px-4 py-2.5 font-data-mono font-bold text-[#001b3d]">{param.name}</td>
                        <td className="px-4 py-2.5 font-data-mono text-[#44474e]">{param.standardName}</td>
                        <td className="px-4 py-2.5 font-data-mono text-[#008ebe]">{param.unit}</td>
                        <td className="px-4 py-2.5 font-data-mono text-[#74777f]">{param.validRange}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-[#f2f4f6] border-t border-[#c4c6cf] p-4 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#c4c6cf] rounded text-xs font-medium hover:bg-[#e0e3e5] text-[#001b3d] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedEndpoint ? 'check' : 'content_copy'}
              </span>
              <span>{copiedEndpoint ? 'Copied API URI' : 'Copy API URI'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#c4c6cf] rounded text-xs font-medium hover:bg-[#e0e3e5] text-[#001b3d] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>{downloadSuccess ? 'Downloaded' : 'Export Schema'}</span>
            </button>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#c4c6cf] text-[#44474e] hover:bg-[#e0e3e5] rounded text-xs font-label-caps uppercase tracking-wider"
            >
              Close
            </button>
            <button
              onClick={() => {
                onQueryInChat(dataset.title);
                onClose();
              }}
              className="px-5 py-2 bg-[#001b3d] hover:bg-[#002d66] text-white rounded text-xs font-label-caps uppercase tracking-wider font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#00BFFF]">forum</span>
              <span>Query in FloatChat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, {useEffect, useState} from 'react';
import {AIStatus, getAIStatus, getDocuments, LibraryDocument} from '../../services/atlas';

interface Props { isOpen: boolean; onClose: () => void; onOpenChat?: () => void; }
export const KnowledgeSyncModal: React.FC<Props> = ({isOpen, onClose, onOpenChat}) => {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    setLoading(true); setError(''); setStatus(null);
    Promise.all([getAIStatus(controller.signal), getDocuments(controller.signal)])
      .then(([nextStatus, library]) => {if (!controller.signal.aborted) {setStatus(nextStatus); setDocuments(library.documents);}})
      .catch(error => {if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not read knowledge status.');})
      .finally(() => {if (!controller.signal.aborted) setLoading(false);});
    return () => controller.abort();
  }, [isOpen, refresh]);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true" aria-labelledby="knowledge-title">
    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-3"><h2 id="knowledge-title" className="font-semibold text-[#001b3d]">Knowledge library status</h2><button onClick={onClose} aria-label="Close knowledge status" className="text-xs text-slate-500">Close</button></div>
      <p className="text-xs text-slate-600 mt-4">Atlas retrieves observations when a question needs them. Scientific documents are indexed explicitly in FloatChat's shared library.</p>
      {loading && <p className="text-sm py-5" role="status">Reading backend status...</p>}
      {error && <p role="alert" className="bg-amber-50 text-amber-900 text-xs p-3 my-3 rounded">{error}</p>}
      {status && <dl className="grid grid-cols-2 gap-3 my-5 text-xs"><dt>Answer mode</dt><dd>{status.model_configured ? 'Model configured' : 'Evidence only'}</dd><dt>Documents</dt><dd>{documents.length}</dd><dt>Indexed passages</dt><dd>{documents.reduce((total,doc) => total + doc.chunks, 0)}</dd><dt>Embedded passages</dt><dd>{documents.reduce((total,doc) => total + doc.embedded_chunks, 0)}</dd></dl>}
      <p className="text-[11px] text-slate-500">Configuration is not a connectivity check. This panel does not bulk-download datasets or claim that external pipelines are live.</p>
      <div className="mt-5 flex gap-2"><button onClick={() => setRefresh(value => value+1)} disabled={loading} className="text-xs border rounded px-3 py-2 disabled:opacity-50">Refresh status</button>{onOpenChat && <button onClick={onOpenChat} className="text-xs bg-[#001b3d] text-white rounded px-3 py-2">Open FloatChat</button>}</div>
    </div>
  </div>;
};

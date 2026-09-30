import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getTaxonomy, safeSourceUrl, type ChatResponse } from '../../services/atlas';
import type { OceanSnapshot } from './OceanWorkspace';

export type EvidenceGraph = ChatResponse['knowledge_graph'];
type Node = EvidenceGraph['nodes'][number];
const kinds = ['source','document','evidence','species','location','parameter','time'];
const palette = ['#0369a1','#7e22ce','#0f766e','#15803d','#b45309','#be123c','#475569'];

export function snapshotGraph(snapshot: OceanSnapshot | null): EvidenceGraph {
  const graph: EvidenceGraph = {nodes: [], edges: [], persistence: 'request_only', limitations: ['Relationships describe the loaded sample, not causation or a complete ecological network.']};
  if (!snapshot) return graph;
  const nodes = new Map<string, Node>();
  const add = (id: string, kind: string, label: string, data?: Record<string, any>) => {if (!nodes.has(id)) nodes.set(id, {id,kind,label,data}); return id;};
  const link = (source: string, target: string, kind: string) => graph.edges.push({source,target,kind});
  const q = snapshot.query;
  const location = add('area','location',q.region || 'Selected area',{bbox:[q.west,q.south,q.east,q.north],start:q.start,end:q.end});
  for (const result of snapshot.results) {
    if (!result.data) continue;
    const data = result.data;
    const source = add('source:'+result.layer,'source',data.provenance?.source || data.source || result.layer,{...data.provenance});
    const evidence = add('evidence:'+result.layer,'evidence',`${result.layer.toUpperCase()} loaded sample`,{source: nodes.get(source)?.label, ...data.provenance, query:data.query, limitations:data.limitations, record_count:data.count ?? data.profiles?.length});
    link(source,evidence,'PROVIDES'); link(evidence,location,'OBSERVED_AT');
    if (!(result.layer === 'obis' && q.obisPeriod === 'all_time')) {
      for (const [key, date] of [['START',q.start],['END',q.end]]) if (date) link(evidence,add('time:'+date,'time',date,{role:'Requested query window',boundary:key}),'PERIOD_'+key);
    }
    for (const row of (data.results || []).slice(0,100)) {
      if (!row.scientific_name) continue;
      const species = add('species:'+row.scientific_name,'species',row.scientific_name,{observations:[]});
      nodes.get(species)!.data!.observations.push({...row, ...data.provenance});
      if (row.event_date) link(species,add('observed:'+row.event_date,'time',row.event_date,{role:'OBIS observation date'}),'PERIOD_START');
      if (!graph.edges.some(e=>e.source===evidence && e.target===species)) link(evidence,species,'MENTIONS');
    }
    for (const [index, profile] of (data.profiles || []).slice(0,20).entries()) {
      const id=add('profile:'+index,'evidence',`ARGO ${profile.float_id} cycle ${profile.cycle}`,profile);
      link(source,id,'PROVIDES'); link(id,location,'OBSERVED_AT');
      if (profile.variable) link(id,add('parameter:'+profile.variable,'parameter',profile.variable,{unit:profile.unit,pressure_unit:'dbar'}),'MEASURES');
    }
  }
  graph.nodes = [...nodes.values()]; return graph;
}

export function KnowledgeGraph({graph}: {graph: EvidenceGraph}) {
  const [limit,setLimit]=useState(20), [selected,setSelected]=useState<Node|null>(null);
  const [scale,setScale]=useState(1), [pan,setPan]=useState({x:0,y:0});
  const [taxonomy,setTaxonomy]=useState<any>(null), [error,setError]=useState('');
  const drag=useRef<{x:number;y:number;px:number;py:number}|null>(null);
  useEffect(()=>{setSelected(null);setLimit(20);setPan({x:0,y:0});setScale(1);},[graph]);
  useEffect(()=>{setTaxonomy(null);setError('');},[selected?.id]);
  const nodes=useMemo(()=>{
    const sorted=[...graph.nodes].sort((a,b)=>kinds.indexOf(a.kind)-kinds.indexOf(b.kind));
    // Include each available type before filling the initial sample.
    const first=kinds.map(kind=>sorted.find(n=>n.kind===kind)).filter(Boolean) as Node[];
    return [...first,...sorted.filter(n=>!first.includes(n))].slice(0,limit);
  },[graph,limit]);
  const positions=new Map(nodes.map((node,index)=>[node.id,{x:125+(index%4)*255,y:60+Math.floor(index/4)*95}]));
  const height=Math.max(320,Math.ceil(nodes.length/4)*95+30);
  const edges=graph.edges.filter(e=>positions.has(e.source)&&positions.has(e.target));
  const related=selected ? graph.edges.filter(e=>e.source===selected.id||e.target===selected.id).map(e=>graph.nodes.find(n=>n.id===(e.source===selected.id?e.target:e.source))).filter(Boolean) as Node[] : [];
  async function resolveSpecies() {
    if (!selected) return;
    const id=selected.id;setError('Resolving WoRMS…');
    try { const result=await getTaxonomy(selected.label); setTaxonomy({id,result});setError(''); }
    catch(err) {setError(err instanceof Error?err.message:'WoRMS unavailable');}
  }
  return <section className="atlas-panel p-5" aria-label="Interactive knowledge graph">
    <h2 className="text-xl font-semibold">Knowledge graph</h2>
    <p className="text-sm text-slate-600 my-2">{graph.persistence==='neo4j'?'Evidence graph saved to Neo4j.':'Request-local evidence graph — no persistent Neo4j graph is configured or available.'} Select a node to inspect its provenance.</p>
    {!nodes.length ? <p className="p-6">Load real observations in Explore or ask Atlas a question to build this graph.</p> : <>
      <div className="flex flex-wrap items-center gap-3 my-3 text-sm">
        <button className="atlas-secondary" onClick={()=>setScale(s=>Math.min(4,s*1.3))}>Zoom in</button>
        <button className="atlas-secondary" onClick={()=>setScale(s=>Math.max(.3,s/1.3))}>Zoom out</button>
        <button className="atlas-secondary" onClick={()=>{setScale(1);setPan({x:0,y:0});}}>Fit to view</button>
        <span>{nodes.length} of {graph.nodes.length} nodes · drag background to pan</span>
        {limit<graph.nodes.length && <button className="atlas-secondary" onClick={()=>setLimit(n=>Math.min(n+40,240))} disabled={limit>=240}>Expand 40 nodes</button>}
      </div>
      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] gap-4">
        <svg viewBox={`0 0 1030 ${height}`} className="w-full h-[520px] border rounded-xl bg-slate-50 touch-none" role="group" aria-label="Evidence nodes and relationships"
          onPointerDown={e=>{if((e.target as Element).closest('[data-node]'))return;e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};}}
          onPointerMove={e=>{if(drag.current){const factor=1030/e.currentTarget.getBoundingClientRect().width;setPan({x:drag.current.px+(e.clientX-drag.current.x)*factor,y:drag.current.py+(e.clientY-drag.current.y)*factor});}}}
          onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null}>
          <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
            {edges.map((edge,i)=>{const a=positions.get(edge.source)!,b=positions.get(edge.target)!;return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={selected&&(edge.source===selected.id||edge.target===selected.id)?'#0891b2':'#cbd5e1'} strokeWidth="2"><title>{edge.kind}</title></line>;})}
            {nodes.map(node=>{const p=positions.get(node.id)!;return <g data-node="true" key={node.id} role="button" tabIndex={0} aria-label={`${node.kind}: ${node.label}`} onClick={()=>setSelected(node)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(node);}}} className="cursor-pointer" transform={`translate(${p.x} ${p.y})`}>
              <rect x="-114" y="-29" width="228" height="58" rx="12" fill={selected?.id===node.id?'#ecfeff':'white'} stroke={palette[kinds.indexOf(node.kind)]||'#475569'} strokeWidth={selected?.id===node.id?3:1.5}/>
              <text y="-8" textAnchor="middle" fill="#64748b" fontSize="12">{node.kind.toUpperCase()}</text>
              <text y="14" textAnchor="middle" fill="#0f172a" fontSize="16">{node.label.length>23?node.label.slice(0,21)+'…':node.label}</text><title>{node.label}</title>
            </g>;})}
          </g>
        </svg>
        <aside className="border rounded-xl p-4 max-h-[520px] overflow-auto" aria-label="Node details">
          {!selected?<p>Click a source, species, document or evidence node.</p>:<>
            <small>{selected.kind.toUpperCase()}</small><h3 className="font-semibold my-2">{selected.label}</h3>
            {selected.kind==='species' && <button className="atlas-secondary" onClick={resolveSpecies}>Resolve with WoRMS</button>}
            {error&&<p role="status">{error}</p>}
            {taxonomy?.id===selected.id&&<div className="my-3">{(taxonomy.result.results||[]).map((match:any,i:number)=><div key={i}><h4 className="font-semibold">WoRMS classification</h4><Fields data={match}/></div>)}<Fields data={taxonomy.result.provenance||{}}/>{!taxonomy.result.results?.length&&<p>No exact marine taxon match found.</p>}</div>}
            {safeSourceUrl(selected.data?.url)&&<a className="text-cyan-700 underline" href={safeSourceUrl(selected.data?.url)} target="_blank" rel="noreferrer">Open original source</a>}
            {selected.data?.text&&<p className="text-sm whitespace-pre-wrap my-3">{selected.data.text}</p>}
            {selected.data&&<><Fields data={selected.data}/>{selected.data.observations&&<div className="my-3"><h4 className="font-semibold">Related OBIS observations ({selected.data.observations.length})</h4>{selected.data.observations.slice(0,5).map((row:any,i:number)=><div key={i} className="border-t mt-2 pt-2"><Fields data={row}/></div>)}</div>}<details className="text-xs mt-3"><summary>Full source metadata</summary><pre className="whitespace-pre-wrap break-words">{JSON.stringify(selected.data,null,2)}</pre></details></>}
            <h4 className="font-semibold mt-4">Related evidence / entities</h4>
            {related.map((node,i)=><button key={i} className="block text-left text-sm text-cyan-800 underline mt-2" onClick={()=>setSelected(node)}>{node.kind}: {node.label}</button>)}
            {!related.length&&<p>No related evidence in this request.</p>}
          </>}
        </aside>
      </div>
    </>}
    {graph.limitations.map((note,i)=><p key={i} className="text-xs text-slate-600 mt-3">{note}</p>)}
  </section>;
}

function Fields({data}:{data:Record<string,any>}) {
  return <dl className="text-sm space-y-2 my-3">{Object.entries(data).filter(([key,value])=>value!=null && key!=='text' && (typeof value!=='object'||(Array.isArray(value)&&value.every(v=>typeof v!=='object')))).map(([key,value])=><div key={key} className="break-words"><dt className="text-xs text-slate-500 capitalize">{key.replaceAll('_',' ')}</dt><dd>{String(Array.isArray(value)?value.join(', '):value)}</dd></div>)}</dl>;
}

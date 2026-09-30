"""Opt-in live regression. Private library passages stay local unless explicitly enabled.
Run against the canonical backend: python scripts/check_demo.py [--include-library-llm]
"""
import argparse
import asyncio
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
import httpx
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))

QUESTION='What oceanographic, biodiversity and fisheries information is available for the Arabian Sea, and what does the scientific literature say about marine heatwaves in this region?'


async def main(include_library):
    end=datetime.now(timezone.utc).date()
    start=end-timedelta(days=30)
    base={'bbox':'50,5,78,25','start':str(start),'end':str(end)}
    report={'checked_at':datetime.now(timezone.utc).isoformat(),'checks':{}}
    output=Path(__file__).resolve().parents[2]/'artifacts'/'demo-live.json'
    output.parent.mkdir(exist_ok=True)
    async with httpx.AsyncClient(base_url='http://127.0.0.1:8000',timeout=240) as client:
        async def get(name,path,params=None):
            response=await client.get(path,params=params)
            data=response.json()
            report['checks'][name]={'http_status':response.status_code,'status':data.get('status'),
                'count':data.get('count',len(data.get('profiles',data.get('results',[])))),
                'provenance':data.get('provenance'),'limitations':data.get('limitations',[])}
            if response.status_code!=200: report['checks'][name]['error']=data.get('detail')
            print(name, response.status_code, data.get('status'), flush=True)
            return data if response.status_code==200 else None
        ready=await get('database','/ready');report['database']=ready
        argo,obis,gfw,worms,sst=await asyncio.gather(
            get('argo','/api/oceanography/argo/gdac',{**base,'limit':5}),
            get('obis_dated','/api/biodiversity/obis',{**base,'limit':2}),
            get('gfw','/api/fisheries/effort',base),
            get('worms','/api/taxonomy/resolve',{'name':'Thunnus albacares'}),
            get('sst','/api/oceanography/erddap/sst',{'lat':15,'lon':65,'days':2}))
        if argo and gfw:
            # At most 25 files. Pagination is explicit and profiles are never fabricated.
            for _ in range(4):
                if len({p['time'][:10] for p in argo['profiles']})>=3 or argo.get('next_offset') is None:break
                page=await client.get('/api/oceanography/argo/gdac',params={**base,'limit':5,'offset':argo['next_offset']})
                if page.status_code!=200:break
                data=page.json();argo['profiles']+=data['profiles'];argo['next_offset']=data.get('next_offset')
            analysis=await client.post('/api/science/ocean-fisheries',json={'argo':argo,'gfw':gfw})
            report['analysis']=analysis.json()
        output.write_text(json.dumps(report,indent=2,default=str),encoding='utf-8')
        print('Public provider checks complete; checking local RAG.',flush=True)
        # Local RAG retrieval and reranking: never sends library passages externally.
        from app.ai import rag, rerank
        passages,mode,notes=await rag.search('What are marine heatwaves?',[],32)
        selected,diagnostics,warnings=await rerank.rerank('What are marine heatwaves?',passages)
        report['rag']={'candidates':len(passages),'selected':[{'title':e.title,'doi':e.doi,'page':e.page,'score':e.metadata.get('relevance_score')} for e in selected],'limitations':notes+warnings}
        print('Local RAG selected',len(selected),'passages; checking chat.',flush=True)
        payload={'message':QUESTION}
        if not include_library:
            # Empty document scope is an explicit test constraint, not a production fallback.
            payload['document_ids']=['demo-check-no-private-documents']
        response=await client.post('/api/chat',json=payload)
        chat=response.json()
        report['chat']={'http_status':response.status_code,'library_sent_to_llm':include_library,
            'status':chat.get('status'),'mode':chat.get('mode'),'answer':chat.get('answer'),'domains':chat.get('plan',{}).get('domains'),
            'agents':[{'domain':a['domain'],'status':a['status'],'sources':a.get('source_statuses')} for a in chat.get('agents',[])],
            'limitations':chat.get('limitations'),'citation_validation':(chat.get('diagnostics') or {}).get('citation_validation'),
            'used_evidence_kinds':sorted({e['kind'] for e in chat.get('citations',[]) if any(e['id'] in c['evidence_ids'] for c in chat.get('claims',[]))}),
            'graph_nodes':len(chat.get('knowledge_graph',{}).get('nodes',[]))}
    output.write_text(json.dumps(report,indent=2,default=str),encoding='utf-8')
    print(json.dumps(report,indent=2,default=str))
    public_pass = (all(report['checks'][key]['http_status']==200 for key in ('argo','obis_dated','gfw','worms'))
        and selected and report['chat']['http_status']==200 and report['chat']['status'] in ('ok','partial')
        and (report['chat']['citation_validation'] or {}).get('passed',False)
        and set(report['chat']['domains'] or []) == {'ocean','biodiversity','fisheries','research'})
    literature_pass = not include_library or (report['chat']['mode']=='model' and 'literature' in report['chat']['used_evidence_kinds'])
    return 0 if public_pass and literature_pass else 1


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--include-library-llm',action='store_true',help='Explicitly authorize sending selected local paper passages to the configured LLM provider.')
    raise SystemExit(asyncio.run(main(parser.parse_args().include_library_llm)))

"""Index user-supplied PDFs locally, retaining page numbers and DOI attribution."""
import argparse, asyncio, json, logging, os, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
# Match the local launcher; never write to a shared database from this utility.
os.environ['DATABASE_URL']='sqlite:///'+(ROOT/'atlas-local.db').as_posix()
from pypdf import PdfReader
from app.database import init_db
from app.ai import rag,provider
from app.ai.schemas import DocumentInput

SPECIAL={
 '2026.eacl-long.303.pdf':('SciRAG: Adaptive, Citation-Aware, and Outline-Guided Retrieval and Synthesis for Scientific Literature','10.18653/v1/2026.eacl-long.303'),
 'annurev-marine-032720-095144.pdf':('Marine Heatwaves','10.1146/annurev-marine-032720-095144'),
 'annurev-marine-041421-082251.pdf':('Environmental DNA Metabarcoding: A Novel Method for Biodiversity Monitoring of Marine Fish Communities','10.1146/annurev-marine-041421-082251'),
}

async def main(folder):
 init_db()
 logging.getLogger('pypdf').setLevel(logging.ERROR)
 report=[]
 for path in sorted(folder.glob('*.pdf')):
  reader=PdfReader(path)
  pages=[(i+1,re.sub(r'(?m)^Downloaded from.*\n?','',page.extract_text() or '')) for i,page in enumerate(reader.pages)]
  first='\n'.join(text for _,text in pages[:2])
  found=re.search(r'10\.\d{4,9}/[^\s<>]+',first)
  title,doi=SPECIAL.get(path.name,(str(reader.metadata.title or path.stem),found[0].rstrip('.,;)') if found else None))
  if not doi: raise ValueError('Missing verified citation for '+path.name)
  groups=[]; group=[]; size=0
  for page,text in pages:
   if group and size+len(text)>95000: groups.append(group);group=[];size=0
   group.append((page,text));size+=len(text)
  if group: groups.append(group)
  for i,group in enumerate(groups):
   part_title=title+(f' (part {i+1}/{len(groups)})' if len(groups)>1 else '')
   meta=DocumentInput(title=part_title,text='\n'.join(t for _,t in group),source_url='https://doi.org/'+doi,
       doi=doi,license='User-supplied research copy; publisher terms apply',use_embeddings=True)
   result=await rag.ingest(meta,group)
   if result['retrieval_mode']=='lexical':
    await rag.reindex(result['id'])
   report.append({'file':path.name,'title':part_title,'id':result['id'],'chunks':result['chunks']})
   print(json.dumps(report[-1],ensure_ascii=True),flush=True)
 results,mode,_=await rag.search('How do marine heatwaves affect fish distribution?',[],limit=4)
 print(json.dumps({'indexed_parts':len(report),'retrieval_mode':mode,'retrieved_titles':[e.title for e in results]},ensure_ascii=True),flush=True)
 (ROOT/'paper-index-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('folder',type=Path)
 asyncio.run(main(parser.parse_args().folder))

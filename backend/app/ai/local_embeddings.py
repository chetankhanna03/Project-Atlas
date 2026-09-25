"""CPU embeddings; weights cached in the workspace, paper text stays local."""
from pathlib import Path
from threading import Lock
from app.config import settings

_lock=Lock()
_models={}


def embed_local(texts,query=False):
    from fastembed import TextEmbedding
    with _lock:
        name=settings.embedding_model
        if name not in _models:
            _models.clear()
            _models[name]=TextEmbedding(model_name=name,cache_dir=str(Path(__file__).resolve().parents[2]/'.embedding-cache'),threads=2)
        model=_models[name]
        iterator=model.query_embed(texts) if query else model.passage_embed(texts)
        return [vector.tolist() for vector in iterator]

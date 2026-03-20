import os, time
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

CHROMA_DIR = os.environ.get("CHROMA_DIR", "./.chroma")
EMB_MODEL = os.environ.get("EMB_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

_client = chromadb.Client(Settings(persist_directory=CHROMA_DIR))
_collection = _client.get_or_create_collection("prt_allowlist")
_model = SentenceTransformer(EMB_MODEL)

def add_docs(docs: list[dict]):
    # docs: [{id, text, url, source, timestamp}]
    _collection.add(
        ids=[d["id"] for d in docs],
        documents=[d["text"] for d in docs],
        metadatas=[{"url": d["url"], "source": d["source"], "ts": d["timestamp"]} for d in docs],
        embeddings=_model.encode([d["text"] for d in docs], convert_to_numpy=True).tolist()
    )

def query(q: str, k=3):
    emb = _model.encode([q], convert_to_numpy=True).tolist()[0]
    res = _collection.query(query_embeddings=[emb], n_results=k)
    out = []
    for i in range(len(res["ids"][0])):
        out.append({
            "id": res["ids"][0][i],
            "text": res["documents"][0][i],
            "meta": res["metadatas"][0][i]
        })
    return out

def now_ms(): return int(time.time()*1000)

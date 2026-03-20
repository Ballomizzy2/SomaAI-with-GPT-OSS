import hashlib, os, time
from urllib.parse import urlparse
from vendors.brightdata import scrape_single
from rag.utils import sanitize_html_to_text, chunk_text
from rag.index import add_docs, now_ms

ALLOW = (os.environ.get("RAG_ALLOWLIST","")).split(",")

def allowlisted(url: str) -> bool:
    host = urlparse(url).netloc
    return any(d for d in ALLOW if d and d in host)

def ingest_url(url: str):
    if not allowlisted(url):
        raise ValueError(f"URL not in allowlist: {url}")
    page = scrape_single(url)
    txt = page.get("text") or sanitize_html_to_text(page.get("html") or "")
    chunks = chunk_text(txt)
    docs = []
    source = urlparse(url).netloc
    ts = now_ms()
    for i, ch in enumerate(chunks):
        did = hashlib.sha1((url+str(i)).encode()).hexdigest()
        docs.append({"id": did, "text": ch, "url": url, "source": source, "timestamp": ts})
    if docs: add_docs(docs)
    return {"url": url, "chunks_added": len(docs)}

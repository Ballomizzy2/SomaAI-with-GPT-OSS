import re
from bs4 import BeautifulSoup

#avoid making unecessary or illegal claims
DISALLOWED = re.compile(r"\b(cure|medication|pill|dose|\d+%|efficacy|effect size|statistically significant)\b", re.I)

def sanitize_html_to_text(html: str, max_chars=4000) -> str:
    text = BeautifulSoup(html or "", "html.parser").get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text).strip()[:max_chars]
    text = DISALLOWED.sub("", text)
    return text

def chunk_text(text: str, max_tokens=350):
    # simple token-ish splitter by sentences/length
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, cur = [], ""
    for s in sentences:
        if len(cur) + len(s) > max_tokens*4:  # rough char≈token*4 heuristic
            if cur: chunks.append(cur.strip())
            cur = s
        else:
            cur += (" " if cur else "") + s
    if cur: chunks.append(cur.strip())
    return [c for c in chunks if len(c) > 50]

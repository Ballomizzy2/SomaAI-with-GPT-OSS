import os, requests

BD_API_KEY = os.environ["BD_API_KEY"]
SERP_URL = os.environ["BD_SERP_ENDPOINT"]
SCRAPER_URL = os.environ["BD_SCRAPER_ENDPOINT"]
HEADERS = {"Authorization": f"Bearer {BD_API_KEY}", "Content-Type": "application/json"}

def serp_generic(q: str, gl="us", hl="en", num=10, device="mobile"):
    # NEVER send PHI; queries must be generic.
    resp = requests.post(SERP_URL, headers=HEADERS, json={"q": q, "gl": gl, "hl": hl, "num": num, "device": device})
    resp.raise_for_status()
    data = resp.json()
    out = []
    for r in (data.get("results") or [])[:5]:
        out.append({"title": r.get("title"), "url": r.get("url"), "snippet": (r.get("snippet") or "")[:300]})
    return out

def scrape_single(url: str):
    resp = requests.post(SCRAPER_URL, headers=HEADERS, json={"url": url, "max_depth": 0, "include_resources": False})
    resp.raise_for_status()
    data = resp.json()
    return {"url": url, "html": data.get("html") or data.get("content"), "text": data.get("text")}


if __main__ == "__main__":
    # simple test
    print("SERP test:")
    results = serp_generic("best pain management techniques", num=3)
    for r in results:
        print(f"- {r['title']} ({r['url']}): {r['snippet']}")
    
    print("\nScrape test:")
    page = scrape_single("https://en.wikipedia.org/wiki/Pain_management")
    print(f"Scraped {len(page['text'])} chars of text from {page['url']}")
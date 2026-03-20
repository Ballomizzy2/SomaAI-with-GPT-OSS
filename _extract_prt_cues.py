import re
from pathlib import Path

PDF_PATH = Path("Pain Reprocessing Therapy.pdf")

KEYWORDS = [
    "safety",
    "safe",
    "fear",
    "calm",
    "soothe",
    "somatic tracking",
    "outcome independence",
    "curiosity",
    "reappraisal",
    "threat",
    "nervous system",
    "emotion",
    "relax",
    "breath",
    "confidence",
    "pleasant",
    "positive",
]


def load_pages(path: Path):
    last_error = None
    for module_name in ("pypdf", "PyPDF2"):
        try:
            module = __import__(module_name)
            reader = module.PdfReader(str(path))
            pages = []
            for i, page in enumerate(reader.pages, 1):
                text = page.extract_text() or ""
                pages.append((i, text))
            return pages
        except Exception as exc:  # pragma: no cover
            last_error = exc
    raise RuntimeError(f"Unable to read PDF with pypdf/PyPDF2: {last_error}")


def main():
    pages = load_pages(PDF_PATH)
    print(f"Pages parsed: {len(pages)}")
    print()

    for page_num, text in pages:
        clean = " ".join(text.split())
        lower = clean.lower()
        hits = [kw for kw in KEYWORDS if kw in lower]
        if not hits:
            continue

        sentences = re.split(r"(?<=[.!?])\s+", clean)
        matched = []
        for sentence in sentences:
            sent_l = sentence.lower()
            if any(kw in sent_l for kw in hits):
                matched.append(sentence)
            if len(matched) >= 2:
                break

        print(f"--- Page {page_num} | hits: {', '.join(hits)}")
        for s in matched:
            print(f"- {s}")
        print()


if __name__ == "__main__":
    main()

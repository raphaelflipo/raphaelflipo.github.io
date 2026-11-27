"""Build the bilingual static search data from the published pages."""
import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GLOSSARY = "/ingenierie/glossaire/"

class Reader(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.fragment = None
        self.field = None
        self.title = ""
        self.terms = {}
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        if tag == "div":
            self.fragment = dict(attrs).get("id")
        if tag in {"title", "dt"}:
            self.field = tag
            if tag == "dt" and self.fragment:
                self.terms[self.fragment] = ""

    def handle_endtag(self, tag):
        if tag == self.field:
            self.field = None

    def handle_data(self, data):
        if self.field == "title":
            self.title += data
        elif self.field == "dt" and self.fragment:
            self.terms[self.fragment] += data

def read(path):
    return Reader(path.read_text(encoding="utf-8"))

entries = []
for article in sorted((ROOT / "journal").glob("*/index.html")):
    relative = article.relative_to(ROOT)
    french = read(article).title.split(" | ")[0].strip()
    english = read(ROOT / "en" / relative).title.split(" | ")[0].strip()
    entries.append(["/" + relative.parent.as_posix() + "/", french, english, "article journal"])

french = read(ROOT / GLOSSARY.strip("/") / "index.html").terms
english = read(ROOT / "en" / GLOSSARY.strip("/") / "index.html").terms
assert french.keys() == english.keys()
for key, label in french.items():
    entries.append([GLOSSARY + "#" + key, label.strip(), english[key].strip(), "glossaire glossary ingénierie engineering"])

assert all(row[1] and row[2] for row in entries)
output = ROOT / "assets" / "index-recherche.js"
output.write_text("export const editorial = " + json.dumps(entries, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")

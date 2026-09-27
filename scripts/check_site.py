"""Check built HTML references without installing a test dependency.

Usage: python scripts/check_site.py _site [--baseurl /portfolio-preview]
"""
import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.references = []
        self.ids = set()
        self.h1_count = 0
        self.errors = []
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            if attrs["id"] in self.ids:
                self.errors.append(f"Duplicate id: {attrs['id']}")
            self.ids.add(attrs["id"])
        if tag == "h1":
            self.h1_count += 1
        if tag == "img" and "alt" not in attrs:
            self.errors.append("Image missing alt attribute")
        for key in ("href", "src"):
            if key in attrs:
                self.references.append(attrs[key])


def check(root, baseurl):
    pages = {path.resolve(): Page(path) for path in root.rglob("*.html")}
    errors = []
    for path, page in pages.items():
        errors.extend(f"{path}: {error}" for error in page.errors)
        if page.h1_count != 1:
            errors.append(f"{path}: Expected one h1, found {page.h1_count}")
        for ref in page.references:
            parts = urlsplit(ref)
            if parts.scheme or parts.netloc:
                continue
            url = unquote(parts.path)
            if url.startswith("/"):
                if baseurl and not url.startswith(baseurl + "/"):
                    errors.append(f"{path}: Missing baseurl in {ref}")
                    continue
                target = root / url[len(baseurl):].lstrip("/")
            else:
                target = path.parent / url if url else path
            if target.is_dir():
                target /= "index.html"
            target = target.resolve()
            if not target.exists():
                errors.append(f"{path}: Broken local reference {ref}")
            elif parts.fragment and target in pages and unquote(parts.fragment) not in pages[target].ids:
                errors.append(f"{path}: Missing fragment {ref}")
    if errors:
        raise SystemExit("\n".join(errors))
    if not pages:
        raise SystemExit("No generated HTML found")
    print(f"Passed: {len(pages)} pages; local links, fragments, image alt attributes, and h1 counts.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("--baseurl", default="")
    args = parser.parse_args()
    check(args.root.resolve(), args.baseurl.rstrip("/"))

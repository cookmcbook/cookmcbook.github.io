"""Repack the AI-generated cat sheet into a uniform grid for the header cat.

The source sheet places frames irregularly, so each row band is split into
connected shapes: large shapes are cats, and small ones (meow and swipe
lines) join the cat they trail just behind, else the cat they overlap. Each frame is then aligned on its
body (alpha centroid) and feet (lowest opaque row), scaled down, and written
into equal cells. Row order and frame counts must match ANIMATIONS in
assets/js/header-cat.js.

Usage: python scripts/build-cat-sprites.py
Requires Pillow.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "Orange Tabby Cat Animation Sprite Sheet.png"
OUTPUT = ROOT / "assets" / "images" / "cat" / "cat-sprites.png"
SCALE = 0.6
ALPHA_FLOOR = 40  # drop faint stray pixels left by the generator
MIN_CAT_AREA = 4000

# Source y-ranges, one per output row:
# 0 sleep (0-3) then wake to sitting (4-7)   1 meow
# 2 walk cycle                                3 run (0-5) then skid to crouch (6-7)
# 4 paw swipe (0-4) then front sits (5-8)     5 idle sitting poses
BANDS = [(18, 170), (184, 343), (346, 476), (500, 602), (627, 801), (825, 1001)]


def components(mask, w, h):
    seen = bytearray(w * h)
    found = []
    for start in range(w * h):
        if not mask[start] or seen[start]:
            continue
        seen[start] = 1
        stack, pixels = [start], []
        while stack:
            i = stack.pop()
            pixels.append(i)
            x, y = i % w, i // w
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < w and 0 <= ny < h:
                    j = ny * w + nx
                    if mask[j] and not seen[j]:
                        seen[j] = 1
                        stack.append(j)
        found.append(pixels)
    return found


def split_band(band):
    w, h = band.size
    alpha = band.getchannel("A").tobytes()
    mask = bytes(1 if v >= ALPHA_FLOOR else 0 for v in alpha)
    parts = []
    for pixels in components(mask, w, h):
        xs = [i % w for i in pixels]
        parts.append((min(xs), max(xs) + 1, pixels))
    cats = sorted((p for p in parts if len(p[2]) >= MIN_CAT_AREA), key=lambda p: p[0])
    groups = [list(c[2]) for c in cats]
    for x0, x1, pixels in parts:
        if len(pixels) >= MIN_CAT_AREA:
            continue
        trailing = [i for i, c in enumerate(cats) if abs(x0 - c[1]) <= 20]
        inside = [i for i, c in enumerate(cats) if c[0] <= x0 < c[1]]
        owner = (trailing or inside or [None])[0]
        if owner is not None:
            groups[owner].extend(pixels)

    frames = []
    for pixels in groups:
        keep = bytearray(w * h)
        for i in pixels:
            keep[i] = alpha[i]
        frame = band.copy()
        frame.putalpha(Image.frombytes("L", (w, h), bytes(keep)))
        frames.append(frame.crop(frame.getbbox()))
    return frames


def anchor(frame):
    """Horizontal alpha centroid, so tails and paws don't shift the body."""
    data = frame.getchannel("A").load()
    w, h = frame.size
    total = sx = 0
    for x in range(w):
        col = sum(data[x, y] for y in range(h))
        total += col
        sx += col * x
    return sx / total


def main():
    sheet = Image.open(SOURCE).convert("RGBA")
    rows = [split_band(sheet.crop((0, y0, sheet.width, y1))) for y0, y1 in BANDS]
    print("frames per row:", [len(r) for r in rows])

    frames = [f for row in rows for f in row]
    half = max(max(anchor(f), f.width - anchor(f)) for f in frames) + 4
    cell_w = int(round(half * 2 * SCALE / 2)) * 2
    cell_h = int(round((max(f.height for f in frames) + 4) * SCALE / 2)) * 2

    cols = max(len(row) for row in rows)
    out = Image.new("RGBA", (cell_w * cols, cell_h * len(rows)), (0, 0, 0, 0))
    for r, row in enumerate(rows):
        for c, f in enumerate(row):
            fw, fh = round(f.width * SCALE), round(f.height * SCALE)
            small = f.resize((fw, fh), Image.LANCZOS)
            x = c * cell_w + round(cell_w / 2 - anchor(f) * SCALE)
            y = r * cell_h + cell_h - fh - 1
            out.alpha_composite(small, (x, y))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    # A 256-colour palette is visually identical here at a quarter of the size.
    out = out.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    out.save(OUTPUT, optimize=True)
    print(f"{OUTPUT.relative_to(ROOT)}: {out.width}x{out.height}, cell {cell_w}x{cell_h}")


if __name__ == "__main__":
    main()

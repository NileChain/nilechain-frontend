"""Chroma-key black plate → transparent; snap to pure white + solid green."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

SRC = Path(
    r"C:\Users\\mahmo\.cursor\projects\c-Dev-ITI-data-Graduation-Project-nilechain-frontend-main"
    r"\assets\nilechain-mark-on-black.png"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "brand"
GREEN = (46, 175, 58, 255)
WHITE = (255, 255, 255, 255)


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    px = im.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dst = out.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
            # Drop black / near-black plate
            if lum < 35:
                continue
            # Green
            if g >= 60 and g > r + 10 and g > b + 10:
                dst[x, y] = GREEN
                continue
            # White structure (M + white waves)
            if lum >= 160:
                dst[x, y] = WHITE

    box = out.split()[-1].getbbox()
    pad = 8
    l, t, r, b = box
    cropped = out.crop(
        (max(0, l - pad), max(0, t - pad), min(w, r + pad), min(h, b + pad))
    )
    OUT.mkdir(parents=True, exist_ok=True)
    cropped.save(OUT / "nilechain-mark-flat.png")

    cw, ch = cropped.size
    side = max(cw, ch)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(cropped, ((side - cw) // 2, (side - ch) // 2), cropped)
    sq = canvas.resize((512, 512), Image.Resampling.LANCZOS)

    for name in (
        "nilechain-mark.png",
        "nilechain-mark-dark.png",
        "nilechain-mark-light.png",
        "nilechain-mark-vector.png",
    ):
        sq.save(OUT / name)

    # Preview
    s = 300
    m = sq.resize((s, s), Image.Resampling.LANCZOS)
    prev = Image.new("RGB", (s * 3 + 48, s + 24), (28, 28, 32))
    chk = Image.new("RGBA", (s, s))
    d = ImageDraw.Draw(chk)
    for y in range(0, s, 12):
        for x in range(0, s, 12):
            c = (185, 185, 185, 255) if ((x // 12) + (y // 12)) % 2 == 0 else (230, 230, 230, 255)
            d.rectangle([x, y, x + 11, y + 11], fill=c)
    chk.alpha_composite(m)
    prev.paste(chk.convert("RGB"), (12, 12))
    dark = Image.new("RGBA", (s, s), (8, 8, 12, 255))
    dark.alpha_composite(m)
    prev.paste(dark.convert("RGB"), (s + 24, 12))
    lite = Image.new("RGBA", (s, s), (251, 249, 248, 255))
    well = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(well).rounded_rectangle(
        [int(s * 0.08), int(s * 0.08), int(s * 0.92), int(s * 0.92)],
        radius=int(s * 0.06),
        fill=(27, 94, 32, 255),
    )
    well.alpha_composite(m)
    lite.alpha_composite(well)
    prev.paste(lite.convert("RGB"), (s * 2 + 36, 12))
    prev.save(OUT / "_preview-flat-logo.png")

    (OUT / "nilechain-mark.svg").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" '
        'role="img" aria-label="NileChain">\n'
        '  <title>NileChain</title>\n'
        '  <image href="nilechain-mark-vector.png" width="512" height="512"/>\n'
        "</svg>\n",
        encoding="utf-8",
    )

    wc = gc = 0
    for r, g, b, a in sq.getdata():
        if a < 128:
            continue
        if g > r + 20:
            gc += 1
        else:
            wc += 1
    print(f"ok white={wc} green={gc} crop={cropped.size}")


if __name__ == "__main__":
    main()

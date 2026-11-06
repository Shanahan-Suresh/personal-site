"""Build public/favicon.svg, public/og-image.svg and public/og-image.jpg in the poster style.

Needs Python with fonttools, brotli, Pillow and playwright (with its Chromium). Run from the
repo root: python scripts/brand-images.py

- favicon.svg: a condensed "S" in butter on night. The glyph is drawn as a path from the
  display font, so the icon needs no font at all.
- og-image.svg: the tomato slab with the hero headline and the name, 1200 x 630. It embeds the
  display face and DM Mono as data URIs, so it renders the same anywhere.
- og-image.jpg: Chromium's render of og-image.svg. Social sites read this one.
"""

import base64
import io
import pathlib

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
DISPLAY = ROOT / "src/assets/fonts/bricolage-condensed-latin.woff2"
MONO = ROOT / "node_modules/@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2"
PUBLIC = ROOT / "public"

# Poster tokens, light theme (src/styles/tokens.css).
TOMATO = "#ff6a45"
BUTTER = "#ffd24a"
INK = "#15120e"
WHITE = "#ffffff"

W, H = 1200, 630
MARGIN = 64
LINES = ["I build full-stack", "products &", "AI tooling."]


def favicon() -> str:
    font = TTFont(DISPLAY)
    glyphs = font.getGlyphSet()
    glyph = glyphs[font.getBestCmap()[ord("S")]]
    # Centre the glyph's ink box in a 64 x 64 square.
    bp = BoundsPen(glyphs)
    glyph.draw(bp)
    x0, y0, x1, y1 = bp.bounds
    target_h = 52
    scale = target_h / (y1 - y0)
    gw = (x1 - x0) * scale
    dx = (64 - gw) / 2 - x0 * scale
    dy = (64 + target_h) / 2 + y0 * scale
    pen = SVGPathPen(glyphs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    glyph.draw(TransformPen(pen, (scale, 0, 0, -scale, dx, dy)))
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n'
        f'  <rect width="64" height="64" fill="{INK}"/>\n'
        f'  <path fill="{BUTTER}" d="{pen.getCommands()}"/>\n'
        "</svg>\n"
    )


def data_uri(path: pathlib.Path) -> str:
    return "data:font/woff2;base64," + base64.b64encode(path.read_bytes()).decode()


def og_svg(size: float, mark_w: float) -> str:
    """The share card. `size` is the headline font size; `mark_w` the width of the last line."""
    lh = size * 0.9
    band = 92
    # Three lines sit in the space under the name band, the last one in a butter box.
    top = band + (H - band - lh * 3) / 2 + size * 0.74
    baselines = [top + i * lh for i in range(3)]
    pad_x = size * 0.12
    box_top = baselines[2] - size * 0.78
    box_h = size * 0.9
    esc = lambda t: t.replace("&", "&amp;")
    lines = "\n".join(
        f'  <text class="hl" x="{MARGIN}" y="{y:.1f}">{esc(t.upper())}</text>'
        for t, y in zip(LINES, baselines)
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <style>
    @font-face {{ font-family: "Bricolage Condensed"; font-weight: 800; src: url({data_uri(DISPLAY)}) format("woff2"); }}
    @font-face {{ font-family: "DM Mono"; font-weight: 500; src: url({data_uri(MONO)}) format("woff2"); }}
    .hl {{ font: 800 {size:.1f}px "Bricolage Condensed", "Arial Narrow", sans-serif; letter-spacing: 0.008em; fill: {INK}; }}
    .name {{ font: 800 40px "Bricolage Condensed", "Arial Narrow", sans-serif; letter-spacing: 0.02em; fill: {WHITE}; }}
    .url {{ font: 500 20px "DM Mono", ui-monospace, monospace; letter-spacing: 0.08em; fill: {BUTTER}; }}
  </style>
  <rect width="{W}" height="{H}" fill="{TOMATO}"/>
  <rect width="{W}" height="{band}" fill="{INK}"/>
  <text class="name" x="{MARGIN}" y="{band / 2 + 14:.1f}">SHANAHAN SURESH</text>
  <text class="url" x="{W - MARGIN}" y="{band / 2 + 7:.1f}" text-anchor="end">SHANAHANSURESH.COM</text>
  <rect x="{MARGIN - pad_x:.1f}" y="{box_top:.1f}" width="{mark_w + pad_x * 2:.1f}" height="{box_h:.1f}" fill="{BUTTER}" stroke="{INK}" stroke-width="4"/>
{lines}
</svg>
"""


def main() -> None:
    (PUBLIC / "favicon.svg").write_text(favicon(), encoding="utf-8")
    svg_path = PUBLIC / "og-image.svg"
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": W, "height": H})

        def measure(svg: str) -> list[float]:
            svg_path.write_text(svg, encoding="utf-8")
            page.goto(svg_path.as_uri())
            page.evaluate("document.fonts.ready")
            return page.evaluate(
                "[...document.querySelectorAll('.hl')].map(t => t.getBBox().width)"
            )

        # Fit the widest line to the slab, within a 1px tolerance.
        widths = measure(og_svg(100, 0))
        size = 100 * (W - MARGIN * 2) / max(widths)
        widths = measure(og_svg(size, 0))
        size *= (W - MARGIN * 2) / max(widths)
        widths = measure(og_svg(size, 0))
        measure(og_svg(size, widths[2]))
        png = page.screenshot(type="png")
        browser.close()
    Image.open(io.BytesIO(png)).convert("RGB").save(
        PUBLIC / "og-image.jpg", quality=88, optimize=True, progressive=True
    )
    print(f"headline {size:.1f}px, widths {[round(w) for w in widths]}")


if __name__ == "__main__":
    main()

"""Build the site icons and the share image in the poster style.

Needs Python with Pillow and playwright, plus an installed Google Chrome: the
renders launch Chrome (channel="chrome"), not Playwright's bundled Chromium.
Run from the repo root: python scripts/brand-images.py

- favicon.svg: a cobalt slab with a butter hard shadow and the nav's butter S (Anton's
  outline, read from Nav.astro), so the tab and the nav carry the same letter. The S is a
  path, so the icon needs no font at all.
- favicon.ico: the same mark at 16, 32 and 48 px, for browsers without SVG favicons.
- apple-touch-icon.png: the mark on cream, 180 x 180, for phone home screens. iOS rounds
  its corners and fills transparency with black, so the ground is solid.
- og-image.svg: the sky slab with the hero headline and the name, 1200 x 630. It embeds the
  display face and DM Mono as data URIs, so it renders the same anywhere.
- og-image.jpg: Chromium's render of og-image.svg. Social sites read this one.
"""

import base64
import io
import pathlib
import re

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
DISPLAY = ROOT / "src/assets/fonts/bricolage-condensed-latin.woff2"
MONO = ROOT / "node_modules/@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2"
PUBLIC = ROOT / "public"
NAV = ROOT / "src/components/Nav.astro"

# Poster tokens, light theme (src/styles/tokens.css).
SKY = "#8ec5ff"
BUTTER = "#ffd24a"
COBALT = "#3d52ea"
CREAM = "#f5f0e4"
INK = "#15120e"
WHITE = "#ffffff"

W, H = 1200, 630
MARGIN = 64
LINES = ["I build full-stack", "products &", "AI tooling."]


def mark() -> str:
    """The icon's shapes on a 64 x 64 grid: shadow, slab, S."""
    s_path = re.search(r'S_PATH =\s*"([^"]+)"', NAV.read_text(encoding="utf-8")).group(1)
    # Anton's S spans x 42..906 and y -16..1776 in font units (centre 474, 880, flipped).
    # Centre it in the 56-unit slab at 42 units tall.
    k = 42 / 1792
    return (
        f'  <rect x="8" y="8" width="56" height="56" fill="{BUTTER}"/>\n'
        f'  <rect width="56" height="56" fill="{COBALT}"/>\n'
        f'  <path fill="{BUTTER}" transform="translate(28 28) scale({k:.5f}) '
        f'translate(-474 880) scale(1 -1)" d="{s_path}"/>\n'
    )


def favicon() -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n'
        + mark()
        + "</svg>\n"
    )


def touch_icon_svg() -> str:
    """The mark at 72% on a cream ground, centred, for a 180 px render."""
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="180" height="180">\n'
        f'  <rect width="64" height="64" fill="{CREAM}"/>\n'
        '  <g transform="translate(8.96 8.96) scale(0.72)">\n'
        + mark()
        + "  </g>\n</svg>\n"
    )


def render(page, svg: str, size: int, transparent: bool) -> Image.Image:
    page.set_viewport_size({"width": size, "height": size})
    sized = re.sub(r'width="\d+" height="\d+"', f'width="{size}" height="{size}"', svg, count=1)
    page.set_content(
        f'<html><body style="margin:0;background:transparent">{sized}</body></html>'
    )
    png = page.screenshot(type="png", omit_background=transparent)
    return Image.open(io.BytesIO(png)).convert("RGBA")


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
  <rect width="{W}" height="{H}" fill="{SKY}"/>
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

        # A fresh page: the share-image page holds an SVG document, which cannot take HTML.
        page = browser.new_page()
        icons = [render(page, favicon(), n, transparent=True) for n in (48, 32, 16)]
        icons[0].save(
            PUBLIC / "favicon.ico",
            sizes=[(48, 48), (32, 32), (16, 16)],
            append_images=icons[1:],
        )
        render(page, touch_icon_svg(), 180, transparent=False).convert("RGB").save(
            PUBLIC / "apple-touch-icon.png", optimize=True
        )
        browser.close()
    Image.open(io.BytesIO(png)).convert("RGB").save(
        PUBLIC / "og-image.jpg", quality=88, optimize=True, progressive=True
    )
    print(f"headline {size:.1f}px, widths {[round(w) for w in widths]}")


if __name__ == "__main__":
    main()

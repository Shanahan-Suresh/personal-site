"""Pixel baseline for refactors that must not change how the site looks.

Usage:
  python baseline.py capture <base_url> <out_dir>   # every page and state, both themes
  python baseline.py diff <dir_a> <dir_b>            # changed pixels per shot, exit 1 on any

capture shoots /, /colophon, /writing and /writing/hello full-page at 1440 and 390 in light and
dark, plus interaction states: a project row on hover and on keyboard focus, an open story, a post
row on hover and focus, and the open mobile menu. Run both captures against builds of the same
commit: the footer prints the commit hash.
"""
import pathlib
import sys

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

PAGES = {"home": "/", "colophon": "/colophon", "writing": "/writing", "post": "/writing/hello"}
SETTLE = (
    "async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){scrollTo(0,y);"
    "await new Promise(r=>setTimeout(r,60))}scrollTo(0,0);"
    "await Promise.race([new Promise(r=>setTimeout(r,8000)),Promise.all([...document.images]"
    ".filter(i=>i.getClientRects().length).map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})))])}"
)


def capture(base: str, out: pathlib.Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        for theme in ("light", "dark"):
            for w in (1440, 390):
                ctx = b.new_context(
                    viewport={"width": w, "height": 900 if w > 600 else 844},
                    color_scheme=theme,
                    reduced_motion="reduce",
                )
                ctx.add_init_script(f"try{{localStorage.setItem('theme','{theme}')}}catch(e){{}}")
                pg = ctx.new_page()

                def go(path: str) -> None:
                    pg.goto(base + path, wait_until="networkidle")
                    pg.evaluate(SETTLE)
                    pg.wait_for_timeout(400)

                def shot(name: str, full: bool = False) -> None:
                    pg.screenshot(path=str(out / f"{name}-{w}-{theme}.png"), full_page=full)

                for key, path in PAGES.items():
                    go(path)
                    shot(f"{key}-page", full=True)

                go("/")
                row = pg.locator("#row-ohse")
                row.scroll_into_view_if_needed()
                if w > 960:
                    row.hover()
                    pg.wait_for_timeout(300)
                    shot("row-hover")
                    pg.mouse.move(0, 0)
                pg.keyboard.press("Tab")
                row.focus()
                pg.wait_for_timeout(300)
                shot("row-focus")
                pg.keyboard.press("Enter")
                pg.wait_for_function(
                    "[...document.querySelectorAll('dialog[open] img')].every(i=>i.complete&&i.naturalWidth)"
                )
                pg.wait_for_timeout(400)
                shot("story-open")
                pg.keyboard.press("Escape")

                go("/writing")
                post = pg.locator("a.post").first
                if w > 960:
                    post.hover()
                    pg.wait_for_timeout(300)
                    shot("post-hover")
                    pg.mouse.move(0, 0)
                pg.keyboard.press("Tab")
                post.focus()
                pg.wait_for_timeout(300)
                shot("post-focus")

                if w <= 768:
                    go("/")
                    pg.locator(".nav-burger").click()
                    pg.wait_for_timeout(300)
                    shot("menu-open")
                ctx.close()
        b.close()
    print(f"captured {len(list(out.glob('*.png')))} shots in {out}")


def diff(a: pathlib.Path, b: pathlib.Path) -> int:
    names = sorted({p.name for p in a.glob("*.png")} | {p.name for p in b.glob("*.png")})
    changed = 0
    for n in names:
        pa, pb = a / n, b / n
        if not pa.exists() or not pb.exists():
            print(f"MISSING {n}")
            changed += 1
            continue
        ia, ib = Image.open(pa).convert("RGB"), Image.open(pb).convert("RGB")
        if ia.size != ib.size:
            print(f"SIZE    {n}: {ia.size} -> {ib.size}")
            changed += 1
            continue
        d = ImageChops.difference(ia, ib)
        box = d.getbbox()
        if box:
            hist = d.convert("L").histogram()
            px = sum(hist) - hist[0]
            print(f"CHANGED {n}: {px} px in {box}")
            changed += 1
    print(f"{len(names)} shots, {changed} differ")
    return 1 if changed else 0


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "capture" and len(sys.argv) == 4:
        capture(sys.argv[2].rstrip("/"), pathlib.Path(sys.argv[3]))
    elif cmd == "diff" and len(sys.argv) == 4:
        sys.exit(diff(pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3])))
    else:
        sys.exit(__doc__)

"""Capture full-page screenshots of a page at desktop and phone widths, light and dark.

Usage: python shot.py <url> <out_prefix> [--widths 1440,390] [--themes light,dark]
Writes <out_prefix>-<width>-<theme>.png and prints each path.
Also reports horizontal overflow (scrollWidth > innerWidth) per shot.
"""
import sys
import argparse
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument("url")
ap.add_argument("out")
ap.add_argument("--widths", default="1440,390")
ap.add_argument("--themes", default="light,dark")
ap.add_argument("--full", default="1")
a = ap.parse_args()

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    for theme in a.themes.split(","):
        for w in [int(x) for x in a.widths.split(",")]:
            ctx = b.new_context(
                viewport={"width": w, "height": 900 if w > 600 else 844},
                color_scheme=theme,
                device_scale_factor=1,
                reduced_motion="reduce",
            )
            pg = ctx.new_page()
            pg.add_init_script(
                f"try{{localStorage.setItem('theme','{theme}')}}catch(e){{}}"
            )
            pg.goto(a.url, wait_until="networkidle")
            pg.evaluate(
                f"document.documentElement.classList.toggle('dark', '{theme}'==='dark')"
            )
            # reveal anything gated on scroll observers
            pg.evaluate(
                "document.querySelectorAll('.reveal,[data-reveal]').forEach(e=>e.classList.add('is-visible','in'))"
            )
            # scroll the whole page so lazy images load, then return to top
            pg.evaluate(
                "async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,60))}scrollTo(0,0)}"
            )
            pg.evaluate(
                # only images on screen: hidden thumbnails and closed dialogs never load
                "Promise.race([new Promise(r=>setTimeout(r,8000)),Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})))])"
            )
            pg.wait_for_timeout(600)
            ov = pg.evaluate("document.documentElement.scrollWidth - innerWidth")
            out = f"{a.out}-{w}-{theme}.png"
            pg.screenshot(path=out, full_page=a.full == "1")
            print(out, "overflow=%dpx" % ov)
            ctx.close()
    b.close()

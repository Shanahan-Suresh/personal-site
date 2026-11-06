# Fonts

`bricolage-grotesque-800-condensed-latin.woff2` is the display face. It is a static instance of
Bricolage Grotesque (SIL Open Font License 1.1, see `OFL.txt`) at weight 800 and width 75.

- Source: `@fontsource-variable/bricolage-grotesque` 5.3.0, file
  `bricolage-grotesque-latin-wdth-normal.woff2` (latin subset, all axes).
- Made with fontTools: `varLib.instancer` pinned `wght=800` and `wdth=75`, then saved as WOFF2. The result is about 21 KB, against about 95 KB for the full variable file.
- The latin subset has no U+2192 (→). The arrow falls back to the next face in the stack.

To rebuild with other settings:

```bash
pip install fonttools brotli
fonttools varLib.instancer bricolage-grotesque-latin-wdth-normal.woff2 wght=800 wdth=75 \
  --flavor woff2 -o bricolage-grotesque-800-condensed-latin.woff2
```

`BaseLayout.astro` declares the face as `Bricolage Condensed` and preloads it. Archivo Variable and
DM Mono come from their `@fontsource` packages.

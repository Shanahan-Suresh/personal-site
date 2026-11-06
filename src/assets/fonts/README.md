# Fonts

`bricolage-condensed-latin.woff2` is the display face: Bricolage Grotesque (SIL Open Font License
1.1, see `OFL.txt`) cut down to one weight and one width, with its optical-size axis kept.

- Source: Google Fonts' `ofl/bricolagegrotesque/BricolageGrotesque[opsz,wdth,wght].ttf`
  (version 1.001), from the `google/fonts` GitHub repository.
- `fontTools.varLib.instancer` pins `wght=800` and `wdth=75`. The `opsz` axis (12 to 96) stays, so
  the browser's automatic optical sizing draws large headings as Google Fonts does. Without it the
  same text sets about 22% wider.
- `fontTools.subset` keeps Google's latin range plus the arrows U+2190 to U+2193, then saves WOFF2
  (about 43 KB). The range has no U+2011 (non-breaking hyphen), so markup keeps `full-stack` on one
  line with `white-space: nowrap` instead.

To rebuild, with `fonttools` and `brotli` installed, run the script below against the source TTF.

```python
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

f = instancer.instantiateVariableFont(TTFont("BricolageGrotesque[opsz,wdth,wght].ttf"),
                                      {"wght": 800, "wdth": 75})
f.save("tmp.ttf")
opts = subset.Options(); opts.flavor = "woff2"; opts.layout_features = ["*"]; opts.name_IDs = ["*"]
s = subset.Subsetter(opts)
s.populate(unicodes=subset.parse_unicodes(
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,"
    "U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212,U+2215,U+FEFF,U+FFFD"))
ft = TTFont("tmp.ttf"); s.subset(ft); ft.flavor = "woff2"; ft.save("bricolage-condensed-latin.woff2")
```

`BaseLayout.astro` declares the face as `Bricolage Condensed` (`format('woff2-variations')`) and
preloads it. Archivo Variable and DM Mono come from their `@fontsource` packages.

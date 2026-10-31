#!/usr/bin/env python3
"""Generates app/theme-remap.css.

Remaps Tailwind colour utilities that are hard-coded across the app
(bg-white, text-gray-700, bg-red-50, border-green-200, ...) to the dark
navy/gold theme. Everything is scoped to screens and skipped on pages that
contain a `.paper` element (printable pages such as invoices).
"""
import sys

HUES = {
    "red": (239, 68, 68), "orange": (249, 115, 22), "amber": (245, 158, 11),
    "yellow": (234, 179, 8), "lime": (132, 204, 22), "green": (34, 197, 94),
    "emerald": (16, 185, 129), "teal": (20, 184, 166), "cyan": (6, 182, 212),
    "sky": (14, 165, 233), "blue": (59, 130, 246), "indigo": (99, 102, 241),
    "violet": (139, 92, 246), "purple": (168, 85, 247), "fuchsia": (217, 70, 239),
    "pink": (236, 72, 153), "rose": (244, 63, 94),
}
NEUTRALS = ["gray", "slate"]
OPAC = ["", "/5", "/10", "/20", "/30", "/40", "/50", "/60", "/70", "/80", "/90", "/95"]
OPAC_MIN = ["", "/30", "/50", "/70"]  # opacity variants kept for tints
SCOPE = "html:not(:has(.paper))"


def esc(cls):
    return cls.replace("/", "\\/").replace(":", "\\:")


def mix(rgb, t):
    return tuple(round(c + (255 - c) * t) for c in rgb)


def hexs(rgb):
    return "#%02x%02x%02x" % rgb


import os
import re

# Only emit rules for utility classes that actually appear in the source.
USED = set()
for root in ("app", "components"):
    for dp, _, files in os.walk(root):
        for f in files:
            if f.endswith((".tsx", ".ts", ".jsx", ".js")):
                try:
                    txt = open(os.path.join(dp, f), encoding="utf-8").read()
                except Exception:
                    continue
                USED.update(re.findall(r"[A-Za-z0-9_:\-/.\[\]%#]+", txt))
FIRST_CLASS = re.compile(r"^\.((?:\\.|[^\\\s:.,>{])+)")

out = []


def rule(sel, decl):
    m = FIRST_CLASS.match(sel)
    if m:
        token = re.sub(r"\\(.)", r"\1", m.group(1))
        # selectors like .hover\:bg-x:hover -> token "hover:bg-x"
        if not (token in USED or token.split(":")[-1] in USED and ":" not in token):
            m2 = re.match(r"^\.((?:\\.|[^\\\s,>{])+?)(?::hover)?(?:>|$|\s)", sel)
            tok2 = re.sub(r"\\(.)", r"\1", m2.group(1)) if m2 else token
            if tok2 not in USED:
                return
    out.append(f"{SCOPE} {sel}{{{decl}}}")


# ---------- surfaces / white ----------
for o in OPAC:
    a = {"": 1, "/5": .05, "/10": .1, "/20": .2, "/30": .3, "/40": .4, "/50": .5,
         "/60": .6, "/70": .7, "/80": .8, "/90": .9, "/95": .95}[o]
    rule(f".bg-white{esc(o)}", f"background-color:rgba(12,26,42,{a})")
    rule(f".from-white{esc(o)}", f"--tw-gradient-from:rgba(12,26,42,{a})")
    rule(f".via-white{esc(o)}", f"--tw-gradient-via:rgba(12,26,42,{a})")
    rule(f".to-white{esc(o)}", f"--tw-gradient-to:rgba(12,26,42,{a})")
    rule(f".border-white{esc(o)}", f"border-color:rgba(255,255,255,{min(a,.14)})")

# ---------- neutrals ----------
NB = {"50": .035, "100": .06, "200": .09, "300": .13}
NT = {"400": "#7d93a3", "500": "#8EA3B2", "600": "#A9BCC9", "700": "#C4D3DD",
      "800": "#DCE7EE", "900": "#EAF1F6", "950": "#F4F8FB"}
NBR = {"100": .07, "200": .1, "300": .15, "400": .22}
for n in NEUTRALS:
    for sh, a in NB.items():
        for o in OPAC_MIN:
            rule(f".bg-{n}-{sh}{esc(o)}", f"background-color:rgba(255,255,255,{a})")
        for p in ("from", "via", "to"):
            for o in OPAC_MIN:
                rule(f".{p}-{n}-{sh}{esc(o)}", f"--tw-gradient-{p}:rgba(255,255,255,{a})")
        # hover variants
        rule(f".hover\\:bg-{n}-{sh}:hover", f"background-color:rgba(255,255,255,{min(a+.03,.16)})")
    for sh, col in NT.items():
        rule(f".text-{n}-{sh}", f"color:{col}")
        rule(f".hover\\:text-{n}-{sh}:hover", f"color:{col}")
    for sh, a in NBR.items():
        rule(f".border-{n}-{sh}", f"border-color:rgba(255,255,255,{a})")
        rule(f".divide-{n}-{sh}>:not(:last-child)", f"border-color:rgba(255,255,255,{a})")
rule(".text-black", "color:#EAF1F6")
rule(".bg-black\\/5", "background-color:rgba(255,255,255,.04)")

# ---------- hues: collapse decorative colours into two tones ----------
# cool/decorative hues -> steel blue (+ cyan tint), warm hues -> gold,
# green and red keep their meaning (success / danger) but only as soft tints
# and light text; saturated green fills are treated as decorative (steel).
COOL = ["blue", "sky", "cyan", "indigo", "violet", "purple", "fuchsia", "pink", "teal"]
WARM = ["amber", "yellow", "orange"]
GREENS = ["green", "emerald", "lime"]
REDS = ["red", "rose"]
CY, GD, GRN, RED = (59, 211, 234), (227, 185, 90), (62, 224, 143), (242, 101, 106)
TINT = {"50": .08, "100": .13, "200": .20, "300": .30}
STEEL = {"400": "#2B7FA3", "500": "#1E6C90", "600": "#14698C", "700": "#0F5878",
         "800": "#0B4A66", "900": "#083A52"}
STEEL_HOVER = {"400": "#1E6C90", "500": "#14698C", "600": "#0F5878", "700": "#0B4A66",
               "800": "#083A52", "900": "#06304A"}
GOLDD = {"400": "#C9972F", "500": "#B58526", "600": "#A87A1E", "700": "#8C6416",
         "800": "#745210", "900": "#5C410C"}
GOLDD_HOVER = {"400": "#B58526", "500": "#A87A1E", "600": "#8C6416", "700": "#745210",
               "800": "#5C410C", "900": "#4a3409"}
TEXT = {"cool": "#86DDEE", "warm": "#F0CD7E", "green": "#6BE6AA", "red": "#FF8F93"}
SAT = ["400", "500", "600", "700", "800", "900"]
ALPHA_OP = {"/5": .05, "/10": .10, "/20": .20, "/30": .30, "/40": .40, "/50": .50, "/80": .80, "/90": .90}


def tint_rgb(h):
    return CY if h in COOL else GD if h in WARM else GRN if h in GREENS else RED


def group(h):
    return "cool" if h in COOL else "warm" if h in WARM else "green" if h in GREENS else "red"


for h in COOL + WARM + GREENS + REDS:
    r, g, b = tint_rgb(h)
    grp = group(h)
    # --- soft tints (backgrounds / gradient stops / borders) ---
    for sh, a in TINT.items():
        for o in OPAC_MIN:
            rule(f".bg-{h}-{sh}{esc(o)}", f"background-color:rgba({r},{g},{b},{a})")
            for pfx in ("from", "via", "to"):
                rule(f".{pfx}-{h}-{sh}{esc(o)}", f"--tw-gradient-{pfx}:rgba({r},{g},{b},{a})")
        rule(f".hover\\:bg-{h}-{sh}:hover", f"background-color:rgba({r},{g},{b},{min(a+.06,.4)})")
    for sh in ("100", "200", "300", "400", "500", "600"):
        for o in ["", "/10", "/20", "/30", "/40", "/50", "/60"]:
            al = .30 if sh in ("100", "200", "300") else .35
            if o:
                al = int(o[1:]) / 100 * (1.0 if int(o[1:]) >= 40 else 1.2)
            rule(f".border-{h}-{sh}{esc(o)}", f"border-color:rgba({r},{g},{b},{min(al,.5):.2f})")
    # --- text ---
    shades = ("300", "400", "500", "600", "700", "800", "900") if grp in ("cool", "warm") else ("500", "600", "700", "800", "900")
    for sh in shades:
        rule(f".text-{h}-{sh}", f"color:{TEXT[grp]}")
        rule(f".hover\\:text-{h}-{sh}:hover", f"color:{TEXT[grp]}")
    # --- saturated fills ---
    if grp == "red":
        continue  # destructive actions keep their red
    scale, hov = (GOLDD, GOLDD_HOVER) if grp == "warm" else (STEEL, STEEL_HOVER)
    for sh in SAT:
        rule(f".bg-{h}-{sh}", f"background-color:{scale[sh]}")
        rule(f".hover\\:bg-{h}-{sh}:hover", f"background-color:{hov[sh]}")
        for pfx in ("from", "via", "to"):
            rule(f".{pfx}-{h}-{sh}", f"--tw-gradient-{pfx}:{scale[sh]}")
            rule(f".hover\\:{pfx}-{h}-{sh}:hover", f"--tw-gradient-{pfx}:{hov[sh]}")
        for o, al in ALPHA_OP.items():
            r2, g2, b2 = GD if grp == "warm" else CY
            rule(f".bg-{h}-{sh}{esc(o)}", f"background-color:rgba({r2},{g2},{b2},{al})")
            for pfx in ("from", "via", "to"):
                rule(f".{pfx}-{h}-{sh}{esc(o)}", f"--tw-gradient-{pfx}:rgba({r2},{g2},{b2},{al})")

# ---------- buttons whose own background replaces the gold primary ----------
# primary-foreground is dark now (text on gold). Buttons that override the
# background (translucent / gradient) expect the old white label.
out.append(f'{SCOPE} [data-slot="button"].text-primary-foreground:not(.bg-primary){{color:#fff}}')
out.append(f'{SCOPE} [data-slot="button"].text-primary-foreground[class*="from-"]{{color:#fff}}')

css = """/* GENERATED by scripts/gen-theme-remap.py - do not edit by hand.
 * Maps hard-coded Tailwind light-theme colours to the dark navy/gold theme.
 * Unlayered on purpose: it must win over Tailwind's layered utilities.
 * Screen only; pages containing a .paper element (e.g. invoices) and print
 * output keep the original light colours. */
@media screen {
""" + "\n".join(out) + "\n}\n"
open(sys.argv[1] if len(sys.argv) > 1 else "app/theme-remap.css", "w", encoding="utf-8").write(css)
print(len(out), "rules,", len(css) // 1024, "KB")

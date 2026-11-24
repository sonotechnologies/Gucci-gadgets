"""
Generates clean, logo-free placeholder product renders (Design Brief §9:
"placeholder product renders that are clearly generic device shots").

    npx tsx scripts/product-image-spec.ts > /tmp/spec.json
    python3 scripts/gen-product-images.py /tmp/spec.json public/products

Images are transparent WebP so they sit on the `surface` tile in both themes.
Replace them with real photos from Admin → Products whenever they're ready.
"""
import json
import math
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

S = 2400  # draw at 2x, downscale to 1200 for smooth edges
OUT = 1200


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def lum(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def canvas():
    return Image.new("RGBA", (S, S), (0, 0, 0, 0))


def rrect_mask(size, box, r):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle(box, r, fill=255)
    return m


def gradient(size, top, bottom, angle_diag=True):
    """Diagonal light-to-dark gradient fill."""
    w, h = size
    g = Image.new("RGB", (w, h))
    px = g.load()
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            t = ((x / w) * 0.45 + (y / h) * 0.55) if angle_diag else y / h
            c = mix(top, bottom, t)
            px[x, y] = c
            if x + 1 < w:
                px[x + 1, y] = c
            if y + 1 < h:
                px[x, y + 1] = c
                if x + 1 < w:
                    px[x + 1, y + 1] = c
    return g


def fill_shape(img, box, r, top, bottom, alpha=255):
    x0, y0, x1, y1 = [int(v) for v in box]
    w, h = x1 - x0, y1 - y0
    g = gradient((w, h), top, bottom).convert("RGBA")
    m = rrect_mask((w, h), (0, 0, w - 1, h - 1), r)
    if alpha < 255:
        m = m.point(lambda v: v * alpha // 255)
    img.alpha_composite(Image.composite(g, Image.new("RGBA", (w, h), (0, 0, 0, 0)), m), (x0, y0))


def shadow(img, box, strength=90, blur=60):
    """Soft contact shadow under an object."""
    x0, y0, x1, y1 = box
    sh = Image.new("L", (S, S), 0)
    ImageDraw.Draw(sh).ellipse((x0, y1 - 40, x1, y1 + 50), fill=strength)
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    layer.putalpha(sh)
    img.alpha_composite(layer)


def lens(d, cx, cy, r, ring=(24, 25, 28)):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=ring)
    d.ellipse((cx - r * 0.78, cy - r * 0.78, cx + r * 0.78, cy + r * 0.78), fill=(52, 58, 70))
    d.ellipse((cx - r * 0.58, cy - r * 0.58, cx + r * 0.58, cy + r * 0.58), fill=(12, 14, 20))
    d.ellipse((cx - r * 0.3, cy - r * 0.3, cx + r * 0.3, cy + r * 0.3), fill=(28, 36, 58))
    d.ellipse((cx - r * 0.42, cy - r * 0.5, cx - r * 0.12, cy - r * 0.2), fill=(150, 165, 190))


def flash(d, cx, cy, r):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(235, 228, 205))
    d.ellipse((cx - r * 0.55, cy - r * 0.55, cx + r * 0.55, cy + r * 0.55), fill=(250, 246, 230))


# ---------------------------------------------------------------- phones
def phone_dims(big):
    return (560, 1180) if big else (520, 1080)


def phone_back(colour, kind, big):
    w, h = phone_dims(big)
    img = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    c = hex_rgb(colour)
    light, dark = mix(c, (255, 255, 255), 0.22), mix(c, (0, 0, 0), 0.18)
    r = 92
    # frame (slightly darker rim) then back glass
    fill_shape(img, (20, 20, 20 + w, 20 + h), r, mix(c, (0, 0, 0), 0.05), mix(c, (0, 0, 0), 0.3))
    fill_shape(img, (30, 30, 10 + w, 10 + h), r - 10, light, dark)
    d = ImageDraw.Draw(img)
    rim = mix(c, (0, 0, 0), 0.35)
    if kind == "phone-triple":
        mx, my, ms = 70, 70, 300
        fill_shape(img, (mx, my, mx + ms, my + ms), 70, mix(c, (255, 255, 255), 0.1), mix(c, (0, 0, 0), 0.25))
        d.rounded_rectangle((mx, my, mx + ms, my + ms), 70, outline=rim, width=4)
        lr = 62
        lens(d, mx + 88, my + 88, lr)
        lens(d, mx + 88, my + 212, lr)
        lens(d, mx + 212, my + 150, lr)
        flash(d, mx + 228, my + 62, 20)
        d.ellipse((mx + 218, my + 236, mx + 238, my + 256), fill=(30, 30, 32))
    elif kind == "phone-dual":
        mx, my = 70, 70
        fill_shape(img, (mx, my, mx + 230, my + 230), 60, mix(c, (255, 255, 255), 0.1), mix(c, (0, 0, 0), 0.22))
        d.rounded_rectangle((mx, my, mx + 230, my + 230), 60, outline=rim, width=4)
        lens(d, mx + 72, my + 72, 52)
        lens(d, mx + 158, my + 158, 52)
        flash(d, mx + 170, my + 60, 16)
    elif kind == "phone-column":
        x = 120
        for i, rr in enumerate((62, 62, 62, 40)):
            lens(d, x, 130 + i * 150, rr, ring=mix(c, (0, 0, 0), 0.45))
        flash(d, 250, 150, 18)
    elif kind == "phone-bar":
        by = 170
        d.rounded_rectangle((20, by, 20 + w, by + 170), 85, fill=mix(c, (0, 0, 0), 0.55))
        d.rounded_rectangle((60, by + 30, 330, by + 140), 55, fill=(18, 19, 22))
        lens(d, 120, by + 85, 46, ring=(18, 19, 22))
        lens(d, 255, by + 85, 46, ring=(18, 19, 22))
        flash(d, 400, by + 85, 18)
    else:  # phone-ring: big round module
        cx, cy, R = 30 + w // 2, 260, 190
        d.ellipse((cx - R, cy - R, cx + R, cy + R), fill=mix(c, (0, 0, 0), 0.4))
        d.ellipse((cx - R + 14, cy - R + 14, cx + R - 14, cy + R - 14), fill=(22, 23, 26))
        lens(d, cx - 70, cy - 60, 58)
        lens(d, cx + 70, cy - 60, 50)
        lens(d, cx - 70, cy + 75, 40)
        flash(d, cx + 70, cy + 75, 22)
    # subtle glass sheen
    sheen = Image.new("L", img.size, 0)
    ImageDraw.Draw(sheen).polygon([(30, 30 + h * 0.55), (30 + w * 0.7, 30), (30 + w * 0.95, 30), (30, 30 + h * 0.8)], fill=26)
    sheen = ImageChops.multiply(sheen, rrect_mask(img.size, (30, 30, 10 + w, 10 + h), r - 10))
    white = Image.new("RGBA", img.size, (255, 255, 255, 0))
    white.putalpha(sheen)
    img.alpha_composite(white)
    # side buttons
    d.rounded_rectangle((12, 300, 22, 400), 4, fill=mix(c, (0, 0, 0), 0.3))
    d.rounded_rectangle((w + 18, 340, w + 28, 500), 4, fill=mix(c, (0, 0, 0), 0.3))
    return img


def phone_front(colour, kind, big):
    w, h = phone_dims(big)
    img = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    c = hex_rgb(colour)
    r = 92
    fill_shape(img, (20, 20, 20 + w, 20 + h), r, mix(c, (0, 0, 0), 0.1), mix(c, (0, 0, 0), 0.35))
    fill_shape(img, (28, 28, 12 + w, 12 + h), r - 8, (14, 14, 16), (8, 8, 10))
    # wallpaper: soft gradient derived from the product colour
    accent = mix(c, (36, 71, 245), 0.55) if lum(c) > 200 else mix(c, (91, 120, 255), 0.4)
    top = mix(accent, (255, 255, 255), 0.25)
    bottom = mix(accent, (10, 10, 30), 0.65)
    sx0, sy0, sx1, sy1 = 44, 44, w - 4, h - 4
    fill_shape(img, (sx0, sy0, sx1, sy1), r - 24, top, bottom)
    d = ImageDraw.Draw(img)
    # soft blobs on wallpaper
    blob = Image.new("RGBA", img.size, (0, 0, 0, 0))
    bd = ImageDraw.Draw(blob)
    bd.ellipse((sx0 - 120, sy1 - 520, sx0 + 420, sy1 + 40), fill=mix(accent, (255, 255, 255), 0.45) + (90,))
    bd.ellipse((sx1 - 330, sy0 + 260, sx1 + 160, sy0 + 760), fill=mix(accent, (0, 0, 0), 0.25) + (110,))
    blob = blob.filter(ImageFilter.GaussianBlur(70))
    blob.putalpha(ImageChops.multiply(blob.getchannel("A"), rrect_mask(img.size, (sx0, sy0, sx1, sy1), r - 24)))
    img.alpha_composite(blob)
    # camera cut-out
    cx = 20 + w // 2
    if kind in ("phone-triple", "phone-dual"):
        d.rounded_rectangle((cx - 95, 74, cx + 95, 122), 24, fill=(6, 6, 8))
    else:
        d.ellipse((cx - 22, 76, cx + 22, 120), fill=(6, 6, 8))
    # status bar + clock blocks (no text, generic)
    d.rounded_rectangle((cx - 120, 240, cx + 120, 330), 30, fill=(255, 255, 255, 230))
    d.rounded_rectangle((cx - 90, 352, cx + 90, 376), 12, fill=(255, 255, 255, 170))
    # dock
    for i in range(4):
        x = sx0 + 60 + i * ((sx1 - sx0 - 120) // 4) + 10
        d.rounded_rectangle((x, sy1 - 150, x + 82, sy1 - 68), 24, fill=(255, 255, 255, 70))
    d.rounded_rectangle((cx - 80, sy1 - 34, cx + 80, sy1 - 24), 5, fill=(255, 255, 255, 160))
    return img


def place(img, obj, cx, cy, angle=0):
    o = obj.rotate(angle, resample=Image.BICUBIC, expand=True) if angle else obj
    img.alpha_composite(o, (int(cx - o.width / 2), int(cy - o.height / 2)))
    return (cx - o.width / 2, cy - o.height / 2, cx + o.width / 2, cy + o.height / 2)


def render_phone(spec, view, colour):
    img = canvas()
    kind, big = spec["kind"], spec["big"]
    if view == "hero":
        back = phone_back(colour, kind, big)
        front = phone_front(colour, kind, big)
        shadow(img, (520, 1880, 1880, 1960), 110, 70)
        place(img, back, 960, 1180, angle=8)
        place(img, front, 1420, 1230, angle=-4)
    elif view == "back":
        shadow(img, (760, 1860, 1640, 1940), 110, 60)
        place(img, phone_back(colour, kind, big), 1200, 1200)
    else:
        shadow(img, (760, 1860, 1640, 1940), 110, 60)
        place(img, phone_front(colour, kind, big), 1200, 1200)
    return img


# ------------------------------------------------------------ accessories
def render_accessory(spec, colour):
    img = canvas()
    k = spec["kind"]
    c = hex_rgb(colour) if colour != "clear" else (230, 236, 242)
    light, dark = mix(c, (255, 255, 255), 0.25), mix(c, (0, 0, 0), 0.2)
    d = ImageDraw.Draw(img)
    if k in ("charger", "charger-dual"):
        shadow(img, (800, 1700, 1600, 1780), 110, 55)
        w = 640 if k == "charger" else 700
        x0, y0 = 1200 - w // 2, 900
        d.rounded_rectangle((x0 + 170, 620, x0 + 230, 920), 14, fill=(170, 172, 178))
        d.rounded_rectangle((x0 + w - 230, 620, x0 + w - 170, 920), 14, fill=(170, 172, 178))
        fill_shape(img, (x0, y0, x0 + w, y0 + 800), 120, (252, 252, 252), (214, 216, 222))
        ports = 1 if k == "charger" else 2
        for i in range(ports):
            px = 1200 if ports == 1 else 1200 + (i * 2 - 1) * 120
            d.rounded_rectangle((px - 70, 1500, px + 70, 1546), 23, fill=(40, 42, 46))
            d.rounded_rectangle((px - 46, 1514, px + 46, 1532), 9, fill=(120, 124, 130))
    elif k == "power-bank":
        shadow(img, (560, 1640, 1840, 1720), 110, 55)
        fill_shape(img, (620, 760, 1780, 1620), 140, light, dark)
        for i in range(4):
            d.ellipse((1460 + i * 60, 1480, 1490 + i * 60, 1510), fill=(70, 200, 120) if i < 3 else (90, 92, 98))
        d.rounded_rectangle((660, 1100, 690, 1260), 10, fill=(30, 30, 34))
    elif k == "magsafe-bank":
        shadow(img, (700, 1720, 1700, 1800), 110, 55)
        fill_shape(img, (720, 640, 1680, 1720), 150, light, dark)
        ring = mix(c, (255, 255, 255), 0.35) if lum(c) < 128 else mix(c, (0, 0, 0), 0.12)
        d.ellipse((900, 880, 1500, 1480), outline=ring, width=26)
        d.rounded_rectangle((1140, 1690, 1260, 1712), 10, fill=(40, 42, 46))
    elif k == "case":
        shadow(img, (760, 1860, 1640, 1940), 90, 60)
        x0, y0, x1, y1 = 900, 400, 1500, 1860
        glass = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glass)
        gd.rounded_rectangle((x0, y0, x1, y1), 110, fill=(210, 225, 240, 70), outline=(190, 205, 220, 255), width=18)
        gd.rounded_rectangle((x0 + 50, y0 + 50, x0 + 380, y0 + 380), 80, fill=(0, 0, 0, 0), outline=(170, 185, 200, 255), width=12)
        gd.ellipse((1050, 1000, 1350, 1300), outline=(200, 214, 228, 255), width=14)
        gd.polygon([(x0 + 40, y1 - 500), (x1 - 80, y0 + 300), (x1 - 40, y0 + 420), (x0 + 40, y1 - 330)], fill=(255, 255, 255, 60))
        img.alpha_composite(glass)
    elif k == "protector":
        shadow(img, (700, 1880, 1700, 1960), 70, 60)
        for off, a in ((60, 60), (0, 110)):
            g = Image.new("RGBA", (S, S), (0, 0, 0, 0))
            gd = ImageDraw.Draw(g)
            gd.rounded_rectangle((900 + off, 380 - off, 1520 + off, 1880 - off), 100, fill=(205, 225, 245, a), outline=(170, 195, 220, 220), width=8)
            gd.rounded_rectangle((1110 + off, 430 - off, 1310 + off, 474 - off), 20, outline=(170, 195, 220, 220), width=6)
            gd.polygon([(940 + off, 1500 - off), (1460 + off, 600 - off), (1500 + off, 760 - off), (940 + off, 1700 - off)], fill=(255, 255, 255, 70))
            img.alpha_composite(g)
    elif k == "earbuds":
        shadow(img, (560, 1640, 1900, 1720), 100, 55)
        fill_shape(img, (560, 900, 1360, 1640), 220, (252, 252, 252), (212, 214, 220))
        d.line((580, 1130, 1340, 1130), fill=(196, 198, 204), width=6)
        d.ellipse((945, 1300, 975, 1330), fill=(70, 200, 120))
        for bx, flip in ((1560, 1), (1780, -1)):
            d.rounded_rectangle((bx - 36, 1080, bx + 36, 1600), 36, fill=(246, 246, 248))
            d.ellipse((bx - 110 * flip - 80, 880, bx - 110 * flip + 120, 1120), fill=(250, 250, 252))
            d.ellipse((bx - 110 * flip - 20, 940, bx - 110 * flip + 70, 1040), fill=(60, 62, 68))
    elif k == "watch":
        shadow(img, (860, 2020, 1540, 2090), 100, 55)
        band = c
        fill_shape(img, (980, 160, 1420, 760), 60, mix(band, (255, 255, 255), 0.12), band)
        fill_shape(img, (980, 1640, 1420, 2240), 60, band, mix(band, (0, 0, 0), 0.25))
        fill_shape(img, (860, 700, 1540, 1700), 170, (70, 72, 78), (28, 29, 33))
        fill_shape(img, (900, 740, 1500, 1660), 140, (8, 8, 10), (2, 2, 4))
        d.rounded_rectangle((1530, 1000, 1580, 1160), 20, fill=(90, 92, 98))
        for i, col in enumerate(((255, 64, 92), (150, 230, 60), (40, 200, 240))):
            rr = 230 - i * 62
            d.arc((1200 - rr, 1200 - rr, 1200 + rr, 1200 + rr), 270, 270 + (300 - i * 70), fill=col, width=46)
    elif k == "speaker":
        shadow(img, (520, 1560, 1880, 1640), 110, 55)
        fill_shape(img, (520, 920, 1880, 1560), 320, light, dark)
        for yy in range(990, 1500, 34):
            for xx in range(760, 1640, 34):
                d.ellipse((xx, yy, xx + 12, yy + 12), fill=mix(c, (0, 0, 0), 0.32))
        d.ellipse((540, 940, 760, 1540), fill=mix(c, (0, 0, 0), 0.35))
        d.ellipse((1640, 940, 1860, 1540), fill=mix(c, (0, 0, 0), 0.35))
        d.rounded_rectangle((1100, 860, 1300, 930), 30, fill=mix(c, (0, 0, 0), 0.25))
    else:
        shadow(img, (700, 1700, 1700, 1780), 100, 55)
        fill_shape(img, (720, 700, 1680, 1700), 100, light, dark)
    return img


def save(img, path):
    img.resize((OUT, OUT), Image.LANCZOS).save(path, "WEBP", quality=88, method=6)


def main(spec_path, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    spec = json.load(open(spec_path))
    for p in spec:
        cols = p["colours"]
        if p["kind"].startswith("phone"):
            views = [("hero", cols[0]), ("back", cols[1 % len(cols)]), ("front", cols[0])]
            for i, (view, col) in enumerate(views[: p["count"]], 1):
                save(render_phone(p, view, col), os.path.join(out_dir, f"{p['slug']}-{i}.webp"))
        else:
            save(render_accessory(p, cols[0]), os.path.join(out_dir, f"{p['slug']}-1.webp"))
        print("rendered", p["slug"])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

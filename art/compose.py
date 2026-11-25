"""Finish the generated illustrations: place the real Aside orb, retouch, and export web sizes.

  python art/compose.py

Reads art/out/<shot>.webp (from flux.py) and the orb renders in art/orb/ (from orb-render.html),
writes assets/art/<shot>.webp for the site. Shots without a source image are skipped.
"""
import pathlib
from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT.parent / "assets" / "art"


def orb(name, size):
    """The orb render (800px canvas, orb 400px) scaled so the orb body is `size` px wide."""
    im = Image.open(ROOT / "orb" / f"{name}.png").convert("RGBA")
    k = size / 400
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)


def place(base, o, cx, cy, clip=None):
    """Composite orb `o` centred at (cx, cy); `clip` (x0, y0, x1, y1) keeps only what falls inside it."""
    layer = Image.new("RGBA", base.size)
    layer.alpha_composite(o, (round(cx - o.width / 2), round(cy - o.height / 2)))
    if clip:
        m = Image.new("L", base.size, 0)
        ImageDraw.Draw(m).rectangle(clip, fill=255)
        layer.putalpha(Image.composite(layer.getchannel("A"), m, m))
    base.alpha_composite(layer)


def inner_right_edge(im, y, x_from):
    """Walk left from the bezel's outer edge to the first light pixel: the screen's right edge."""
    x = x_from
    while x > 0 and sum(im.getpixel((x, y))[:3]) / 3 < 90:
        x -= 1
    return x


def hero():
    im = Image.open(ROOT / "out" / "hero.webp").convert("RGBA")
    # Bezel found by scanning for dark pixels: x 441-877, y 331-556 (FLUX seed 11).
    right = inner_right_edge(im, 420, 870)
    top, bottom = 338, 528
    # The orb is docked: half of it peeks out of the screen's right edge, eyes toward the person.
    clip = (442, top, right, bottom)
    cx, cy = right - 16, 396  # summoned: slid out, about 70% visible
    glow(im, cx, cy, 150, (245, 167, 66), 0.45, clip)
    place(im, grain(orb("orb-idle-left", 84)), cx, cy, clip=clip)
    return im


def glow(base, cx, cy, r, rgb, strength, clip):
    """A soft pool of the orb's light, like it lights up the screen around it."""
    g = Image.new("L", base.size, 0)
    ImageDraw.Draw(g).ellipse((cx - r, cy - r, cx + r, cy + r), fill=int(255 * strength))
    g = g.filter(ImageFilter.GaussianBlur(r / 2.2))
    m = Image.new("L", base.size, 0)
    ImageDraw.Draw(m).rectangle(clip, fill=255)
    g = Image.composite(g, Image.new("L", base.size, 0), m)
    layer = Image.new("RGBA", base.size, rgb + (0,))
    layer.putalpha(g)
    base.alpha_composite(layer)


def grain(o, amount=22):
    """The same print grain as the riso illustrations, so the render sits in the drawing."""
    import random
    rnd = random.Random(3)
    noise = Image.new("L", o.size)
    noise.putdata([128 + rnd.randint(-amount, amount) for _ in range(o.width * o.height)])
    rgb = Image.merge("RGB", [Image.blend(ch, noise, 0.12) for ch in o.convert("RGB").split()])
    rgb.putalpha(o.getchannel("A"))
    return rgb


def writer():
    im = Image.open(ROOT / "out" / "writer.webp").convert("RGBA")
    # Paint out the fruit logo FLUX drew on the laptop lid, in the lid's own colour.
    px = im.load()
    for y in range(636, 712):
        for x in range(588, 646):
            r, g, b, a = px[x, y]
            if r < 16 and g < 36 and b < 46:
                px[x, y] = (27, 50, 58, a)
    return im


SHOTS = {"hero": hero, "writer": writer}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name in ["hero", "writer", "coder", "student", "reader", "tabs", "designer", "evening"]:
        src = ROOT / "out" / f"{name}.webp"
        if not src.exists():
            print(f"{name}: no source yet, skipped")
            continue
        im = SHOTS[name]() if name in SHOTS else Image.open(src).convert("RGBA")
        im.convert("RGB").save(OUT / f"{name}.webp", quality=84, method=6)
        print(f"{name}: assets/art/{name}.webp {im.size}")


if __name__ == "__main__":
    main()

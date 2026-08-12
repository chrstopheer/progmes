"""Generate PWA icons matching the app's brand identity.
Palette: yellow (#F4C430), red (#C0392B), blue (#2C5AA0), ink (#1E2432)
Design: rounded-square calendar icon with a red header stripe, three
brand color rings on top, and a bold "15" (the classic calendar mark day).
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT_DIR = "/app/frontend/public"
os.makedirs(OUT_DIR, exist_ok=True)

YELLOW = (244, 196, 48)
RED = (192, 57, 43)
BLUE = (44, 90, 160)
INK = (30, 36, 50)
PAPER = (255, 250, 232)


def rounded_rect_mask(size, radius):
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([(0, 0), (size[0] - 1, size[1] - 1)], radius=radius, fill=255)
    return mask


def load_font(size, bold=True):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVu-Sans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def draw_icon(size):
    S = size
    r = int(S * 0.22)  # rounded corner
    padding = int(S * 0.06)

    # Base with rounded corners on transparent bg
    canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    body = Image.new("RGBA", (S, S), PAPER + (255,))
    canvas.paste(body, (0, 0), rounded_rect_mask((S, S), r))

    d = ImageDraw.Draw(canvas)

    # Inner card area (calendar body)
    inner = (padding, padding, S - padding, S - padding)
    inner_r = int(r * 0.72)

    # Red top strip (calendar header/spine)
    strip_h = int(S * 0.24)
    strip_box = (inner[0], inner[1], inner[2], inner[1] + strip_h)
    strip_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(strip_layer).rounded_rectangle(
        inner, radius=inner_r, fill=YELLOW + (255,)
    )
    # Yellow full card
    canvas.paste(strip_layer, (0, 0), strip_layer)

    # Red header band on top of yellow, clipped to card shape
    band_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bd = ImageDraw.Draw(band_layer)
    bd.rectangle(strip_box, fill=RED + (255,))
    # Clip via rounded card mask
    card_mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(card_mask).rounded_rectangle(inner, radius=inner_r, fill=255)
    band_layer.putalpha(
        Image.eval(
            Image.merge(
                "L",
                (
                    Image.eval(card_mask, lambda v: v),
                ),
            ).convert("L"),
            lambda v: v,
        )
    )
    # Simpler: composite band with card_mask as alpha
    band_only = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(band_only).rectangle(strip_box, fill=RED + (255,))
    band_only.putalpha(
        card_mask
        if False
        else Image.merge("L", (card_mask,)).point(lambda v: v)
    )
    # Draw band only inside card mask
    tmp = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(tmp).rectangle(strip_box, fill=RED + (255,))
    canvas = Image.alpha_composite(
        canvas,
        Image.composite(tmp, Image.new("RGBA", (S, S), (0, 0, 0, 0)), card_mask),
    )

    d = ImageDraw.Draw(canvas)

    # Two rings (binder holes) on the red band
    ring_r = int(S * 0.035)
    ring_y = inner[1] + int(strip_h * 0.42)
    x1 = inner[0] + int((inner[2] - inner[0]) * 0.28)
    x2 = inner[0] + int((inner[2] - inner[0]) * 0.72)
    for cx in (x1, x2):
        d.ellipse(
            (cx - ring_r, ring_y - ring_r, cx + ring_r, ring_y + ring_r),
            fill=PAPER + (255,),
            outline=INK + (255,),
            width=max(2, int(S * 0.006)),
        )

    # Big centered day number "15" in blue (below the red band)
    font_size = int(S * 0.42)
    font = load_font(font_size, bold=True)
    text = "15"
    bbox = d.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    text_area_top = inner[1] + strip_h
    text_area_h = inner[3] - text_area_top
    tx = inner[0] + ((inner[2] - inner[0]) - tw) // 2 - bbox[0]
    ty = text_area_top + (text_area_h - th) // 2 - bbox[1]
    d.text((tx, ty), text, font=font, fill=BLUE + (255,))

    # Blue accent bar at bottom of card (subtle)
    bar_h = max(3, int(S * 0.02))
    bar_y = inner[3] - int(S * 0.08)
    bar_pad = int((inner[2] - inner[0]) * 0.28)
    d.rounded_rectangle(
        (inner[0] + bar_pad, bar_y, inner[2] - bar_pad, bar_y + bar_h),
        radius=bar_h // 2,
        fill=RED + (255,),
    )

    # Ensure outer transparent corners are truly transparent
    outer_mask = rounded_rect_mask((S, S), r)
    final = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    final.paste(canvas, (0, 0), outer_mask)
    return final


def make_maskable(base_img, size):
    """PWA maskable icon: solid safe-zone padding so OS masks don't crop content."""
    S = size
    canvas = Image.new("RGBA", (S, S), YELLOW + (255,))
    inner_size = int(S * 0.78)
    inner = base_img.resize((inner_size, inner_size), Image.LANCZOS)
    off = (S - inner_size) // 2
    canvas.paste(inner, (off, off), inner)
    return canvas


if __name__ == "__main__":
    icon512 = draw_icon(512)
    icon512.save(os.path.join(OUT_DIR, "icon-512.png"), format="PNG", optimize=True)

    icon192 = draw_icon(192)
    icon192.save(os.path.join(OUT_DIR, "icon-192.png"), format="PNG", optimize=True)

    # Apple touch icon (180x180)
    icon180 = draw_icon(180)
    icon180.save(os.path.join(OUT_DIR, "apple-touch-icon.png"), format="PNG", optimize=True)

    # Maskable variants
    make_maskable(icon512, 512).save(
        os.path.join(OUT_DIR, "icon-maskable-512.png"), format="PNG", optimize=True
    )
    make_maskable(icon192, 192).save(
        os.path.join(OUT_DIR, "icon-maskable-192.png"), format="PNG", optimize=True
    )

    # Favicon 32x32 and ico
    fav32 = draw_icon(64).resize((32, 32), Image.LANCZOS)
    fav32.save(os.path.join(OUT_DIR, "favicon-32.png"), format="PNG", optimize=True)
    fav32.save(os.path.join(OUT_DIR, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])

    print("Generated icons in", OUT_DIR)
    for f in ["icon-512.png", "icon-192.png", "apple-touch-icon.png",
              "icon-maskable-512.png", "icon-maskable-192.png",
              "favicon-32.png", "favicon.ico"]:
        p = os.path.join(OUT_DIR, f)
        print(f, os.path.getsize(p), "bytes")

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
GENERATOR_TEXTURE_DIR = ROOT / "src" / "assets" / "textures" / "art-camp"
GAME_TEXTURE_DIR = (
    ROOT.parent
    / "gnome-field"
    / "gnome-field"
    / "src"
    / "assets"
    / "map-tiles"
    / "art-camp"
)
GAME_ASSETS_DIR = ROOT.parent / "gnome-field" / "gnome-field" / "src" / "assets"

TILE_SIZE = 64
FRAME_COUNT = 8
PAINT_EFFECT_SIZE = TILE_SIZE * 3


def rgba(color: tuple[int, int, int], alpha: int = 255) -> tuple[int, int, int, int]:
    return color[0], color[1], color[2], alpha


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def gradient_bg(top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), rgba(top))
    px = img.load()
    for y in range(TILE_SIZE):
        t = y / (TILE_SIZE - 1)
        color = tuple(lerp(top[i], bottom[i], t) for i in range(3))
        for x in range(TILE_SIZE):
            px[x, y] = rgba(color)
    return img


def noise_overlay(img: Image.Image, seed: int, alpha: int = 18) -> Image.Image:
    rng = random.Random(seed)
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    px = overlay.load()
    for y in range(img.height):
        for x in range(img.width):
            value = rng.randint(-24, 24)
            if value >= 0:
                px[x, y] = (255, 255, 255, min(alpha, value))
            else:
                px[x, y] = (0, 0, 0, min(alpha, -value))
    return Image.alpha_composite(img, overlay)


def soft_ellipse(
    img: Image.Image,
    box: tuple[float, float, float, float],
    color: tuple[int, int, int, int],
    blur: float = 3.0,
) -> None:
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    draw.ellipse(box, fill=color)
    img.alpha_composite(overlay.filter(ImageFilter.GaussianBlur(blur)))


def soft_polygon(
    img: Image.Image,
    points: tuple[tuple[float, float], ...],
    color: tuple[int, int, int, int],
    blur: float = 2.0,
) -> None:
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    draw.polygon(points, fill=color)
    img.alpha_composite(overlay.filter(ImageFilter.GaussianBlur(blur)))


def polish_frame(img: Image.Image) -> Image.Image:
    hi_size = TILE_SIZE * 4
    hi = img.convert("RGBA").resize((hi_size, hi_size), Image.Resampling.BICUBIC)
    hi = hi.filter(ImageFilter.SMOOTH).filter(ImageFilter.GaussianBlur(0.18))
    out = hi.resize((TILE_SIZE, TILE_SIZE), Image.Resampling.LANCZOS)
    out = ImageEnhance.Color(out).enhance(0.9)
    out = ImageEnhance.Contrast(out).enhance(0.96)
    return out


def paste_rotated(
    base: Image.Image,
    shape: Image.Image,
    center: tuple[int, int],
    angle: float,
) -> None:
    rotated = shape.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    x = int(center[0] - rotated.width / 2)
    y = int(center[1] - rotated.height / 2)
    base.alpha_composite(rotated, (x, y))


def draw_paper(
    img: Image.Image,
    center: tuple[int, int],
    size: tuple[int, int],
    angle: float,
    fill: tuple[int, int, int],
) -> None:
    paper = Image.new("RGBA", (size[0] + 8, size[1] + 8), (0, 0, 0, 0))
    draw = ImageDraw.Draw(paper)
    draw.rounded_rectangle((4, 4, size[0] + 4, size[1] + 4), radius=2, fill=rgba(fill))
    draw.line((7, 11, size[0] + 1, 11), fill=(124, 132, 132, 90), width=1)
    draw.line((7, 17, size[0] - 2, 17), fill=(124, 132, 132, 70), width=1)
    paste_rotated(img, paper, center, angle)


def water_frames() -> list[Image.Image]:
    frames = []
    for frame in range(FRAME_COUNT):
        phase = frame / FRAME_COUNT * math.tau
        img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
        px = img.load()
        rng = random.Random(9200)

        sparkle_points = [
            (rng.randrange(-12, 76), rng.randrange(-10, 74), rng.random() * math.tau)
            for _ in range(18)
        ]

        for y in range(TILE_SIZE):
            for x in range(TILE_SIZE):
                nx = x / TILE_SIZE
                ny = y / TILE_SIZE
                slow_swell = (
                    math.sin(x * 0.085 + y * 0.028 + phase) +
                    math.sin(x * 0.032 - y * 0.11 - phase * 0.72)
                ) * 0.5
                depth = 0.35 + ny * 0.34 + slow_swell * 0.08
                vignette = ((nx - 0.5) ** 2 + (ny - 0.52) ** 2) * 0.58
                glint = max(
                    0,
                    math.sin(x * 0.18 + y * 0.13 + phase * 1.15)
                    + math.sin(x * 0.12 - y * 0.16 - phase * 0.85)
                    - 1.36,
                )
                caustic = glint**2 * 0.22

                r = lerp(11, 35, min(1, depth + caustic - vignette))
                g = lerp(50, 126, min(1, depth + caustic * 1.3 - vignette))
                b = lerp(80, 158, min(1, depth + caustic * 1.5 - vignette))
                px[x, y] = rgba((r, g, b))

        img = img.filter(ImageFilter.GaussianBlur(0.22))
        highlight = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
        draw = ImageDraw.Draw(highlight, "RGBA")

        for x, y, offset in sparkle_points:
            drift = math.sin(phase + offset) * 2.2
            twinkle = max(0, math.sin(phase * 1.3 + offset))
            alpha = int(10 + twinkle * 18)
            draw.ellipse(
                (x + drift - 2.2, y - drift - 1.0, x + drift + 4.4, y - drift + 2.2),
                fill=(185, 229, 232, alpha),
            )

        soft_ellipse(
            highlight,
            (-18 + math.sin(phase) * 4, 8, 54 + math.sin(phase) * 4, 34),
            (140, 207, 218, 20),
            blur=8.0,
        )
        soft_ellipse(
            highlight,
            (18 - math.sin(phase) * 3, 36, 84 - math.sin(phase) * 3, 70),
            (4, 30, 60, 42),
            blur=9.0,
        )
        img.alpha_composite(highlight.filter(ImageFilter.GaussianBlur(1.2)))
        frames.append(ImageEnhance.Contrast(img).enhance(1.04))
    return frames


def papers_frames() -> list[Image.Image]:
    base_specs = [
        ((12, 11), (19, 13), -18, (255, 249, 219)),
        ((25, 32), (23, 15), 7, (255, 232, 160)),
        ((48, 44), (17, 14), -28, (229, 251, 255)),
    ]
    frames = []
    for frame in range(FRAME_COUNT):
        img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img, "RGBA")
        for idx, (center, size, angle, fill) in enumerate(base_specs):
            wobble = math.sin((frame + idx) / FRAME_COUNT * math.tau) * 1.5
            draw_paper(
                img,
                (round(center[0] + wobble), round(center[1] - wobble)),
                size,
                angle + wobble * 3,
                fill,
            )
        frames.append(img)
    return frames


def basement_door_frames() -> list[Image.Image]:
    frames = []
    for frame in range(FRAME_COUNT):
        img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img, "RGBA")
        glow = 100 + int(math.sin(frame / FRAME_COUNT * math.tau) * 55)
        draw.ellipse((8, 7, 56, 70), fill=(255, 185, 68, glow // 2))
        draw.rounded_rectangle((12, 7, 52, 62), radius=9, fill=(143, 72, 38, 255), outline=(23, 18, 22, 255), width=4)
        draw.rounded_rectangle((19, 15, 45, 62), radius=6, fill=(78, 45, 31, 255), outline=(34, 24, 27, 210), width=2)
        for x in (25, 36):
            draw.line((x, 16, x, 61), fill=(219, 122, 55, 150), width=2)
        draw.ellipse((40, 33, 47, 40), fill=(255, 214, 89, 255), outline=(72, 40, 25, 210), width=1)
        frames.append(img)
    return frames


def bun_frames() -> list[Image.Image]:
    frames = []
    for frame in range(FRAME_COUNT):
        img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img, "RGBA")
        lift = math.sin(frame / FRAME_COUNT * math.tau) * 0.5
        draw.ellipse((11, 39 + lift, 54, 55 + lift), fill=(9, 8, 15, 80))
        draw.ellipse((10, 18, 55, 49), fill=(184, 97, 43, 255), outline=(74, 38, 30, 180), width=2)
        draw.ellipse((13, 14, 52, 43), fill=(250, 175, 73, 255), outline=(91, 45, 31, 150), width=2)
        draw.arc((18, 17, 34, 37), 195, 337, fill=(255, 234, 150, 190), width=2)
        draw.arc((30, 15, 48, 36), 195, 337, fill=(255, 234, 150, 180), width=2)
        for idx, point in enumerate(((22, 25), (31, 21), (40, 27), (28, 32), (45, 34))):
            dx = math.sin((frame + idx) / FRAME_COUNT * math.tau) * 0.4
            draw.ellipse((point[0] + dx - 1, point[1] - 1, point[0] + dx + 2, point[1] + 2), fill=(108, 70, 38, 145))
        draw.arc((16, 31, 49, 50), 10, 170, fill=(146, 70, 43, 90), width=2)
        frames.append(img)
    return frames


def paint_can_frames() -> list[Image.Image]:
    frames = []
    for frame in range(FRAME_COUNT):
        img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img, "RGBA")
        draw.ellipse((14, 43, 51, 55), fill=(6, 7, 13, 82))
        draw.ellipse((14, 9, 50, 23), fill=(244, 247, 250, 255), outline=(48, 55, 70, 230), width=3)
        draw.rectangle((14, 16, 50, 46), fill=(210, 221, 232, 255), outline=(48, 55, 70, 230), width=3)
        draw.ellipse((14, 38, 50, 53), fill=(151, 166, 181, 255), outline=(48, 55, 70, 230), width=3)
        draw.rounded_rectangle((18, 21, 46, 41), radius=4, fill=(205, 39, 49, 255))
        draw.rectangle((23, 19, 32, 45), fill=(236, 51, 59, 255))
        draw.ellipse((21, 42, 34, 52), fill=(181, 28, 36, 230))
        draw.ellipse((29, 11, 42, 18), fill=(221, 37, 47, 235))
        draw.arc((9, 4, 55, 35), 196, 344, fill=(75, 85, 101, 230), width=3)
        draw.ellipse((42, 28, 47, 33), fill=(247, 244, 218, 220))
        frames.append(img)
    return frames


def cardboard_frames() -> list[Image.Image]:
    frames = []
    for frame in range(FRAME_COUNT):
        img = gradient_bg((184, 132, 76), (145, 98, 55))
        img = noise_overlay(img, seed=2300 + frame, alpha=5)
        draw = ImageDraw.Draw(img, "RGBA")
        draw.rectangle((0, 0, 63, 63), outline=(79, 50, 30, 120), width=2)
        draw.rectangle((4, 4, 59, 59), outline=(210, 162, 92, 50), width=1)
        rng = random.Random(3100)
        for _ in range(16):
            y = rng.randrange(7, 58)
            x0 = rng.randrange(0, 18)
            x1 = rng.randrange(44, 64)
            shade = rng.choice(((218, 166, 95, 34), (86, 55, 35, 34)))
            draw.line((x0, y, x1, y + rng.choice((-1, 0, 1))), fill=shade, width=1)
        frames.append(img)
    return frames


def scanner_frames() -> list[Image.Image]:
    frames = []
    for frame in range(FRAME_COUNT):
        img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img, "RGBA")
        draw.rounded_rectangle((9, 9, 55, 55), radius=7, fill=(7, 14, 36, 220), outline=(58, 201, 229, 160), width=2)
        sweep = (frame * 8) % 72 - 4
        draw.rectangle((10 + sweep % 44, 10, 14 + sweep % 44, 54), fill=(102, 255, 201, 88))
        draw.ellipse((14, 13, 44, 43), outline=(225, 252, 255, 245), width=5)
        draw.ellipse((21, 20, 37, 36), outline=(66, 224, 255, 125), width=2)
        draw.line((38, 38, 52, 52), fill=(225, 252, 255, 245), width=6)
        frames.append(img)
    return frames


def vent_frames(kind: str) -> list[Image.Image]:
    frames = []
    inward = kind == "in"
    for frame in range(FRAME_COUNT):
        img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img, "RGBA")
        accent = (74, 211, 198) if inward else (241, 178, 72)
        draw.ellipse((10, 46, 54, 58), fill=(6, 7, 12, 90))
        draw.rounded_rectangle((9, 10, 55, 54), radius=8, fill=(42, 47, 55, 255), outline=(150, 158, 163, 230), width=3)
        draw.rounded_rectangle((15, 16, 49, 48), radius=5, fill=(19, 23, 31, 255), outline=(93, 102, 111, 210), width=2)
        for y in (22, 29, 36, 43):
            draw.rounded_rectangle((18, y, 46, y + 3), radius=1, fill=(127, 139, 148, 235))
        draw.rounded_rectangle((25, 18, 39, 46), radius=2, fill=(9, 12, 18, 125))
        if inward:
            points = ((32, 25), (24, 36), (30, 36), (30, 43), (34, 43), (34, 36), (40, 36))
        else:
            points = ((32, 43), (24, 32), (30, 32), (30, 25), (34, 25), (34, 32), (40, 32))
        draw.polygon(points, fill=rgba(accent, 230), outline=(238, 247, 236, 125))
        frames.append(img)
    return frames


def magic_box_frames() -> list[Image.Image]:
    frames = []
    for frame in range(FRAME_COUNT):
        img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img, "RGBA")
        draw.ellipse((12, 45, 54, 57), fill=(7, 7, 13, 90))
        draw.polygon(((16, 24), (32, 13), (50, 24), (32, 35)), fill=(238, 187, 66, 255), outline=(44, 31, 80, 230))
        draw.polygon(((16, 24), (32, 35), (32, 54), (15, 42)), fill=(71, 97, 194, 255), outline=(44, 31, 80, 230))
        draw.polygon(((50, 24), (32, 35), (32, 54), (51, 42)), fill=(63, 178, 123, 255), outline=(44, 31, 80, 230))
        draw.polygon(((26, 17), (32, 13), (39, 17), (39, 50), (32, 54), (26, 50)), fill=(255, 236, 117, 215))
        for x, y, r in ((13, 16, 3), (50, 15, 2), (53, 36, 2), (18, 48, 2)):
            draw.line((x - r, y, x + r, y), fill=(250, 252, 220, 220), width=1)
            draw.line((x, y - r, x, y + r), fill=(250, 252, 220, 220), width=1)
        frames.append(img)
    return frames


def wall_texture(direction: str) -> Image.Image:
    img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    color = (188, 137, 75, 247)
    dark = (82, 51, 29, 220)
    light = (226, 177, 100, 130)

    def draw_sheet(box: tuple[int, int, int, int], vertical: bool) -> None:
        draw.rectangle(box, fill=color, outline=dark, width=2)
        x0, y0, x1, y1 = box
        seed = sum(ord(char) for char in direction) + sum(box)
        rng = random.Random(seed)
        if vertical:
            for x in (x0 + 3, x0 + 6):
                draw.line((x, y0 + 2, x, y1 - 2), fill=light, width=1)
            for _ in range(7):
                y = rng.randrange(y0 + 5, y1 - 4)
                draw.line((x0 + 2, y, x1 - 2, y), fill=(104, 67, 38, 70), width=1)
        else:
            for y in (y0 + 3, y0 + 6):
                draw.line((x0 + 2, y, x1 - 2, y), fill=light, width=1)
            for _ in range(7):
                x = rng.randrange(x0 + 5, x1 - 4)
                draw.line((x, y0 + 2, x, y1 - 2), fill=(104, 67, 38, 65), width=1)

    if direction == "up":
        draw_sheet((0, 0, 64, 9), vertical=False)
    elif direction == "right":
        draw_sheet((55, 0, 64, 64), vertical=True)
    elif direction == "down":
        draw_sheet((0, 55, 64, 64), vertical=False)
    elif direction == "left":
        draw_sheet((0, 0, 9, 64), vertical=True)
    return img


def paint_explosion_frames() -> list[Image.Image]:
    colors = [(230, 20, 35), (255, 55, 59), (172, 17, 32)]
    frames = []
    rng = random.Random(777)
    drops = [
        (rng.uniform(0, math.tau), rng.randint(18, 80), rng.randint(6, 18), colors[i % len(colors)])
        for i in range(42)
    ]
    for frame in range(FRAME_COUNT):
        img = Image.new("RGBA", (PAINT_EFFECT_SIZE, PAINT_EFFECT_SIZE), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img, "RGBA")
        grow = 0.35 + frame / (FRAME_COUNT - 1) * 0.75
        for angle, dist, radius, color in drops:
            x = PAINT_EFFECT_SIZE / 2 + math.cos(angle) * dist * grow
            y = PAINT_EFFECT_SIZE / 2 + math.sin(angle) * dist * grow
            r = radius * grow
            alpha = 120 + frame * 12
            draw.ellipse((x - r, y - r, x + r, y + r), fill=rgba(color, min(alpha, 230)))
        draw.ellipse((52, 52, 140, 140), fill=(255, 94, 92, 95))
        frames.append(img.filter(ImageFilter.GaussianBlur(0.15)))
    return frames


def paint_stain_image() -> Image.Image:
    img = Image.new("RGBA", (PAINT_EFFECT_SIZE, PAINT_EFFECT_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    rng = random.Random(991)
    draw.ellipse((43, 50, 149, 145), fill=(178, 18, 31, 218))
    draw.ellipse((70, 42, 124, 81), fill=(226, 34, 42, 230))
    draw.ellipse((45, 102, 91, 150), fill=(150, 12, 25, 210))
    for _ in range(32):
        angle = rng.uniform(0, math.tau)
        dist = rng.randint(35, 83)
        x = PAINT_EFFECT_SIZE / 2 + math.cos(angle) * dist
        y = PAINT_EFFECT_SIZE / 2 + math.sin(angle) * dist
        r = rng.randint(3, 10)
        color = rng.choice(((212, 28, 40, 215), (156, 12, 26, 205), (242, 57, 62, 190)))
        draw.ellipse((x - r, y - r, x + r, y + r), fill=color)
    return img.filter(ImageFilter.GaussianBlur(0.25))


def save_asset(name: str, frames: list[Image.Image], animated: bool = True) -> None:
    frames = [polish_frame(frame) for frame in frames]
    first = frames[0].convert("RGBA")
    for out_dir in (GENERATOR_TEXTURE_DIR, GAME_TEXTURE_DIR):
        out_dir.mkdir(parents=True, exist_ok=True)
        first.save(out_dir / f"{name}.png")
        gif_path = out_dir / f"{name}.gif"
        if animated and len(frames) > 1:
            frames[0].save(
                gif_path,
                save_all=True,
                append_images=frames[1:],
                duration=405,
                loop=0,
                disposal=2,
            )
        elif gif_path.exists():
            gif_path.unlink()


def cleanup_stale_assets() -> None:
    stale_names = {
        "dried-breakfast.gif",
        "dried-breakfast.png",
        "plywood.gif",
        "plywood.png",
    }
    for out_dir in (GENERATOR_TEXTURE_DIR, GAME_TEXTURE_DIR):
        if not out_dir.exists():
            continue
        for filename in stale_names:
            path = out_dir / filename
            if path.exists():
                path.unlink()


def main() -> None:
    cleanup_stale_assets()

    assets = {
        "water": water_frames(),
        "papers": papers_frames(),
        "basement-door": basement_door_frames(),
        "bun": bun_frames(),
        "paint-can": paint_can_frames(),
        "cardboard": cardboard_frames(),
        "scanner": scanner_frames(),
        "vent-in": vent_frames("in"),
        "magic-box": magic_box_frames(),
        "vent-out": vent_frames("out"),
    }
    for name, frames in assets.items():
        save_asset(name, frames, animated=name in {"water", "scanner"})

    for direction in ("up", "right", "down", "left"):
        texture = wall_texture(direction)
        for out_dir in (GENERATOR_TEXTURE_DIR, GAME_TEXTURE_DIR):
            out_dir.mkdir(parents=True, exist_ok=True)
            texture.save(out_dir / f"wall-{direction}.png")

    explosion = paint_explosion_frames()
    stain = paint_stain_image()
    GAME_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    explosion[0].save(GAME_ASSETS_DIR / "paint-explosion.png")
    explosion[0].save(
        GAME_ASSETS_DIR / "paint-explosion.gif",
        save_all=True,
        append_images=explosion[1:],
        duration=95,
        loop=0,
        disposal=2,
    )
    stain.save(GAME_ASSETS_DIR / "paint-stain.png")


if __name__ == "__main__":
    main()

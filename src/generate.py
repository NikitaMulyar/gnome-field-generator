import json
from functools import lru_cache
from pathlib import Path

from PIL import Image


TILE_SIZE = 64

ROOT = Path(__file__).resolve().parents[1]
SOURCE_MAP = ROOT / "src" / "assets" / "map.json"
OUTPUT_MAP = ROOT / "out" / "map.png"
TEXTURE_DIR = "art-camp"
TEXTURE_ROOT = ROOT / "src" / "assets" / "textures" / TEXTURE_DIR

TEXTURES = {
    0: "water.png",
    1: "papers.png",
    2: "basement-door.png",
    3: "bricks.png",
    4: "paint-can.png",
    5: "cardboard.png",
    6: "scanner.png",
    7: "vent-in.png",
    8: "magic-box.png",
    9: "vent-out.png",
}

WALL_TEXTURE_LOOKUP = {0: "up", 1: "right", 2: "down", 3: "left"}


@lru_cache(maxsize=None)
def load_texture(filename: str, width: int, height: int):
    with Image.open(TEXTURE_ROOT / filename) as texture:
        return texture.convert("RGBA").resize(
            (width, height),
            Image.Resampling.LANCZOS,
        )


class Map:
    def __init__(self, filename: str):
        self.width = 0
        self.height = 0
        self.tiles = []
        self.walls = []
        self.read_map(filename)

    def read_map(self, filename: str):
        with open(filename, "r") as f:
            data = json.load(f)
            self.width = data["width"]
            self.height = data["height"]
            for i, tile in enumerate(data["tiles"]):
                self.tiles.append(tile["type"])
                for wall_i, wall in enumerate(tile["walls"]):
                    if wall:
                        self.walls.append((i, wall_i))


def main():
    map2d = Map(SOURCE_MAP)

    img = Image.new(
        "RGBA", (map2d.width * TILE_SIZE, map2d.height * TILE_SIZE), (21, 25, 35, 255)
    )

    for i in range(map2d.height):
        for j in range(map2d.width):
            tile = map2d.tiles[i * map2d.width + j]
            if tile in [7, 9]:
                continue
            texture = load_texture(TEXTURES[tile], TILE_SIZE, TILE_SIZE)
            img.alpha_composite(texture, (j * TILE_SIZE, i * TILE_SIZE))

    for i in range(map2d.height - 1):
        for j in range(map2d.width - 1):
            tile1 = map2d.tiles[(i + 0) * map2d.width + (j + 0)]
            tile2 = map2d.tiles[(i + 1) * map2d.width + (j + 0)]
            tile3 = map2d.tiles[(i + 0) * map2d.width + (j + 1)]
            tile4 = map2d.tiles[(i + 1) * map2d.width + (j + 1)]
            if tile1 in [7, 9] and all(
                t == tile1 for t in [tile1, tile2, tile3, tile4]
            ):
                texture = load_texture(TEXTURES[tile1], TILE_SIZE * 2, TILE_SIZE * 2)
                img.alpha_composite(texture, (j * TILE_SIZE, i * TILE_SIZE))

    for wall in map2d.walls:
        tile_i, wall_i = wall
        i = tile_i // map2d.width
        j = tile_i % map2d.width
        texture = load_texture(
            f"wall-{WALL_TEXTURE_LOOKUP[wall_i]}.png",
            TILE_SIZE,
            TILE_SIZE,
        )
        img.alpha_composite(texture, (j * TILE_SIZE, i * TILE_SIZE))

    OUTPUT_MAP.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_MAP, "wb") as out:
        img.save(out, "PNG")


if __name__ == "__main__":
    main()

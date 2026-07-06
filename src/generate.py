from PIL import Image
import json


TILE_SIZE = 64

TEXTURE_DIR = "art-camp"

TEXTURES = {
    0: "water.png",
    1: "papers.png",
    2: "basement-door.png",
    3: "bun.png",
    4: "paint-can.png",
    5: "cardboard.png",
    6: "scanner.png",
    7: "vent-in.png",
    8: "magic-box.png",
    9: "vent-out.png",
}


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
    map2d = Map("src/assets/map.json")

    img = Image.new(
        "RGBA", (map2d.width * TILE_SIZE, map2d.height * TILE_SIZE), (21, 25, 35, 255)
    )

    for i in range(map2d.height):
        for j in range(map2d.width):
            tile = map2d.tiles[i * map2d.width + j]
            if tile in [7, 9]:
                continue
            texture = Image.open(
                f"src/assets/textures/{TEXTURE_DIR}/{TEXTURES[tile]}"
            ).convert("RGBA")
            texture = texture.resize((TILE_SIZE, TILE_SIZE))
            img.paste(texture, (j * TILE_SIZE, i * TILE_SIZE))

    for i in range(map2d.height - 1):
        for j in range(map2d.width - 1):
            tile1 = map2d.tiles[(i + 0) * map2d.width + (j + 0)]
            tile2 = map2d.tiles[(i + 1) * map2d.width + (j + 0)]
            tile3 = map2d.tiles[(i + 0) * map2d.width + (j + 1)]
            tile4 = map2d.tiles[(i + 1) * map2d.width + (j + 1)]
            if tile1 in [7, 9] and all(
                t == tile1 for t in [tile1, tile2, tile3, tile4]
            ):
                texture = Image.open(
                    f"src/assets/textures/{TEXTURE_DIR}/{TEXTURES[tile1]}"
                ).convert("RGBA")
                texture = texture.resize((TILE_SIZE * 2, TILE_SIZE * 2))
                img.paste(texture, (j * TILE_SIZE, i * TILE_SIZE))

    for wall in map2d.walls:
        tile_i, wall_i = wall
        i = tile_i // map2d.width
        j = tile_i % map2d.width
        WALL_TEXTURE_LOOKUP = {0: "up", 1: "right", 2: "down", 3: "left"}
        texture = Image.open(
            f"src/assets/textures/{TEXTURE_DIR}/wall-{WALL_TEXTURE_LOOKUP[wall_i]}.png"
        ).convert("RGBA")
        texture = texture.resize((TILE_SIZE, TILE_SIZE))
        img.paste(texture, (j * TILE_SIZE, i * TILE_SIZE), texture)

    with open("out/map.png", "wb") as out:
        img.save(out, "PNG")


if __name__ == "__main__":
    main()

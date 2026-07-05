import json
import os
import shutil
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

WORK_DIR = Path(os.environ.get("WORK_DIR", "/work"))
GAME_DIR = Path(os.environ.get("GAME_DIR", "/game"))
HOST = os.environ.get("SYNC_API_HOST", "0.0.0.0")
PORT = int(os.environ.get("SYNC_API_PORT", "3002"))

SOURCE_MAP = WORK_DIR / "src" / "assets" / "map.json"
GENERATED_MAP = WORK_DIR / "out" / "map.png"
GAME_MAP = GAME_DIR / "public" / "map.json"
GAME_IMAGE = GAME_DIR / "src" / "assets" / "map.png"


def validate_map(data):
    width = data.get("width")
    height = data.get("height")
    tiles = data.get("tiles")
    portals = data.get("portals", [])

    if not isinstance(width, int) or width < 1:
        raise ValueError("width must be a positive integer")
    if not isinstance(height, int) or height < 1:
        raise ValueError("height must be a positive integer")
    if not isinstance(tiles, list) or len(tiles) != width * height:
        raise ValueError("tiles length must be width * height")
    if not isinstance(portals, list):
        raise ValueError("portals must be an array")

    for index, tile in enumerate(tiles):
        if not isinstance(tile, dict):
            raise ValueError(f"tile {index} must be an object")
        if not isinstance(tile.get("type"), int):
            raise ValueError(f"tile {index}.type must be an integer")
        walls = tile.get("walls")
        if not isinstance(walls, list) or len(walls) != 4:
            raise ValueError(f"tile {index}.walls must be an array of 4 booleans")
        if not all(isinstance(wall, bool) for wall in walls):
            raise ValueError(f"tile {index}.walls must contain only booleans")

    return {
        "width": width,
        "height": height,
        "portals": portals,
        "tiles": tiles,
    }


class SyncHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path != "/health":
            self.respond_json({"error": "Not found"}, status=404)
            return
        self.respond_json({"ok": True})

    def do_POST(self):
        if self.path != "/sync-map":
            self.respond_json({"error": "Not found"}, status=404)
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(content_length)
            map_data = validate_map(json.loads(raw_body.decode("utf-8")))

            SOURCE_MAP.parent.mkdir(parents=True, exist_ok=True)
            SOURCE_MAP.write_text(
                json.dumps(map_data, ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8",
            )

            subprocess.run(["python", "src/generate.py"], cwd=WORK_DIR, check=True)

            if not GENERATED_MAP.exists():
                raise RuntimeError(f"Generated map not found: {GENERATED_MAP}")

            GAME_MAP.parent.mkdir(parents=True, exist_ok=True)
            GAME_IMAGE.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(SOURCE_MAP, GAME_MAP)
            shutil.copyfile(GENERATED_MAP, GAME_IMAGE)

            self.respond_json({
                "ok": True,
                "mapJson": str(GAME_MAP),
                "mapImage": str(GAME_IMAGE),
            })
        except Exception as error:
            self.respond_json({"ok": False, "error": str(error)}, status=500)

    def respond_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        print("%s - %s" % (self.address_string(), format % args), flush=True)


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), SyncHandler)
    print(f"Map sync API listening on http://{HOST}:{PORT}", flush=True)
    server.serve_forever()

#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import sys
from pathlib import Path


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


def digest(path: Path) -> str:
    hash_value = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            hash_value.update(chunk)
    return hash_value.hexdigest()


def file_map(root: Path) -> dict[str, Path]:
    return {
        path.name: path
        for path in sorted(root.iterdir())
        if path.is_file() and path.name != ".DS_Store"
    }


def main() -> int:
    if not GENERATOR_TEXTURE_DIR.exists():
        print(f"Generator texture directory not found: {GENERATOR_TEXTURE_DIR}")
        return 2
    if not GAME_TEXTURE_DIR.exists():
        print(f"Game texture directory not found: {GAME_TEXTURE_DIR}")
        return 2

    generator_files = file_map(GENERATOR_TEXTURE_DIR)
    game_files = file_map(GAME_TEXTURE_DIR)

    missing_in_generator = sorted(set(game_files) - set(generator_files))
    missing_in_game = sorted(set(generator_files) - set(game_files))
    changed = sorted(
        name
        for name in set(generator_files) & set(game_files)
        if digest(generator_files[name]) != digest(game_files[name])
    )

    if not missing_in_generator and not missing_in_game and not changed:
        print("art-camp assets are in sync")
        return 0

    if missing_in_generator:
        print("Missing in generator:")
        for name in missing_in_generator:
            print(f"  - {name}")
    if missing_in_game:
        print("Missing in game:")
        for name in missing_in_game:
            print(f"  - {name}")
    if changed:
        print("Different content:")
        for name in changed:
            print(f"  - {name}")

    return 1


if __name__ == "__main__":
    sys.exit(main())

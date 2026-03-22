#!/usr/bin/env python3
"""
Write README/WRITEUP screenshots for both tasks (stdlib only, no Pillow):

  Task 1 → task-1/docs/screenshot-output.png  (CLI-style placeholder)
  Task 2 → task-2/docs/screenshot-output.png  (board-style placeholder)

Run from repository root:

  python scripts/materialize_docs_png.py
  python scripts/materialize_docs_png.py --task 1
  python scripts/materialize_docs_png.py --task 2
"""
from __future__ import annotations

import argparse
import struct
import zlib
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
TASK1_SCREENSHOT = REPO_ROOT / "task-1" / "docs" / "screenshot-output.png"
TASK2_SCREENSHOT = REPO_ROOT / "task-2" / "docs" / "screenshot-output.png"


def _chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png_rgb(path: Path, width: int, height: int, pixel_fn) -> None:
    """pixel_fn(x, y) -> (r, g, b) each 0-255."""
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type None
        for x in range(width):
            r, g, b = pixel_fn(x, y)
            raw.extend((r, g, b))
    compressed = zlib.compress(bytes(raw), 9)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n"
    png += _chunk(b"IHDR", ihdr)
    png += _chunk(b"IDAT", compressed)
    png += _chunk(b"IEND", b"")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)


def task1_terminal() -> Path:
    w, h = 920, 520
    bg = (18, 18, 24)
    dim = (140, 200, 140)
    accent = (100, 180, 255)
    fg = (220, 220, 228)
    err = (255, 120, 120)

    # Simple "line" bands to suggest terminal output (no font rendering).
    bands = [
        (28, 48, dim),
        (72, 92, accent),
        (120, 136, fg),
        (160, 176, fg),
        (200, 216, fg),
        (240, 256, fg),
        (280, 296, fg),
        (320, 336, fg),
        (360, 376, fg),
        (400, 416, dim),
        (440, 456, fg),
        (480, 496, fg),
        (520, 536, dim),
        (560, 576, err),
    ]

    def pix(x: int, y: int) -> tuple[int, int, int]:
        if x < 3 or x >= w - 3 or y < 3 or y >= h - 3:
            return (60, 60, 80)
        for y0, y1, c in bands:
            if y0 <= y < y1:
                # left "prompt" margin tint
                if x < 24:
                    return tuple(max(0, v - 30) for v in c)
                return c
        return bg

    write_png_rgb(TASK1_SCREENSHOT, w, h, pix)
    return TASK1_SCREENSHOT


def task2_kanban() -> Path:
    w, h = 980, 560
    bg = (245, 246, 250)

    def rect_hit(x: int, y: int, x0: int, y0: int, x1: int, y1: int) -> bool:
        return x0 <= x < x1 and y0 <= y < y1

    def pix(x: int, y: int) -> tuple[int, int, int]:
        if not rect_hit(x, y, 0, 0, w, h):
            return bg
        # Title bar
        if rect_hit(x, y, 24, 20, 700, 44):
            return (40, 44, 52)
        # Search field
        if rect_hit(x, y, 24, 52, 520, 84):
            if rect_hit(x, y, 26, 54, 518, 82):
                return (255, 255, 255)
            return (210, 213, 220)
        col_w, col_h = 280, 380
        top = 110
        x0 = 24
        for i in range(3):
            cx = x0 + i * (col_w + 16)
            if rect_hit(x, y, cx, top, cx + col_w, top + col_h):
                # column panel
                if rect_hit(x, y, cx + 2, top + 2, cx + col_w - 2, top + col_h - 2):
                    return (250, 250, 252)
                return (230, 232, 238)
            # cards in col 0 and 1
            if i == 0:
                for cy in (top + 48, top + 130):
                    if rect_hit(x, y, cx + 10, cy, cx + col_w - 10, cy + 72):
                        return (255, 255, 255)
            elif i == 1:
                cy = top + 48
                if rect_hit(x, y, cx + 10, cy, cx + col_w - 10, cy + 72):
                    return (255, 255, 255)
            elif i == 2:
                # placeholder text area approx
                if rect_hit(x, y, cx + 14, top + 48, cx + 200, top + 70):
                    return (200, 205, 215)
        # Add column button
        if rect_hit(x, y, w - 200, top + col_h - 50, w - 24, top + col_h - 14):
            return (70, 120, 220)
        return bg

    write_png_rgb(TASK2_SCREENSHOT, w, h, pix)
    return TASK2_SCREENSHOT


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate docs/screenshot-output.png for task-1 and/or task-2.")
    parser.add_argument(
        "--task",
        choices=("1", "2", "all"),
        default="all",
        help="Which screenshot to generate (default: all).",
    )
    args = parser.parse_args()

    written: list[tuple[str, Path]] = []
    if args.task in ("1", "all"):
        p = task1_terminal()
        written.append(("Task 1 (Feedwatch CLI placeholder)", p))
    if args.task in ("2", "all"):
        p = task2_kanban()
        written.append(("Task 2 (Kanban board placeholder)", p))

    print("materialize_docs_png: done")
    for label, path in written:
        try:
            rel = path.relative_to(REPO_ROOT)
        except ValueError:
            rel = path
        print(f"  [{label}] -> {rel}")


if __name__ == "__main__":
    main()

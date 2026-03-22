"""
Generate representative PNG screenshots for Task 1 (CLI) and Task 2 (Kanban) README/WRITEUP.
Run from repo root: python scripts/generate_readme_screenshots.py
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def _mono_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in (
        r"C:\Windows\Fonts\consola.ttf",
        r"C:\Windows\Fonts\cour.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ):
        p = Path(path)
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def task1_cli_screenshot(out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    w, h = 920, 520
    img = Image.new("RGB", (w, h), (18, 18, 24))
    draw = ImageDraw.Draw(img)
    font = _mono_font(15)
    small = _mono_font(13)
    fg = (220, 220, 228)
    dim = (140, 200, 140)
    accent = (100, 180, 255)

    lines = [
        ("$ bun ./feedwatch.js --help", dim),
        ("", fg),
        ("feedwatch — monitor RSS/Atom feeds for new items", accent),
        ("", fg),
        ("Commands:", fg),
        ("  config show          Show resolved configuration", fg),
        ("  add <name> <url>     Register a feed", fg),
        ("  remove <name>        Remove a feed", fg),
        ("  list                 List registered feeds", fg),
        ("  run [--all|--json]   Fetch and diff NEW vs SEEN", fg),
        ("  read <name>          Read items for one feed", fg),
        ("", fg),
        ("$ feedwatch run", dim),
        ("", fg),
        ("  myblog   OK   2 NEW, 5 SEEN", fg),
        ("    [NEW] Release 2.1 — changelog", dim),
        ("    [NEW] Docs: migration guide", dim),
        ("  news     FAILED  timeout after 30s", (255, 120, 120)),
    ]

    x, y = 24, 28
    for text, color in lines:
        f = small if text.startswith("    [") else font
        draw.text((x, y), text, fill=color, font=f)
        y += 22 if f == font else 20
        if y > h - 30:
            break

    draw.rectangle([0, 0, w - 1, h - 1], outline=(60, 60, 80))
    img.save(out, "PNG", optimize=True)


def task2_kanban_screenshot(out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    w, h = 980, 560
    img = Image.new("RGB", (w, h), (245, 246, 250))
    draw = ImageDraw.Draw(img)
    title_font = _mono_font(18)
    body = _mono_font(14)
    small = _mono_font(12)

    draw.text((24, 20), "Kanban — http://localhost:5500/", fill=(40, 44, 52), font=title_font)
    # Search bar
    draw.rounded_rectangle([24, 52, 520, 84], radius=6, fill=(255, 255, 255), outline=(210, 213, 220))
    draw.text((36, 60), "Search cards...", fill=(150, 155, 165), font=small)

    col_w, col_h = 280, 380
    top = 110
    cols = [
        ("To Do", [("Write tests", "Unit + e2e"), ("Fix bug #42", "Jira repro")]),
        ("In Progress", [("Spike auth", "OAuth flow")]),
        ("Done", []),
    ]
    x0 = 24
    for i, (name, cards) in enumerate(cols):
        x = x0 + i * (col_w + 16)
        draw.rounded_rectangle([x, top, x + col_w, top + col_h], radius=10, fill=(250, 250, 252), outline=(230, 232, 238))
        draw.text((x + 14, top + 14), name, fill=(30, 34, 42), font=body)
        cy = top + 48
        if not cards:
            draw.text((x + 14, cy), "No cards yet", fill=(140, 145, 155), font=small)
        else:
            for t, d in cards:
                draw.rounded_rectangle([x + 10, cy, x + col_w - 10, cy + 72], radius=8, fill=(255, 255, 255), outline=(220, 223, 230))
                draw.text((x + 22, cy + 10), t, fill=(35, 39, 47), font=small)
                draw.text((x + 22, cy + 30), d[:40], fill=(120, 125, 135), font=small)
                cy += 82
        # Footer hint
        draw.text((x + 14, top + col_h - 32), "+ Add card", fill=(80, 120, 200), font=small)

    draw.rounded_rectangle([w - 200, top + col_h - 50, w - 24, top + col_h - 14], radius=6, fill=(70, 120, 220))
    draw.text((w - 178, top + col_h - 42), "Add column", fill=(255, 255, 255), font=small)

    img.save(out, "PNG", optimize=True)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    task1_cli_screenshot(root / "task-1" / "docs" / "screenshot-output.png")
    task2_kanban_screenshot(root / "task-2" / "docs" / "screenshot-output.png")
    print("Wrote:")
    print(" ", root / "task-1" / "docs" / "screenshot-output.png")
    print(" ", root / "task-2" / "docs" / "screenshot-output.png")


if __name__ == "__main__":
    main()

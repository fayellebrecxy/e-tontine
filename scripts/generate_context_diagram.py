#!/usr/bin/env python3
"""
Diagramme de contexte — Système E-Tontine.

Vue d'ensemble : système central, acteurs humains et systèmes externes,
flux principaux nommés (sans détail des cas d'utilisation).
"""
from __future__ import annotations

from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "Docs"
PNG_PATH = DOCS / "diagramme-contexte-e-tontine.png"

BLACK = (0, 0, 0)
GRAY = (80, 80, 80)
WHITE = (255, 255, 255)
SYS_FILL = (248, 250, 252)

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

W, H = 1400, 920


def _font(size: int, bold: bool = False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_PATH, size)


def _box_edges(cx: float, cy: float, w: float, h: float) -> dict:
    return {
        "cx": cx,
        "cy": cy,
        "left": cx - w / 2,
        "right": cx + w / 2,
        "top": cy - h / 2,
        "bottom": cy + h / 2,
        "w": w,
        "h": h,
    }


def _draw_box(d: ImageDraw.ImageDraw, box: dict, lines: list[str], font, font_bold, fill=WHITE):
    x0, y0 = box["left"], box["top"]
    x1, y1 = box["right"], box["bottom"]
    d.rounded_rectangle((x0, y0, x1, y1), radius=8, outline=BLACK, fill=fill, width=2)
    if len(lines) == 1:
        d.text((box["cx"], box["cy"]), lines[0], font=font_bold, fill=BLACK, anchor="mm")
        return
    y = box["cy"] - (len(lines) * 16) / 2 + 8
    for i, line in enumerate(lines):
        f = font_bold if i == 0 else font
        d.text((box["cx"], y), line, font=f, fill=BLACK, anchor="mm")
        y += 18 if i == 0 else 16


def _edge_point(src: dict, dst: dict) -> tuple[float, float, float, float]:
    """Point de sortie src et point d'entrée dst (intersection bord rectangle)."""
    dx, dy = dst["cx"] - src["cx"], dst["cy"] - src["cy"]
    if abs(dx) < 1 and abs(dy) < 1:
        return src["cx"], src["cy"], dst["cx"], dst["cy"]
    hw, hh = src["w"] / 2, src["h"] / 2
    if abs(dx) * hh > abs(dy) * hw:
        sx = src["right"] if dx > 0 else src["left"]
        sy = src["cy"] + (sx - src["cx"]) * dy / dx if dx else src["cy"]
    else:
        sy = src["bottom"] if dy > 0 else src["top"]
        sx = src["cx"] + (sy - src["cy"]) * dx / dy if dy else src["cx"]

    hw2, hh2 = dst["w"] / 2, dst["h"] / 2
    if abs(dx) * hh2 > abs(dy) * hw2:
        tx = dst["left"] if dx > 0 else dst["right"]
        ty = dst["cy"] + (tx - dst["cx"]) * dy / dx if dx else dst["cy"]
    else:
        ty = dst["top"] if dy > 0 else dst["bottom"]
        tx = dst["cx"] + (ty - dst["cy"]) * dx / dy if dy else dst["cx"]
    return sx, sy, tx, ty


def _arrow(d: ImageDraw.ImageDraw, x1, y1, x2, y2):
    d.line((x1, y1, x2, y2), fill=BLACK, width=1)
    ang = __import__("math").atan2(y2 - y1, x2 - x1)
    size = 10
    import math

    a1, a2 = ang + math.pi * 0.82, ang - math.pi * 0.82
    d.polygon(
        [
            (x2, y2),
            (x2 + size * math.cos(a1), y2 + size * math.sin(a1)),
            (x2 + size * math.cos(a2), y2 + size * math.sin(a2)),
        ],
        outline=BLACK,
        fill=WHITE,
    )


def _link(d: ImageDraw.ImageDraw, src: dict, dst: dict, label: str, font_label, bidirectional=False):
    x1, y1, x2, y2 = _edge_point(src, dst)
    _arrow(d, x1, y1, x2, y2)
    if bidirectional:
        _arrow(d, x2, y2, x1, y1)
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    for i, line in enumerate(wrap(label, 28)):
        d.text((mx, my - 8 + i * 14), line, font=font_label, fill=GRAY, anchor="mm")


def render() -> Path:
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    f = _font(13)
    fb = _font(14, bold=True)
    f_title = _font(22, bold=True)
    f_lbl = _font(11)

    # Draw border rectangle around the diagram
    d.rectangle((20, 20, W - 20, H - 20), outline=BLACK, width=2)

    d.text((W / 2, 56), "Diagramme de contexte — E-Tontine", font=f_title, fill=BLACK, anchor="mm")

    system = _box_edges(700, 460, 400, 200)
    _draw_box(
        d,
        system,
        ["E-Tontine", "Application web (Next.js)", "API · Tableau de bord · Logique métier"],
        f,
        fb,
        fill=SYS_FILL,
    )

    entities = {
        "guest": _box_edges(200, 150, 220, 72),
        "member": _box_edges(200, 460, 220, 72),
        "admin": _box_edges(200, 770, 220, 72),
        "auth": _box_edges(700, 130, 240, 72),
        "mm": _box_edges(1180, 280, 250, 80),
        "db": _box_edges(1180, 640, 240, 80),
    }

    _draw_box(d, entities["guest"], ["Utilisateur non authentifié"], f, fb)
    _draw_box(d, entities["member"], ["Membre de groupe"], f, fb)
    _draw_box(d, entities["admin"], ["Administrateur de groupe"], f, fb)
    _draw_box(d, entities["auth"], ["Supabase Auth", "Inscription · Connexion · Session"], f, fb)
    _draw_box(d, entities["mm"], ["Opérateur Mobile Money", "Orange Money · MTN MoMo"], f, fb)
    _draw_box(d, entities["db"], ["PostgreSQL", "Persistance (Prisma ORM)"], f, fb)

    _link(d, entities["guest"], system, "S'inscrire, se connecter,\nconsulter l'accueil", f_lbl)
    _link(d, entities["member"], system, "Cycles, cotisations, épargne,\nprêts, finances", f_lbl)
    _link(d, entities["admin"], system, "Gestion groupe, cycles,\nrapports, validations", f_lbl)
    _link(d, system, entities["auth"], "Vérification identité\n& tokens SSR", f_lbl, bidirectional=True)
    _link(d, system, entities["mm"], "Initier & confirmer\npaiements Mobile Money", f_lbl, bidirectional=True)
    _link(d, system, entities["db"], "Lecture / écriture\ndonnées métier", f_lbl, bidirectional=True)

    DOCS.mkdir(parents=True, exist_ok=True)
    img.save(PNG_PATH, quality=95, optimize=True)

    im = img.copy()
    if im.width != 1920:
        im = im.resize((1920, int(im.height * 1920 / im.width)), Image.Resampling.LANCZOS)
        im.save(PNG_PATH, quality=95)

    return PNG_PATH


def main():
    path = render()
    print(f"PNG : {path}")


if __name__ == "__main__":
    main()

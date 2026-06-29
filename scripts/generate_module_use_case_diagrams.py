#!/usr/bin/env python3
"""
Diagrammes de cas d'utilisation par module — E-Tontine.

Style TAMELA (aligné sur le diagramme global) :
  - Cas principaux à gauche, cas inclus/étendus au centre si nécessaire
  - « S'authentifier » à droite (<<include>> horizontal)
  - Généralisation acteur : couloir à gauche + triangle creux (TAMELA)
"""
from __future__ import annotations

import math
from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "Docs" / "diagramme uses case module"
OUT.mkdir(parents=True, exist_ok=True)

BLACK = (20, 20, 20)
GRAY = (90, 90, 90)
UC_BLUE = (37, 99, 235)
UC_FILL = (247, 251, 255)
WHITE = (255, 255, 255)
SYS_FILL = (252, 253, 255)

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FB = ImageFont.truetype(BOLD, 24)
FS = ImageFont.truetype(FONT, 19)
FSB = ImageFont.truetype(BOLD, 20)
FX = ImageFont.truetype(FONT, 15)

ACTOR_X = 58
TOP = 95
ROW = 78
AUTH_RX, AUTH_RY_BASE = 82, 26


def _layout(n_rows: int, has_side: bool) -> dict:
    main_x = 280
    side_x = 490 if has_side else None
    auth_x = 700 if not has_side else 720
    bw = 620 if not has_side else 720
    return {"main_x": main_x, "side_x": side_x, "auth_x": auth_x, "bw": bw}


def _text_center(d, box, label, font=FS, max_chars=18):
    x1, y1, x2, y2 = box
    lines = []
    for part in str(label).split("\n"):
        lines.extend(wrap(part, max_chars) or [""])
    lh = font.size + 5
    y = (y1 + y2) / 2 - (len(lines) * lh) / 2 + 2
    for line in lines:
        d.text(((x1 + x2) / 2, y), line, font=font, fill=BLACK, anchor="ma")
        y += lh


def _draw_actor(d, x, y, label):
    d.ellipse((x - 14, y, x + 14, y + 28), outline=BLACK, width=2)
    d.line((x, y + 28, x, y + 52), fill=BLACK, width=2)
    d.line((x - 18, y + 38, x + 18, y + 38), fill=BLACK, width=2)
    d.line((x, y + 52, x - 16, y + 72), fill=BLACK, width=2)
    d.line((x, y + 52, x + 16, y + 72), fill=BLACK, width=2)
    ty = y + 86
    for line in label.split("\n"):
        d.text((x, ty), line, font=FSB, fill=BLACK, anchor="ma")
        ty += 19
    return x + 18, y + 38


def _draw_oval(d, cx, cy, rx, ry, label):
    box = (cx - rx, cy - ry, cx + rx, cy + ry)
    d.ellipse(box, outline=UC_BLUE, fill=UC_FILL, width=2)
    _text_center(d, box, label, FS)
    return {
        "cx": cx, "cy": cy, "rx": rx, "ry": ry,
        "left": cx - rx, "right": cx + rx,
        "top": cy - ry, "bottom": cy + ry,
    }


def _auth_geom(n_rows: int, auth_x: int) -> dict:
    y1, y2 = TOP, TOP + (n_rows - 1) * ROW
    cy = (y1 + y2) / 2
    ry = (y2 - y1) / 2 + AUTH_RY_BASE + 4
    return {
        "cx": auth_x, "cy": cy, "rx": AUTH_RX, "ry": ry,
        "left": auth_x - AUTH_RX, "right": auth_x + AUTH_RX,
        "top": cy - ry, "bottom": cy + ry,
    }


def _dashed(d, x1, y1, x2, y2):
    dx, dy = x2 - x1, y2 - y1
    dist = math.hypot(dx, dy)
    if dist < 1:
        return
    ux, uy = dx / dist, dy / dist
    pos, on = 0.0, True
    while pos < dist:
        seg = min(8 if on else 5, dist - pos)
        if on:
            d.line(
                (x1 + ux * pos, y1 + uy * pos, x1 + ux * (pos + seg), y1 + uy * (pos + seg)),
                fill=GRAY, width=1,
            )
        pos += seg
        on = not on


def _ellipse_left_x(oval: dict, y: float) -> float:
    dy = max(-1.0, min(1.0, (y - oval["cy"]) / oval["ry"]))
    return oval["cx"] - oval["rx"] * math.sqrt(1.0 - dy * dy)


def _open_arrow(d, tx, ty, dx, dy):
    ln = math.hypot(dx, dy) or 1.0
    ux, uy = dx / ln, dy / ln
    px, py = -uy, ux
    d.line((tx, ty, tx - ux * 9 + px * 5, ty - uy * 9 + py * 5), fill=GRAY, width=1)
    d.line((tx, ty, tx - ux * 9 - px * 5, ty - uy * 9 - py * 5), fill=GRAY, width=1)


def _include_tamela(d, src, dst, label="<<include>>", y_off: float = 0):
    sy = src["cy"] + y_off
    sx = src["right"]
    tx = _ellipse_left_x(dst, sy)
    if tx <= sx + 4:
        return
    _dashed(d, sx, sy, tx, sy)
    _open_arrow(d, tx, sy, tx - sx, 0)
    lx = (sx + tx) / 2
    ly = sy + 16 if tx - sx <= 120 else sy - 16
    d.text((lx, ly), label, font=FX, fill=BLACK, anchor="ma")


def _extend_tamela(d, ext, base, bx):
    ty = base["cy"]
    tx = _ellipse_left_x(base, ty)
    sy = ext["cy"]

    if abs(sy - ty) < 14 and ext["cx"] > base["cx"]:
        _dashed(d, ext["left"], sy, tx, ty)
        _open_arrow(d, tx, ty, tx - ext["left"], 0)
        d.text(((ext["left"] + tx) / 2, sy - 16), "<<extend>>", font=FX, fill=BLACK, anchor="ma")
        return

    mid_x = bx + 68
    _dashed(d, ext["left"], sy, mid_x, sy)
    _dashed(d, mid_x, sy, mid_x, ty)
    _dashed(d, mid_x, ty, tx, ty)
    _open_arrow(d, tx, ty, tx - mid_x, 0)
    d.text((mid_x - 8, (sy + ty) / 2), "<<extend>>", font=FX, fill=BLACK, anchor="rm")


def _actor_positions(spec, n_rows):
    n = len(spec["actors"])
    gen = spec.get("actor_gen", [])

    if n == 1:
        return [TOP + (n_rows - 1) * ROW // 2]

    if n == 2 and gen:
        spread = max((n_rows - 1) * ROW, 220)
        return [TOP + 40, TOP + 40 + spread]

    if n == 3 and gen:
        y0 = TOP + 20
        y2 = TOP + (n_rows - 1) * ROW - 10
        y1 = (y0 + y2) // 2
        return [y0, y1, y2]

    linked = []
    for ai in range(n):
        rows = [i for i, p in enumerate(spec["primary"]) if p[3] & (1 << ai)]
        linked.append(int(sum(TOP + i * ROW for i in rows) / len(rows)) if rows else TOP + (n_rows - 1) * ROW // 2)
    return linked


def _actor_for_case(mask: int, gen_pairs: list[tuple[int, int]]) -> int | None:
    """Acteur à associer — évite le doublon parent/enfant (TAMELA)."""
    child_of = {c: p for c, p in gen_pairs}
    bits = [i for i in range(8) if mask & (1 << i)]
    if not bits:
        return None
    if len(bits) == 1:
        return bits[0]
    # cas partagés parent/enfant : association sur le parent (TAMELA)
    for c, p in gen_pairs:
        if c in bits and p in bits:
            return p
    return bits[0]


def _actor_gen(d, child_xy, parent_xy):
    """Généralisation UML : trait droit enfant → parent + triangle creux au parent."""
    x1, y1 = child_xy
    x2, y2 = parent_xy
    dx, dy = x1 - x2, y1 - y2
    length = math.hypot(dx, dy) or 1.0
    ux, uy = dx / length, dy / length  # parent → enfant
    tri_h, tri_w = 18, 10
    ax, ay = x2, y2
    bx, by = x2 + ux * tri_h, y2 + uy * tri_h
    px, py = -uy, ux
    wing_l = (bx + px * tri_w, by + py * tri_w)
    wing_r = (bx - px * tri_w, by - py * tri_w)
    d.line((x1, y1, bx, by), fill=BLACK, width=2)
    d.polygon([(ax, ay), wing_l, wing_r], outline=BLACK, fill=WHITE, width=2)


def render_diagram(spec: dict) -> Path:
    primary = spec["primary"]
    side = spec.get("side", [])
    n_rows = max(len(primary), max((r for r, *_ in side), default=-1) + 1)
    use_auth = spec.get("auth", spec["file"] != "uc-authentification")
    no_auth = set(spec.get("no_auth", []))
    lay = _layout(n_rows, bool(side))
    gen_pairs = spec.get("actor_gen", [])
    actor_ys = _actor_positions(spec, n_rows)
    bh = max(TOP + (n_rows - 1) * ROW + 60, max(actor_ys) + 120 if actor_ys else 200)
    bx, by, bw = 145, 38, lay["bw"]

    img = Image.new("RGB", (bx + bw + 50, by + bh + 50), WHITE)
    d = ImageDraw.Draw(img)
    d.rectangle((bx, by, bx + bw, by + bh), outline=BLACK, width=2, fill=SYS_FILL)
    d.text((bx + bw / 2, by + 26), spec["title"], font=FB, fill=BLACK, anchor="ma")

    actor_pts = []
    for ai, label in enumerate(spec["actors"]):
        actor_pts.append(_draw_actor(d, ACTOR_X, actor_ys[ai] - 38, label))

    for child, parent in gen_pairs:
        _actor_gen(d, actor_pts[child], actor_pts[parent])

    povals, sovals = [], {}
    for i, (label, rx, ry, mask) in enumerate(primary):
        cy = TOP + i * ROW
        ov = _draw_oval(d, lay["main_x"], cy, rx, ry, label)
        povals.append(ov)
        ai = _actor_for_case(mask, gen_pairs)
        if ai is not None:
            lx, ly = actor_pts[ai]
            d.line((lx, ly, ov["left"], cy), fill=BLACK, width=1)

    if lay["side_x"] is not None:
        for row, label, rx, ry in side:
            cy = TOP + row * ROW
            sovals[row] = _draw_oval(d, lay["side_x"], cy, rx, ry, label)

    auth = None
    if use_auth:
        g = _auth_geom(n_rows, lay["auth_x"])
        auth = _draw_oval(d, g["cx"], g["cy"], g["rx"], g["ry"], "S'authentifier")

    for pi, si in spec.get("includes", []):
        _include_tamela(d, povals[pi], sovals[si])

    if auth:
        for pi, ov in enumerate(povals):
            if pi not in no_auth:
                _include_tamela(d, ov, auth, y_off=(-1) ** pi * 2)
        for row, ov in sovals.items():
            if row not in no_auth:
                _include_tamela(d, ov, auth)

    for si, pi in spec.get("extends", []):
        _extend_tamela(d, sovals[si], povals[pi], bx)

    path = OUT / f"{spec['file']}.png"
    w, h = img.size
    img.resize((1920, int(h * 1920 / w)), Image.Resampling.LANCZOS).save(path, quality=95)
    return path


MODULES = [
    {
        "file": "uc-authentification",
        "title": "Module Authentification",
        "auth": False,
        "actors": ["Utilisateur"],
        "primary": [
            ("S'inscrire", 78, 24, 0b1),
            ("Se connecter", 78, 24, 0b1),
            ("Réinitialiser\nmot de passe", 95, 28, 0b1),
            ("Modifier profil", 78, 24, 0b1),
        ],
        "side": [(1, "Vérifier\nidentifiants", 92, 28)],
        "includes": [(1, 1)],
    },
    {
        "file": "uc-groupes",
        "title": "Module Groupes",
        "actors": ["Administrateur"],
        "primary": [
            ("Créer un groupe", 88, 24, 0b1),
            ("Configurer le groupe", 95, 24, 0b1),
            ("Supprimer le groupe", 92, 24, 0b1),
            ("Exporter\nrapport groupe", 95, 28, 0b1),
        ],
    },
    {
        "file": "uc-membres",
        "title": "Module Membres",
        "actors": ["Utilisateur", "Membre", "Administrateur"],
        "actor_gen": [(2, 1)],  # Administrateur → Membre
        "no_auth": [0],
        "primary": [
            ("Rejoindre\nun groupe", 95, 28, 0b001),
            ("Consulter membres", 92, 24, 0b010),
            ("Demander\nréintégration", 95, 28, 0b010),
            ("Générer\ninvitation", 95, 28, 0b100),
            ("Promouvoir membre", 92, 24, 0b100),
            ("Exclure membre", 88, 24, 0b100),
            ("Valider\nréintégration", 95, 28, 0b100),
        ],
    },
    {
        "file": "uc-cycles",
        "title": "Module Cycles",
        "actors": ["Membre", "Administrateur"],
        "actor_gen": [(1, 0)],
        "primary": [
            ("Consulter cycle", 88, 24, 0b01),
            ("Payer cotisation", 82, 24, 0b01),
            ("Gérer échange", 82, 24, 0b01),
            ("Créer un cycle", 82, 24, 0b10),
            ("Enregistrer\ncotisation", 98, 28, 0b10),
            ("Verser le pot", 82, 24, 0b10),
        ],
    },
    {
        "file": "uc-rubriques",
        "title": "Module Rubriques",
        "actors": ["Membre", "Administrateur"],
        "actor_gen": [(1, 0)],
        "primary": [
            ("Consulter rubriques", 88, 24, 0b01),
            ("Payer rubrique", 88, 24, 0b01),
            ("Créer rubrique", 88, 24, 0b10),
            ("Effectuer retrait", 88, 24, 0b10),
            ("Verser au\npot commun", 95, 28, 0b10),
        ],
    },
    {
        "file": "uc-reunions",
        "title": "Module Réunions",
        "actors": ["Membre", "Administrateur"],
        "actor_gen": [(1, 0)],
        "primary": [
            ("Consulter réunions", 88, 24, 0b01),
            ("Signaler\nabsence", 92, 28, 0b01),
            ("Payer amende", 88, 24, 0b01),
            ("Planifier réunion", 88, 24, 0b10),
            ("Saisir présences", 88, 24, 0b10),
            ("Retirer caisse\namendes", 95, 28, 0b10),
        ],
    },
    {
        "file": "uc-epargne",
        "title": "Module Épargne",
        "actors": ["Membre", "Administrateur"],
        "actor_gen": [(1, 0)],
        "primary": [
            ("Consulter\népargne", 92, 28, 0b01),
            ("Effectuer dépôt", 88, 24, 0b01),
            ("Effectuer retrait", 88, 24, 0b01),
            ("Signaler\nmouvement", 92, 28, 0b01),
            ("Ouvrir compte", 88, 24, 0b10),
            ("Auditer\nmouvements", 92, 28, 0b10),
        ],
    },
    {
        "file": "uc-prets",
        "title": "Module Prêts",
        "actors": ["Membre", "Administrateur"],
        "actor_gen": [(1, 0)],
        "primary": [
            ("Demander prêt", 82, 24, 0b01),
            ("Accepter garantie", 92, 24, 0b01),
            ("Rembourser prêt", 88, 24, 0b01),
            ("Approuver prêt", 88, 24, 0b10),
            ("Décaisser prêt", 82, 24, 0b10),
            ("Configurer\nparamètres", 92, 28, 0b10),
        ],
    },
    {
        "file": "uc-paiements",
        "title": "Module Paiements",
        "actors": ["Membre", "Administrateur"],
        "actor_gen": [(1, 0)],
        "primary": [
            ("Initier\nMobile Money", 98, 28, 0b11),
            ("Suivre transaction", 92, 24, 0b11),
        ],
    },
    {
        "file": "uc-finances",
        "title": "Module Finances",
        "actors": ["Membre", "Administrateur"],
        "actor_gen": [(1, 0)],
        "primary": [
            ("Consulter caisses", 88, 24, 0b11),
            ("Consulter journal", 88, 24, 0b11),
            ("Télécharger\nrelevé PDF", 95, 28, 0b11),
        ],
    },
]


def main():
    for spec in MODULES:
        render_diagram(spec)
        print(f"  {spec['file']}.png")
    print(f"{len(MODULES)} diagrammes UC → {OUT}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Diagrammes de cas d'utilisation — cahier d'analyse E-Tontine (traits horizontaux, sans croisement)."""
from __future__ import annotations

import math
from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "Docs" / "cahier-analyse-diagrammes"
OUT.mkdir(parents=True, exist_ok=True)

BLACK = (20, 20, 20)
GRAY = (85, 85, 85)
UC_BLUE = (37, 99, 235)
UC_FILL = (247, 251, 255)
WHITE = (255, 255, 255)
SYS_FILL = (252, 253, 255)

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
F = ImageFont.truetype(FONT, 22)
FB = ImageFont.truetype(BOLD, 24)
FS = ImageFont.truetype(FONT, 19)
FSB = ImageFont.truetype(BOLD, 20)
FX = ImageFont.truetype(FONT, 16)


def save(img: Image.Image, name: str):
    img.save(OUT / f"{name}.png", quality=95, optimize=True)


def text_center(d, box, label, font=F, max_chars=22):
    x1, y1, x2, y2 = box
    lines = []
    for part in str(label).split("\n"):
        lines.extend(wrap(part, max_chars) or [""])
    lh = font.size + 6
    y = (y1 + y2) / 2 - (len(lines) * lh) / 2 + 3
    for line in lines:
        d.text(((x1 + x2) / 2, y), line, font=font, fill=BLACK, anchor="ma")
        y += lh


def draw_actor(d, x, y, label):
    d.ellipse((x - 14, y, x + 14, y + 28), outline=BLACK, width=2)
    d.line((x, y + 28, x, y + 52), fill=BLACK, width=2)
    d.line((x - 18, y + 38, x + 18, y + 38), fill=BLACK, width=2)
    d.line((x, y + 52, x - 16, y + 72), fill=BLACK, width=2)
    d.line((x, y + 52, x + 16, y + 72), fill=BLACK, width=2)
    lines = label.split("\n")
    ty = y + 88
    for line in lines:
        d.text((x, ty), line, font=FSB, fill=BLACK, anchor="ma")
        ty += 20
    link_y = y + 38
    return {
        "chest": (x + 18, link_y),
        "head_top": (x, y),
        "feet_bottom": (x, y + 72),
        "text_bottom": (x, ty),
        "x": x,
        "y": y,
    }



def draw_oval(d, cx, cy, rx, ry, label):
    box = (cx - rx, cy - ry, cx + rx, cy + ry)
    d.ellipse(box, outline=UC_BLUE, fill=UC_FILL, width=2)
    text_center(d, box, label, FS, max_chars=16 if rx < 95 else 18)
    return {
        "cx": cx, "cy": cy, "rx": rx, "ry": ry,
        "left": cx - rx, "right": cx + rx, "top": cy - ry, "bottom": cy + ry,
    }


def _ellipse_left_x(oval: dict, y: float) -> float:
    """Abscisse du bord gauche de l'ellipse à l'ordonnée y (TAMELA)."""
    dy = max(-1.0, min(1.0, (y - oval["cy"]) / oval["ry"]))
    return oval["cx"] - oval["rx"] * math.sqrt(1.0 - dy * dy)


def _open_arrow_dir(d, tip_x, tip_y, dx, dy, fill=GRAY):
    """Flèche ouverte UML orientée dans le sens du trait (TAMELA fig. 12)."""
    length = math.hypot(dx, dy) or 1.0
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    wing, back = 5.0, 9.0
    d.line(
        (tip_x, tip_y, tip_x - ux * back + px * wing, tip_y - uy * back + py * wing),
        fill=fill, width=1,
    )
    d.line(
        (tip_x, tip_y, tip_x - ux * back - px * wing, tip_y - uy * back - py * wing),
        fill=fill, width=1,
    )


def assoc_direct(d, ax, ay, case):
    """Association acteur–cas : trait plein direct, sans flèche (TAMELA)."""
    d.line((ax, ay, case["left"], case["cy"]), fill=BLACK, width=1)


def _include_tamela(d, src, dst, stereotype):
    """
    <<include>> TAMELA : trait pointillé horizontal au niveau du cas source,
    flèche ouverte vers le cas inclus (à droite, même ordonnée).
    """
    sy = src["cy"]
    ty = dst["cy"]
    if abs(sy - ty) > 12:
        return False
    sx = src["right"]
    tx = _ellipse_left_x(dst, sy)
    if tx <= sx + 20:
        return False
    dashed_line(d, sx, sy, tx, sy)
    _open_arrow_dir(d, tx, sy, tx - sx, 0)
    d.text(((sx + tx) / 2, sy - 14), stereotype, font=FX, fill=BLACK, anchor="ma")
    return True


def _route_dependency(d, src, dst, stereotype, bx, corridor_side="right", route_idx=0):
    """
    <<include>> / <<extend>> avec couloir (cas cible non aligné horizontalement).
    Flèche ouverte vers le cas cible (bord gauche).
    """
    sy, sx = src["cy"], src["right"]
    ty = dst["cy"]
    tx = _ellipse_left_x(dst, ty)

    if corridor_side == "left":
        mid_x = min(src["left"], dst["left"]) - 28 - route_idx * 18
        mid_x = max(mid_x, bx + 72)
        start_x = src["left"] if src["cx"] >= dst["cx"] else src["right"]
        if src["cx"] >= dst["cx"]:
            dashed_line(d, start_x, sy, mid_x, sy)
            dashed_line(d, mid_x, sy, mid_x, ty)
            dashed_line(d, mid_x, ty, tx, ty)
            _open_arrow_dir(d, tx, ty, tx - mid_x, 0)
            d.text((mid_x - 6, (sy + ty) / 2), stereotype, font=FX, fill=BLACK, anchor="rm")
        else:
            dashed_line(d, sx, sy, mid_x, sy)
            dashed_line(d, mid_x, sy, mid_x, ty)
            dashed_line(d, mid_x, ty, tx, ty)
            _open_arrow_dir(d, tx, ty, tx - mid_x, 0)
            d.text((mid_x - 6, (sy + ty) / 2), stereotype, font=FX, fill=BLACK, anchor="rm")
    else:
        mid_x = max(sx, dst["right"]) + 24 + route_idx * 18
        dashed_line(d, sx, sy, mid_x, sy)
        dashed_line(d, mid_x, sy, mid_x, ty)
        dashed_line(d, mid_x, ty, tx, ty)
        _open_arrow_dir(d, tx, ty, tx - mid_x, 0)
        d.text((mid_x + 4, (sy + ty) / 2), stereotype, font=FX, fill=BLACK, anchor="lm")


def include_relation(d, src, dst, stereotype, bx, route_idx=0):
    """<<include>> : horizontal TAMELA si possible, sinon couloir à droite."""
    if not _include_tamela(d, src, dst, stereotype):
        _route_dependency(d, src, dst, stereotype, bx, corridor_side="right", route_idx=route_idx)


def extend_relation(d, ext, base, stereotype, bx, route_idx=0):
    """
    <<extend>> TAMELA : trait pointillé + flèche ouverte vers le cas de base.
    Couloir à gauche si extension à droite ; couloir à droite si même colonne.
    """
    ty = base["cy"]
    tx = _ellipse_left_x(base, ty)
    sy = ext["cy"]

    # Même ligne, extension à droite du cas de base
    if abs(sy - ty) < 14 and ext["cx"] > base["cx"]:
        sx = ext["left"]
        dashed_line(d, sx, sy, tx, ty)
        _open_arrow_dir(d, tx, ty, tx - sx, 0)
        d.text(((sx + tx) / 2, sy - 12), stereotype, font=FX, fill=BLACK, anchor="ma")
        return

    # Même colonne : couloir interne à gauche des ovales (TAMELA, sans traverser le diagramme)
    if abs(ext["cx"] - base["cx"]) < 24:
        mid_x = bx + 62 + route_idx * 14
        sx = ext["left"]
        dashed_line(d, sx, sy, mid_x, sy)
        dashed_line(d, mid_x, sy, mid_x, ty)
        dashed_line(d, mid_x, ty, tx, ty)
        _open_arrow_dir(d, tx, ty, tx - mid_x, 0)
        d.text((mid_x - 8, min(sy, ty) - 14), stereotype, font=FX, fill=BLACK, anchor="rm")
        return

    mid_x = min(ext["left"], base["left"]) - 28 - route_idx * 18
    mid_x = max(mid_x, bx + 72)
    sx = ext["left"] if ext["cx"] >= base["cx"] else ext["right"]
    dashed_line(d, sx, sy, mid_x, sy)
    dashed_line(d, mid_x, sy, mid_x, ty)
    dashed_line(d, mid_x, ty, tx, ty)
    _open_arrow_dir(d, tx, ty, tx - mid_x, 0)
    d.text((mid_x - 8, min(sy, ty) - 14), stereotype, font=FX, fill=BLACK, anchor="rm")


def dashed_line(d, x1, y1, x2, y2, fill=GRAY, width=1, dash=8, gap=5):
    """Trait pointillé UML (<<include>> / <<extend>>) — style TAMELA."""
    dx, dy = x2 - x1, y2 - y1
    dist = math.hypot(dx, dy)
    if dist < 1:
        return
    ux, uy = dx / dist, dy / dist
    pos, draw_seg = 0.0, True
    while pos < dist:
        seg = min(dash if draw_seg else gap, dist - pos)
        if draw_seg:
            d.line(
                (x1 + ux * pos, y1 + uy * pos, x1 + ux * (pos + seg), y1 + uy * (pos + seg)),
                fill=fill,
                width=width,
            )
        pos += seg
        draw_seg = not draw_seg


def actor_generalization(d, child_actor: dict, parent_actor: dict):
    """Généralisation acteur UML : de la tête de l'enfant au mot de l'acteur parent (ou inversement)."""
    # Determine the vertical positions of child and parent to draw from head to text_bottom / head_top
    if child_actor["y"] > parent_actor["y"]:
        # Child is below parent: line starts at top of child's head and ends at bottom of parent's text
        x1, y1 = child_actor["head_top"]
        x2, y2 = parent_actor["text_bottom"]
    else:
        # Child is above parent: line starts at bottom of child's text and ends at top of parent's head
        x1, y1 = child_actor["text_bottom"]
        x2, y2 = parent_actor["head_top"]

    dx, dy = x1 - x2, y1 - y2
    length = math.hypot(dx, dy) or 1.0
    ux, uy = dx / length, dy / length
    tri_h, tri_w = 18, 10
    ax, ay = x2, y2
    bx, by = x2 + ux * tri_h, y2 + uy * tri_h
    px, py = -uy, ux
    wing_l = (bx + px * tri_w, by + py * tri_w)
    wing_r = (bx - px * tri_w, by - py * tri_w)
    d.line((x1, y1, bx, by), fill=BLACK, width=2)
    d.polygon([(ax, ay), wing_l, wing_r], outline=BLACK, fill=WHITE, width=2)


def use_case_diagram(
    filename,
    title,
    boundary,
    actors,
    cases,
    links,
    actor_gen=None,
    includes=None,
    extends=None,
    tamela_horizontal=False,
    padding_extra=None,
):
    actor_gen = actor_gen or []
    includes = includes or []
    extends = extends or []

    bx, by, bw, bh = boundary
    pad = 40
    extra = padding_extra if padding_extra is not None else (len(includes) + len(extends)) * 26 + 50
    w = bx + bw + pad
    h = by + bh + pad + extra
    img = Image.new("RGB", (w, h), WHITE)
    d = ImageDraw.Draw(img)

    d.rectangle((bx, by, bx + bw, by + bh), outline=BLACK, width=2, fill=SYS_FILL)
    d.rectangle((bx + 6, by + 6, bx + bw - 6, by + 52), fill=WHITE, outline=WHITE)
    d.text((bx + bw / 2, by + 28), title, font=FB, fill=BLACK, anchor="ma")

    actor_pts = []
    for ax, ay, label in actors:
        pt = draw_actor(d, ax, ay, label)
        actor_pts.append(pt)

    ovals = []
    for cx, cy, rx, ry, label in cases:
        ovals.append(draw_oval(d, cx, cy, rx, ry, label))

    for ai, ci in links:
        lx, ly = actor_pts[ai]["chest"]
        assoc_direct(d, lx, ly, ovals[ci])

    for child, parent in actor_gen:
        actor_generalization(d, actor_pts[child], actor_pts[parent])

    for i, (fi, ti) in enumerate(includes):
        include_relation(d, ovals[fi], ovals[ti], "<<include>>", bx, route_idx=i)

    for i, (ei, bi) in enumerate(extends):
        extend_relation(d, ovals[ei], ovals[bi], "<<extend>>", bx, route_idx=i)

    save(img, filename)


# ─── Diagramme global (délégué au moteur TAMELA) ─────────────────────────────
def global_diagram():
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "uc_global", ROOT / "scripts" / "generate_uc_global_drawio.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.main()


MODULES = [
    {
        "file": "uc-auth",
        "title": "Module Authentification",
        "boundary": (160, 40, 520, 300),
        "actors": [(60, 100, "Visiteur"), (60, 220, "Utilisateur\nauthentifié")],
        "actor_gen": [],
        "cases": [
            (320, 110, 78, 24, "S'inscrire"),
            (320, 175, 78, 24, "Se connecter"),
            (320, 240, 92, 28, "Réinitialiser\nmot de passe"),
            (320, 310, 78, 24, "Modifier profil"),
            (490, 175, 88, 28, "Vérifier\nidentifiants"),
        ],
        "links": [(0, 0), (0, 1), (0, 2), (1, 3)],
        "includes": [(1, 4), (3, 4)],
    },
    {
        "file": "uc-groupe",
        "title": "Module Groupes",
        "boundary": (160, 40, 480, 280),
        "actors": [(60, 120, "Administrateur\nde groupe")],
        "cases": [
            (320, 110, 88, 24, "Créer un groupe"),
            (320, 180, 92, 24, "Configurer le groupe"),
            (320, 250, 92, 24, "Supprimer le groupe"),
            (480, 180, 88, 24, "Exporter rapport"),
        ],
        "links": [(0, 0), (0, 1), (0, 2), (0, 3)],
        "extends": [(3, 1)],
    },
    {
        "file": "uc-membres",
        "title": "Module Membres",
        "boundary": (160, 40, 520, 300),
        "actors": [(60, 90, "Administrateur\nde groupe"), (60, 240, "Utilisateur\ninvité")],
        "cases": [
            (320, 110, 92, 24, "Générer invitation"),
            (320, 180, 92, 24, "Promouvoir membre"),
            (320, 250, 88, 24, "Exclure membre"),
            (320, 320, 92, 28, "Valider\nréintégration"),
            (480, 180, 92, 28, "Rejoindre\nun groupe"),
        ],
        "links": [(0, 0), (0, 1), (0, 2), (0, 3), (1, 4)],
    },
    {
        "file": "uc-cycles",
        "title": "Module Cycles",
        "boundary": (160, 40, 520, 300),
        "actors": [(60, 100, "Membre\nde groupe"), (60, 250, "Administrateur\nde groupe")],
        "actor_gen": [(1, 0)],
        "cases": [
            (320, 110, 82, 24, "Créer un cycle"),
            (320, 180, 98, 24, "Enregistrer cotisation"),
            (320, 250, 82, 24, "Verser le pot"),
            (320, 320, 82, 24, "Gérer échange"),
            (480, 250, 88, 24, "Consulter cycle"),
        ],
        "links": [(1, 0), (1, 1), (1, 2), (0, 3), (0, 4), (1, 4)],
        "includes": [(2, 1)],
    },
    {
        "file": "uc-rubriques",
        "title": "Module Rubriques",
        "boundary": (160, 40, 520, 280),
        "actors": [(60, 100, "Membre\nde groupe"), (60, 240, "Administrateur\nde groupe")],
        "actor_gen": [(1, 0)],
        "cases": [
            (320, 110, 88, 24, "Créer rubrique"),
            (320, 180, 98, 24, "Enregistrer paiement"),
            (320, 250, 88, 24, "Effectuer retrait"),
            (480, 180, 92, 28, "Verser au\npot commun"),
        ],
        "links": [(1, 0), (0, 1), (1, 1), (1, 2), (1, 3)],
    },
    {
        "file": "uc-reunions",
        "title": "Module Réunions",
        "boundary": (160, 40, 520, 300),
        "actors": [(60, 100, "Membre\nde groupe"), (60, 250, "Administrateur\nde groupe")],
        "actor_gen": [(1, 0)],
        "cases": [
            (320, 110, 88, 24, "Planifier réunion"),
            (320, 180, 88, 24, "Saisir présences"),
            (320, 250, 88, 24, "Appliquer amende"),
            (320, 320, 92, 28, "Retirer caisse\namendes"),
            (480, 110, 92, 28, "Signaler\nabsence"),
        ],
        "links": [(1, 0), (1, 1), (1, 2), (1, 3), (0, 4)],
        "extends": [(4, 0)],
    },
    {
        "file": "uc-epargne",
        "title": "Module Épargne",
        "boundary": (160, 40, 520, 300),
        "actors": [(60, 100, "Membre\nde groupe"), (60, 250, "Administrateur\nde groupe")],
        "actor_gen": [(1, 0)],
        "cases": [
            (320, 110, 88, 24, "Ouvrir compte"),
            (320, 180, 88, 24, "Effectuer dépôt"),
            (320, 250, 88, 24, "Effectuer retrait"),
            (320, 320, 92, 28, "Signaler\nmouvement"),
        ],
        "links": [(1, 0), (0, 1), (1, 1), (0, 2), (1, 2), (0, 3)],
        "includes": [(2, 1)],
    },
    {
        "file": "uc-prets",
        "title": "Module Prêts",
        "boundary": (160, 40, 540, 340),
        "actors": [
            (55, 70, "Membre\nemprunteur"),
            (55, 190, "Avaliste"),
            (55, 310, "Administrateur\nde groupe"),
        ],
        "cases": [
            (330, 110, 82, 24, "Demander prêt"),
            (330, 180, 92, 24, "Accepter garantie"),
            (330, 250, 88, 24, "Approuver prêt"),
            (330, 320, 88, 24, "Rembourser prêt"),
            (490, 250, 82, 24, "Décaisser prêt"),
        ],
        "links": [(0, 0), (1, 1), (2, 2), (0, 3), (2, 4)],
        "includes": [(2, 4)],
    },
    {
        "file": "uc-paiements",
        "title": "Module Paiements",
        "boundary": (160, 40, 520, 260),
        "actors": [(60, 90, "Membre\nde groupe"), (60, 210, "Administrateur\nde groupe")],
        "actor_gen": [(1, 0)],
        "cases": [
            (320, 110, 98, 28, "Initier\nMobile Money"),
            (320, 190, 92, 24, "Suivre transaction"),
            (480, 150, 92, 28, "Finaliser\npaiement"),
        ],
        "links": [(0, 0), (1, 0), (0, 1), (1, 1)],
        "includes": [(0, 2)],
    },
    {
        "file": "uc-finances",
        "title": "Module Finances",
        "boundary": (160, 40, 520, 300),
        "actors": [(60, 100, "Membre\nde groupe"), (60, 250, "Administrateur\nde groupe")],
        "actor_gen": [(1, 0)],
        "cases": [
            (320, 110, 88, 24, "Consulter caisses"),
            (320, 180, 88, 24, "Consulter journal"),
            (320, 250, 88, 24, "Télécharger PDF"),
            (480, 180, 92, 28, "Exporter\nExcel"),
        ],
        "links": [(0, 0), (0, 1), (1, 0), (1, 1), (1, 2), (1, 3)],
        "extends": [(2, 0), (3, 1)],
    },
]


def main():
    global_diagram()
    for mod in MODULES:
        use_case_diagram(
            mod["file"],
            mod["title"],
            mod["boundary"],
            mod["actors"],
            mod["cases"],
            mod["links"],
            actor_gen=mod.get("actor_gen"),
            includes=mod.get("includes"),
            extends=mod.get("extends"),
        )
    print(f"{len(MODULES) + 1} diagrammes UC générés dans {OUT}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Diagramme de cas d'utilisation GLOBAL E-Tontine — reproduction fidèle TAMELA (fig. 11/12).

Structure TAMELA :
  - Acteurs à gauche (stick figures)
  - Colonne verticale unique de cas d'utilisation au centre
  - S'authentifier à droite
  - Associations : traits pleins sans flèche
  - <<include>> / <<extend>> : traits pointillés + flèche ouverte + stéréotype
"""
from __future__ import annotations

import html
import math
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "Docs"
DRAWIO_PATH = DOCS / "uc-global-e-tontine.drawio"
PNG_PATH = DOCS / "uc-global-e-tontine.png"
ANALYSE_PNG = ROOT / "Docs" / "cahier-analyse-diagrammes" / "uc-global.png"

# ─── Géométrie (layout TAMELA fig. 12) ───────────────────────────────────────

BX, BY, BW, BH = 160, 35, 1200, 1000
TITLE = "E-Tontine"

CX = 480
RX, RY = 108, 24
ROW = 50
Y0 = 95

# S'authentifier à droite
AUTH_CX = 1060

ACTORS = [
    (50, 200, "Administrateur"),
    (50, 520, "Membre"),
    (50, 870, "Utilisateur"),
]
ACTOR_GEN = (0, 1)  # Admin → Membre

COLUMN_LABELS = [
    "Créer un groupe",
    "Gérer les membres",
    "Gérer les cycles",
    "Gérer rubriques",
    "Gérer réunions",
    "Gérer l'épargne",
    "Gérer les prêts",
    "Générer rapports",
    "Payer cotisation",
    "Payer rubrique",
    "Consulter cycle",
    "Demander échange",
    "Déposer épargne",
    "Demander prêt",
    "Consulter finances",
    "Accepter garantie",
    "S'inscrire",
    "Se connecter",
    "Rejoindre un groupe",
]

I = {name: i for i, name in enumerate([
    "create_grp", "members", "cycles", "rubrics", "meetings", "savings", "loans", "reports",
    "pay_cot", "pay_rub", "view_cycle", "exchange", "deposit", "loan_req", "finances", "guarantee",
    "signup", "login", "join",
])}
I["auth"] = len(COLUMN_LABELS)

ADMIN_LINKS = list(range(8))
MEMBER_LINKS = list(range(8, 16))
GUEST_LINKS = [16, 17, 18]

INCLUDES_AUTH = list(range(16))  # 16 cas métier → S'authentifier (seul à seul, TAMELA)
EXTENDS = [(7, 14)]

# ─── Styles graphiques ───────────────────────────────────────────────────────

BLACK = (0, 0, 0)
GRAY = (60, 60, 60)
WHITE = (255, 255, 255)
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def _font(size: int, bold: bool = False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_PATH, size)


def _oval_geom(cx: float, cy: float, rx: float, ry: float, label: str) -> dict:
    return {
        "cx": cx, "cy": cy, "rx": rx, "ry": ry,
        "left": cx - rx, "right": cx + rx,
        "top": cy - ry, "bottom": cy + ry,
        "label": label,
    }


def _auth_geom() -> dict:
    """Ovale S'authentifier : hauteur couvrant les 16 cas (traits horizontaux TAMELA)."""
    y1, y2 = Y0, Y0 + 15 * ROW
    cy = (y1 + y2) / 2
    ry = (y2 - y1) / 2 + RY + 6
    return _oval_geom(AUTH_CX, cy, 86, ry, "S'authentifier")


def _column_cases() -> list[dict]:
    cases = []
    for i, label in enumerate(COLUMN_LABELS):
        cy = Y0 + i * ROW
        cases.append(_oval_geom(CX, cy, RX, RY, label))
    cases.append(_auth_geom())
    return cases


def _text_in_oval(d: ImageDraw.ImageDraw, o: dict, font, max_chars: int = 20):
    lines = []
    for part in o["label"].split("\n"):
        lines.extend(wrap(part, max_chars) or [""])
    lh = font.size + 4
    y = o["cy"] - (len(lines) * lh) / 2 + 2
    for line in lines:
        d.text((o["cx"], y), line, font=font, fill=BLACK, anchor="ma")
        y += lh


def _dashed(d: ImageDraw.ImageDraw, x1, y1, x2, y2, dash=8, gap=5):
    dx, dy = x2 - x1, y2 - y1
    dist = math.hypot(dx, dy)
    if dist < 1:
        return
    ux, uy = dx / dist, dy / dist
    pos, draw = 0.0, True
    while pos < dist:
        seg = min(dash if draw else gap, dist - pos)
        if draw:
            d.line((x1 + ux * pos, y1 + uy * pos, x1 + ux * (pos + seg), y1 + uy * (pos + seg)), fill=GRAY, width=1)
        pos += seg
        draw = not draw


def _ellipse_left_x(oval: dict, y: float) -> float:
    """Abscisse du bord gauche de l'ellipse à l'ordonnée y (clamp sur le contour)."""
    dy = max(-1.0, min(1.0, (y - oval["cy"]) / oval["ry"]))
    return oval["cx"] - oval["rx"] * math.sqrt(1.0 - dy * dy)


def _open_arrow(d: ImageDraw.ImageDraw, tip_x, tip_y, dx: float, dy: float):
    """Flèche ouverte UML : pointe (tip) orientée dans le sens du trait (dx, dy)."""
    length = math.hypot(dx, dy) or 1.0
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    wing = 5.0
    back = 9.0
    d.line(
        (tip_x, tip_y, tip_x - ux * back + px * wing, tip_y - uy * back + py * wing),
        fill=GRAY, width=1,
    )
    d.line(
        (tip_x, tip_y, tip_x - ux * back - px * wing, tip_y - uy * back - py * wing),
        fill=GRAY, width=1,
    )


def _include_tamela(
    d: ImageDraw.ImageDraw,
    src: dict,
    dst: dict,
    font_inc,
    y_offset: float = 0,
    label: str = "<<include>>",
):
    """TAMELA fig. 12 : un trait pointillé horizontal par cas, vers la cible (même ordonnée)."""
    sy = src["cy"] + y_offset
    sx = src["right"]
    tx = _ellipse_left_x(dst, sy)
    if tx <= sx + 4:
        return
    _dashed(d, sx, sy, tx, sy)
    _open_arrow(d, tx, sy, tx - sx, 0)
    if tx - sx > 90:
        d.text(((sx + tx) / 2, sy - 11), label, font=font_inc, fill=BLACK, anchor="ma")


def _extend_relation(d: ImageDraw.ImageDraw, ext: dict, base: dict, font_inc):
    """<<extend>> : Générer rapports → Consulter finances (couloir à gauche, bien visible)."""
    mid_x = CX - RX - 55
    ty = base["cy"]
    tx = _ellipse_left_x(base, ty)
    _dashed(d, ext["left"], ext["cy"], mid_x, ext["cy"])
    _dashed(d, mid_x, ext["cy"], mid_x, ty)
    _dashed(d, mid_x, ty, tx, ty)
    _open_arrow(d, tx, ty, tx - mid_x, 0)
    d.text((mid_x - 8, (ext["cy"] + ty) / 2), "<<extend>>", font=font_inc, fill=BLACK, anchor="rm")


def _draw_oval(d: ImageDraw.ImageDraw, o: dict, font):
    d.ellipse((o["left"], o["top"], o["right"], o["bottom"]), outline=BLACK, fill=WHITE, width=1)
    _text_in_oval(d, o, font)


def _draw_actor(d: ImageDraw.ImageDraw, x, y, label, font_label):
    d.ellipse((x - 12, y, x + 12, y + 26), outline=BLACK, width=1)
    d.line((x, y + 26, x, y + 48), fill=BLACK, width=1)
    d.line((x - 16, y + 36, x + 16, y + 36), fill=BLACK, width=1)
    d.line((x, y + 48, x - 14, y + 66), fill=BLACK, width=1)
    d.line((x, y + 48, x + 14, y + 66), fill=BLACK, width=1)
    ty = y + 78
    for line in label.split("\n"):
        d.text((x, ty), line, font=font_label, fill=BLACK, anchor="ma")
        ty += font_label.size + 2
    return x + 14, y + 36


def _assoc_direct(d: ImageDraw.ImageDraw, ax, ay, o: dict):
    """Association TAMELA : trait plein direct acteur → cas (sans flèche)."""
    d.line((ax, ay, o["left"], o["cy"]), fill=BLACK, width=1)


def _actor_generalization(d: ImageDraw.ImageDraw, child_xy, parent_xy):
    """Généralisation UML : trait droit + triangle creux au parent."""
    x1, y1 = child_xy
    x2, y2 = parent_xy
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


def render_tamela_png(target: Path):
    W, H = BX + BW + 50, BY + BH + 50
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    f_title = _font(20, bold=True)
    f_case = _font(15)
    f_actor = _font(14, bold=True)
    f_inc = _font(13)

    d.rectangle((BX, BY, BX + BW, BY + BH), outline=BLACK, width=1, fill=WHITE)
    d.text((BX + BW / 2, BY + 22), TITLE, font=f_title, fill=BLACK, anchor="ma")

    cases = _column_cases()
    auth = cases[I["auth"]]

    actor_pts = []
    for ax, ay, label in ACTORS:
        actor_pts.append(_draw_actor(d, ax, ay, label, f_actor))

    for o in cases[: len(COLUMN_LABELS)]:
        _draw_oval(d, o, f_case)
    _draw_oval(d, auth, f_case)

    _actor_generalization(d, actor_pts[ACTOR_GEN[0]], actor_pts[ACTOR_GEN[1]])

    for idx in ADMIN_LINKS:
        _assoc_direct(d, *actor_pts[0], cases[idx])
    for idx in MEMBER_LINKS:
        _assoc_direct(d, *actor_pts[1], cases[idx])
    for idx in GUEST_LINKS:
        _assoc_direct(d, *actor_pts[2], cases[idx])

    for ext_i, base_i in EXTENDS:
        _extend_relation(d, cases[ext_i], cases[base_i], f_inc)

    for idx in INCLUDES_AUTH:
        _include_tamela(d, cases[idx], auth, f_inc)

    img.save(target, quality=95, optimize=True)
    return img


# ─── draw.io ─────────────────────────────────────────────────────────────────

STYLE_ASSOC = "endArrow=none;html=1;strokeColor=#000000;strokeWidth=1;"
STYLE_GEN = "endArrow=block;endFill=0;endSize=8;html=1;strokeWidth=1;strokeColor=#000000;"
STYLE_DEP = "endArrow=open;endFill=0;dashed=1;dashPattern=8 4;html=1;strokeColor=#333333;strokeWidth=1;fontSize=11;"


def build_drawio() -> str:
    cases = _column_cases()
    _cell = 2

    def nid() -> str:
        nonlocal _cell
        _cell += 1
        return str(_cell)

    mxfile = ET.Element("mxfile", {"host": "app.diagrams.net", "version": "24.7.17"})
    diagram = ET.SubElement(mxfile, "diagram", {"id": "uc-global", "name": "Cas d'utilisation global"})
    model = ET.SubElement(diagram, "mxGraphModel", {"pageWidth": "1400", "pageHeight": "1100"})
    root = ET.SubElement(model, "root")
    ET.SubElement(root, "mxCell", {"id": "0"})
    ET.SubElement(root, "mxCell", {"id": "1", "parent": "0"})

    sys_id = nid()
    geo_sys = ET.SubElement(
        ET.SubElement(root, "mxCell", {
            "id": sys_id, "parent": "1", "value": TITLE,
            "style": "swimlane;startSize=28;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontStyle=1;",
            "vertex": "1",
        }), "mxGeometry", {"x": str(BX), "y": str(BY), "width": str(BW), "height": str(BH), "as": "geometry"},
    )

    cids: list[str] = []
    for o in cases:
        cid = nid()
        cids.append(cid)
        parent = "1" if o["label"] == "S'authentifier" else sys_id
        ox = o["cx"] - o["rx"] - (BX if parent == sys_id else 0)
        oy = o["cy"] - o["ry"] - (BY if parent == sys_id else 0)
        if parent == sys_id:
            ox, oy = o["cx"] - o["rx"] - BX, o["cy"] - o["ry"] - BY
        else:
            ox, oy = o["cx"] - o["rx"], o["cy"] - o["ry"]
        ET.SubElement(
            ET.SubElement(root, "mxCell", {
                "id": cid, "parent": sys_id, "value": html.escape(o["label"].replace("\n", "<br>")),
                "style": "ellipse;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontSize=12;",
                "vertex": "1",
            }), "mxGeometry",
            {"x": str(o["cx"] - o["rx"] - BX), "y": str(o["cy"] - o["ry"] - BY),
             "width": str(o["rx"] * 2), "height": str(o["ry"] * 2), "as": "geometry"},
        )

    aids: list[str] = []
    for ax, ay, label in ACTORS:
        aid = nid()
        aids.append(aid)
        ET.SubElement(
            ET.SubElement(root, "mxCell", {
                "id": aid, "parent": "1", "value": html.escape(label.replace("\n", "<br>")),
                "style": "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;",
                "vertex": "1",
            }), "mxGeometry", {"x": str(ax), "y": str(ay), "width": "30", "height": "60", "as": "geometry"},
        )

    def edge(src, dst, style, label=""):
        eid = nid()
        ET.SubElement(root, "mxCell", {
            "id": eid, "parent": "1", "value": html.escape(label), "style": style,
            "edge": "1", "source": src, "target": dst,
        })

    edge(aids[0], aids[1], STYLE_GEN)
    for idx in ADMIN_LINKS:
        edge(aids[0], cids[idx], STYLE_ASSOC)
    for idx in MEMBER_LINKS:
        edge(aids[1], cids[idx], STYLE_ASSOC)
    for idx in GUEST_LINKS:
        edge(aids[2], cids[idx], STYLE_ASSOC)
    for idx in INCLUDES_AUTH:
        edge(cids[idx], cids[I["auth"]], STYLE_DEP, "<<include>>")
    for ext_i, base_i in EXTENDS:
        edge(cids[ext_i], cids[base_i], STYLE_DEP, "<<extend>>")

    ET.indent(mxfile, space="  ")
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(mxfile, encoding="unicode")


def main():
    DOCS.mkdir(parents=True, exist_ok=True)
    DRAWIO_PATH.write_text(build_drawio(), encoding="utf-8")
    print(f"Draw.io : {DRAWIO_PATH}")

    render_tamela_png(PNG_PATH)

    im = Image.open(PNG_PATH)
    w0, h0 = im.size
    if w0 != 1920:
        im = im.resize((1920, int(h0 * 1920 / w0)), Image.Resampling.LANCZOS)
        im.save(PNG_PATH, quality=95)

    ANALYSE_PNG.parent.mkdir(parents=True, exist_ok=True)
    import shutil
    shutil.copy2(PNG_PATH, ANALYSE_PNG)
    print(f"PNG     : {PNG_PATH}")
    print(f"Copie   : {ANALYSE_PNG}")


if __name__ == "__main__":
    main()

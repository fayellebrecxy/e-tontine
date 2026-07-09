#!/usr/bin/env python3
"""
Diagramme de packages UML 2.x — E-Tontine (système complet).

Version épurée et hautement lisible :
  - Suppression des listes de classes internes pour réduire le bruit visuel.
  - Paquetages standardisés de taille uniforme.
  - Organisation en grille symétrique par couches.
  - Dépendances claires et aérées.
"""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "Docs"
PNG_PATH = DOCS / "diagramme-packages-e-tontine.png"

BLACK = (0, 0, 0)
GRAY = (100, 100, 100)
WHITE = (255, 255, 255)

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

SCALE = 2
W, H = 1600 * SCALE, 900 * SCALE


def _font(size: int, bold: bool = False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_PATH, size)


def _draw_package(
    d: ImageDraw.ImageDraw,
    x: float,
    y: float,
    stereotype: str,
    name: str,
    fonts: dict,
) -> dict:
    """Dessine un paquetage UML standardisé et fermé avec nom multi-ligne."""
    w = 220 * SCALE
    h = 72 * SCALE
    tab_h = 20 * SCALE
    tab_w = 135 * SCALE
    body_y = y + tab_h

    WRAPPED_NAMES = {
        "AuthentificationSession": "Authentification",
        "GestionMembres": "Gestion\nMembres",
        "GestionGroupes": "Gestion\nGroupes",
        "CyclesTontine": "Cycles\nTontine",
        "RubriquesCotisation": "Rubriques\nCotisation",
        "ReunionsAmendes": "Réunions\net Amendes",
        "EpargneIndividuelle": "Épargne\nIndividuelle",
        "PretsInternes": "Prêts\nInternes",
        "PaiementsMobileMoney": "Paiements\nMobile Money",
        "JournalFinancier": "Journal\nFinancier"
    }

    # Dessin des contours du paquetage (B&W)
    d.rectangle((x, body_y, x + w, y + h), outline=BLACK, fill=WHITE, width=3)
    d.rectangle((x, y, x + tab_w, y + tab_h), outline=BLACK, fill=WHITE, width=3)

    # Textes stéréotype et nom du paquetage
    d.text((x + 6 * SCALE, y + 2 * SCALE), f"«{stereotype}»", font=fonts["st"], fill=BLACK)
    
    wrapped_name = WRAPPED_NAMES.get(name, name)
    body_cy = body_y + (h - tab_h) / 2
    d.text((x + w / 2, body_cy), wrapped_name, font=fonts["name"], fill=BLACK, anchor="mm", align="center")

    cx = x + w / 2
    cy = y + tab_h + (h - tab_h) / 2
    return {
        "x": x,
        "y": y,
        "w": w,
        "h": h,
        "tab_h": tab_h,
        "cx": cx,
        "cy": cy,
        "left": x,
        "right": x + w,
        "top": body_y,
        "bottom": y + h,
    }


def _port(g: dict, side: str) -> tuple[float, float]:
    if side == "top":
        return g["cx"], g["y"]
    if side == "bottom":
        return g["cx"], g["bottom"]
    if side == "left":
        return g["left"], g["cy"]
    return g["right"], g["cy"]


def _dashed(d: ImageDraw.ImageDraw, x1, y1, x2, y2, step=9 * SCALE):
    dist = math.hypot(x2 - x1, y2 - y1)
    if dist < 1:
        return
    ux, uy = (x2 - x1) / dist, (y2 - y1) / dist
    pos, draw = 0.0, True
    while pos < dist:
        nxt = min(pos + step, dist)
        if draw:
            d.line(
                (x1 + ux * pos, y1 + uy * pos, x1 + ux * nxt, y1 + uy * nxt),
                fill=BLACK,
                width=5,
            )
        pos, draw = nxt, not draw


def _arrow_head(d: ImageDraw.ImageDraw, x, y, ang):
    s = 12 * SCALE
    # Branches de la flèche ouverte UML (en gras)
    x1 = x - s * math.cos(ang - 0.42)
    y1 = y - s * math.sin(ang - 0.42)
    x2 = x - s * math.cos(ang + 0.42)
    y2 = y - s * math.sin(ang + 0.42)
    d.line((x1, y1, x, y), fill=BLACK, width=5)
    d.line((x2, y2, x, y), fill=BLACK, width=5)


def _dep(
    d: ImageDraw.ImageDraw,
    src: dict,
    dst: dict,
    s_side: str,
    d_side: str,
    *,
    route: tuple[float, float] | None = None,
):
    """Dépendance pointillée «utilise» entre paquetages."""
    x1, y1 = _port(src, s_side)
    x2, y2 = _port(dst, d_side)
    if route:
        mx, my = route
        _dashed(d, x1, y1, mx, y1)
        _dashed(d, mx, y1, mx, y2)
        _dashed(d, mx, y2, x2, y2)
        ang = 0.0 if abs(x2 - mx) >= abs(y2 - my) else (math.pi / 2 if y2 > my else -math.pi / 2)
        if abs(x2 - mx) >= abs(y2 - my):
            ang = 0.0 if x2 > mx else math.pi
        _arrow_head(d, x2, y2, ang)
    else:
        _dashed(d, x1, y1, x2, y2)
        _arrow_head(d, x2, y2, math.atan2(y2 - y1, x2 - x1))


def _dep_multi(
    d: ImageDraw.ImageDraw,
    src: dict,
    dst: dict,
    s_side: str,
    d_side: str,
    intermediate_points: list[tuple[float, float]],
    angle: float,
):
    """Dépendance pointillée multi-segments «utilise» entre paquetages."""
    x1, y1 = _port(src, s_side)
    x2, y2 = _port(dst, d_side)
    
    prev_x, prev_y = x1, y1
    for px, py in intermediate_points:
        _dashed(d, prev_x, prev_y, px, py)
        prev_x, prev_y = px, py
    _dashed(d, prev_x, prev_y, x2, y2)
    _arrow_head(d, x2, y2, angle)


def _frame_dashed(d: ImageDraw.ImageDraw, x, y, w, h):
    step = 14 * SCALE
    line_len = 7 * SCALE
    for i in range(0, int(w), step):
        d.line((x + i, y, x + min(i + line_len, w), y), fill=GRAY, width=2)
        d.line((x + i, y + h, x + min(i + line_len, w), y + h), fill=GRAY, width=2)
    for j in range(0, int(h), step):
        d.line((x, y + j, x, y + min(j + line_len, h)), fill=GRAY, width=2)
        d.line((x + w, y + j, x + w, y + min(j + line_len, h)), fill=GRAY, width=2)


def render() -> Path:
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    fonts = {
        "title": _font(20 * SCALE, bold=True),
        "name": _font(17 * SCALE, bold=True),
        "st": _font(14 * SCALE),
    }

    # Cadre «système» (B&W)
    sx, sy, sw, sh = 40 * SCALE, 28 * SCALE, 1520 * SCALE, 840 * SCALE
    d.rectangle((sx, sy, sx + sw, sy + sh), outline=BLACK, fill=WHITE, width=3)
    d.text((sx + 12 * SCALE, sy + 10 * SCALE), "«système»", font=fonts["title"], fill=BLACK)

    # ── Couche 1 : Configuration et Accès (y=120) ──
    auth = _draw_package(d, 220 * SCALE, 120 * SCALE, "module", "AuthentificationSession", fonts)
    membres = _draw_package(d, 660 * SCALE, 120 * SCALE, "module", "GestionMembres", fonts)
    groupes = _draw_package(d, 1100 * SCALE, 120 * SCALE, "module", "GestionGroupes", fonts)

    # ── Couche 2 : Opérations Tontine (y=380) ──
    cycles = _draw_package(d, 120 * SCALE, 380 * SCALE, "module", "CyclesTontine", fonts)
    rubriques = _draw_package(d, 480 * SCALE, 380 * SCALE, "module", "RubriquesCotisation", fonts)
    reunions = _draw_package(d, 840 * SCALE, 380 * SCALE, "module", "ReunionsAmendes", fonts)
    epargne = _draw_package(d, 1200 * SCALE, 380 * SCALE, "module", "EpargneIndividuelle", fonts)

    # ── Couche 3 : Financement & Intégration (y=640) ──
    paiements = _draw_package(d, 300 * SCALE, 640 * SCALE, "module", "PaiementsMobileMoney", fonts)
    prets = _draw_package(d, 660 * SCALE, 640 * SCALE, "module", "PretsInternes", fonts)
    finances = _draw_package(d, 1020 * SCALE, 640 * SCALE, "module", "JournalFinancier", fonts)

    # ── Dépendances principales ──
    # 1. Membres -> Authentification & Groupes
    _dep(d, membres, auth, "left", "right")
    _dep(d, membres, groupes, "right", "left")

    # 2. Modules opérationnels -> GestionGroupes (dépendance de contexte)
    # Bus à y=280
    _dep_multi(d, cycles, groupes, "top", "bottom", [
        (cycles["cx"], 280 * SCALE),
        (groupes["cx"], 280 * SCALE)
    ], -math.pi / 2)
    
    _dep_multi(d, rubriques, groupes, "top", "bottom", [
        (rubriques["cx"], 280 * SCALE),
        (groupes["cx"], 280 * SCALE)
    ], -math.pi / 2)
    
    _dep_multi(d, reunions, groupes, "top", "bottom", [
        (reunions["cx"], 280 * SCALE),
        (groupes["cx"], 280 * SCALE)
    ], -math.pi / 2)
    
    _dep_multi(d, epargne, groupes, "top", "bottom", [
        (epargne["cx"], 280 * SCALE),
        (groupes["cx"], 280 * SCALE)
    ], -math.pi / 2)
    
    _dep_multi(d, prets, groupes, "top", "bottom", [
        (prets["cx"], 280 * SCALE),
        (groupes["cx"], 280 * SCALE)
    ], -math.pi / 2)

    # 3. Prêts dépendent des Épargnes et des Cycles (Garanties / Échéances)
    # Bus à y=510
    _dep_multi(d, prets, epargne, "top", "bottom", [
        (prets["cx"], 510 * SCALE),
        (epargne["cx"], 510 * SCALE)
    ], -math.pi / 2)
    
    _dep_multi(d, prets, cycles, "top", "bottom", [
        (prets["cx"], 510 * SCALE),
        (cycles["cx"], 510 * SCALE)
    ], -math.pi / 2)

    # 4. Utilisation de la passerelle de Paiements Mobile Money
    # Bus à y=540
    _dep_multi(d, cycles, paiements, "bottom", "top", [
        (cycles["cx"], 540 * SCALE),
        (paiements["cx"], 540 * SCALE)
    ], math.pi / 2)
    
    _dep_multi(d, rubriques, paiements, "bottom", "top", [
        (rubriques["cx"], 540 * SCALE),
        (paiements["cx"], 540 * SCALE)
    ], math.pi / 2)
    
    _dep_multi(d, epargne, paiements, "bottom", "top", [
        (epargne["cx"], 540 * SCALE),
        (paiements["cx"], 540 * SCALE)
    ], math.pi / 2)
    
    _dep(d, prets, paiements, "left", "right")

    # 5. Écritures dans la comptabilité (Journal Financier)
    # Bus à y=570
    _dep_multi(d, cycles, finances, "bottom", "top", [
        (cycles["cx"], 570 * SCALE),
        (finances["cx"], 570 * SCALE)
    ], math.pi / 2)
    
    _dep_multi(d, rubriques, finances, "bottom", "top", [
        (rubriques["cx"], 570 * SCALE),
        (finances["cx"], 570 * SCALE)
    ], math.pi / 2)
    
    _dep_multi(d, reunions, finances, "bottom", "top", [
        (reunions["cx"], 570 * SCALE),
        (finances["cx"], 570 * SCALE)
    ], math.pi / 2)
    
    _dep_multi(d, epargne, finances, "bottom", "top", [
        (epargne["cx"], 570 * SCALE),
        (finances["cx"], 570 * SCALE)
    ], math.pi / 2)
    
    _dep(d, prets, finances, "right", "left")

    # Sauvegarde
    DOCS.mkdir(parents=True, exist_ok=True)
    img.save(PNG_PATH, quality=95, optimize=True)
    return PNG_PATH


def main():
    print(f"PNG : {render()}")


if __name__ == "__main__":
    main()

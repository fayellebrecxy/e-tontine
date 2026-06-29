#!/usr/bin/env python3
"""
Diagramme de packages UML 2.x — E-Tontine (système complet).

Respecte :
  - Symbole paquetage (onglet + corps)
  - Stéréotypes d'architecture (<<interface>>, <<application>>, <<domaine>>, …)
  - Éléments internes publics (+) dans les paquetages ouverts
  - Dépendances pointillées <<use>> (A → B : A dépend de B)
  - Graphe acyclique (couches : interface → application → domaine → infrastructure)
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
LIGHT = (248, 249, 250)
WHITE = (255, 255, 255)

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

W, H = 1680, 1120


def _font(size: int, bold: bool = False, mono: bool = False):
    if mono:
        return ImageFont.truetype(FONT_MONO, size)
    return ImageFont.truetype(FONT_BOLD if bold else FONT_PATH, size)


def _draw_package(
    d: ImageDraw.ImageDraw,
    x: float,
    y: float,
    w: float,
    h: float,
    stereotype: str,
    name: str,
    members: list[str] | None,
    fonts: dict,
) -> dict:
    """Paquetage UML : onglet supérieur + corps ; members = éléments publics (+)."""
    tab_h = 22
    tab_w = min(max(len(name) * 7 + 24, 100), w * 0.62)
    body_y = y + tab_h

    d.rectangle((x, body_y, x + w, y + h), outline=BLACK, fill=WHITE, width=1)
    d.rectangle((x, y, x + tab_w, y + tab_h), outline=BLACK, fill=WHITE, width=1)
    d.line((x + tab_w, y, x + tab_w, y + tab_h), fill=WHITE, width=2)

    d.text((x + 6, y + 3), f"<<{stereotype}>>", font=fonts["st"], fill=GRAY)
    d.text((x + 6, body_y + 6), name, font=fonts["name"], fill=BLACK)

    ty = body_y + 26
    if members:
        for m in members:
            d.text((x + 10, ty), m, font=fonts["mem"], fill=BLACK)
            ty += 16
    elif h > 56:
        d.text((x + 10, ty), "(encapsulé)", font=fonts["st"], fill=GRAY)

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
        return g["cx"], g["top"]
    if side == "bottom":
        return g["cx"], g["bottom"]
    if side == "left":
        return g["left"], g["cy"]
    return g["right"], g["cy"]


def _dashed(d: ImageDraw.ImageDraw, x1, y1, x2, y2, step=9):
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
                fill=GRAY,
                width=1,
            )
        pos, draw = nxt, not draw


def _arrow_head(d: ImageDraw.ImageDraw, x, y, ang):
    s = 9
    d.polygon(
        [
            (x, y),
            (x - s * math.cos(ang - 0.42), y - s * math.sin(ang - 0.42)),
            (x - s * math.cos(ang + 0.42), y - s * math.sin(ang + 0.42)),
        ],
        outline=GRAY,
        fill=WHITE,
    )


def _dep(
    d: ImageDraw.ImageDraw,
    src: dict,
    dst: dict,
    s_side: str,
    d_side: str,
    *,
    route: tuple[float, float] | None = None,
    label_once: bool = False,
    fonts=None,
):
    """Dépendance : src → dst (src utilise dst)."""
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
        if label_once and fonts:
            d.text((mx + 4, (y1 + y2) / 2 - 6), "<<use>>", font=fonts["st"], fill=GRAY, anchor="lm")
    else:
        _dashed(d, x1, y1, x2, y2)
        _arrow_head(d, x2, y2, math.atan2(y2 - y1, x2 - x1))
        if label_once and fonts:
            d.text(((x1 + x2) / 2, (y1 + y2) / 2 - 8), "<<use>>", font=fonts["st"], fill=GRAY, anchor="mm")


def _frame_dashed(d: ImageDraw.ImageDraw, x, y, w, h):
    for i in range(0, int(w), 14):
        d.line((x + i, y, x + min(i + 7, w), y), fill=GRAY)
        d.line((x + i, y + h, x + min(i + 7, w), y + h), fill=GRAY)
    for j in range(0, int(h), 14):
        d.line((x, y + j, x, y + min(j + 7, h)), fill=GRAY)
        d.line((x + w, y + j, x + w, y + min(j + 7, h)), fill=GRAY)


def render() -> Path:
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    fonts = {
        "name": _font(12, bold=True),
        "mem": _font(10, mono=True),
        "st": _font(9),
    }

    # Cadre <<système>>
    sx, sy, sw, sh = 40, 28, 1600, 1060
    d.rectangle((sx, sy, sx + sw, sy + sh), outline=BLACK, fill=LIGHT, width=1)
    d.text((sx + 12, sy + 8), "<<système>> E-Tontine", font=fonts["name"], fill=BLACK)

    # ── 1. Interface ──
    ui = _draw_package(
        d, 120, 66, 300, 108,
        "interface", "InterfaceUtilisateur",
        ["+ DashboardPages", "+ ComposantsReact", "+ JoinGroupDialog"],
        fonts,
    )
    ctrl = _draw_package(
        d, 480, 66, 300, 108,
        "application", "CoucheControleurs",
        ["+ ApiRoutes", "+ ServerActions", "+ ValidationsEntrée"],
        fonts,
    )

    # ── 2. Authentification (transversal domaine) ──
    auth = _draw_package(
        d, 120, 216, 280, 96,
        "domaine", "AuthentificationSession",
        ["+ SupabaseServerClient", "+ getActiveMembership"],
        fonts,
    )

    # ── 3. Domaine métier (cadre) ──
    dx, dy, dw, dh = 430, 204, 1180, 500
    _frame_dashed(d, dx, dy, dw, dh)

    groupes = _draw_package(
        d, 450, 236, 200, 58, "domaine", "GestionGroupes", None, fonts,
    )
    cycles = _draw_package(
        d, 670, 236, 220, 112,
        "domaine", "CyclesTontine",
        ["+ CycleDistributions", "+ CyclePenalties", "+ CycleMemberDebts"],
        fonts,
    )
    rubriques = _draw_package(
        d, 910, 236, 200, 58, "domaine", "RubriquesCotisation", None, fonts,
    )
    reunions = _draw_package(
        d, 1130, 236, 200, 58, "domaine", "ReunionsAmendes", None, fonts,
    )

    epargne = _draw_package(
        d, 450, 376, 200, 58, "domaine", "EpargneIndividuelle", None, fonts,
    )
    prets = _draw_package(
        d, 670, 376, 220, 112,
        "domaine", "PretsInternes",
        ["+ PretService", "+ PretBanque", "+ PretAvalistes"],
        fonts,
    )
    paiements = _draw_package(
        d, 910, 376, 230, 112,
        "domaine", "PaiementsMobileMoney",
        ["+ PaymentProcess", "+ PaymentFinalize", "+ PaymentAmounts"],
        fonts,
    )
    finances = _draw_package(
        d, 1160, 376, 220, 112,
        "domaine", "JournalFinancier",
        ["+ FinancialJournal", "+ CaisseFinanciere", "+ MouvementFinancier"],
        fonts,
    )

    exports = _draw_package(
        d, 450, 516, 220, 96,
        "domaine", "RapportsExports",
        ["+ RapportGroupePdf", "+ RapportGroupeExcel"],
        fonts,
    )

    # ── 4. Infrastructure ──
    notif = _draw_package(
        d, 720, 736, 260, 96,
        "infrastructure", "NotificationsMetier",
        ["+ createNotification", "+ notifyGroupMembers"],
        fonts,
    )
    valid = _draw_package(
        d, 1020, 736, 260, 96,
        "transversal", "ValidationsMetier",
        ["+ SchemasZod", "+ normalizeEmail"],
        fonts,
    )
    data = _draw_package(
        d, 1320, 736, 280, 112,
        "infrastructure", "PersistanceDonnees",
        ["+ PrismaClient", "+ SchemaMetier", "+ Transactions"],
        fonts,
    )

    # ── Dépendances (acycliques) ──
    # Couche interface → application
    _dep(d, ui, ctrl, "right", "left")

    _dep(d, ctrl, auth, "left", "right", route=(400, ctrl["cy"]))
    _dep(d, ctrl, cycles, "bottom", "top", route=(ctrl["cx"], 196))
    _dep(d, ctrl, valid, "bottom", "top", route=(560, 716))

    # Paiements (hub) → autres domaines
    _dep(d, paiements, finances, "right", "left")
    _dep(d, paiements, cycles, "left", "right", route=(860, 336))
    _dep(d, paiements, rubriques, "top", "bottom", route=(1020, 356))
    _dep(d, paiements, epargne, "left", "right", route=(820, 436))
    _dep(d, paiements, prets, "left", "right")

    _dep(d, prets, finances, "right", "left", route=(1120, 426))
    _dep(d, prets, cycles, "top", "bottom", route=(780, 356))
    _dep(d, cycles, finances, "right", "left", route=(1100, 306))
    _dep(d, rubriques, finances, "bottom", "top", route=(1020, 486))
    _dep(d, reunions, finances, "bottom", "top", route=(1270, 486))
    _dep(d, exports, finances, "right", "left", route=(1150, 566))

    _dep(d, groupes, notif, "bottom", "top", route=(550, 696))
    _dep(d, cycles, notif, "bottom", "top", route=(780, 696))
    _dep(d, paiements, notif, "bottom", "top", route=(1020, 696))
    _dep(d, prets, notif, "bottom", "top", route=(880, 696))

    for pkg in [auth, groupes, cycles, rubriques, reunions, epargne, prets, paiements, finances, exports, notif]:
        _dep(d, pkg, data, "bottom", "top", route=(pkg["cx"], 711))

    DOCS.mkdir(parents=True, exist_ok=True)
    img.save(PNG_PATH, quality=95, optimize=True)
    out = img.resize((1920, int(img.height * 1920 / img.width)), Image.Resampling.LANCZOS)
    out.save(PNG_PATH, quality=95)
    return PNG_PATH


def main():
    print(f"PNG : {render()}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Modèle logique de données E-Tontine — style mémoire de référence (ERD type MySQL Workbench).
Tables PostgreSQL / Prisma avec colonnes, types et relations.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "Docs" / "cahier-implementation-diagrammes" / "modele-logique-donnees-e-tontine.png"

WHITE = (255, 255, 255)
BLACK = (30, 30, 30)
HEADER = (230, 230, 230)
HEADER_BORDER = (160, 160, 160)
ROW_ALT = (248, 248, 248)
PK_COLOR = (255, 200, 60)
FK_COLOR = (220, 80, 80)
LINE = (120, 120, 120)

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# (name, columns: list of (col_name, col_type, is_pk, is_fk))
TABLES = {
    "users": [
        ("id_user", "UUID", True, False),
        ("nom", "VARCHAR(255)", False, False),
        ("prenom", "VARCHAR(255)", False, False),
        ("email", "VARCHAR(255)", False, False),
        ("telephone", "VARCHAR(255)", False, False),
        ("date_creation", "TIMESTAMP", False, False),
        ("date_mise_a_jour", "TIMESTAMP", False, False),
    ],
    "groupes": [
        ("id_groupe", "UUID", True, False),
        ("nom", "VARCHAR(255)", False, False),
        ("description", "TEXT", False, False),
        ("devise", "VARCHAR(10)", False, False),
        ("lien_invitation", "VARCHAR(255)", False, False),
        ("date_de_creation", "TIMESTAMP", False, False),
    ],
    "membres_groupe": [
        ("id_membre_groupe", "UUID", True, False),
        ("id_user", "UUID", False, True),
        ("id_groupe", "UUID", False, True),
        ("role", "ENUM", False, False),
        ("statut_adhesion", "ENUM", False, False),
        ("date_adhesion", "TIMESTAMP", False, False),
    ],
    "cycles_tontine": [
        ("id_cycle", "UUID", True, False),
        ("id_groupe", "UUID", False, True),
        ("nom_cycle", "VARCHAR(255)", False, False),
        ("montant_cotisation", "DECIMAL(15,2)", False, False),
        ("duree_tour_de_gain", "INT", False, False),
        ("date_debut", "TIMESTAMP", False, False),
        ("date_fin", "TIMESTAMP", False, False),
    ],
    "cotisations": [
        ("id_cotisation", "UUID", True, False),
        ("id_cycle", "UUID", False, True),
        ("id_membre_groupe", "UUID", False, True),
        ("montant", "DECIMAL(15,2)", False, False),
        ("numero_tour", "INT", False, False),
        ("date_echeance", "TIMESTAMP", False, False),
    ],
    "rubriques_cotisation": [
        ("id_rubrique", "UUID", True, False),
        ("id_groupe", "UUID", False, True),
        ("nom", "VARCHAR(255)", False, False),
        ("montant_fixe", "DECIMAL(15,2)", False, False),
        ("type_rubrique", "ENUM", False, False),
        ("frequence", "ENUM", False, False),
    ],
    "comptes_epargne": [
        ("id_compte", "UUID", True, False),
        ("id_groupe", "UUID", False, True),
        ("id_membre_groupe", "UUID", False, True),
        ("numero_compte", "VARCHAR(50)", False, False),
        ("solde_actuel", "DECIMAL(15,2)", False, False),
        ("statut", "ENUM", False, False),
    ],
    "prets": [
        ("id_pret", "UUID", True, False),
        ("id_groupe", "UUID", False, True),
        ("id_emprunteur", "UUID", False, True),
        ("montant_demande", "DECIMAL(15,2)", False, False),
        ("montant_approuve", "DECIMAL(15,2)", False, False),
        ("statut", "ENUM", False, False),
        ("date_demande", "TIMESTAMP", False, False),
    ],
    "caisses_financieres": [
        ("id_caisse", "UUID", True, False),
        ("id_groupe", "UUID", False, True),
        ("type_caisse", "ENUM", False, False),
        ("solde_actuel", "DECIMAL(15,2)", False, False),
    ],
    "mouvements_financiers": [
        ("id_mouvement", "UUID", True, False),
        ("id_groupe", "UUID", False, True),
        ("id_caisse", "UUID", False, True),
        ("montant", "DECIMAL(15,2)", False, False),
        ("source", "VARCHAR(255)", False, False),
        ("solde_avant", "DECIMAL(15,2)", False, False),
        ("solde_apres", "DECIMAL(15,2)", False, False),
    ],
}

# positions (x, y) — disposition proche Workbench
LAYOUT = {
    "users": (60, 80),
    "groupes": (520, 80),
    "membres_groupe": (290, 300),
    "cycles_tontine": (860, 80),
    "cotisations": (860, 380),
    "rubriques_cotisation": (520, 380),
    "comptes_epargne": (60, 620),
    "prets": (520, 620),
    "caisses_financieres": (860, 620),
    "mouvements_financiers": (1180, 620),
}

RELATIONS = [
    ("users", "membres_groupe"),
    ("groupes", "membres_groupe"),
    ("groupes", "cycles_tontine"),
    ("groupes", "rubriques_cotisation"),
    ("groupes", "comptes_epargne"),
    ("groupes", "prets"),
    ("groupes", "caisses_financieres"),
    ("cycles_tontine", "cotisations"),
    ("membres_groupe", "cotisations"),
    ("caisses_financieres", "mouvements_financiers"),
    ("groupes", "mouvements_financiers"),
]

W_CANVAS = 1680
H_CANVAS = 980
COL_W = 300
HEADER_H = 34
ROW_H = 26
ICON = 14


def _font(size: int, bold: bool = False):
    return ImageFont.truetype(BOLD if bold else FONT, size)


def _table_height(n_rows: int) -> int:
    return HEADER_H + n_rows * ROW_H + 8


def _draw_table(d, x, y, name, columns, boxes):
    n = len(columns)
    h = _table_height(n)
    w = COL_W
    boxes[name] = (x, y, x + w, y + h)

    d.rectangle((x, y, x + w, y + h), outline=HEADER_BORDER, fill=WHITE, width=1)
    d.rectangle((x, y, x + w, y + HEADER_H), fill=HEADER, outline=HEADER_BORDER, width=1)
    d.text((x + 10, y + 8), name, font=_font(16, True), fill=BLACK)

    ty = y + HEADER_H + 4
    for i, (col, ctype, is_pk, is_fk) in enumerate(columns):
        if i % 2 == 1:
            d.rectangle((x + 1, ty - 2, x + w - 1, ty + ROW_H - 4), fill=ROW_ALT)
        ix = x + 8
        if is_pk:
            d.rectangle((ix, ty + 4, ix + ICON, ty + 4 + ICON), fill=PK_COLOR, outline=BLACK)
        elif is_fk:
            d.polygon(
                [(ix + ICON // 2, ty + 3), (ix + ICON, ty + 3 + ICON), (ix, ty + 3 + ICON)],
                fill=FK_COLOR,
                outline=BLACK,
            )
        else:
            ix += ICON + 4
        d.text((ix + (ICON + 6 if is_pk or is_fk else 0), ty + 2), col, font=_font(13), fill=BLACK)
        d.text((x + w - 8, ty + 2), ctype, font=_font(11), fill=(90, 90, 90), anchor="ra")
        ty += ROW_H


def _center(box):
    x1, y1, x2, y2 = box
    return ((x1 + x2) / 2, (y1 + y2) / 2)


def _link_tables(d, box_a, box_b):
    ax, ay = _center(box_a)
    bx, by = _center(box_b)
    d.line((ax, ay, bx, by), fill=LINE, width=2)


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (W_CANVAS, H_CANVAS), WHITE)
    d = ImageDraw.Draw(img)

    boxes = {}
    for name, (x, y) in LAYOUT.items():
        _draw_table(d, x, y, name, TABLES[name], boxes)

    for a, b in RELATIONS:
        if a in boxes and b in boxes:
            _link_tables(d, boxes[a], boxes[b])

    img.save(OUT, quality=95)
    print(f"MLD généré : {OUT}")


if __name__ == "__main__":
    main()

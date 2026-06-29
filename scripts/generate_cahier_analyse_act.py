#!/usr/bin/env python3
"""Diagrammes d'activité et de classes — cahier d'analyse (style TAMELA, Pillow)."""
from __future__ import annotations

import json
import math
from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "Docs" / "cahier-analyse-diagrammes"
OUT.mkdir(parents=True, exist_ok=True)

W = 1800
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
BG = (184, 212, 232)
RED = (229, 57, 53)

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
F = ImageFont.truetype(FONT, 26)
FB = ImageFont.truetype(BOLD, 26)
FS = ImageFont.truetype(FONT, 22)
FSB = ImageFont.truetype(BOLD, 22)

_last_y = 0


def new_canvas(h: int):
    global _last_y
    _last_y = 40
    img = Image.new("RGB", (W, h), BG)
    return img, ImageDraw.Draw(img)


def track(y: int):
    global _last_y
    _last_y = max(_last_y, y)


def centered(d, box, text, font=F, max_chars=30, fill=BLACK):
    x1, y1, x2, y2 = box
    lines = []
    for part in str(text).split("\n"):
        lines.extend(wrap(part, max_chars) or [""])
    lh = font.size + 8
    y = (y1 + y2) / 2 - (len(lines) * lh) / 2 + 5
    for line in lines:
        d.text(((x1 + x2) / 2, y), line, font=font, fill=fill, anchor="ma")
        y += lh


def rounded_box(d, box, label, max_chars=32):
    d.rounded_rectangle(box, radius=22, outline=BLACK, fill=WHITE, width=3)
    centered(d, box, label, max_chars=max_chars)
    track(box[3])


def diamond(d, cx, cy, w, h, label, fill=RED, text_fill=WHITE):
    pts = [(cx, cy - h // 2), (cx + w // 2, cy), (cx, cy + h // 2), (cx - w // 2, cy)]
    d.polygon(pts, fill=fill, outline=BLACK)
    d.line(pts + [pts[0]], fill=BLACK, width=3)
    centered(d, (cx - w // 2 + 16, cy - h // 2 + 12, cx + w // 2 - 16, cy + h // 2 - 12), label, FS, 14, text_fill)
    track(cy + h // 2)


def arrow(d, start, end, width=4, label="", label_side=0):
    x1, y1 = start
    x2, y2 = end
    if abs(x2 - x1) < 1 and abs(y2 - y1) < 1:
        return
    d.line((x1, y1, x2, y2), fill=BLACK, width=width)
    ang = math.atan2(y2 - y1, x2 - x1)
    sz = 18
    d.line((x2, y2, x2 - sz * math.cos(ang - 0.42), y2 - sz * math.sin(ang - 0.42)), fill=BLACK, width=width)
    d.line((x2, y2, x2 - sz * math.cos(ang + 0.42), y2 - sz * math.sin(ang + 0.42)), fill=BLACK, width=width)
    if label:
        d.text(((x1 + x2) / 2 + label_side, (y1 + y2) / 2 - 16), label, font=FSB, fill=BLACK, anchor="ma")


def flow(d, points, width=4):
    for i in range(len(points) - 1):
        arrow(d, points[i], points[i + 1], width=width)


def fork_bar(d, x1, x2, y):
    d.rectangle((x1, y, x2, y + 8), fill=BLACK)


def initial_node(d, cx, cy):
    d.ellipse((cx - 14, cy - 14, cx + 14, cy + 14), fill=BLACK)


def final_node(d, cx, cy):
    d.ellipse((cx - 16, cy - 16, cx + 16, cy + 16), outline=BLACK, width=3)
    d.ellipse((cx - 9, cy - 9, cx + 9, cy + 9), fill=BLACK)
    track(cy + 20)


def save(name: str, img: Image.Image):
    global _last_y
    cropped = img.crop((0, 0, W, min(img.height, _last_y + 50)))
    cropped.save(OUT / f"{name}.png", quality=95)


def act_auth():
    img, d = new_canvas(1200)
    x = W // 2
    y = 50
    initial_node(d, x, y)
    prev = (x, y + 14)
    y += 48

    arrow(d, prev, (x, y))
    box1_top = y
    rounded_box(d, (x - 360, y, x + 360, y + 90), "Saisir le login et le mot de passe")
    prev = (x, y + 90)
    y += 125

    arrow(d, prev, (x, y + 60))
    dec_y = y + 60
    diamond(d, x, dec_y, 300, 120, "Mot de passe\ncorrect ?")

    arrow(d, (x - 150, dec_y), (x - 430, dec_y), label="Non", label_side=-20)
    rounded_box(d, (x - 640, dec_y - 50, x - 220, dec_y + 50), "Afficher le message d'erreur", 22)
    flow(d, [(x - 430, dec_y - 50), (x - 430, box1_top - 16), (x, box1_top - 16), (x, box1_top)])

    yes_y = dec_y + 125
    arrow(d, (x, dec_y + 60), (x, yes_y), label="Oui", label_side=24)
    rounded_box(d, (x - 360, yes_y, x + 360, yes_y + 80), "Accéder à la page d'accueil")
    arrow(d, (x, yes_y + 80), (x, yes_y + 125))
    final_node(d, x, yes_y + 143)
    save("act-auth", img)
    return _last_y + 50


def fork_branches(d, x, bw, fork_y, branches):
    branch_y = fork_y + 42
    xs = [x - 420, x, x + 420][: len(branches)]
    branch_bottoms = []
    for bx, lbl in zip(xs, branches):
        flow(d, [(x, fork_y + 8), (bx, fork_y + 8), (bx, branch_y)])
        rounded_box(d, (bx - 155, branch_y, bx + 155, branch_y + 76), lbl, 20)
        branch_bottoms.append(branch_y + 76)
    join_y = max(branch_bottoms) + 48
    for bx, bottom in zip(xs, branch_bottoms):
        arrow(d, (bx, bottom), (bx, join_y))
    fork_bar(d, x - bw, x + bw, join_y)
    return join_y


def act_fork(name, click, listing, branches, finish):
    img, d = new_canvas(1400)
    x = W // 2
    bw = 360
    y = 50
    initial_node(d, x, y)
    prev = (x, y + 14)
    y += 48

    for step in [click, listing]:
        arrow(d, prev, (x, y))
        rounded_box(d, (x - bw, y, x + bw, y + 88), step, 30)
        prev = (x, y + 88)
        y += 118

    arrow(d, prev, (x, y))
    fork_y = y
    join_y = fork_branches(d, x, bw, fork_y, branches)
    fin_y = join_y + 42
    arrow(d, (x, join_y + 8), (x, fin_y))
    rounded_box(d, (x - bw, fin_y, x + bw, fin_y + 88), finish, 30)
    arrow(d, (x, fin_y + 88), (x, fin_y + 132))
    final_node(d, x, fin_y + 150)
    save(name, img)
    return _last_y + 50


def act_crud(name, entity, branches, final_label):
    img, d = new_canvas(1750)
    x = W // 2
    bw = 360
    y = 50
    initial_node(d, x, y)
    prev = (x, y + 14)
    y += 48

    for step in [
        f"Cliquer sur le bouton Gérer les {entity}",
        f"Afficher la liste des {entity} avec les boutons ajouter, modifier, supprimer",
    ]:
        arrow(d, prev, (x, y))
        rounded_box(d, (x - bw, y, x + bw, y + 88), step, 32)
        prev = (x, y + 88)
        y += 115

    arrow(d, prev, (x, y))
    fork_y = y
    join_y = fork_branches(d, x, bw, fork_y, branches)
    form_y = join_y + 42
    arrow(d, (x, join_y + 8), (x, form_y))
    form_top = form_y
    rounded_box(d, (x - bw, form_y, x + bw, form_y + 80), "Saisir et valider le formulaire")
    arrow(d, (x, form_y + 80), (x, form_y + 125))
    dec_y = form_y + 185
    diamond(d, x, dec_y, 300, 120, "Données\nvalides ?")

    arrow(d, (x - 150, dec_y), (x - 430, dec_y), label="Non", label_side=-20)
    rounded_box(d, (x - 640, dec_y - 50, x - 220, dec_y + 50), "Afficher le message d'erreur", 22)
    flow(d, [(x - 430, dec_y - 50), (x - 430, form_top - 16), (x, form_top - 16), (x, form_top)])

    fin_y = dec_y + 125
    arrow(d, (x, dec_y + 60), (x, fin_y), label="Oui", label_side=24)
    rounded_box(d, (x - bw, fin_y, x + bw, fin_y + 88), final_label, 30)
    arrow(d, (x, fin_y + 88), (x, fin_y + 132))
    final_node(d, x, fin_y + 150)
    save(name, img)
    return _last_y + 50


def act_decision(name, steps, question, yes_label, no_label, loop_step=None):
    img, d = new_canvas(1350)
    x = W // 2
    bw = 340
    y = 50
    initial_node(d, x, y)
    prev = (x, y + 14)
    y += 48
    tops = []

    for step in steps:
        arrow(d, prev, (x, y))
        box = (x - bw, y, x + bw, y + 82)
        rounded_box(d, box, step, 30)
        tops.append(box[1])
        prev = (x, y + 82)
        y += 110

    arrow(d, prev, (x, y + 55))
    dec_y = y + 55
    diamond(d, x, dec_y, 300, 120, question)

    arrow(d, (x - 150, dec_y), (x - 430, dec_y), label="Non", label_side=-20)
    rounded_box(d, (x - 640, dec_y - 50, x - 220, dec_y + 50), no_label, 22)
    if loop_step is not None:
        ly = tops[loop_step] - 16
        flow(d, [(x - 430, dec_y - 50), (x - 430, ly), (x, ly), (x, tops[loop_step])])
    else:
        arrow(d, (x - 430, dec_y + 50), (x - 430, dec_y + 115))
        final_node(d, x - 430, dec_y + 133)

    yes_y = dec_y + 125
    arrow(d, (x, dec_y + 60), (x, yes_y), label="Oui", label_side=24)
    rounded_box(d, (x - bw, yes_y, x + bw, yes_y + 82), yes_label, 30)
    arrow(d, (x, yes_y + 82), (x, yes_y + 125))
    final_node(d, x, yes_y + 143)
    save(name, img)
    return _last_y + 50


def class_box(d, name, box, attrs):
    x1, y1, x2, y2 = box
    d.rectangle(box, outline=BLACK, fill=WHITE, width=2)
    d.line((x1, y1 + 38, x2, y1 + 38), fill=BLACK, width=2)
    d.text(((x1 + x2) / 2, y1 + 16), name, font=FSB, fill=BLACK, anchor="ma")
    yy = y1 + 54
    for a in attrs:
        d.text((x1 + 14, yy), f"+ {a}", font=FS, fill=BLACK)
        yy += 30


def card_label(d, x, y, text, anchor="ma", pad=9):
    """Cardinalité lisible : fond blanc pour ne pas chevaucher les classes."""
    bbox = d.textbbox((x, y), text, font=FSB, anchor=anchor)
    d.rectangle((bbox[0] - pad, bbox[1] - pad, bbox[2] + pad, bbox[3] + pad), fill=WHITE, outline=BLACK, width=1)
    d.text((x, y), text, font=FSB, fill=BLACK, anchor=anchor)


def link_h(d, x1, x2, y, c1, c2, gap=65, label_y=None):
    d.line((x1, y, x2, y), fill=BLACK, width=2)
    ly = label_y if label_y is not None else y - 36
    card_label(d, x1 + gap, ly, c1)
    card_label(d, x2 - gap, ly, c2)


def link_h_below(d, b_left, b_right, c1, c2, offset=32):
    """Association horizontale sous les classes, cardinalités hors des boîtes."""
    bottom = max(b_left["b"], b_right["b"])
    y = bottom + offset
    label_y = bottom + 12
    lx, rx = b_left["r"], b_right["l"]
    d.line((lx, bottom, lx, y), fill=BLACK, width=2)
    d.line((rx, bottom, rx, y), fill=BLACK, width=2)
    link_h(d, lx, rx, y, c1, c2, label_y=label_y, gap=72)


def link_v(d, x, y1, y2, c1, c2, label_x=0, gap=None):
    d.line((x, y1, x, y2), fill=BLACK, width=2)
    span = y2 - y1
    g = gap if gap is not None else max(58, min(95, span // 5))
    card_label(d, x + label_x, y1 + g, c1)
    card_label(d, x + label_x, y2 - g, c2)


def link_elbow(d, x1, y1, x2, y2, c1, c2, bend=None, gap=52):
    if bend is None:
        bend = (y1 + y2) // 2
    d.line((x1, y1, x1, bend), fill=BLACK, width=2)
    d.line((x1, bend, x2, bend), fill=BLACK, width=2)
    d.line((x2, bend, x2, y2), fill=BLACK, width=2)
    card_label(d, x1 + gap, y1 + max(48, (bend - y1) // 2), c1)
    card_label(d, x2 - gap, y2 - max(48, (y2 - bend) // 2), c2)


def class_diagram():
    img, d = new_canvas(1120)
    specs = {
        "user": (50, 60, 270, 185),
        "membre": (400, 60, 620, 205),
        "groupe": (740, 60, 980, 185),
        "cycle": (1100, 60, 1360, 185),
        "rub": (50, 390, 290, 520),
        "epargne": (400, 390, 620, 520),
        "reunion": (740, 390, 970, 520),
        "cot": (1100, 390, 1360, 520),
        "caisse": (740, 660, 970, 780),
        "mv": (1100, 660, 1360, 780),
    }
    attrs = {
        "user": ["id_user", "nom, prenom", "email"],
        "membre": ["role", "statut_adhesion", "statut_visuel"],
        "groupe": ["id_groupe", "nom", "devise"],
        "cycle": ["montant_cotisation", "duree_tour"],
        "rub": ["nom", "montant_fixe", "type_rubrique"],
        "epargne": ["numero_compte", "solde_actuel", "statut"],
        "reunion": ["titre", "date_reunion", "montant_amende"],
        "cot": ["montant", "numero_tour", "date_echeance"],
        "caisse": ["type_caisse", "solde_actuel"],
        "mv": ["type_mouvement", "montant", "solde_apres"],
    }
    names = {
        "user": "User",
        "membre": "MembreGroupe",
        "groupe": "Groupes",
        "cycle": "CycleTontine",
        "rub": "RubriqueCotisation",
        "epargne": "CompteEpargne",
        "reunion": "Reunion",
        "cot": "Cotisations",
        "caisse": "CaisseFinanciere",
        "mv": "MouvementFinancier",
    }
    b = {}
    for k, box in specs.items():
        class_box(d, names[k], box, attrs[k])
        x1, y1, x2, y2 = box
        b[k] = {"l": x1, "r": x2, "t": y1, "b": y2, "cx": (x1 + x2) // 2, "cy": (y1 + y2) // 2}

    link_h_below(d, b["user"], b["membre"], "1", "0..*")
    link_h_below(d, b["membre"], b["groupe"], "0..*", "1")
    link_h_below(d, b["groupe"], b["cycle"], "1", "0..*")
    link_v(d, b["membre"]["cx"], b["membre"]["b"], b["epargne"]["t"], "1", "0..1", -88)
    link_elbow(d, b["groupe"]["cx"] - 85, b["groupe"]["b"], b["rub"]["cx"], b["rub"]["t"], "1", "0..*", bend=310)
    link_elbow(d, b["groupe"]["cx"] + 85, b["groupe"]["b"], b["reunion"]["cx"], b["reunion"]["t"], "1", "0..*", bend=310)
    link_v(d, b["cycle"]["cx"], b["cycle"]["b"], b["cot"]["t"], "1", "0..*")
    link_v(d, b["groupe"]["cx"], b["groupe"]["b"], b["caisse"]["t"], "1", "1..*", 88)
    link_h_below(d, b["caisse"], b["mv"], "1", "0..*")

    track(810)
    save("class-diagram", img)
    return _last_y + 50


def main():
    heights = {
        "act-auth": act_auth(),
        "act-groupe": act_crud(
            "act-groupe",
            "groupes",
            ["Ajouter un groupe", "Modifier un groupe", "Supprimer un groupe"],
            "Effectuer l'opération et retourner à l'accueil",
        ),
        "act-membres": act_crud(
            "act-membres",
            "membres",
            ["Inviter un membre", "Promouvoir un membre", "Exclure un membre"],
            "Mettre à jour la liste et notifier le membre",
        ),
        "act-cycles": act_fork(
            "act-cycles",
            "Cliquer sur le bouton Gérer les cycles",
            "Afficher la liste des cycles avec les options créer, cotiser, verser",
            ["Créer un cycle", "Enregistrer cotisation", "Verser le pot"],
            "Mettre à jour le cycle et notifier les membres",
        ),
        "act-rubriques": act_fork(
            "act-rubriques",
            "Cliquer sur le bouton Gérer les rubriques",
            "Afficher les rubriques avec les options créer, payer, retirer",
            ["Créer une rubrique", "Enregistrer paiement", "Effectuer retrait"],
            "Mettre à jour la caisse rubrique",
        ),
        "act-reunions": act_fork(
            "act-reunions",
            "Cliquer sur le bouton Gérer les réunions",
            "Afficher la liste des réunions planifiées",
            ["Planifier réunion", "Saisir présences", "Appliquer amende"],
            "Clôturer la réunion et mettre à jour la caisse amendes",
        ),
        "act-epargne": act_decision(
            "act-epargne",
            ["Accéder au module Épargne", "Choisir dépôt, retrait ou signalement"],
            "Opération valide ?",
            "Mettre à jour le solde et l'historique",
            "Afficher message d'erreur",
            1,
        ),
        "act-prets": act_decision(
            "act-prets",
            ["Soumettre ou consulter une demande de prêt", "Analyser éligibilité et avalistes"],
            "Demande valide ?",
            "Mettre à jour le statut du prêt et notifier",
            "Afficher message d'erreur",
            None,
        ),
        "act-paiements": act_decision(
            "act-paiements",
            ["Initier le paiement Mobile Money", "Attendre la confirmation de l'opérateur"],
            "Paiement réussi ?",
            "Finaliser la transaction et mettre à jour les caisses",
            "Afficher message d'échec",
            1,
        ),
        "act-finances": act_fork(
            "act-finances",
            "Cliquer sur Finances ou Rapports",
            "Afficher les caisses et le journal des mouvements",
            ["Consulter en ligne", "Exporter PDF", "Exporter Excel"],
            "Afficher ou télécharger le document",
        ),
        "class-diagram": class_diagram(),
    }
    (OUT / "heights.json").write_text(json.dumps(heights), encoding="utf-8")
    print(f"{len(heights)} diagrammes générés dans {OUT}")


if __name__ == "__main__":
    main()

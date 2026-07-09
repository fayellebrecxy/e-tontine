#!/usr/bin/env python3
"""
Génère les diagrammes UML 2.x académiques E-Tontine (PNG)
Sortie : Docs/Diagramme/
"""
from __future__ import annotations

import math
from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "Docs" / "Diagramme"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 3300, 2400
BLACK = (15, 15, 15)
WHITE = (255, 255, 255)
LIGHT = (248, 250, 252)
SYS_FILL = (245, 249, 255)

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
TITLE = ImageFont.truetype(BOLD, 60)
SUBTITLE = ImageFont.truetype(BOLD, 44)
TEXT = ImageFont.truetype(FONT, 34)
SMALL = ImageFont.truetype(FONT, 29)
SMALL_BOLD = ImageFont.truetype(BOLD, 29)
TINY = ImageFont.truetype(FONT, 24)
CLASS_TITLE_FONT = ImageFont.truetype(BOLD, 38)
CLASS_ATTR_FONT = ImageFont.truetype(FONT, 33)
CLASS_CARD_FONT = ImageFont.truetype(BOLD, 36)


def canvas(title: str):
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    d.text((W // 2, 52), title, font=TITLE, fill=BLACK, anchor="ma")
    return img, d


def centered(d, box, text, font=TEXT, max_chars=26, fill=BLACK):
    x1, y1, x2, y2 = box
    lines = []
    for part in str(text).split("\n"):
        lines.extend(wrap(part, max_chars) or [""])
    lh = font.size + 7
    total = len(lines) * lh
    y = (y1 + y2) / 2 - total / 2 + 4
    for line in lines:
        d.text(((x1 + x2) / 2, y), line, font=font, fill=fill, anchor="ma")
        y += lh


def rect(d, box, label="", font=TEXT, fill=WHITE, width=3, radius=0, max_chars=26):
    if radius:
        d.rounded_rectangle(box, radius=radius, outline=BLACK, fill=fill, width=width)
    else:
        d.rectangle(box, outline=BLACK, fill=fill, width=width)
    if label:
        centered(d, box, label, font=font, max_chars=max_chars)


def ellipse(d, box, label="", font=TEXT, width=3, max_chars=28):
    d.ellipse(box, outline=BLACK, fill=WHITE, width=width)
    if label:
        centered(d, box, label, font=font, max_chars=max_chars)


def diamond(d, cx, cy, w, h, label="", font=SMALL, max_chars=16):
    pts = [(cx, cy - h // 2), (cx + w // 2, cy), (cx, cy + h // 2), (cx - w // 2, cy)]
    d.polygon(pts, outline=BLACK, fill=WHITE)
    d.line(pts + [pts[0]], fill=BLACK, width=3)
    if label:
        centered(d, (cx - w // 2 + 14, cy - h // 2 + 10, cx + w // 2 - 14, cy + h // 2 - 10), label, font, max_chars)


def arrow(d, start, end, width=3, label="", label_offset=(0, -8)):
    x1, y1 = start
    x2, y2 = end
    d.line((x1, y1, x2, y2), fill=BLACK, width=width)
    angle = math.atan2(y2 - y1, x2 - x1)
    size = 20
    pts = [
        (x2, y2),
        (x2 - size * math.cos(angle - math.pi / 6), y2 - size * math.sin(angle - math.pi / 6)),
        (x2 - size * math.cos(angle + math.pi / 6), y2 - size * math.sin(angle + math.pi / 6)),
    ]
    d.polygon(pts, fill=BLACK)
    if label:
        mx, my = (x1 + x2) / 2 + label_offset[0], (y1 + y2) / 2 + label_offset[1]
        d.text((mx, my), label, font=SMALL_BOLD, fill=BLACK, anchor="ma")


def line(d, start, end, width=3):
    d.line((*start, *end), fill=BLACK, width=width)


def dashed_line(d, start, end, width=2, dash=16, gap=10):
    x1, y1 = start
    x2, y2 = end
    length = math.hypot(x2 - x1, y2 - y1)
    if length == 0:
        return
    dx, dy = (x2 - x1) / length, (y2 - y1) / length
    dist = 0
    while dist < length:
        seg = min(dash, length - dist)
        d.line(
            (x1 + dx * dist, y1 + dy * dist, x1 + dx * (dist + seg), y1 + dy * (dist + seg)),
            fill=BLACK,
            width=width,
        )
        dist += dash + gap


def actor(d, x, y, name):
    d.ellipse((x - 32, y, x + 32, y + 64), outline=BLACK, width=3)
    line(d, (x, y + 64), (x, y + 170))
    line(d, (x - 78, y + 100), (x + 78, y + 100))
    line(d, (x, y + 170), (x - 68, y + 260))
    line(d, (x, y + 170), (x + 68, y + 260))
    centered(d, (x - 150, y + 275, x + 150, y + 360), name, SMALL_BOLD, 16)


def association(d, start, end):
    line(d, start, end, width=2)


def fork_bar(d, x1, x2, y):
    d.rectangle((x1, y, x2, y + 8), fill=BLACK)


def initial_node(d, cx, cy):
    d.ellipse((cx - 28, cy - 28, cx + 28, cy + 28), fill=BLACK)


def final_node(d, cx, cy):
    d.ellipse((cx - 32, cy - 32, cx + 32, cy + 32), outline=BLACK, width=3)
    d.ellipse((cx - 18, cy - 18, cx + 18, cy + 18), fill=BLACK)


def save(img, name):
    img.save(OUT / name, quality=95, optimize=True)


# ─── Cas d'utilisation ───────────────────────────────────────────────────────

def use_case_diagram(title, filename, actors, cases, includes=None):
    """
    actors: list of (x, y, name)
    cases: list of (cx, cy, label)
    includes: list of ((from_idx, to_idx), stereotype) — indices in cases
    """
    includes = includes or []
    img, d = canvas(title)
    bx, by, bw, bh = 820, 210, 2280, 2050
    d.rectangle((bx, by, bx + bw, by + bh), outline=BLACK, width=3, fill=SYS_FILL)
    d.text((bx + 24, by + 18), "Systeme E-Tontine", font=SMALL_BOLD, fill=BLACK)

    for x, y, name in actors:
        actor(d, x, y, name)

    boxes = []
    for cx, cy, label in cases:
        box = (cx - 400, cy - 82, cx + 400, cy + 82)
        ellipse(d, box, label, TEXT, max_chars=30)
        boxes.append((cx, cy, box))

    for x, y, _ in actors:
        ax, ay = x + 85, y + 130
        for cx, cy, box in boxes:
            tx = box[0] if cx > ax else box[2]
            association(d, (ax, ay), (tx, cy))

    for (fi, ti), stereo in includes:
        if fi == ti:
            continue
        x1, y1, _ = boxes[fi]
        x2, y2, _ = boxes[ti]
        dashed_line(d, (x1, y1 + 70), (x2, y2 - 70), width=2)
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        d.text((mx, my - 16), stereo, font=TINY, fill=BLACK, anchor="ma")

    save(img, filename)


# ─── Activité ────────────────────────────────────────────────────────────────

def activity_vertical(title, filename, steps, decision=None):
    """steps: list of action labels; decision: (question, yes_label, no_label, loop_to_step)"""
    img, d = canvas(title)
    x = W // 2
    y = 200
    initial_node(d, x, y)
    prev = (x, y + 28)
    y += 100
    positions = []

    for step in steps:
        arrow(d, prev, (x, y))
        rect(d, (x - 440, y, x + 440, y + 105), step, radius=24)
        positions.append((x, y + 105))
        prev = (x, y + 105)
        y += 165

    if decision:
        question, yes_lbl, no_lbl, loop_idx = decision
        arrow(d, prev, (x, y))
        diamond(d, x, y + 95, 540, 210, question)
        d.text((x + 310, y + 60), "[Oui]", font=SMALL_BOLD, fill=BLACK, anchor="ma")
        d.text((x - 380, y + 60), "[Non]", font=SMALL_BOLD, fill=BLACK, anchor="ma")

        arrow(d, (x + 270, y + 95), (x + 620, y + 95))
        rect(d, (x + 620, y + 30, x + 1220, y + 160), yes_lbl, radius=24)
        merge_y = y + 380
        arrow(d, (x + 920, y + 160), (x + 920, merge_y))
        arrow(d, (x + 920, merge_y), (x, merge_y))

        arrow(d, (x - 270, y + 95), (x - 620, y + 95))
        rect(d, (x - 1220, y + 30, x - 620, y + 160), no_lbl, radius=24)
        if loop_idx is not None:
            lx, ly = positions[loop_idx]
            arrow(d, (x - 920, y + 30), (x - 440, ly - 50))
        else:
            arrow(d, (x - 920, y + 160), (x - 920, merge_y))
            arrow(d, (x - 920, merge_y), (x, merge_y))

        arrow(d, (x, merge_y), (x, merge_y + 60))
        final_node(d, x, merge_y + 60)
    else:
        arrow(d, prev, (x, y + 40))
        final_node(d, x, y + 40)

    save(img, filename)


def activity_fork(title, filename, preamble, branches, merge_label):
    img, d = canvas(title)
    x = W // 2
    y = 200
    initial_node(d, x, y)
    prev = (x, y + 28)
    y += 90

    for step in preamble:
        arrow(d, prev, (x, y))
        rect(d, (x - 440, y, x + 440, y + 100), step, radius=24)
        prev = (x, y + 100)
        y += 155

    arrow(d, prev, (x, y))
    fork_y = y
    fork_bar(d, x - 440, x + 440, fork_y)
    branch_y = fork_y + 50
    xs = [x - 520, x, x + 520] if len(branches) == 3 else [x - 350 + i * 700 for i in range(len(branches))]

    for i, (lbl, bx) in enumerate(zip(branches, xs)):
        arrow(d, (x, fork_y + 8), (bx, branch_y))
        rect(d, (bx - 200, branch_y, bx + 200, branch_y + 90), lbl, SMALL, radius=20, max_chars=22)
        arrow(d, (bx, branch_y + 90), (bx, branch_y + 160))

    join_y = branch_y + 160
    fork_bar(d, x - 440, x + 440, join_y)
    arrow(d, (x, join_y + 8), (x, join_y + 50))
    rect(d, (x - 440, join_y + 50, x + 440, join_y + 150), merge_label, radius=24)
    arrow(d, (x, join_y + 150), (x, join_y + 210))
    final_node(d, x, join_y + 210)
    save(img, filename)


def activity_crud(title, filename, entity, branches, final_label):
    img, d = canvas(title)
    x = W // 2
    y = 200
    initial_node(d, x, y)
    prev = (x, y + 28)
    y += 90

    for step in [
        f"Accéder au module {entity}",
        f"Afficher la liste des {entity}",
    ]:
        arrow(d, prev, (x, y))
        rect(d, (x - 440, y, x + 440, y + 95), step, radius=24)
        prev = (x, y + 95)
        y += 150

    arrow(d, prev, (x, y))
    fork_bar(d, x - 440, x + 440, y)
    branch_y = y + 45
    xs = [x - 520, x, x + 520]
    for lbl, bx in zip(branches, xs):
        arrow(d, (x, y + 8), (bx, branch_y))
        rect(d, (bx - 195, branch_y, bx + 195, branch_y + 85), lbl, SMALL, radius=20, max_chars=20)
        arrow(d, (bx, branch_y + 85), (bx, branch_y + 145))

    join_y = branch_y + 145
    fork_bar(d, x - 440, x + 440, join_y)
    form_y = join_y + 35
    arrow(d, (x, join_y + 8), (x, form_y))
    rect(d, (x - 440, form_y, x + 440, form_y + 95), "Saisir et valider le formulaire", radius=24)
    arrow(d, (x, form_y + 95), (x, form_y + 175))
    diamond(d, x, form_y + 265, 520, 200, "Données valides ?")
    d.text((x + 300, form_y + 230), "[Oui]", font=SMALL_BOLD, fill=BLACK, anchor="ma")
    d.text((x - 370, form_y + 230), "[Non]", font=SMALL_BOLD, fill=BLACK, anchor="ma")

    arrow(d, (x - 260, form_y + 265), (x - 620, form_y + 265))
    rect(d, (x - 1220, form_y + 200, x - 620, form_y + 330), "Afficher message d'erreur", radius=24)
    arrow(d, (x - 920, form_y + 200), (x - 440, form_y + 140))

    arrow(d, (x, form_y + 365), (x, form_y + 430), label="[Oui]")
    rect(d, (x - 440, form_y + 430, x + 440, form_y + 530), final_label, radius=24)
    arrow(d, (x, form_y + 530), (x, form_y + 590))
    final_node(d, x, form_y + 590)
    save(img, filename)


# ─── Classes ─────────────────────────────────────────────────────────────────

def class_box(d, name, box, attrs, methods=None):
    methods = methods or []
    x1, y1, x2, y2 = box
    rect(d, box, fill=WHITE)
    d.line((x1, y1 + 80, x2, y1 + 80), fill=BLACK, width=2)
    d.text(((x1 + x2) / 2, y1 + 20), name, font=CLASS_TITLE_FONT, fill=BLACK, anchor="ma")
    y = y1 + 100
    for attr in attrs:
        d.text((x1 + 22, y), attr, font=CLASS_ATTR_FONT, fill=BLACK)
        y += 52
    if methods:
        d.line((x1, y + 4, x2, y + 4), fill=BLACK, width=2)
        y += 28
        for m in methods:
            d.text((x1 + 22, y), m, font=CLASS_ATTR_FONT, fill=BLACK)
            y += 44


def class_assoc(d, p1, p2, c1, c2):
    line(d, p1, p2, 3)
    mx = (p1[0] + p2[0]) / 2
    my = (p1[1] + p2[1]) / 2 - 24
    d.text((mx, my), f"{c1}    {c2}", font=SMALL_BOLD, fill=BLACK, anchor="ma")


def draw_association_large(d, points: list[tuple[int, int]], card_start: str, card_end: str):
    # Draw segments
    for i in range(len(points) - 1):
        d.line((points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]), fill=BLACK, width=3)
    
    # Fonts for cardinalities
    f_card = CLASS_CARD_FONT
    
    # Place card_start
    p0 = points[0]
    p1 = points[1]
    if p1[0] > p0[0]:  # Right
        d.text((p0[0] + 12, p0[1] - 8), card_start, font=f_card, fill=BLACK, anchor="lb")
    elif p1[0] < p0[0]:  # Left
        d.text((p0[0] - 12, p0[1] - 8), card_start, font=f_card, fill=BLACK, anchor="rb")
    elif p1[1] > p0[1]:  # Down
        d.text((p0[0] + 12, p0[1] + 8), card_start, font=f_card, fill=BLACK, anchor="lt")
    else:  # Up
        d.text((p0[0] + 12, p0[1] - 8), card_start, font=f_card, fill=BLACK, anchor="lb")

    # Place card_end
    pn = points[-1]
    pn_1 = points[-2]
    if pn[0] > pn_1[0]:  # Right
        d.text((pn[0] - 12, pn[1] - 8), card_end, font=f_card, fill=BLACK, anchor="rb")
    elif pn[0] < pn_1[0]:  # Left
        d.text((pn[0] + 12, pn[1] - 8), card_end, font=f_card, fill=BLACK, anchor="lb")
    elif pn[1] > pn_1[1]:  # Down
        d.text((pn[0] + 12, pn[1] - 8), card_end, font=f_card, fill=BLACK, anchor="lb")
    else:  # Up
        d.text((pn[0] + 12, pn[1] + 8), card_end, font=f_card, fill=BLACK, anchor="lt")

def class_diagram_global():
    w, h = 3300, 1500
    img = Image.new("RGB", (w, h), WHITE)
    d = ImageDraw.Draw(img)

    # Cadre extérieur
    d.rectangle((15, 15, w - 15, h - 15), outline=BLACK, width=4)

    boxes = {
        "User": (120, 150, 600, 550, ["- id_user: UUID", "+ nom: String", "+ prenom: String", "- email: String", "- telephone: String"]),
        "MembreGroupe": (720, 150, 1280, 550, ["- id_membre_groupe: UUID", "- role: RoleMembre", "- statut_adhesion: StatutAdhesion", "- statut_visuel: StatutVisuel"]),
        "Groupes": (1380, 150, 1880, 550, ["- id_groupe: UUID", "+ nom: String", "+ devise: String", "- lien_invitation: String"]),
        "CycleTontine": (1980, 150, 2520, 550, ["- id_cycle: UUID", "+ montant_cotisation: Decimal", "+ duree_tour_de_gain: Int", "+ mode_penalite: ModePenalite"]),
        "Cotisations": (2620, 150, 3180, 550, ["- id_cotisation: UUID", "+ montant: Decimal", "+ numero_tour: Int", "+ date_echeance: DateTime"]),
        
        "Pret": (120, 850, 600, 1250, ["- id_pret: UUID", "+ montant: Decimal", "- statut: StatutPret", "+ taux_interet: Decimal"]),
        "CompteEpargne": (720, 850, 1280, 1250, ["- id_compte: UUID", "- numero_compte: String", "- solde_actuel: Decimal", "- statut: StatutCompteEpargne"]),
        "Reunion": (1380, 850, 1880, 1250, ["- id_reunion: UUID", "+ titre: String", "+ date_reunion: DateTime", "+ montant_amende: Decimal"]),
        "RubriqueCotisation": (1980, 850, 2520, 1250, ["- id_rubrique: UUID", "+ nom: String", "+ montant_fixe: Decimal", "+ type_rubrique: TypeRubrique"]),
        "CaisseFinanciere": (2620, 850, 3180, 1250, ["- id_caisse: UUID", "+ type_caisse: TypeCaisse", "- solde_actuel: Decimal"]),
    }

    for name, (x1, y1, x2, y2, attrs) in boxes.items():
        class_box(d, name, (x1, y1, x2, y2), attrs)

    # 1. User -> MembreGroupe
    draw_association_large(d, [(600, 280), (720, 280)], "1", "0..*")
    # 2. Groupes -> MembreGroupe
    draw_association_large(d, [(1380, 280), (1280, 280)], "1", "1..*")
    
    # 3. Groupes -> CycleTontine
    draw_association_large(d, [(1880, 280), (1980, 280)], "1", "0..*")
    
    # 4. CycleTontine -> Cotisations
    draw_association_large(d, [(2520, 280), (2620, 280)], "1", "0..*")
    
    # 5. MembreGroupe -> CompteEpargne
    draw_association_large(d, [(1000, 550), (1000, 850)], "1", "0..1")
    
    # 6. Groupes -> Reunion
    draw_association_large(d, [(1630, 550), (1630, 850)], "1", "0..*")
    
    # 7. MembreGroupe -> Pret (Orthogonal)
    draw_association_large(d, [(850, 550), (850, 660), (360, 660), (360, 850)], "1", "0..*")
    # 8. Groupes -> RubriqueCotisation (Orthogonal)
    draw_association_large(d, [(1750, 550), (1750, 660), (2250, 660), (2250, 850)], "1", "0..*")

    # 9. Groupes -> CaisseFinanciere (Orthogonal)
    draw_association_large(d, [(1830, 550), (1830, 600), (2900, 600), (2900, 850)], "1", "1..*")

    # Save to all three locations
    docs_dir = Path(__file__).resolve().parent.parent / "Docs"
    
    # 1. Docs/diagrame-de-classe-e-tontine.png
    img.save(docs_dir / "diagrame-de-classe-e-tontine.png", quality=95, optimize=True)
    print(f"Généré dans Docs : {docs_dir / 'diagrame-de-classe-e-tontine.png'}")

    # 2. Docs/diagramme de conception 2/diagramme-classes.png
    conception_dir = docs_dir / "diagramme de conception 2"
    conception_dir.mkdir(parents=True, exist_ok=True)
    img.save(conception_dir / "diagramme-classes.png", quality=95, optimize=True)
    print(f"Généré dans Conception 2 : {conception_dir / 'diagramme-classes.png'}")

    # 3. Docs/Diagramme/CLASSES-diagramme-global.png
    diagramme_dir = docs_dir / "Diagramme"
    diagramme_dir.mkdir(parents=True, exist_ok=True)
    img.save(diagramme_dir / "CLASSES-diagramme-global.png", quality=95, optimize=True)
    print(f"Généré dans Diagramme : {diagramme_dir / 'CLASSES-diagramme-global.png'}")


# ─── Modules ─────────────────────────────────────────────────────────────────

MODULES = [
    {
        "id": "01-authentification",
        "uc_title": "Diagramme de cas d'utilisation — Authentification",
        "act_title": "Diagramme d'activité — S'authentifier",
        "actors": [(260, 900, "Utilisateur\n/ Visiteur")],
        "cases": [
            (1500, 380, "S'inscrire"),
            (1500, 720, "Se connecter"),
            (1500, 1060, "Reinitialiser\nmot de passe"),
            (2300, 720, "Modifier le profil"),
            (2300, 380, "Verifier identifiants"),
        ],
        "includes": [
            ((1, 4), "<<include>>"),
            ((3, 4), "<<include>>"),
        ],
        "act": "auth",
    },
    {
        "id": "02-groupes",
        "uc_title": "Diagramme de cas d'utilisation — Gestion des groupes",
        "act_title": "Diagramme d'activité — Gérer un groupe",
        "actors": [(260, 900, "Administrateur\nde groupe")],
        "cases": [
            (1500, 420, "Créer un groupe"),
            (1500, 720, "Configurer le groupe"),
            (1500, 1020, "Supprimer le groupe"),
            (2100, 720, "Exporter un rapport"),
        ],
        "act": "crud",
        "entity": "groupes",
        "branches": ["Ajouter un groupe", "Modifier un groupe", "Supprimer un groupe"],
        "final": "Enregistrer et retourner au tableau de bord",
    },
    {
        "id": "03-membres",
        "uc_title": "Diagramme de cas d'utilisation — Membres et invitations",
        "act_title": "Diagramme d'activité — Gérer les membres",
        "actors": [(260, 750, "Administrateur"), (260, 1250, "Membre\ninvité")],
        "cases": [
            (1500, 420, "Générer invitation"),
            (1500, 720, "Rejoindre un groupe"),
            (1500, 1020, "Promouvoir membre"),
            (2100, 620, "Exclure membre"),
            (2100, 920, "Réintégrer membre"),
        ],
        "act": "crud",
        "entity": "membres",
        "branches": ["Inviter un membre", "Promouvoir un membre", "Exclure un membre"],
        "final": "Mettre à jour la liste et notifier",
    },
    {
        "id": "04-cycles",
        "uc_title": "Diagramme de cas d'utilisation — Cycles de tontine",
        "act_title": "Diagramme d'activité — Gérer un cycle",
        "actors": [(260, 850, "Administrateur"), (260, 1300, "Membre")],
        "cases": [
            (1500, 380, "Créer un cycle"),
            (1500, 680, "Enregistrer cotisation"),
            (1500, 980, "Verser le pot"),
            (2100, 530, "Gérer échange de tour"),
            (2100, 830, "Consulter cycle"),
        ],
        "act": "fork",
        "preamble": ["Accéder au module Cycles", "Afficher les cycles du groupe"],
        "branches": ["Créer un cycle", "Enregistrer cotisation", "Verser le pot"],
        "merge": "Mettre à jour le cycle et notifier les membres",
    },
    {
        "id": "05-rubriques",
        "uc_title": "Diagramme de cas d'utilisation — Rubriques de cotisation",
        "act_title": "Diagramme d'activité — Gérer les rubriques",
        "actors": [(260, 900, "Administrateur"), (260, 1400, "Membre")],
        "cases": [
            (1500, 420, "Créer une rubrique"),
            (1500, 720, "Enregistrer paiement"),
            (1500, 1020, "Effectuer un retrait"),
            (2100, 720, "Verser au pot commun"),
        ],
        "act": "fork",
        "preamble": ["Accéder au module Rubriques", "Afficher les rubriques actives"],
        "branches": ["Créer une rubrique", "Enregistrer paiement", "Effectuer retrait"],
        "merge": "Mettre à jour la caisse rubrique",
    },
    {
        "id": "06-reunions",
        "uc_title": "Diagramme de cas d'utilisation — Réunions",
        "act_title": "Diagramme d'activité — Gérer une réunion",
        "actors": [(260, 850, "Administrateur"), (260, 1300, "Membre")],
        "cases": [
            (1500, 420, "Planifier réunion"),
            (1500, 720, "Saisir présences"),
            (1500, 1020, "Appliquer amende"),
            (2100, 720, "Retirer caisse amendes"),
        ],
        "act": "vertical",
        "steps": [
            "Planifier la réunion et notifier les membres",
            "Recevoir les demandes d'excuse",
            "Enregistrer les présences",
        ],
        "decision": ("Absent ou en retard ?", "Encaisser l'amende", "Aucune amende", None),
    },
    {
        "id": "07-epargne",
        "uc_title": "Diagramme de cas d'utilisation — Épargne individuelle",
        "act_title": "Diagramme d'activité — Gérer l'épargne",
        "actors": [(260, 900, "Administrateur"), (260, 1400, "Membre")],
        "cases": [
            (1500, 420, "Ouvrir compte épargne"),
            (1500, 720, "Effectuer dépôt"),
            (1500, 1020, "Effectuer retrait"),
            (2100, 720, "Signaler mouvement"),
        ],
        "act": "vertical",
        "steps": [
            "Sélectionner le compte épargne du membre",
            "Saisir dépôt, retrait ou signalement",
        ],
        "decision": ("Opération valide ?", "Mettre à jour solde et historique", "Afficher message d'erreur", 1),
    },
    {
        "id": "08-prets",
        "uc_title": "Diagramme de cas d'utilisation — Prêts internes",
        "act_title": "Diagramme d'activité — Gérer un prêt",
        "actors": [(260, 750, "Membre"), (260, 1150, "Avaliste"), (260, 1550, "Administrateur")],
        "cases": [
            (1500, 420, "Demander un prêt"),
            (1500, 720, "Accepter garantie"),
            (1500, 1020, "Approuver prêt"),
            (2100, 620, "Décaisser prêt"),
            (2100, 920, "Rembourser prêt"),
        ],
        "act": "vertical",
        "steps": [
            "Soumettre la demande de prêt",
            "Collecter les avalistes",
            "Analyser éligibilité et banque du groupe",
        ],
        "decision": ("Demande approuvée ?", "Décaisser et notifier", "Refuser et notifier", None),
    },
    {
        "id": "09-paiements",
        "uc_title": "Diagramme de cas d'utilisation — Paiements Mobile Money",
        "act_title": "Diagramme d'activité — Effectuer un paiement",
        "actors": [(260, 850, "Membre"), (260, 1300, "Administrateur")],
        "cases": [
            (1500, 420, "Initier Mobile Money"),
            (1500, 720, "Suivre transaction"),
            (1500, 1020, "Finaliser paiement"),
        ],
        "includes": [((0, 2), "<<include>>")],
        "act": "vertical",
        "steps": [
            "Initier le paiement Mobile Money",
            "Attendre confirmation opérateur (Orange/MTN)",
        ],
        "decision": ("Paiement réussi ?", "Finaliser transaction et caisses", "Afficher échec", 1),
    },
    {
        "id": "10-finances",
        "uc_title": "Diagramme de cas d'utilisation — Finances et rapports",
        "act_title": "Diagramme d'activité — Consulter les finances",
        "actors": [(260, 900, "Membre"), (260, 1400, "Administrateur")],
        "cases": [
            (1500, 420, "Consulter caisses"),
            (1500, 720, "Consulter journal"),
            (1500, 1020, "Télécharger PDF"),
            (2100, 720, "Exporter Excel"),
        ],
        "act": "fork",
        "preamble": ["Accéder au module Finances", "Afficher caisses et journal paginé"],
        "branches": ["Consulter en ligne", "Exporter PDF", "Exporter Excel"],
        "merge": "Afficher ou télécharger le document",
    },
]


def generate_module(mod):
    mid = mod["id"]
    use_case_diagram(
        mod["uc_title"],
        f"UC-{mid}.png",
        mod["actors"],
        mod["cases"],
        mod.get("includes"),
    )

    act = mod["act"]
    if act == "auth":
        activity_vertical(
            mod["act_title"],
            f"ACT-{mid}.png",
            ["Saisir email et mot de passe", "Vérifier identifiants via Supabase Auth"],
            ("Identifiants valides ?", "Créer session et rediriger", "Afficher message d'erreur", 0),
        )
    elif act == "crud":
        activity_crud(
            mod["act_title"],
            f"ACT-{mid}.png",
            mod["entity"],
            mod["branches"],
            mod["final"],
        )
    elif act == "fork":
        activity_fork(
            mod["act_title"],
            f"ACT-{mid}.png",
            mod["preamble"],
            mod["branches"],
            mod["merge"],
        )
    elif act == "vertical":
        activity_vertical(
            mod["act_title"],
            f"ACT-{mid}.png",
            mod["steps"],
            mod.get("decision"),
        )


def main():
    for old in OUT.glob("*.png"):
        old.unlink()
    for mod in MODULES:
        generate_module(mod)
    class_diagram_global()

    readme = """# Diagrammes UML E-Tontine

Diagrammes UML 2.x au format PNG pour le mémoire de soutenance.

## Contenu

Pour chaque module fonctionnel :
- `UC-XX-*.png` — diagramme de cas d'utilisation
- `ACT-XX-*.png` — diagramme d'activité

Diagramme de classes :
- `CLASSES-diagramme-global.png`

## Modules

1. Authentification
2. Groupes
3. Membres et invitations
4. Cycles de tontine
5. Rubriques
6. Réunions
7. Épargne
8. Prêts
9. Paiements Mobile Money
10. Finances et rapports

## Régénération

```bash
python3 scripts/generate_diagramme_uml.py
```
"""
    (OUT / "README.md").write_text(readme, encoding="utf-8")
    print(f"Diagrammes générés dans {OUT}")
    print(f"  {len(list(OUT.glob('*.png')))} fichiers PNG")


if __name__ == "__main__":
    main()

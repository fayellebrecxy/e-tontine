from __future__ import annotations

import math
from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont


OUT = Path("Docs/diagrammes-academiques-e-tontine")
OUT.mkdir(parents=True, exist_ok=True)

W, H = 3300, 2300
BLACK = (20, 20, 20)
GRAY = (245, 245, 245)
WHITE = (255, 255, 255)

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

TITLE = ImageFont.truetype(BOLD, 52)
SUBTITLE = ImageFont.truetype(BOLD, 36)
TEXT = ImageFont.truetype(FONT, 30)
SMALL = ImageFont.truetype(FONT, 24)
SMALL_BOLD = ImageFont.truetype(BOLD, 24)
TINY = ImageFont.truetype(FONT, 20)


def canvas(title: str):
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    d.text((W // 2, 55), title, font=TITLE, fill=BLACK, anchor="ma")
    return img, d


def text_size(d: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont):
    box = d.textbbox((0, 0), text, font=font)
    return box[2] - box[0], box[3] - box[1]


def centered(d, box, text, font=TEXT, max_chars=24, fill=BLACK):
    x1, y1, x2, y2 = box
    lines = []
    for part in str(text).split("\n"):
        lines.extend(wrap(part, max_chars) or [""])
    line_h = font.size + 8
    total_h = len(lines) * line_h
    y = (y1 + y2) / 2 - total_h / 2 + 4
    for line in lines:
        d.text(((x1 + x2) / 2, y), line, font=font, fill=fill, anchor="ma")
        y += line_h


def rect(d, box, label="", font=TEXT, fill=WHITE, width=4, radius=0, max_chars=24):
    if radius:
        d.rounded_rectangle(box, radius=radius, outline=BLACK, fill=fill, width=width)
    else:
        d.rectangle(box, outline=BLACK, fill=fill, width=width)
    if label:
        centered(d, box, label, font=font, max_chars=max_chars)


def ellipse(d, box, label="", font=TEXT, width=4, max_chars=24):
    d.ellipse(box, outline=BLACK, fill=WHITE, width=width)
    if label:
        centered(d, box, label, font=font, max_chars=max_chars)


def diamond(d, cx, cy, w, h, label="", font=SMALL, max_chars=18):
    pts = [(cx, cy - h // 2), (cx + w // 2, cy), (cx, cy + h // 2), (cx - w // 2, cy)]
    d.polygon(pts, outline=BLACK, fill=WHITE)
    d.line(pts + [pts[0]], fill=BLACK, width=4)
    if label:
        centered(d, (cx - w // 2 + 12, cy - h // 2 + 10, cx + w // 2 - 12, cy + h // 2 - 10), label, font, max_chars)


def arrow(d, start, end, width=4):
    x1, y1 = start
    x2, y2 = end
    d.line((x1, y1, x2, y2), fill=BLACK, width=width)
    angle = math.atan2(y2 - y1, x2 - x1)
    size = 22
    pts = [
        (x2, y2),
        (x2 - size * math.cos(angle - math.pi / 6), y2 - size * math.sin(angle - math.pi / 6)),
        (x2 - size * math.cos(angle + math.pi / 6), y2 - size * math.sin(angle + math.pi / 6)),
    ]
    d.polygon(pts, fill=BLACK)


def line(d, start, end, width=4):
    d.line((*start, *end), fill=BLACK, width=width)


def dashed_line(d, start, end, width=3, dash=18, gap=12, fill=BLACK):
    x1, y1 = start
    x2, y2 = end
    length = math.hypot(x2 - x1, y2 - y1)
    if length == 0:
        return
    dx = (x2 - x1) / length
    dy = (y2 - y1) / length
    dist = 0
    while dist < length:
        seg = min(dash, length - dist)
        sx = x1 + dx * dist
        sy = y1 + dy * dist
        ex = x1 + dx * (dist + seg)
        ey = y1 + dy * (dist + seg)
        d.line((sx, sy, ex, ey), fill=fill, width=width)
        dist += dash + gap


def actor(d, x, y, name):
    d.ellipse((x - 35, y, x + 35, y + 70), outline=BLACK, width=4)
    line(d, (x, y + 70), (x, y + 185))
    line(d, (x - 85, y + 110), (x + 85, y + 110))
    line(d, (x, y + 185), (x - 75, y + 285))
    line(d, (x, y + 185), (x + 75, y + 285))
    centered(d, (x - 170, y + 300, x + 170, y + 390), name, SMALL_BOLD, 18)


def association(d, start, end):
    line(d, start, end, width=3)


def sequence_actor(d, x, y, name):
    d.ellipse((x - 26, y, x + 26, y + 52), outline=BLACK, width=4)
    line(d, (x, y + 52), (x, y + 135), 4)
    line(d, (x - 60, y + 82), (x + 60, y + 82), 4)
    line(d, (x, y + 135), (x - 52, y + 205), 4)
    line(d, (x, y + 135), (x + 52, y + 205), 4)
    centered(d, (x - 140, y + 215, x + 140, y + 285), name, SMALL_BOLD, 16)


def uml_message_arrow(d, start, end, dashed=False, width=4):
    x1, y1 = start
    x2, y2 = end
    if dashed:
        dashed_line(d, start, end, width=width)
    else:
        line(d, start, end, width=width)
    angle = math.atan2(y2 - y1, x2 - x1)
    size = 22
    left = (x2 - size * math.cos(angle - math.pi / 6), y2 - size * math.sin(angle - math.pi / 6))
    right = (x2 - size * math.cos(angle + math.pi / 6), y2 - size * math.sin(angle + math.pi / 6))
    d.line((x2, y2, *left), fill=BLACK, width=width)
    d.line((x2, y2, *right), fill=BLACK, width=width)


def save(img, name):
    img.save(OUT / name, quality=100)


def use_case_page(title: str, actor_name: str, filename: str, cases: list[str]):
    img, d = canvas(title)
    actor_x, actor_y = 260, 900
    actor(d, actor_x, actor_y, actor_name)
    d.rectangle((900, 230, 3050, 2100), outline=BLACK, width=4)
    d.text((940, 255), "Systeme E-Tontine", font=SMALL_BOLD, fill=BLACK)
    start_y = 390
    gap = 260 if len(cases) >= 7 else 300
    cx = 1920
    for i, label in enumerate(cases):
        cy = start_y + i * gap
        ellipse(d, (cx - 480, cy - 95, cx + 480, cy + 95), label, TEXT, max_chars=30)
        association(d, (actor_x + 90, actor_y + 140), (cx - 480, cy))
    save(img, filename)


def use_case_admin_groupe_cycle():
    use_case_page(
        "Diagramme de cas d'utilisation - Admin : groupe et cycle",
        "Administrateur",
        "01-cas-utilisation-admin-groupe-cycle.png",
        [
            "Creer ou modifier un groupe",
            "Generer et revoquer une invitation",
            "Gerer les membres et les roles",
            "Exclure ou reintegrer un membre",
            "Creer et modifier un cycle",
            "Definir l'ordre des beneficiaires",
            "Gerer les demandes d'echange",
        ],
    )


def use_case_admin_finances_modules():
    use_case_page(
        "Diagramme de cas d'utilisation - Admin : finances et modules",
        "Administrateur",
        "02-cas-utilisation-admin-finances-modules.png",
        [
            "Enregistrer les cotisations",
            "Collecter les penalites",
            "Verser le pot au beneficiaire",
            "Gerer les rubriques de cotisation",
            "Gerer les reunions et amendes",
            "Gerer les comptes d'epargne",
            "Exporter les rapports financiers",
        ],
    )


def use_case_membre_suivi():
    use_case_page(
        "Diagramme de cas d'utilisation - Membre : suivi tontine",
        "Membre",
        "03-cas-utilisation-membre-suivi-tontine.png",
        [
            "Consulter ses groupes",
            "Rejoindre un groupe par invitation",
            "Consulter les cycles participants",
            "Consulter ses cotisations et penalites",
            "Consulter son ordre de passage",
            "Demander un echange de tour",
        ],
    )


def use_case_membre_services():
    use_case_page(
        "Diagramme de cas d'utilisation - Membre : services",
        "Membre",
        "04-cas-utilisation-membre-services.png",
        [
            "Modifier son profil",
            "Consulter les rubriques",
            "Consulter les reunions",
            "Signaler une absence",
            "Consulter son compte epargne",
            "Signaler un mouvement epargne",
            "Lire notifications et releves",
        ],
    )


def activity_auth():
    img, d = canvas("Diagramme d'activite - Authentification")
    x = W // 2
    d.ellipse((x - 35, 220, x + 35, 290), fill=BLACK)
    arrow(d, (x, 290), (x, 380))
    rect(d, (x - 360, 380, x + 360, 510), "Saisir email et mot de passe", radius=28)
    arrow(d, (x, 510), (x, 610))
    rect(d, (x - 360, 610, x + 360, 740), "Verifier les identifiants via Supabase Auth", radius=28)
    arrow(d, (x, 740), (x, 870))
    diamond(d, x, 970, 520, 220, "Identifiants valides ?")
    d.text((x + 295, 935), "Oui", font=SMALL_BOLD, fill=BLACK)
    d.text((x - 435, 935), "Non", font=SMALL_BOLD, fill=BLACK)
    arrow(d, (x + 260, 970), (x + 620, 970))
    rect(d, (x + 620, 900, x + 1220, 1040), "Charger le profil utilisateur", radius=28)
    arrow(d, (x + 920, 1040), (x + 920, 1180))
    rect(d, (x + 560, 1180, x + 1280, 1320), "Creer la session serveur", radius=28)
    arrow(d, (x + 920, 1320), (x + 920, 1460))
    rect(d, (x + 560, 1460, x + 1280, 1600), "Rediriger vers le tableau de bord", radius=28)
    arrow(d, (x + 920, 1600), (x + 920, 1750))
    d.ellipse((x + 880, 1750, x + 960, 1830), outline=BLACK, width=4)
    d.ellipse((x + 895, 1765, x + 945, 1815), fill=BLACK)
    arrow(d, (x - 260, 970), (x - 620, 970))
    rect(d, (x - 1240, 900, x - 620, 1040), "Afficher un message d'erreur", radius=28)
    arrow(d, (x - 930, 900), (x - 360, 445))
    save(img, "05-activite-authentification.png")


def sequence_auth():
    participants = ["Utilisateur", "Interface Next.js", "Supabase Auth", "Prisma", "Base PostgreSQL"]
    messages = [
        (0, 1, "Saisir email et mot de passe"),
        (1, 2, "signInWithPassword()"),
        (2, 1, "Retour session ou erreur"),
        (1, 3, "Charger le profil users"),
        (3, 4, "SELECT users WHERE id_user"),
        (4, 3, "Profil utilisateur"),
        (3, 1, "Profil charge"),
        (1, 0, "Redirection dashboard"),
    ]
    sequence("Diagramme de sequence - S'authentifier", "06-sequence-authentification.png", participants, messages)


def activity_cycle():
    img, d = canvas("Diagramme d'activite - Gestion d'un cycle de tontine")
    x = W // 2
    steps = [
        "Creer le cycle",
        "Choisir les membres actifs",
        "Definir montant, duree et penalites",
        "Definir l'ordre des beneficiaires",
        "Enregistrer les cotisations du tour",
    ]
    y = 210
    d.ellipse((x - 35, y, x + 35, y + 70), fill=BLACK)
    prev = (x, y + 70)
    y += 130
    for step in steps:
        arrow(d, prev, (x, y))
        rect(d, (x - 430, y, x + 430, y + 105), step, radius=28)
        prev = (x, y + 105)
        y += 170
    arrow(d, prev, (x, y))
    diamond(d, x, y + 80, 520, 200, "Retard constate ?")
    d.text((x + 300, y + 45), "Oui", font=SMALL_BOLD, fill=BLACK)
    d.text((x - 350, y + 45), "Non", font=SMALL_BOLD, fill=BLACK)
    arrow(d, (x + 260, y + 80), (x + 560, y + 80))
    rect(d, (x + 560, y + 10, x + 1180, y + 150), "Calculer et collecter la penalite", radius=28)
    arrow(d, (x + 870, y + 150), (x + 870, y + 295))
    arrow(d, (x - 260, y + 80), (x - 560, y + 80))
    rect(d, (x - 1180, y + 10, x - 560, y + 150), "Mettre a jour la tresorerie", radius=28)
    arrow(d, (x - 870, y + 150), (x - 870, y + 295))
    rect(d, (x - 420, y + 295, x + 420, y + 425), "Verser le pot au beneficiaire", radius=28)
    arrow(d, (x - 870, y + 295), (x - 420, y + 360))
    arrow(d, (x + 870, y + 295), (x + 420, y + 360))
    arrow(d, (x, y + 425), (x, y + 540))
    diamond(d, x, y + 630, 560, 210, "Tous les membres servis ?")
    d.text((x + 320, y + 600), "Oui", font=SMALL_BOLD, fill=BLACK)
    d.text((x - 370, y + 600), "Non", font=SMALL_BOLD, fill=BLACK)
    arrow(d, (x + 280, y + 630), (x + 590, y + 630))
    rect(d, (x + 590, y + 560, x + 1210, y + 700), "Cloturer ou relancer le cycle", radius=28)
    arrow(d, (x + 900, y + 700), (x + 900, y + 830))
    d.ellipse((x + 860, y + 830, x + 940, y + 910), outline=BLACK, width=4)
    d.ellipse((x + 875, y + 845, x + 925, y + 895), fill=BLACK)
    line(d, (x - 280, y + 630), (x - 1220, y + 630), 4)
    line(d, (x - 1220, y + 630), (x - 1220, 1185), 4)
    arrow(d, (x - 1220, 1185), (x - 430, 1185))
    save(img, "07-activite-gestion-cycle.png")


def sequence(title, filename, participants, messages):
    img, d = canvas(title)
    n = len(participants)
    xs = [260 + i * ((W - 520) // (n - 1)) for i in range(n)]
    top = 260
    bottom = H - 180
    actor_names = {"Utilisateur", "Admin", "Membre", "Administrateur"}
    for i, (x, name) in enumerate(zip(xs, participants)):
        if i == 0 and name in actor_names:
            sequence_actor(d, x, top - 95, name)
            lifeline_start = top + 210
        else:
            rect(d, (x - 165, top, x + 165, top + 92), name, SMALL_BOLD, max_chars=15)
            lifeline_start = top + 92
        dashed_line(d, (x, lifeline_start), (x, bottom), width=3, fill=(120, 120, 120))

    y = top + 250
    for frm, to, label in messages:
        x1, x2 = xs[frm], xs[to]
        dashed = any(word in label.lower() for word in ["retour", "confirm", "valide", "chargé", "chargee", "redirection", "erreur"])
        if not dashed and to != 0:
            d.rectangle((x2 - 18, y - 22, x2 + 18, y + 86), outline=BLACK, fill=WHITE, width=3)
        uml_message_arrow(d, (x1, y), (x2, y), dashed=dashed, width=4)
        label_lines = wrap(label, 34)
        label_y = y - 54
        for line_text in label_lines:
            d.text(((x1 + x2) / 2, label_y), line_text, font=SMALL, fill=BLACK, anchor="ma")
            label_y += 30
        y += 165
    save(img, filename)


def sequence_join():
    sequence(
        "Diagramme de sequence - Rejoindre un groupe par invitation",
        "08-sequence-adhesion-invitation.png",
        ["Utilisateur", "Page invitation", "API Join", "Supabase Auth", "Base PostgreSQL", "Notifications"],
        [
            (0, 1, "Ouvrir le lien d'invitation"),
            (1, 2, "Envoyer code et profil"),
            (2, 3, "Verifier la session"),
            (2, 4, "Chercher invitation et groupe"),
            (2, 4, "Creer ou mettre a jour users"),
            (2, 4, "Creer membership MEMBRE"),
            (2, 5, "Notifier admins et membre"),
            (2, 1, "Adhesion confirmee"),
        ],
    )


def sequence_cotisation():
    sequence(
        "Diagramme de sequence - Enregistrer une cotisation",
        "09-sequence-cotisation.png",
        ["Admin", "Page cycle", "API Paiement", "Prisma", "Journal financier", "Notifications"],
        [
            (0, 1, "Choisir membre, montant et date"),
            (1, 2, "POST paiement"),
            (2, 3, "Verifier admin, cycle et participant"),
            (2, 3, "Calculer tour actif et reste a payer"),
            (2, 3, "Creer cotisation / penalite"),
            (2, 4, "Journaliser entree caisse"),
            (2, 5, "Notifier le membre"),
            (2, 1, "Paiement enregistre"),
        ],
    )


def sequence_versement():
    sequence(
        "Diagramme de sequence - Verser le pot au beneficiaire",
        "10-sequence-versement-pot.png",
        ["Admin", "Formulaire", "API Distribution", "Prisma", "Journal financier", "Notifications"],
        [
            (0, 1, "Choisir le tour"),
            (1, 2, "POST distribution"),
            (2, 3, "Verifier admin actif"),
            (2, 3, "Identifier beneficiaire"),
            (2, 3, "Calculer pot collecte"),
            (2, 3, "Creer versement"),
            (2, 4, "Journaliser sortie caisse cycle"),
            (2, 5, "Notifier membres"),
        ],
    )


def activity_reunion():
    img, d = canvas("Diagramme d'activite - Gestion d'une reunion")
    x = W // 2
    y = 230
    d.ellipse((x - 35, y, x + 35, y + 70), fill=BLACK)
    prev = (x, y + 70)
    for label in [
        "Planifier la reunion",
        "Notifier les membres",
        "Recevoir les demandes d'excuse",
        "Enregistrer les presences",
    ]:
        y += 180
        arrow(d, prev, (x, y))
        rect(d, (x - 430, y, x + 430, y + 125), label, radius=28)
        prev = (x, y + 125)
    y += 180
    arrow(d, prev, (x, y))
    diamond(d, x, y + 95, 600, 230, "Absent ou en retard ?")
    arrow(d, (x + 300, y + 95), (x + 650, y + 95))
    rect(d, (x + 650, y + 25, x + 1260, y + 165), "Encaisser l'amende", radius=28)
    arrow(d, (x + 955, y + 165), (x + 955, y + 330))
    arrow(d, (x - 300, y + 95), (x - 650, y + 95))
    rect(d, (x - 1260, y + 25, x - 650, y + 165), "Aucune amende", radius=28)
    arrow(d, (x - 955, y + 165), (x - 955, y + 330))
    rect(d, (x - 430, y + 330, x + 430, y + 470), "Cloturer la reunion", radius=28)
    arrow(d, (x + 955, y + 330), (x + 430, y + 400))
    arrow(d, (x - 955, y + 330), (x - 430, y + 400))
    arrow(d, (x, y + 470), (x, y + 620))
    d.ellipse((x - 40, y + 620, x + 40, y + 700), outline=BLACK, width=4)
    d.ellipse((x - 25, y + 635, x + 25, y + 685), fill=BLACK)
    save(img, "11-activite-reunion.png")


def sequence_epargne():
    sequence(
        "Diagramme de sequence - Operation d'epargne",
        "12-sequence-epargne.png",
        ["Admin", "Module epargne", "API Epargne", "Prisma", "Compte epargne", "Notifications"],
        [
            (0, 1, "Saisir depot ou retrait"),
            (1, 2, "POST operation"),
            (2, 3, "Verifier role ADMIN"),
            (2, 4, "Verifier compte actif"),
            (2, 4, "Calculer solde avant/apres"),
            (2, 3, "Creer mouvement epargne"),
            (2, 5, "Notifier le membre"),
            (2, 1, "Operation validee"),
        ],
    )


def activity_rubriques():
    img, d = canvas("Diagramme d'activite - Gestion d'une rubrique")
    x = W // 2
    y = 230
    d.ellipse((x - 35, y, x + 35, y + 70), fill=BLACK)
    prev = (x, y + 70)
    for label in [
        "Creer une rubrique de cotisation",
        "Choisir les membres concernes",
        "Definir montant, frequence et echeance",
        "Notifier les membres",
        "Enregistrer les paiements",
    ]:
        y += 170
        arrow(d, prev, (x, y))
        rect(d, (x - 470, y, x + 470, y + 110), label, radius=28)
        prev = (x, y + 110)
    y += 180
    arrow(d, prev, (x, y))
    diamond(d, x, y + 90, 560, 210, "Retrait necessaire ?")
    d.text((x + 320, y + 55), "Oui", font=SMALL_BOLD, fill=BLACK)
    d.text((x - 370, y + 55), "Non", font=SMALL_BOLD, fill=BLACK)
    arrow(d, (x + 280, y + 90), (x + 620, y + 90))
    rect(d, (x + 620, y + 25, x + 1240, y + 155), "Enregistrer le retrait", radius=28)
    arrow(d, (x + 930, y + 155), (x + 930, y + 320))
    arrow(d, (x - 280, y + 90), (x - 620, y + 90))
    rect(d, (x - 1240, y + 25, x - 620, y + 155), "Conserver le solde", radius=28)
    arrow(d, (x - 930, y + 155), (x - 930, y + 320))
    rect(d, (x - 470, y + 320, x + 470, y + 450), "Consulter l'historique de rubrique", radius=28)
    arrow(d, (x - 930, y + 320), (x - 470, y + 385))
    arrow(d, (x + 930, y + 320), (x + 470, y + 385))
    arrow(d, (x, y + 450), (x, y + 590))
    d.ellipse((x - 40, y + 590, x + 40, y + 670), outline=BLACK, width=4)
    d.ellipse((x - 25, y + 605, x + 25, y + 655), fill=BLACK)
    save(img, "13-activite-rubriques.png")


def sequence_rubriques():
    sequence(
        "Diagramme de sequence - Paiement d'une rubrique",
        "14-sequence-rubriques.png",
        ["Admin", "Module rubriques", "Action serveur", "Prisma", "Journal financier", "Notifications"],
        [
            (0, 1, "Selectionner rubrique et membre"),
            (1, 2, "Enregistrer paiement"),
            (2, 3, "Verifier admin actif"),
            (2, 3, "Creer PaiementRubrique"),
            (2, 4, "Journaliser entree caisse rubrique"),
            (2, 5, "Notifier le membre"),
            (2, 1, "Paiement valide"),
        ],
    )


def activity_epargne():
    img, d = canvas("Diagramme d'activite - Gestion d'un compte epargne")
    x = W // 2
    y = 230
    d.ellipse((x - 35, y, x + 35, y + 70), fill=BLACK)
    prev = (x, y + 70)
    for label in [
        "Ouvrir le compte epargne",
        "Selectionner le compte du membre",
        "Saisir depot ou retrait",
    ]:
        y += 190
        arrow(d, prev, (x, y))
        rect(d, (x - 460, y, x + 460, y + 120), label, radius=28)
        prev = (x, y + 120)
    y += 180
    arrow(d, prev, (x, y))
    diamond(d, x, y + 90, 620, 220, "Operation valide ?")
    d.text((x + 340, y + 55), "Oui", font=SMALL_BOLD, fill=BLACK)
    d.text((x - 390, y + 55), "Non", font=SMALL_BOLD, fill=BLACK)
    arrow(d, (x + 310, y + 90), (x + 640, y + 90))
    rect(d, (x + 640, y + 25, x + 1260, y + 155), "Mettre a jour le solde", radius=28)
    arrow(d, (x + 950, y + 155), (x + 950, y + 320))
    arrow(d, (x - 310, y + 90), (x - 640, y + 90))
    rect(d, (x - 1260, y + 25, x - 640, y + 155), "Afficher l'erreur", radius=28)
    arrow(d, (x - 950, y + 25), (x - 460, 810))
    rect(d, (x - 460, y + 320, x + 460, y + 450), "Historiser le mouvement", radius=28)
    arrow(d, (x + 950, y + 320), (x + 460, y + 385))
    arrow(d, (x, y + 450), (x, y + 590))
    rect(d, (x - 460, y + 590, x + 460, y + 720), "Notifier le membre", radius=28)
    arrow(d, (x, y + 720), (x, y + 860))
    d.ellipse((x - 40, y + 860, x + 40, y + 940), outline=BLACK, width=4)
    d.ellipse((x - 25, y + 875, x + 25, y + 925), fill=BLACK)
    save(img, "15-activite-epargne.png")


def draw_class_box(d, name, box, attrs):
    x1, y1, x2, y2 = box
    rect(d, box, fill=WHITE)
    d.line((x1, y1 + 62, x2, y1 + 62), fill=BLACK, width=3)
    d.text(((x1 + x2) / 2, y1 + 18), name, font=SMALL_BOLD, fill=BLACK, anchor="ma")
    y = y1 + 82
    for attr in attrs:
        d.text((x1 + 28, y), f"- {attr}", font=SMALL, fill=BLACK)
        y += 44


def class_core_diagram():
    img, d = canvas("Diagramme de classes - Noyau tontine")
    boxes = {
        "User": (100, 300, 560, 610, ["id_user", "nom", "prenom", "email", "telephone"]),
        "MembreGroupe": (760, 300, 1300, 650, ["id_membre_groupe", "role", "statut_adhesion", "statut_visuel"]),
        "Groupes": (1500, 300, 1980, 610, ["id_groupe", "nom", "description", "devise"]),
        "CycleTontine": (2200, 280, 2920, 680, ["id_cycle", "nom_cycle", "montant_cotisation", "duree_tour_de_gain", "mode_penalite"]),
        "CycleParticipant": (1260, 910, 1860, 1250, ["id_cycle_participant", "ordre", "date_ajout"]),
        "Cotisations": (2180, 920, 2760, 1260, ["id_cotisation", "montant", "numero_tour", "date_echeance"]),
        "Penalite": (2180, 1510, 2760, 1810, ["id_penalite", "motif", "montant_final"]),
        "Versement": (960, 1510, 1540, 1810, ["id_versement", "numero_tour", "montant_verse"]),
    }
    for name, (x1, y1, x2, y2, attrs) in boxes.items():
        draw_class_box(d, name, (x1, y1, x2, y2), attrs)

    def conn(a, b, p1, p2, label):
        line(d, p1, p2, 4)
        d.text(((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2 - 28), label, font=SMALL_BOLD, fill=BLACK, anchor="ma")

    conn("User", "MembreGroupe", (560, 455), (760, 455), "1      0..*")
    conn("MembreGroupe", "Groupes", (1300, 455), (1500, 455), "0..*      1")
    conn("Groupes", "CycleTontine", (1980, 455), (2200, 455), "1      0..*")
    conn("MembreGroupe", "CycleParticipant", (1030, 650), (1420, 910), "1      0..*")
    conn("CycleTontine", "CycleParticipant", (2380, 680), (1700, 910), "1      1..*")
    conn("CycleTontine", "Cotisations", (2560, 680), (2470, 920), "1      0..*")
    conn("Cotisations", "Penalite", (2470, 1260), (2470, 1510), "1      0..*")
    conn("CycleTontine", "Versement", (2200, 600), (1540, 1580), "1      0..*")
    conn("MembreGroupe", "Versement", (950, 650), (1250, 1510), "beneficiaire")
    save(img, "16-diagramme-classes-noyau-tontine.png")


def class_rubriques_diagram():
    img, d = canvas("Diagramme de classes - Rubriques de cotisation")
    boxes = {
        "Groupes": (280, 520, 820, 850, ["id_groupe", "nom", "devise"]),
        "MembreGroupe": (280, 1290, 900, 1630, ["id_membre_groupe", "role", "statut_visuel"]),
        "RubriqueCotisation": (1420, 420, 2100, 820, ["id_rubrique", "nom", "montant_fixe", "frequence"]),
        "PaiementRubrique": (1420, 1240, 2100, 1580, ["id_paiement", "montant_paye", "date_paiement"]),
    }
    for name, (x1, y1, x2, y2, attrs) in boxes.items():
        draw_class_box(d, name, (x1, y1, x2, y2), attrs)

    def conn(p1, p2, label):
        line(d, p1, p2, 4)
        d.text(((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2 - 28), label, font=SMALL_BOLD, fill=BLACK, anchor="ma")

    conn((820, 680), (1420, 620), "1      0..*")
    conn((1760, 820), (1760, 1240), "1      0..*")
    conn((900, 1460), (1420, 1410), "1      0..*")
    save(img, "17-diagramme-classes-rubriques.png")


def class_reunions_diagram():
    img, d = canvas("Diagramme de classes - Reunions et presences")
    boxes = {
        "Groupes": (280, 520, 820, 850, ["id_groupe", "nom", "devise"]),
        "MembreGroupe": (280, 1290, 900, 1630, ["id_membre_groupe", "role", "statut_visuel"]),
        "Reunion": (1420, 420, 2100, 820, ["id_reunion", "titre", "date_reunion", "montant_amende"]),
        "PresenceReunion": (1420, 1240, 2100, 1580, ["id_presence", "statut_presence", "amende_payee"]),
        "RetraitAmendeReunion": (2440, 1240, 3140, 1580, ["id_retrait_amende", "montant", "motif"]),
    }
    for name, (x1, y1, x2, y2, attrs) in boxes.items():
        draw_class_box(d, name, (x1, y1, x2, y2), attrs)

    def conn(p1, p2, label):
        line(d, p1, p2, 4)
        d.text(((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2 - 28), label, font=SMALL_BOLD, fill=BLACK, anchor="ma")

    conn((820, 680), (1420, 620), "1      0..*")
    conn((1760, 820), (1760, 1240), "1      0..*")
    conn((900, 1460), (1420, 1410), "1      0..*")
    conn((820, 760), (2440, 1410), "1      0..*")
    save(img, "18-diagramme-classes-reunions.png")


def class_epargne_finances_diagram():
    img, d = canvas("Diagramme de classes - Epargne et finances")
    boxes = {
        "Groupes": (180, 330, 700, 650, ["id_groupe", "nom", "devise"]),
        "MembreGroupe": (180, 1200, 760, 1540, ["id_membre_groupe", "role", "statut_visuel"]),
        "CompteEpargne": (1180, 330, 1780, 680, ["id_compte", "numero_compte", "solde_actuel", "statut"]),
        "MouvementEpargne": (1180, 1200, 1780, 1560, ["id_mouvement", "type_operation", "montant", "solde_apres"]),
        "SignalementEpargne": (2200, 1200, 2820, 1560, ["id_signalement", "motif", "statut"]),
        "CaisseFinanciere": (2200, 330, 2820, 700, ["id_caisse", "type_caisse", "solde_actuel"]),
        "MouvementFinancier": (2200, 1740, 2920, 2100, ["id_mouvement", "source", "montant", "solde_avant", "solde_apres"]),
    }
    for name, (x1, y1, x2, y2, attrs) in boxes.items():
        draw_class_box(d, name, (x1, y1, x2, y2), attrs)

    def conn(p1, p2, label):
        line(d, p1, p2, 4)
        d.text(((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2 - 28), label, font=SMALL_BOLD, fill=BLACK, anchor="ma")

    conn((700, 500), (1180, 500), "1      0..*")
    conn((760, 1370), (1180, 1370), "1      0..1")
    conn((1480, 680), (1480, 1200), "1      0..*")
    conn((1780, 1370), (2200, 1370), "1      0..*")
    conn((700, 610), (2200, 515), "1      0..*")
    conn((2510, 700), (2510, 1740), "1      0..*")
    save(img, "19-diagramme-classes-epargne-finances.png")


def old_class_diagram_removed():
    img, d = canvas("Diagramme de classes simplifie - E-Tontine")
    boxes = {
        "User": (160, 250, 650, 560, ["id_user", "nom", "prenom", "email", "telephone"]),
        "MembreGroupe": (840, 250, 1380, 620, ["id_membre_groupe", "role", "statut_adhesion", "statut_visuel"]),
        "Groupes": (1600, 250, 2120, 560, ["id_groupe", "nom", "description", "devise"]),
        "CycleTontine": (2350, 250, 3040, 650, ["id_cycle", "nom_cycle", "montant_cotisation", "duree_tour_de_gain", "mode_penalite"]),
        "Cotisations": (320, 900, 880, 1240, ["id_cotisation", "montant", "numero_tour", "date_echeance"]),
        "Penalite": (1060, 900, 1580, 1240, ["id_penalite", "motif", "montant_final"]),
        "Versement": (1760, 900, 2280, 1240, ["id_versement", "numero_tour", "montant_verse"]),
        "RubriqueCotisation": (2460, 900, 3120, 1260, ["id_rubrique", "nom", "montant_fixe", "frequence"]),
        "Reunion": (320, 1550, 880, 1880, ["id_reunion", "titre", "date_reunion", "montant_amende"]),
        "CompteEpargne": (1060, 1550, 1640, 1880, ["id_compte", "numero_compte", "solde_actuel", "statut"]),
        "MouvementFinancier": (1850, 1550, 2550, 1920, ["id_mouvement", "source", "montant", "solde_avant", "solde_apres"]),
    }
    for name, (x1, y1, x2, y2, attrs) in boxes.items():
        rect(d, (x1, y1, x2, y2), fill=WHITE)
        d.line((x1, y1 + 62, x2, y1 + 62), fill=BLACK, width=3)
        d.text(((x1 + x2) / 2, y1 + 18), name, font=SMALL_BOLD, fill=BLACK, anchor="ma")
        y = y1 + 82
        for attr in attrs:
            d.text((x1 + 28, y), f"- {attr}", font=SMALL, fill=BLACK)
            y += 44
    def c(a, b, label):
        ax = (boxes[a][0] + boxes[a][2]) // 2
        ay = (boxes[a][1] + boxes[a][3]) // 2
        bx = (boxes[b][0] + boxes[b][2]) // 2
        by = (boxes[b][1] + boxes[b][3]) // 2
        line(d, (ax, ay), (bx, by), 3)
        d.text(((ax + bx) / 2, (ay + by) / 2 - 18), label, font=TINY, fill=BLACK, anchor="ma")
    c("User", "MembreGroupe", "1 / 0..*")
    c("Groupes", "MembreGroupe", "1 / 0..*")
    c("Groupes", "CycleTontine", "1 / 0..*")
    c("CycleTontine", "Cotisations", "1 / 0..*")
    c("Cotisations", "Penalite", "1 / 0..*")
    c("CycleTontine", "Versement", "1 / 0..*")
    c("Groupes", "RubriqueCotisation", "1 / 0..*")
    c("Groupes", "Reunion", "1 / 0..*")
    c("MembreGroupe", "CompteEpargne", "1 / 0..1")
    c("Groupes", "MouvementFinancier", "1 / 0..*")
    save(img, "13-diagramme-classes-simplifie.png")


def mcd():
    mcd_adhesion_cycle()
    mcd_financier_cycle()
    mcd_modules()


def entity_box(d, cx, cy, name, attrs, w=560, h=310):
    x1, y1, x2, y2 = cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2
    d.rectangle((x1, y1, x2, y2), outline=BLACK, fill=WHITE, width=4)
    d.line((x1, y1 + 58, x2, y1 + 58), fill=BLACK, width=3)
    d.text((cx, y1 + 16), name, font=SMALL_BOLD, fill=BLACK, anchor="ma")
    y = y1 + 78
    for attr in attrs:
        d.text((x1 + 24, y), attr, font=SMALL, fill=BLACK)
        y += 38
    return (x1, y1, x2, y2)


def assoc_box(d, cx, cy, name, attrs=None, w=360, h=120):
    attrs = attrs or []
    if attrs:
        h = max(h, 120 + 36 * len(attrs))
    x1, y1, x2, y2 = cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2
    d.rounded_rectangle((x1, y1, x2, y2), radius=12, outline=BLACK, fill=WHITE, width=4)
    if attrs:
        d.text((cx, y1 + 26), name, font=SMALL_BOLD, fill=BLACK, anchor="ma")
        y = y1 + 72
        for attr in attrs:
            d.text((x1 + 24, y), attr, font=TINY, fill=BLACK)
            y += 32
    else:
        centered(d, (x1, y1, x2, y2), name, SMALL_BOLD, 18)
    return (x1, y1, x2, y2)


def mcd_link(d, p1, p2, card1, card2):
    line(d, p1, p2, 4)
    d.text((p1[0], p1[1] - 32), card1, font=SMALL_BOLD, fill=BLACK, anchor="ma")
    d.text((p2[0], p2[1] - 32), card2, font=SMALL_BOLD, fill=BLACK, anchor="ma")


def mcd_adhesion_cycle():
    img, d = canvas("MCD Merise - Adhesion et cycle")
    entity_box(d, 430, 520, "UTILISATEUR", ["#id_user", "nom", "prenom", "email", "telephone"])
    entity_box(d, 1660, 520, "GROUPE", ["#id_groupe", "nom", "description", "devise"])
    entity_box(d, 2890, 520, "CYCLE_TONTINE", ["#id_cycle", "nom_cycle", "montant_cotisation", "duree_tour"])

    assoc_box(d, 1045, 520, "ADHERER", ["role", "statut_adhesion", "statut_visuel"], w=430, h=190)
    mcd_link(d, (710, 520), (830, 520), "0,n", "")
    mcd_link(d, (1260, 520), (1380, 520), "", "1,n")

    assoc_box(d, 2275, 520, "ORGANISER", w=430, h=120)
    mcd_link(d, (1940, 520), (2060, 520), "1,1", "")
    mcd_link(d, (2490, 520), (2610, 520), "", "0,n")

    assoc_box(d, 1660, 1430, "PARTICIPER", ["ordre", "date_ajout"], w=430, h=170)
    line(d, (430, 675), (430, 1430), 4)
    line(d, (430, 1430), (1445, 1430), 4)
    d.text((430, 720), "0,n", font=SMALL_BOLD, fill=BLACK, anchor="ma")
    d.text((1405, 1398), "1,n", font=SMALL_BOLD, fill=BLACK, anchor="ma")
    line(d, (2890, 675), (2890, 1430), 4)
    line(d, (2890, 1430), (1875, 1430), 4)
    d.text((2890, 720), "1,1", font=SMALL_BOLD, fill=BLACK, anchor="ma")
    d.text((1915, 1398), "0,n", font=SMALL_BOLD, fill=BLACK, anchor="ma")
    save(img, "20-mcd-merise-adhesion-cycle.png")


def mcd_financier_cycle():
    img, d = canvas("MCD Merise - Cotisations et versements")
    entity_box(d, 360, 500, "MEMBRE_GROUPE", ["#id_membre_groupe", "role", "statut_visuel"])
    entity_box(d, 1640, 500, "CYCLE_TONTINE", ["#id_cycle", "nom_cycle", "montant_cotisation"])
    entity_box(d, 2900, 500, "COTISATION", ["#id_cotisation", "montant", "numero_tour", "date_echeance"])
    entity_box(d, 2900, 1470, "PENALITE", ["#id_penalite", "motif", "montant_final"])
    entity_box(d, 360, 1470, "VERSEMENT", ["#id_versement", "numero_tour", "montant_verse"])

    assoc_box(d, 1000, 500, "cotise")
    mcd_link(d, (620, 500), (2640, 500), "1,1", "0,n")
    line(d, (1640, 620), (2640, 500), 4)
    d.text((2150, 570), "recoit", font=SMALL_BOLD, fill=BLACK, anchor="ma")

    assoc_box(d, 2900, 980, "genere")
    mcd_link(d, (2900, 620), (2900, 1350), "1,1", "0,n")

    assoc_box(d, 1000, 1470, "beneficie")
    mcd_link(d, (620, 1470), (360, 620), "0,n", "1,1")
    line(d, (620, 1470), (1640, 620), 4)
    d.text((1120, 1040), "distribue", font=SMALL_BOLD, fill=BLACK, anchor="ma")
    save(img, "21-mcd-merise-cotisations-versements.png")


def mcd_modules():
    img, d = canvas("MCD Merise - Modules complementaires")
    entity_box(d, 360, 430, "GROUPE", ["#id_groupe", "nom", "devise"])
    entity_box(d, 360, 1260, "MEMBRE_GROUPE", ["#id_membre_groupe", "role", "statut_visuel"])
    entity_box(d, 1220, 430, "RUBRIQUE", ["#id_rubrique", "nom", "montant_fixe", "frequence"])
    entity_box(d, 1220, 1260, "PAIEMENT_RUBRIQUE", ["#id_paiement", "montant_paye", "date_paiement"])
    entity_box(d, 2070, 430, "REUNION", ["#id_reunion", "titre", "date_reunion", "montant_amende"])
    entity_box(d, 2070, 1260, "PRESENCE", ["#id_presence", "statut_presence", "amende_payee"])
    entity_box(d, 2900, 430, "COMPTE_EPARGNE", ["#id_compte", "numero_compte", "solde_actuel", "statut"])
    entity_box(d, 2900, 1260, "MOUVEMENT_EPARGNE", ["#id_mouvement", "type_operation", "montant", "solde_apres"])
    entity_box(d, 1650, 1870, "MOUVEMENT_FINANCIER", ["#id_mouvement", "source", "montant", "solde_avant", "solde_apres"])

    assoc_box(d, 790, 430, "definit")
    mcd_link(d, (620, 430), (960, 430), "1,1", "0,n")
    assoc_box(d, 1220, 845, "recoit")
    mcd_link(d, (1220, 550), (1220, 1140), "1,1", "0,n")
    assoc_box(d, 790, 1260, "effectue")
    mcd_link(d, (620, 1260), (960, 1260), "1,1", "0,n")

    assoc_box(d, 1645, 430, "planifie")
    mcd_link(d, (620, 500), (1810, 430), "1,1", "0,n")
    assoc_box(d, 2070, 845, "enregistre")
    mcd_link(d, (2070, 550), (2070, 1140), "1,1", "0,n")
    assoc_box(d, 1645, 1260, "concerne")
    mcd_link(d, (620, 1330), (1810, 1260), "1,1", "0,n")

    assoc_box(d, 2485, 430, "detient")
    mcd_link(d, (620, 1190), (2640, 430), "1,1", "0,1")
    assoc_box(d, 2900, 845, "historise")
    mcd_link(d, (2900, 550), (2900, 1140), "1,1", "0,n")
    assoc_box(d, 1650, 1640, "journalise")
    mcd_link(d, (620, 560), (1650, 1750), "1,1", "0,n")
    save(img, "22-mcd-merise-modules.png")


def mld():
    mld_noyau()
    mld_modules()


def mld_table(d, x, y, name, fields, w=620):
    row_h = 42
    h = 64 + row_h * len(fields)
    d.rectangle((x, y, x + w, y + h), outline=BLACK, fill=WHITE, width=4)
    d.rectangle((x, y, x + w, y + 64), outline=BLACK, fill=GRAY, width=4)
    d.text((x + w / 2, y + 18), name, font=SMALL_BOLD, fill=BLACK, anchor="ma")
    yy = y + 78
    for f in fields:
        d.text((x + 20, yy), f, font=TINY, fill=BLACK)
        yy += row_h
    return (x, y, x + w, y + h)


def polyline(d, points, width=3):
    for start, end in zip(points, points[1:]):
        line(d, start, end, width)


def mld_fk(d, points, label=""):
    polyline(d, points, 3)
    if label:
        x, y = points[len(points) // 2]
        d.text((x + 8, y - 26), label, font=TINY, fill=BLACK)


def mld_noyau():
    img, d = canvas("MLD - Noyau tontine")
    users = mld_table(d, 90, 260, "users", ["PK id_user", "nom", "prenom", "email UNIQUE", "telephone UNIQUE"])
    membres = mld_table(d, 900, 260, "membres_groupe", ["PK id_membre_groupe", "FK id_user", "FK id_groupe", "role", "statut_adhesion", "statut_visuel"])
    groupes = mld_table(d, 1710, 260, "groupes", ["PK id_groupe", "nom", "description", "devise", "lien_invitation"])
    cycles = mld_table(d, 2520, 260, "cycles_tontine", ["PK id_cycle", "FK id_groupe", "nom_cycle", "montant_cotisation", "duree_tour_de_gain", "mode_penalite"])

    participants = mld_table(d, 500, 1050, "cycles_participants", ["PK id_cycle_participant", "FK id_cycle", "FK id_membre_groupe", "ordre"])
    cotisations = mld_table(d, 1310, 1050, "cotisations", ["PK id_cotisation", "FK id_cycle", "FK id_membre_groupe", "montant", "numero_tour", "date_echeance"])
    versements = mld_table(d, 2120, 1050, "versements", ["PK id_versement", "FK id_cycle", "FK id_beneficiaire", "FK id_admin_valideur", "numero_tour", "montant_verse"])
    penalites = mld_table(d, 1310, 1720, "penalites", ["PK id_penalite", "FK id_cotisation", "FK id_membre_groupe", "motif", "montant_final"])

    mld_fk(d, [(710, 410), (900, 410)])
    mld_fk(d, [(1520, 470), (1710, 470)])
    mld_fk(d, [(2330, 410), (2520, 410)])

    mld_fk(d, [(1210, 620), (1210, 900), (810, 900), (810, 1050)])
    mld_fk(d, [(2830, 620), (2830, 900), (810, 900), (810, 1050)])

    mld_fk(d, [(1210, 620), (1210, 960), (1620, 960), (1620, 1050)])
    mld_fk(d, [(2830, 620), (2830, 960), (1620, 960), (1620, 1050)])

    mld_fk(d, [(2830, 620), (2830, 930), (2430, 930), (2430, 1050)])
    mld_fk(d, [(1210, 620), (1210, 1010), (2430, 1010), (2430, 1050)])

    mld_fk(d, [(1620, 1380), (1620, 1720)])
    mld_fk(d, [(1210, 620), (1210, 1680), (1460, 1680), (1460, 1720)])
    save(img, "23-mld-noyau-tontine.png")


def mld_modules():
    img, d = canvas("MLD - Modules complementaires")
    rubriques = mld_table(d, 70, 260, "rubriques_cotisation", ["PK id_rubrique", "FK id_groupe", "nom", "montant_fixe", "type_rubrique", "frequence"])
    paiements = mld_table(d, 880, 260, "paiements_rubrique", ["PK id_paiement", "FK id_rubrique", "FK id_membre_groupe", "montant_paye", "date_paiement"])
    reunions = mld_table(d, 1690, 260, "reunions", ["PK id_reunion", "FK id_groupe", "titre", "date_reunion", "statut", "montant_amende"])
    presences = mld_table(d, 2500, 260, "presences_reunion", ["PK id_presence", "FK id_reunion", "FK id_membre_groupe", "statut_presence", "amende_payee"])

    comptes = mld_table(d, 70, 1180, "comptes_epargne", ["PK id_compte", "FK id_groupe", "FK id_membre_groupe UNIQUE", "numero_compte", "solde_actuel", "statut"])
    mouvements = mld_table(d, 880, 1180, "mouvements_epargne", ["PK id_mouvement", "FK id_compte", "FK id_groupe", "FK id_membre_groupe", "type_operation", "montant"])
    caisses = mld_table(d, 1690, 1180, "caisses_financieres", ["PK id_caisse", "FK id_groupe", "FK id_cycle NULL", "FK id_rubrique NULL", "type_caisse", "solde_actuel"])
    mouvements_financiers = mld_table(d, 2500, 1180, "mouvements_financiers", ["PK id_mouvement", "FK id_groupe", "FK id_caisse", "source", "montant", "solde_avant", "solde_apres"])

    mld_fk(d, [(690, 430), (880, 430)])
    mld_fk(d, [(2310, 430), (2500, 430)])
    mld_fk(d, [(690, 1400), (880, 1400)])
    mld_fk(d, [(2310, 1400), (2500, 1400)])
    d.text((1650, 820), "Les champs FK rattachent chaque module au groupe et au membre actif concerne.",
           font=SMALL, fill=BLACK, anchor="ma")
    save(img, "24-mld-modules-complementaires.png")


def deployment():
    img, d = canvas("Diagramme de deploiement - E-Tontine")
    rect(d, (160, 650, 780, 1050), "Poste utilisateur\nNavigateur web", SUBTITLE, radius=20, max_chars=18)
    rect(d, (1120, 420, 2100, 1280), "Vercel\nApplication Next.js\nPages + API Routes", SUBTITLE, radius=20, max_chars=18)
    rect(d, (2480, 300, 3150, 680), "Supabase Auth\nGestion sessions", SUBTITLE, radius=20, max_chars=18)
    rect(d, (2480, 850, 3150, 1230), "Supabase PostgreSQL\nBase metier", SUBTITLE, radius=20, max_chars=18)
    rect(d, (1120, 1530, 2100, 1900), "GitHub\nDepot source", SUBTITLE, radius=20, max_chars=18)
    rect(d, (2480, 1530, 3150, 1900), "SMTP Gmail\nEmails", SUBTITLE, radius=20, max_chars=18)
    arrow(d, (780, 850), (1120, 850))
    d.text((950, 790), "HTTPS", font=SMALL_BOLD, fill=BLACK, anchor="ma")
    arrow(d, (2100, 650), (2480, 500))
    d.text((2290, 520), "Auth SSR", font=SMALL_BOLD, fill=BLACK, anchor="ma")
    arrow(d, (2100, 950), (2480, 1030))
    d.text((2290, 925), "Prisma", font=SMALL_BOLD, fill=BLACK, anchor="ma")
    arrow(d, (1610, 1530), (1610, 1280))
    d.text((1745, 1420), "Deploiement", font=SMALL_BOLD, fill=BLACK, anchor="ma")
    arrow(d, (2100, 1715), (2480, 1715))
    d.text((2290, 1660), "Notifications email", font=SMALL_BOLD, fill=BLACK, anchor="ma")
    save(img, "26-diagramme-deploiement.png")


def architecture_mvc():
    img, d = canvas("Architecture MVC adaptee - E-Tontine")
    rect(d, (230, 780, 770, 1120), "Vue\nPages Next.js\nComposants React", SUBTITLE, radius=20, max_chars=16)
    rect(d, (1380, 500, 1960, 860), "Controleur\nAPI Routes\nServer Actions", SUBTITLE, radius=20, max_chars=16)
    rect(d, (1380, 1280, 1960, 1640), "Modele\nPrisma Client\nServices metier", SUBTITLE, radius=20, max_chars=16)
    rect(d, (2480, 880, 3060, 1240), "Base de donnees\nPostgreSQL\nSupabase", SUBTITLE, radius=20, max_chars=16)
    rect(d, (2480, 360, 3060, 680), "Authentification\nSupabase Auth", SUBTITLE, radius=20, max_chars=16)
    arrow(d, (770, 920), (1380, 680))
    d.text((1070, 760), "requete utilisateur", font=SMALL_BOLD, fill=BLACK, anchor="ma")
    arrow(d, (1960, 680), (2480, 520))
    d.text((2220, 520), "session", font=SMALL_BOLD, fill=BLACK, anchor="ma")
    arrow(d, (1670, 860), (1670, 1280))
    d.text((1805, 1070), "logique metier", font=SMALL_BOLD, fill=BLACK, anchor="ma")
    arrow(d, (1960, 1460), (2480, 1060))
    d.text((2220, 1290), "requete SQL", font=SMALL_BOLD, fill=BLACK, anchor="ma")
    arrow(d, (1380, 1460), (770, 1040))
    d.text((1060, 1290), "donnees", font=SMALL_BOLD, fill=BLACK, anchor="ma")
    save(img, "25-architecture-mvc.png")


def main():
    for old in OUT.glob("*.png"):
        old.unlink()
    use_case_admin_groupe_cycle()
    use_case_admin_finances_modules()
    use_case_membre_suivi()
    use_case_membre_services()
    activity_auth()
    sequence_auth()
    activity_cycle()
    sequence_join()
    sequence_cotisation()
    sequence_versement()
    activity_reunion()
    sequence_epargne()
    activity_rubriques()
    sequence_rubriques()
    activity_epargne()
    class_core_diagram()
    class_rubriques_diagram()
    class_reunions_diagram()
    class_epargne_finances_diagram()
    mcd()
    mld()
    architecture_mvc()
    deployment()
    readme = """# Diagrammes academiques E-Tontine

Ces PNG remplacent les premiers rendus Mermaid pour l'insertion dans le memoire.
Ils suivent une presentation UML plus classique, proche du modele du memoire de reference :

- acteurs et ovales pour les cas d'utilisation ;
- noeud initial/final, actions et decisions pour les activites ;
- lignes de vie pour les sequences ;
- classes UML simplifiees et separees par domaine ;
- MCD Merise ;
- MLD ;
- architecture MVC ;
- deploiement par noeuds.

Les diagrammes sont volontairement separes et alleger pour rester lisibles dans Word.
"""
    (OUT / "README.md").write_text(readme, encoding="utf-8")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Diagrammes de séquence UML — style TAMELA avec fragments alt/opt analysés par module.
"""
from __future__ import annotations

import math
from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "Docs" / "cahier-conception-diagrammes"
OUT.mkdir(parents=True, exist_ok=True)

W = 3000
BLACK = (15, 15, 15)
WHITE = (255, 255, 255)
GRAY = (130, 130, 130)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
TITLE_F = ImageFont.truetype(BOLD, 52)
NAME_F = ImageFont.truetype(BOLD, 32)
MSG_F = ImageFont.truetype(FONT, 30)
SMALL_F = ImageFont.truetype(FONT, 24)
GUARD_F = ImageFont.truetype(BOLD, 26)

HUMANS = {
    "Utilisateur", "Admin", "Membre", "Visiteur", "Administrateur",
    "Administrateur de groupe", "Membre emprunteur",
}
MSG_GAP = 148
FRAME_PAD = 36
GUARD_H = 36
SEP_H = 44
REF_H = 78
TITLE_BOTTOM = 72
TOP = 60


def instance_label(name: str) -> str:
    """Nom d'instance UML : préfixe « : » (TAMELA)."""
    clean = name.replace("\\n", "\n").strip()
    first = clean.split("\n", 1)[0]
    if first.startswith(":"):
        return clean
    rest = clean.split("\n", 1)
    return (":" + rest[0]) + (("\n" + rest[1]) if len(rest) > 1 else "")


def centered(d, box, text, font=NAME_F, max_chars=18):
    x1, y1, x2, y2 = box
    lines = []
    for part in str(text).replace("\\n", "\n").split("\n"):
        lines.extend(wrap(part, max_chars) or [""])
    lh = font.size + 6
    y = (y1 + y2) / 2 - (len(lines) * lh) / 2 + 4
    for line in lines:
        d.text(((x1 + x2) / 2, y), line, font=font, fill=BLACK, anchor="ma")
        y += lh


def centered_underlined(d, box, text, font=NAME_F, max_chars=16):
    """Texte centré avec soulignement — notation :Instance (TAMELA)."""
    x1, y1, x2, y2 = box
    lines = []
    for part in str(text).replace("\\n", "\n").split("\n"):
        lines.extend(wrap(part, max_chars) or [""])
    lh = font.size + 8
    y = (y1 + y2) / 2 - (len(lines) * lh) / 2 + 4
    for line in lines:
        cx = (x1 + x2) / 2
        d.text((cx, y), line, font=font, fill=BLACK, anchor="ma")
        bbox = d.textbbox((cx, y), line, font=font, anchor="ma")
        d.line((bbox[0], bbox[3] + 2, bbox[2], bbox[3] + 2), fill=BLACK, width=3)
        y += lh


def dashed_line(d, start, end, width=2, dash=14, gap=10, fill=GRAY):
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
            fill=fill,
            width=width,
        )
        dist += dash + gap


def solid_line(d, start, end, width=3):
    d.line((*start, *end), fill=BLACK, width=width)


def arrow_head(d, end, angle, width=3, open_head=False):
    x2, y2 = end
    size = 18
    left = (x2 - size * math.cos(angle - math.pi / 6), y2 - size * math.sin(angle - math.pi / 6))
    right = (x2 - size * math.cos(angle + math.pi / 6), y2 - size * math.sin(angle + math.pi / 6))
    if open_head:
        d.line((x2, y2, *left), fill=BLACK, width=width)
        d.line((x2, y2, *right), fill=BLACK, width=width)
    else:
        d.polygon([(x2, y2), left, right], fill=BLACK)


def message_arrow(d, start, end, dashed=False, width=3):
    x1, y1 = start
    x2, y2 = end
    if dashed:
        length = abs(x2 - x1)
        dash, gap = 12, 8
        dist = 0
        while dist < length:
            seg = min(dash, length - dist)
            sx = x1 + (x2 - x1) * dist / length
            ex = x1 + (x2 - x1) * (dist + seg) / length
            d.line((sx, y1, ex, y1), fill=BLACK, width=width)
            dist += dash + gap
    else:
        solid_line(d, start, end, width)
    angle = math.atan2(y2 - y1, x2 - x1)
    arrow_head(d, end, angle, width, open_head=dashed)


def draw_actor(d, x, y, name):
    d.ellipse((x - 28, y, x + 28, y + 56), outline=BLACK, width=3)
    solid_line(d, (x, y + 56), (x, y + 118), 3)
    solid_line(d, (x - 55, y + 78), (x + 55, y + 78), 3)
    solid_line(d, (x, y + 118), (x - 48, y + 178), 3)
    solid_line(d, (x, y + 118), (x + 48, y + 178), 3)
    centered(d, (x - 150, y + 188, x + 150, y + 260), name, NAME_F, 16)


def draw_object(d, x, y, name):
    label = instance_label(name)
    lines = label.split("\n")
    bh = max(68, 24 + len(lines) * 28)
    bw = 210
    box = (x - bw // 2, y, x + bw // 2, y + bh)
    d.rectangle(box, outline=BLACK, width=3, fill=WHITE)
    centered_underlined(d, box, "\n".join(lines), NAME_F, 14)
    return y + bh


def draw_ref_frame(d, x, top, w, h, label="S'authentifier"):
    """Fragment ref TAMELA : cadre sur les lifelines + onglet ref + libellé du cas référencé."""
    d.rectangle((x, top, x + w, top + h), outline=BLACK, width=3, fill=WHITE)
    draw_fragment_tab(d, x, top, "ref")
    d.text((x + 118, top + 28), label, font=GUARD_F, fill=BLACK)


def draw_fragment_tab(d, x, y, kind: str):
    """Onglet ref / alt / opt — style TAMELA."""
    w = 130 if kind == "alt" else 100
    pts = [(x, y + 40), (x + w, y + 40), (x + w + 28, y + 20), (x + w + 28, y), (x, y)]
    d.polygon(pts, outline=BLACK, fill=WHITE)
    d.line(pts + [pts[0]], fill=BLACK, width=2)
    d.text((x + w / 2, y + 12), kind, font=SMALL_F, fill=BLACK, anchor="ma")


def is_return_message(frm, to, label):
    if to < frm:
        return True
    low = label.lower()
    patterns = (
        "retour ", "réponse", "reponse", "erreur", "session ok", "échec", "echec",
        "profil utilisateur", "profil chargé", "profil charge", "groupe créé",
        "données persistées", "invitation valide", "compte actif", "banque et garanties",
        "données financières", "adhésion confirmée", "confirmation affichée",
        "opération validée", "demande enregistrée", "paiement enregistré",
        "téléchargement", "statut affiché", "redirection vers", "tour actif",
        "rubrique et membre", "présence enregistrée", "amende appliquée",
        "message d'erreur", "accès refusé", "code invalide", "données invalides",
        "solde insuffisant", "prêt refusé", "prêt approuvé", "caisse mise à jour",
        "session établie", "session valide", "groupe créé", "enregistrée", "enregistré",
        "mis à jour", "confirmée", "confirmation", "finalisée", "valides", "succès",
        "success", "refus", "échec", "introuvable", "invalides", "motif", "journal",
        "soldes", "relevé", "téléchargement", "profil trouvé", "invitation trouvée",
        "rubrique valide", "compte disponible", "transaction validée", "données financières",
        "fichier prêt", "paiement confirmé", "demande enregistrée", "amende enregistrée",
    )
    return any(p in low for p in patterns)


def count_messages(spec) -> int:
    if isinstance(spec, list):
        return len(spec)
    total = len(spec.get("preamble", []))
    if "alt" in spec:
        ops = spec["alt"]["operands"]
        total += sum(len(m) for _, m in ops)
        total += len(ops)  # guards
        total += max(0, len(ops) - 1) * 2  # séparateurs
    if "opt" in spec:
        total += len(spec["opt"]["messages"]) + 1
    total += len(spec.get("postamble", []))
    return total


def _collect_messages(msgs, y_start, act_spans, msg_data, extend_act):
    y_cur = y_start
    for frm, to, label in msgs:
        dashed = is_return_message(frm, to, label)
        if not dashed:
            extend_act(to, y_cur - 8, y_cur + MSG_GAP - 44)
            extend_act(frm, y_cur - 8, y_cur + 22)
        msg_data.append((frm, to, label, dashed, y_cur))
        y_cur += MSG_GAP
    return y_cur


def sequence_diagram(title, filename, participants, spec, show_ref=False):
    n = len(participants)
    xs = [220 + i * ((W - 440) // (n - 1)) for i in range(n)]
    top = TOP

    # ── Pass 1 : mise en page (positions Y) ──────────────────────────────────
    act_spans: dict[int, list[list[int]]] = {i: [] for i in range(n)}
    msg_data: list[tuple] = []
    frames: list[tuple] = []  # (kind, x, top, bottom, extras)

    def extend_act(idx, y0, y1):
        if not act_spans[idx]:
            act_spans[idx].append([y0, y1])
        else:
            last = act_spans[idx][-1]
            if y0 <= last[1] + 40:
                last[1] = max(last[1], y1)
            else:
                act_spans[idx].append([y0, y1])

    y = top + 270
    frame_x, frame_w = 90, W - 180
    ref_frame = None

    if show_ref:
        ref_frame = (frame_x, y, frame_w, REF_H)
        y += REF_H + 36

    if isinstance(spec, list):
        y = _collect_messages(spec, y, act_spans, msg_data, extend_act)
    else:
        y = _collect_messages(spec.get("preamble", []), y, act_spans, msg_data, extend_act)

        if "alt" in spec:
            frame_top = y + 8
            y_inner = frame_top + FRAME_PAD + 24
            guard_ys = []
            for idx, (guard, op_msgs) in enumerate(spec["alt"]["operands"]):
                if idx > 0:
                    y_inner += SEP_H
                guard_ys.append((guard, y_inner))
                y_inner += GUARD_H
                y_inner = _collect_messages(op_msgs, y_inner, act_spans, msg_data, extend_act)
            frame_bottom = y_inner + FRAME_PAD
            frames.append(("alt", frame_x, frame_top, frame_bottom, guard_ys))
            y = frame_bottom + 28

        if "opt" in spec:
            opt = spec["opt"]
            frame_top = y + 8
            y_inner = frame_top + FRAME_PAD + 24
            y_inner = _collect_messages(opt["messages"], y_inner, act_spans, msg_data, extend_act)
            frame_bottom = y_inner + FRAME_PAD
            frames.append(("opt", frame_x, frame_top, frame_bottom, opt.get("guard", "[option]")))
            y = frame_bottom + 28

        y = _collect_messages(spec.get("postamble", []), y, act_spans, msg_data, extend_act)

    h = y + 120 + TITLE_BOTTOM
    for _, _, _, fbot, _ in frames:
        h = max(h, fbot + 80 + TITLE_BOTTOM)
    h = max(h, top + 300 + count_messages(spec) * MSG_GAP + TITLE_BOTTOM)

    # ── Pass 2 : dessin ──────────────────────────────────────────────────────
    img = Image.new("RGB", (W, h), WHITE)
    d = ImageDraw.Draw(img)

    life_end = h - TITLE_BOTTOM - 24

    for i, name in enumerate(participants):
        x = xs[i]
        base = name.lstrip(":").split("\n")[0].split()[0]
        is_human = i == 0 or base in HUMANS or name.lstrip(":").split()[0] in HUMANS
        if is_human and i == 0:
            draw_actor(d, x, top, name.replace("\n", " ").lstrip(":"))
            life_start_i = top + 250
        else:
            life_start_i = draw_object(d, x, top, name) + 18
        dashed_line(d, (x, life_start_i), (x, life_end), width=2)

    if ref_frame:
        fx, ftop, fw, fh = ref_frame
        draw_ref_frame(d, fx, ftop, fw, fh)

    for kind, fx, ftop, fbot, extra in frames:
        d.rectangle((fx, ftop, fx + frame_w, fbot), outline=BLACK, width=3)
        draw_fragment_tab(d, fx, ftop, kind)
        if kind == "alt":
            for idx, (guard, gy) in enumerate(extra):
                d.text((fx + 24, gy), guard, font=GUARD_F, fill=BLACK)
                if idx > 0:
                    sep_y = gy - 12
                    dashed_line(
                        d, (fx + 16, sep_y), (fx + frame_w - 16, sep_y),
                        width=2, fill=BLACK, dash=10, gap=8,
                    )
        elif kind == "opt":
            d.text((fx + 150, ftop + 16), extra, font=GUARD_F, fill=BLACK)

    bar_half = 14
    for i, spans in act_spans.items():
        x = xs[i]
        for y0, y1 in spans:
            d.rectangle((x - bar_half, y0, x + bar_half, y1), outline=BLACK, width=2, fill=WHITE)

    for frm, to, label, dashed, my in msg_data:
        x1, x2 = xs[frm], xs[to]
        message_arrow(d, (x1, my), (x2, my), dashed=dashed)
        lines = wrap(label, 28)
        lh = MSG_F.size + 6
        ly = my - 14 - len(lines) * lh
        for line in lines:
            d.text(((x1 + x2) / 2, ly), line, font=MSG_F, fill=BLACK, anchor="ma")
            ly += lh

    d.text((W // 2, h - TITLE_BOTTOM // 2 + 8), title, font=TITLE_F, fill=BLACK, anchor="ma")

    img.save(OUT / filename, quality=95)


# ─── Spécifications par module (alt/opt selon analyse métier du code) ────────
#
# alt  = branches mutuellement exclusives (succès/échec, valide/invalide)
# opt  = action optionnelle (peut ne pas être exécutée)
# linéaire seul = flux sans alternative métier significative

SEQUENCES = [
    # Auth : signInWithPassword réussit ou échoue (app/auth/actions.ts)
    (
        "Diagramme de séquence — S'authentifier",
        "seq-auth.png",
        ["Utilisateur", "Interface", "SupabaseAuth", "Prisma", "BaseDonnees"],
        {
            "preamble": [
                (0, 1, "Saisir email et mot de passe"),
                (1, 2, "signInWithPassword()"),
            ],
            "alt": {
                "operands": [
                    (
                        "[identifiants valides]",
                        [
                            (2, 1, "Session créée"),
                            (1, 3, "Charger le profil User"),
                            (3, 4, "SELECT users WHERE id_user"),
                            (4, 3, "Profil utilisateur"),
                            (1, 0, "Redirection vers le tableau de bord"),
                        ],
                    ),
                    (
                        "[identifiants invalides]",
                        [
                            (2, 1, "Erreur d'authentification"),
                            (1, 0, "Afficher message d'erreur"),
                        ],
                    ),
                ],
            },
        },
        True,
    ),
    # Groupes : validation Zod + unicité (app/api/groups/route.ts)
    (
        "Diagramme de séquence — Créer un groupe",
        "seq-groupes.png",
        ["Admin", "Dashboard", "APIGroups", "Prisma", "BaseDonnees"],
        {
            "preamble": [
                (0, 1, "Remplir le formulaire de création"),
                (1, 2, "POST /api/groups"),
                (2, 3, "Vérifier session et valider (Zod)"),
            ],
            "alt": {
                "operands": [
                    (
                        "[données valides]",
                        [
                            (3, 4, "INSERT groupes et membre ADMIN"),
                            (4, 3, "Groupe créé"),
                            (2, 1, "Réponse { ok: true }"),
                            (1, 0, "Afficher le tableau de bord du groupe"),
                        ],
                    ),
                    (
                        "[données invalides]",
                        [
                            (3, 2, "Erreur de validation"),
                            (2, 1, "Réponse { ok: false }"),
                            (1, 0, "Afficher message d'erreur"),
                        ],
                    ),
                ],
            },
        },
        False,
    ),
    # Membres : code invitation valide ou révoqué (app/api/invitations/.../join)
    (
        "Diagramme de séquence — Rejoindre un groupe",
        "seq-membres.png",
        ["Utilisateur", "PageInvitation", "APIJoin", "Prisma", "Notifications"],
        {
            "preamble": [
                (0, 1, "Ouvrir le lien d'invitation"),
                (1, 2, "POST /api/invitations/:code/join"),
                (2, 3, "Rechercher invitation ou lien groupe"),
            ],
            "alt": {
                "operands": [
                    (
                        "[code valide et non révoqué]",
                        [
                            (3, 2, "Invitation valide"),
                            (2, 3, "Créer MembreGroupe MEMBRE"),
                            (2, 4, "Notifier les administrateurs"),
                            (2, 1, "Adhésion confirmée"),
                        ],
                    ),
                    (
                        "[code invalide ou révoqué]",
                        [
                            (3, 2, "Code introuvable"),
                            (2, 1, "Réponse 404"),
                            (1, 0, "Afficher code invalide"),
                        ],
                    ),
                ],
            },
        },
        True,
    ),
    # Cycles : membre actif avec cotisation en attente ou non (cycles/.../payments)
    (
        "Diagramme de séquence — Enregistrer une cotisation",
        "seq-cycles.png",
        ["Admin", "PageCycle", "APIPaiement", "Prisma", "JournalFinancier"],
        {
            "preamble": [
                (0, 1, "Sélectionner membre et montant"),
                (1, 2, "POST .../cycles/:id/payments"),
                (2, 3, "Vérifier admin et participant actif"),
            ],
            "alt": {
                "operands": [
                    (
                        "[cotisation ou pénalité en attente]",
                        [
                            (3, 2, "Tour actif et montant alloué"),
                            (2, 3, "Créer Cotisation / Pénalité"),
                            (2, 4, "Journaliser entrée caisse cycle"),
                            (2, 1, "Paiement enregistré"),
                        ],
                    ),
                    (
                        "[aucune obligation en attente]",
                        [
                            (3, 2, "Aucune cotisation due"),
                            (2, 1, "Réponse { ok: false }"),
                            (1, 0, "Afficher message d'erreur"),
                        ],
                    ),
                ],
            },
        },
        False,
    ),
    # Rubriques : montant suffisant ou rubrique clôturée (lib/actions/rubriques.ts)
    (
        "Diagramme de séquence — Paiement rubrique",
        "seq-rubriques.png",
        ["Admin", "ModuleRubriques", "ActionsServeur", "Prisma", "CaisseRubrique"],
        {
            "preamble": [
                (0, 1, "Sélectionner rubrique et membre"),
                (1, 2, "enregistrerPaiementRubrique()"),
                (2, 3, "Vérifier rôle ADMIN et rubrique active"),
            ],
            "alt": {
                "operands": [
                    (
                        "[montant valide]",
                        [
                            (3, 2, "Rubrique et membre valides"),
                            (2, 3, "Créer PaiementRubrique"),
                            (2, 4, "Mettre à jour la caisse rubrique"),
                            (2, 1, "Confirmation affichée"),
                        ],
                    ),
                    (
                        "[montant insuffisant ou rubrique clôturée]",
                        [
                            (3, 2, "Erreur métier"),
                            (2, 1, "Réponse { ok: false }"),
                            (1, 0, "Afficher message d'erreur"),
                        ],
                    ),
                ],
            },
        },
        False,
    ),
    # Réunions : planification linéaire + alt présence/absence avec amende
    (
        "Diagramme de séquence — Gérer une réunion",
        "seq-reunions.png",
        ["Admin", "PageReunions", "APIReunions", "Prisma", "Notifications"],
        {
            "preamble": [
                (0, 1, "Créer une réunion (date, amende)"),
                (1, 2, "POST /api/groups/:id/reunions"),
                (2, 3, "Persister Reunion"),
                (2, 4, "Notifier les membres"),
                (0, 1, "Saisir la présence d'un membre"),
                (1, 2, "PATCH .../presences"),
            ],
            "alt": {
                "operands": [
                    (
                        "[membre présent]",
                        [
                            (2, 3, "Statut PRESENT enregistré"),
                            (2, 1, "Présence enregistrée"),
                        ],
                    ),
                    (
                        "[membre absent ou en retard]",
                        [
                            (2, 3, "Statut ABSENT + amende"),
                            (2, 4, "Mettre à jour caisse amendes"),
                            (2, 1, "Amende appliquée"),
                        ],
                    ),
                ],
            },
        },
        False,
    ),
    # Épargne : solde suffisant ou compte bloqué (epargne/.../operations)
    (
        "Diagramme de séquence — Opération d'épargne",
        "seq-epargne.png",
        ["Admin", "ModuleEpargne", "APIEpargne", "Prisma", "CompteEpargne"],
        {
            "preamble": [
                (0, 1, "Saisir dépôt ou retrait"),
                (1, 2, "POST .../accounts/:id/operations"),
                (2, 3, "Vérifier rôle ADMIN et compte"),
            ],
            "alt": {
                "operands": [
                    (
                        "[opération valide]",
                        [
                            (3, 2, "Compte actif, solde suffisant"),
                            (2, 3, "Transaction solde avant / après"),
                            (2, 4, "Mettre à jour solde et historique"),
                            (2, 1, "Opération validée"),
                        ],
                    ),
                    (
                        "[solde insuffisant ou compte bloqué]",
                        [
                            (3, 2, "Solde insuffisant"),
                            (2, 1, "Réponse { ok: false }"),
                            (1, 0, "Afficher message d'erreur"),
                        ],
                    ),
                ],
            },
        },
        False,
    ),
    # Prêts : éligibilité OK ou refus (lib/pret.ts, api/prets)
    (
        "Diagramme de séquence — Demande de prêt",
        "seq-prets.png",
        ["Membre", "ModulePrets", "APIPrets", "Prisma", "BanqueGroupe"],
        {
            "preamble": [
                (0, 1, "Soumettre demande et avalistes"),
                (1, 2, "POST /api/groups/:id/prets"),
                (2, 3, "Analyser éligibilité et paramètres"),
            ],
            "alt": {
                "operands": [
                    (
                        "[membre éligible]",
                        [
                            (3, 2, "Banque et garanties OK"),
                            (2, 3, "Créer Pret EN_ATTENTE"),
                            (2, 4, "Réserver garanties avalistes"),
                            (2, 1, "Demande enregistrée"),
                        ],
                    ),
                    (
                        "[non éligible ou banque insuffisante]",
                        [
                            (3, 2, "Éligibilité refusée"),
                            (2, 1, "Réponse { ok: false }"),
                            (1, 0, "Afficher motif de refus"),
                        ],
                    ),
                ],
            },
        },
        False,
    ),
    # Paiements MM : SUCCESS vs FAILURE opérateur (payment-process.ts, payment-finalize.ts)
    (
        "Diagramme de séquence — Paiement Mobile Money",
        "seq-paiements.png",
        ["Membre", "CheckoutUI", "APIPaiement", "OperateurMM", "Prisma"],
        {
            "preamble": [
                (0, 1, "Initier paiement (montant, contexte)"),
                (1, 2, "POST .../payments/initiate"),
                (2, 3, "Créer PaymentTransaction PENDING"),
            ],
            "alt": {
                "operands": [
                    (
                        "[paiement confirmé par l'opérateur]",
                        [
                            (3, 2, "Confirmation SUCCESS"),
                            (2, 4, "Finaliser atomiquement (finalize)"),
                            (4, 2, "Caisse et cotisation mises à jour"),
                            (2, 1, "Statut SUCCESS affiché"),
                        ],
                    ),
                    (
                        "[paiement refusé ou expiré]",
                        [
                            (3, 2, "Échec opérateur"),
                            (2, 4, "Marquer transaction FAILED"),
                            (2, 1, "Statut échec affiché"),
                            (1, 0, "Afficher message d'échec"),
                        ],
                    ),
                ],
            },
        },
        False,
    ),
    # Finances : consultation linéaire + opt export (action optionnelle admin)
    (
        "Diagramme de séquence — Consulter les finances",
        "seq-finances.png",
        ["Admin", "PageFinances", "APIRapport", "Prisma", "ExportPDF"],
        {
            "preamble": [
                (0, 1, "Ouvrir le module Finances"),
                (1, 2, "GET caisses et mouvements"),
                (2, 3, "Requêtes paginées Prisma"),
                (3, 2, "Données financières"),
                (2, 1, "Afficher journal et soldes"),
            ],
            "opt": {
                "guard": "[export demandé]",
                "messages": [
                    (0, 1, "Demander export PDF ou Excel"),
                    (1, 2, "GET /api/groups/:id/rapport"),
                    (2, 4, "Générer document PDF / Excel"),
                    (4, 0, "Téléchargement du fichier"),
                ],
            },
        },
        False,
    ),
]


def main():
    for title, fname, parts, spec, ref in SEQUENCES:
        sequence_diagram(title, fname, parts, spec, show_ref=ref)
    print(f"{len(SEQUENCES)} diagrammes de séquence générés dans {OUT}")


if __name__ == "__main__":
    main()

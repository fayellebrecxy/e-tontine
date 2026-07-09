#!/usr/bin/env python3
"""
Génère tous les diagrammes et schémas pour la dernière partie du Chapitre II (Conception).
Sortie : Docs/diagramme de conception 2/
"""
from __future__ import annotations

import os
import math
from pathlib import Path
from textwrap import wrap
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "Docs" / "diagramme de conception 2"
OUT.mkdir(parents=True, exist_ok=True)

# Configuration graphique (Noir sur blanc académique)
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GRAY = (100, 100, 100)
LIGHT_GRAY = (240, 240, 240)

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def _font(size: int, bold: bool = False):
    p = FONT_BOLD_PATH if bold else FONT_PATH
    if os.path.exists(p):
        return ImageFont.truetype(p, size)
    return ImageFont.load_default()

# -----------------------------------------------------------------------------
# 1. GÉNÉRATEUR DES DIAGRAMMES DE SÉQUENCE DÉTAILLÉS (DSD)
# -----------------------------------------------------------------------------

HUMANS = {"Visiteur", "Utilisateur", "Membre", "Admin", "Administrateur"}
MSG_GAP = 360  # Compacted further
FRAME_PAD = 100
GUARD_H = 70
SEP_H = 120
TOP = 80
W_SEQ = 8800

def instance_label(name: str) -> str:
    lbl = name.replace("\\n", "\n").strip()
    if not lbl.startswith(":"):
        lbl = ":" + lbl
    return lbl

def wrapped_lines(text, max_chars=24) -> list[str]:
    lines = []
    for part in str(text).replace("\\n", "\n").split("\n"):
        # If it's a file path (contains /) and has no spaces, split it intelligently by slashes
        if "/" in part and " " not in part:
            current_line = ""
            segments = part.split("/")
            for i, seg in enumerate(segments):
                item = seg + "/" if i < len(segments) - 1 else seg
                if len(current_line) + len(item) <= max_chars:
                    current_line += item
                else:
                    if current_line:
                        lines.append(current_line)
                    current_line = item
            if current_line:
                lines.append(current_line)
        else:
            lines.extend(wrap(part, max_chars) or [""])
    return lines

def centered(d, box, text, font, max_chars=18):
    x1, y1, x2, y2 = box
    lines = wrapped_lines(text, max_chars)
    lh = font.size + 6
    y = (y1 + y2) / 2 - (len(lines) * lh) / 2 + 2
    for line in lines:
        d.text(((x1 + x2) / 2, y), line, font=font, fill=BLACK, anchor="ma")
        y += lh

def get_box_colors(name: str) -> tuple[tuple[int, int, int], tuple[int, int, int]]:
    name_lower = name.lower()
    # 1. Interface (Bleu)
    if any(k in name_lower for k in ["form", "sheet", "checkout", "page", "assistant", "interface", "login", "view", "ui"]):
        return (30, 100, 200), (230, 240, 255)  # Contour bleu, fond bleu clair
    # 2. Contrôleur et Service (Rouge)
    if any(k in name_lower for k in ["contrôleur", "controleur", "service", "action", "api", "handler", "route"]):
        return (200, 30, 30), (255, 235, 235)   # Contour rouge, fond rouge clair
    # 3. Table / Base de données (Vert)
    if any(k in name_lower for k in ["utilisateurs", "groupes", "membres", "cycles", "rubriques", "réunions", "reunions", "comptesépargne", "comptes", "prêts", "prets", "transactions", "mouvements", "database", "table", "base", "bd"]):
        return (30, 150, 60), (235, 250, 240)   # Contour vert, fond vert clair
    return (0, 0, 0), (250, 250, 250)           # Contour noir, fond gris clair (humains)

def centered_underlined(d, box, text, font, max_chars=16, color=BLACK):
    x1, y1, x2, y2 = box
    lines = wrapped_lines(text, max_chars)
    lh = font.size + 8
    y = (y1 + y2) / 2 - (len(lines) * lh) / 2 + 2
    for line in lines:
        cx = (x1 + x2) / 2
        d.text((cx, y), line, font=font, fill=BLACK, anchor="ma")
        bbox = d.textbbox((cx, y), line, font=font, anchor="ma")
        d.line((bbox[0], bbox[3] + 2, bbox[2], bbox[3] + 2), fill=color, width=10)
        y += lh

def dashed_line(d, start, end, width=3, dash=12, gap=8, fill=GRAY):
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
    size = max(24, width * 5)
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
        dash, gap = 40, 25
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

def draw_actor(d, x, y, name, font_name):
    # Stick figure above the box
    ay = y + 10
    # Head
    d.ellipse((x - 20, ay, x + 20, ay + 40), outline=BLACK, width=12)
    # Body
    solid_line(d, (x, ay + 40), (x, ay + 90), 12)
    # Arms
    solid_line(d, (x - 30, ay + 55), (x + 30, ay + 55), 12)
    # Legs
    solid_line(d, (x, ay + 90), (x - 25, ay + 140), 12)
    solid_line(d, (x, ay + 90), (x + 25, ay + 140), 12)
    
    # Box below the stick figure
    by = y + 170
    label = name if name.startswith(":") else ":" + name
    w_lines = wrapped_lines(label, 12)
    bh = max(240, 80 + len(w_lines) * (font_name.size + 20))
    bw = 1400  # Widen to fit gargantuan text
    box = (x - bw // 2, by, x + bw // 2, by + bh)
    box_color, fill_color = get_box_colors(name)
    d.rectangle(box, outline=box_color, width=12, fill=fill_color)
    
    # Label centered and underlined (no colon)
    centered_underlined(d, box, "\n".join(w_lines), font_name, 12, color=box_color)
    return by + bh

def draw_object(d, x, y, name, font_name):
    # Align box at y + 170
    by = y + 170
    label = instance_label(name)
    w_lines = wrapped_lines(label, 12)
    bh = max(240, 80 + len(w_lines) * (font_name.size + 20))
    bw = 1400  # Widen to fit gargantuan text
    box = (x - bw // 2, by, x + bw // 2, by + bh)
    box_color, fill_color = get_box_colors(name)
    d.rectangle(box, outline=box_color, width=12, fill=fill_color)
    centered_underlined(d, box, "\n".join(w_lines), font_name, 12, color=box_color)
    return by + bh

def draw_fragment_tab(d, x, y, kind: str, font_small):
    w = 420 if kind == "alt" else 320
    h_tab = 140
    pts = [(x, y + h_tab), (x + w, y + h_tab), (x + w + 50, y + h_tab - 40), (x + w + 50, y), (x, y)]
    d.polygon(pts, outline=BLACK, fill=WHITE)
    d.line(pts + [pts[0]], fill=BLACK, width=12)
    d.text((x + w / 2 + 15, y + 10), kind, font=font_small, fill=BLACK, anchor="ma")

def is_return_message(label: str, frm: int = 0, to: int = 0) -> bool:
    return frm > to

def sequence_diagram(title: str, filename: str, participants: list[str], spec: dict):
    n = len(participants)
    w_seq = W_SEQ
    x_start = 800
    xs = [x_start + i * ((w_seq - 2 * x_start) // (n - 1)) for i in range(n)]
    top = TOP

    # Scaled up academic typography (extremely large fonts for maximum legibility)
    f_name = _font(150, bold=True)
    f_msg = _font(130, bold=True)
    f_small = _font(110, bold=True)
    f_guard = _font(120, bold=True)

    act_spans: dict[int, list[list[int]]] = {i: [] for i in range(n)}
    msg_data: list[tuple] = []
    frames: list[tuple] = []

    def extend_act(idx, y0, y1):
        if not act_spans[idx]:
            act_spans[idx].append([y0, y1])
        else:
            last = act_spans[idx][-1]
            if y0 <= last[1] + 30:
                last[1] = max(last[1], y1)
            else:
                act_spans[idx].append([y0, y1])

    # Dynamic starting coordinate for first message to prevent header or ref box overlaps
    has_ref = (title != "DSD — Se connecter")
    max_bh = 240
    for i, name in enumerate(participants):
        is_human = name in HUMANS or "Visiteur" in name or "Membre" in name or "Admin" in name or "Acteur" in name or "Utilisateur" in name or "Administrateur" in name
        if is_human and i == 0:
            label = name if name.startswith(":") else ":" + name
        else:
            label = instance_label(name)
        w_lines = wrapped_lines(label, 12)
        bh = max(240, 80 + len(w_lines) * (f_name.size + 20))
        if bh > max_bh:
            max_bh = bh

    y_ref = top + 170 + max_bh + 40
    if has_ref:
        y = y_ref + 180 + 320
    else:
        y = top + 170 + max_bh + 60
        
    frame_x, frame_w = 80, w_seq - 160

    # Collect preamble messages
    for frm, to, label in spec.get("preamble", []):
        dashed = is_return_message(label, frm, to)
        if not dashed:
            extend_act(to, y - 6, y + MSG_GAP - 36)
            extend_act(frm, y - 6, y + 16)
        msg_data.append((frm, to, label, dashed, y))
        y += MSG_GAP

    # Alt frames
    if "alt" in spec:
        frame_top = y + 8
        y_inner = frame_top + FRAME_PAD + 30
        guard_ys = []
        for idx, (guard, op_msgs) in enumerate(spec["alt"]["operands"]):
            if idx > 0:
                y_inner += SEP_H
            guard_ys.append((guard, y_inner))
            y_inner += GUARD_H + 340  # Leave space for the guard label and first message text
            for frm, to, label in op_msgs:
                dashed = is_return_message(label, frm, to)
                if not dashed:
                    extend_act(to, y_inner - 6, y_inner + MSG_GAP - 36)
                    extend_act(frm, y_inner - 6, y_inner + 16)
                msg_data.append((frm, to, label, dashed, y_inner))
                y_inner += MSG_GAP
        frame_bottom = y_inner + FRAME_PAD
        frames.append(("alt", frame_x, frame_top, frame_bottom, guard_ys))
        y = frame_bottom + 20

    # Collect postamble messages
    for frm, to, label in spec.get("postamble", []):
        dashed = is_return_message(label, frm, to)
        if not dashed:
            extend_act(to, y - 6, y + MSG_GAP - 36)
            extend_act(frm, y - 6, y + 16)
        msg_data.append((frm, to, label, dashed, y))
        y += MSG_GAP

    h = y + 140
    for _, _, _, fbot, _ in frames:
        h = max(h, fbot + 120)

    img = Image.new("RGB", (w_seq, h), WHITE)
    d = ImageDraw.Draw(img)

    # Outer border
    d.rectangle((15, 15, w_seq - 15, h - 15), outline=BLACK, width=14)

    life_end = h - 60

    # 1. Draw lifelines (dashed lines)
    for i, name in enumerate(participants):
        x = xs[i]
        is_human = name in HUMANS or "Visiteur" in name or "Membre" in name or "Admin" in name or "Acteur" in name or "Utilisateur" in name or "Administrateur" in name
        if is_human and i == 0:
            label = name if name.startswith(":") else ":" + name
        else:
            label = instance_label(name)
        w_lines = wrapped_lines(label, 12)
        bh = max(240, 80 + len(w_lines) * (f_name.size + 20))
        life_start_i = top + 170 + bh
        dashed_line(d, (x, life_start_i), (x, life_end), width=10, dash=35, gap=20)

    # 2. Draw the s'authentifier ref box
    if has_ref:
        rx1 = xs[0] - 20
        rx2 = xs[n - 1] + 20
        ry1 = y_ref - 10
        ry2 = y_ref + 180
        # Draw background block (filled white to cover lifelines)
        d.rectangle((rx1, ry1, rx2, ry2), outline=BLACK, width=12, fill=WHITE)
        # Draw tab
        tab_w = 280
        tab_h = 100
        tab_pts = [
            (rx1, ry1),
            (rx1 + tab_w, ry1),
            (rx1 + tab_w + 40, ry1 + tab_h - 30),
            (rx1 + tab_w + 40, ry1 + tab_h),
            (rx1, ry1 + tab_h)
        ]
        d.polygon(tab_pts, outline=BLACK, fill=WHITE)
        d.line(tab_pts + [(rx1, ry1)], fill=BLACK, width=12)
        d.text((rx1 + tab_w / 2 + 15, ry1 + 10), "ref", font=f_small, fill=BLACK, anchor="ma")
        # Draw text
        d.text(((rx1 + rx2) / 2, ry1 + 30), "s'authentifier", font=f_msg, fill=BLACK, anchor="ma")

    # 3. Draw frames (alt/opt boxes)
    for kind, fx, ftop, fbot, extra in frames:
        d.rectangle((fx, ftop, fx + frame_w, fbot), outline=BLACK, width=12)
        draw_fragment_tab(d, fx, ftop, kind, f_small)
        if kind == "alt":
            for idx, (guard, gy) in enumerate(extra):
                d.text((fx + 20, gy), guard, font=f_guard, fill=BLACK)
                if idx > 0:
                    sep_y = gy - 20
                    dashed_line(d, (fx + 10, sep_y), (fx + frame_w - 10, sep_y), width=10, fill=BLACK, dash=35, gap=20)

    # 4. Draw activation bars (white fill)
    bar_half = 15
    for i, spans in act_spans.items():
        x = xs[i]
        for y0, y1 in spans:
            d.rectangle((x - bar_half, y0, x + bar_half, y1), outline=BLACK, width=10, fill=WHITE)

    # 5. Draw message arrows and text labels
    for frm, to, label, dashed, my in msg_data:
        x1, x2 = xs[frm], xs[to]
        # Offset message arrow endpoint slightly to touch activation bar edge
        if x2 > x1:
            arrow_end_x = x2 - bar_half
            arrow_start_x = x1 + bar_half if frm > 0 else x1
        else:
            arrow_end_x = x2 + bar_half
            arrow_start_x = x1 - bar_half if frm > 0 else x1
            
        message_arrow(d, (arrow_start_x, my), (arrow_end_x, my), dashed=dashed, width=12)
        lines = wrapped_lines(label, 26)
        lh = f_msg.size + 15
        ly = my - 20 - len(lines) * lh
        for line in lines:
            d.text(((x1 + x2) / 2, ly), line, font=f_msg, fill=BLACK, anchor="ma")
            ly += lh

    # 6. Draw Actor/Object headers at the very top (so they are drawn on top)
    for i, name in enumerate(participants):
        x = xs[i]
        is_human = name in HUMANS or "Visiteur" in name or "Membre" in name or "Admin" in name or "Acteur" in name or "Utilisateur" in name or "Administrateur" in name
        if is_human and i == 0:
            draw_actor(d, x, top, name, f_name)
        else:
            draw_object(d, x, top, name, f_name)

    img.save(OUT / filename, quality=95)
    print(f"Généré : {OUT / filename}")

    # Copy/Save to multiple locations to satisfy different layout and user/memoir needs:
    import shutil
    alt_names = []
    if filename == "dsd-creer-cycles.png":
        alt_names = ["dsd-creer-cycle.png", "creer-cycle.png"]
    elif filename == "dsd-demander-prets.png":
        alt_names = ["dsd-demander-pret.png", "demander-pret.png"]
    elif filename == "dsd-planifier-reunion.png":
        alt_names = ["planifier-reunion.png", "dsd-planifier-reunion.png"]
        
    for alt_name in alt_names:
        dest_path = ROOT / "Docs" / alt_name
        shutil.copy2(OUT / filename, dest_path)
        print(f"Copié supplémentaire : {dest_path}")


# -----------------------------------------------------------------------------
# 2. GÉNÉRATEUR DU DIAGRAMME DE CLASSES
# -----------------------------------------------------------------------------

def generate_class_diagram():
    src = ROOT / "Docs" / "diagrame-de-classe-e-tontine.png"
    dst = OUT / "diagramme-classes.png"
    if src.exists():
        img = Image.open(src)
        img.save(dst, quality=95)
        print(f"Copié : {src} -> {dst}")
    else:
        print(f"Source introuvable : {src}")


# -----------------------------------------------------------------------------
# 3. GÉNÉRATEUR DU SCHÉMA D'ARCHITECTURE SYSTÈME (3 TIERS)
# -----------------------------------------------------------------------------

def draw_3d_box(d, x, y, w, h, title: str):
    depth = 14
    # Face avant
    d.rectangle((x, y + depth, x + w, y + h + depth), fill=WHITE, outline=BLACK, width=2)
    # Face sup
    d.polygon([(x, y + depth), (x + depth, y), (x + w + depth, y), (x + w, y + depth)], fill=WHITE, outline=BLACK)
    # Face lat
    d.polygon([(x + w, y + depth), (x + w + depth, y), (x + w + depth, y + h), (x + w, y + h + depth)], fill=WHITE, outline=BLACK)
    
    f_bold = _font(18, bold=True)
    d.text((x + w/2, y + depth + 10), title, font=f_bold, fill=BLACK, anchor="ma")

def draw_inner_comp(d, box, label: str):
    d.rounded_rectangle(box, radius=8, outline=BLACK, fill=WHITE, width=2)
    f_reg = _font(15, bold=True)
    d.text(((box[0] + box[2])/2, (box[1] + box[3])/2), label, font=f_reg, fill=BLACK, anchor="mm")

def draw_arch_link(d, p1, p2, label=""):
    d.line((p1[0], p1[1], p2[0], p2[1]), fill=BLACK, width=2)
    # Arrowheads at both ends (bidirectional)
    for end, start in [(p2, p1), (p1, p2)]:
        ang = math.atan2(end[1] - start[1], end[0] - start[0])
        s = 10
        tip = end
        left = (end[0] - s * math.cos(ang - 0.35), end[1] - s * math.sin(ang - 0.35))
        right = (end[0] - s * math.cos(ang + 0.35), end[1] - s * math.sin(ang + 0.35))
        d.polygon([tip, left, right], fill=BLACK)
        
    if label:
        f_italic = _font(14, bold=True)
        mx, my = (p1[0] + p2[0])/2, (p1[1] + p2[1])/2
        if abs(p1[1] - p2[1]) < 2:  # Horizontal line
            d.text((mx, my - 22), label, font=f_italic, fill=BLACK, anchor="mm")
        else:  # Vertical line
            d.text((mx + 15, my), label, font=f_italic, fill=BLACK, anchor="lm")

def generate_architecture_diagram():
    w, h = 1200, 600
    img = Image.new("RGB", (w, h), WHITE)
    d = ImageDraw.Draw(img)

    # Cadre extérieur
    d.rectangle((10, 10, w - 10, h - 10), outline=BLACK, width=2)

    # Présentation Tier (Client)
    draw_3d_box(d, 80, 100, 260, 240, "Tier Présentation (Client)")
    draw_inner_comp(d, (110, 170, 310, 220), "Navigateur Web")
    draw_inner_comp(d, (110, 240, 310, 290), "Interface Application Web")

    # Application Tier (Serveur)
    draw_3d_box(d, 460, 100, 300, 240, "Tier Application (Serveur)")
    draw_inner_comp(d, (490, 170, 730, 220), "API et Services Web")
    draw_inner_comp(d, (490, 240, 730, 290), "Contrôles et Validation")

    # Data Tier (Données)
    draw_3d_box(d, 860, 100, 260, 240, "Tier Données (Base de données)")
    draw_inner_comp(d, (890, 170, 1090, 220), "Accès aux Données")
    draw_inner_comp(d, (890, 240, 1090, 290), "Base de Données")

    # External APIs (Mobile Money)
    draw_3d_box(d, 480, 400, 260, 140, "Service Externe")
    draw_inner_comp(d, (500, 460, 710, 510), "Passerelle Mobile Money")

    # Connectors
    draw_arch_link(d, (354, 220), (460, 220), "Requête")
    draw_arch_link(d, (774, 220), (860, 220), "Accès Données")
    draw_arch_link(d, (610, 354), (610, 400), "API Calls / Webhooks")

    for path in [
        OUT / "architecture-systeme.png",
        ROOT / "Docs" / "cahier-conception-diagrammes" / "architecture-systeme.png",
        ROOT / "Docs" / "architecture-systeme.png",
        ROOT / "Docs" / "dss" / "architecture-systeme.png",
    ]:
        path.parent.mkdir(parents=True, exist_ok=True)
        img.save(path, quality=95)
        print(f"Généré : {path}")


# -----------------------------------------------------------------------------
# 4. EXÉCUTION
# -----------------------------------------------------------------------------

SEQUENCES_SPEC = [
    # 1. Se connecter
    (
        "DSD — Se connecter",
        "dsd-se-connecter.png",
        ["Utilisateur", "LoginForm", "ContrôleurConnexion", "ServiceAuthentification", "Utilisateurs"],
        {
            "preamble": [
                (0, 1, "Saisir email/mot de passe et valider"),
                (1, 2, "app/auth/actions.ts"),
                (2, 3, "authentifier(email, password)"),
                (3, 4, "rechercherUtilisateur(email)")
            ],
            "alt": {
                "operands": [
                    ("[Session valide]", [
                        (4, 3, "Profil et mot de passe valides"),
                        (3, 2, "Retourner jeton d'accès (JWT)"),
                        (2, 1, "Redirection /dashboard"),
                        (1, 0, "Afficher tableau de bord")
                    ]),
                    ("[Identifiants invalides]", [
                        (4, 3, "Utilisateur introuvable / Erreur pass"),
                        (3, 2, "Retourner erreur auth"),
                        (2, 1, "Retourner statut 401 Unauthorized"),
                        (1, 0, "Afficher message d'erreur")
                    ])
                ]
            },
            "postamble": []
        }
    ),
    # 2. Créer groupe
    (
        "DSD — Créer groupe",
        "dsd-creer-groupe.png",
        ["Admin", "CreateGroupForm", "ContrôleurGroupes", "ServiceGroupes", "Groupes"],
        {
            "preamble": [
                (0, 1, "Saisir nom, devise et valider"),
                (1, 2, "app/api/groups/route.ts")
            ],
            "alt": {
                "operands": [
                    ("[Données valides]", [
                        (2, 3, "validerEtCréerGroupe(donnees)"),
                        (3, 4, "sauvegarderGroupe(donnees)"),
                        (4, 3, "Enregistrement OK"),
                        (3, 2, "Retourner succès"),
                        (2, 1, "Retourner statut 201 Created"),
                        (1, 0, "Rediriger vers le dashboard groupe")
                    ]),
                    ("[Données invalides]", [
                        (2, 1, "Retourner statut 400 (Zod error)"),
                        (1, 0, "Afficher message de validation")
                    ])
                ]
            },
            "postamble": []
        }
    ),
    # 3. Rejoindre groupe
    (
        "DSD — Rejoindre groupe",
        "dsd-rejoindre-groupe.png",
        ["Membre", "JoinInvitationForm", "ContrôleurInvitations", "ServiceInvitations", "Membres"],
        {
            "preamble": [
                (0, 1, "Cliquer sur Rejoindre groupe"),
                (1, 2, "app/api/invitations/[code]/join/route.ts"),
                (2, 3, "validerInvitation(code)"),
                (3, 4, "verifierInvitationEtMembre(code)")
            ],
            "alt": {
                "operands": [
                    ("[Invitation valide]", [
                        (4, 3, "Créer membre et marquer utilisée"),
                        (3, 2, "Retourner succès adhésion"),
                        (2, 1, "Retourner statut 200 OK"),
                        (1, 0, "Afficher message de succès et rediriger")
                    ]),
                    ("[Invitation expirée / invalide]", [
                        (4, 3, "Code incorrect / expiré"),
                        (3, 2, "Retourner erreur validité"),
                        (2, 1, "Retourner statut 400 Bad Request"),
                        (1, 0, "Afficher erreur invitation invalide")
                    ])
                ]
            },
            "postamble": []
        }
    ),
    # 4. Créer cycles
    (
        "DSD — Créer cycles",
        "dsd-creer-cycles.png",
        ["Admin", "CreateCycleForm", "ContrôleurCycles", "ServiceCycles", "Cycles"],
        {
            "preamble": [
                (0, 1, "Saisir montant, tours et valider"),
                (1, 2, "app/api/groups/[groupId]/cycles/route.ts"),
                (2, 3, "verifierRôleAdmin(id_membre)")
            ],
            "alt": {
                "operands": [
                    ("[Admin autorisé]", [
                        (3, 4, "creerCycleEtOrdrePassage(data)"),
                        (4, 3, "Cycle et ordre enregistrés"),
                        (3, 2, "Retourner succès cycle"),
                        (2, 1, "Retourner statut 201 Created"),
                        (1, 0, "Afficher le nouveau cycle")
                    ]),
                    ("[Accès refusé]", [
                        (2, 1, "Retourner statut 403 Forbidden"),
                        (1, 0, "Afficher erreur droits insuffisants")
                    ])
                ]
            },
            "postamble": []
        }
    ),
    # 5. Créer rubrique
    (
        "DSD — Créer rubrique",
        "dsd-creer-rubrique.png",
        ["Admin", "RubriqueAssistant", "ContrôleurRubriques", "ServiceRubriques", "Rubriques"],
        {
            "preamble": [
                (0, 1, "Saisir nom, type, montant et valider"),
                (1, 2, "lib/actions/rubriques.ts")
            ],
            "alt": {
                "operands": [
                    ("[Succès]", [
                        (2, 3, "validerEtCréerRubrique(data)"),
                        (3, 4, "creerRubriqueEtCaisse(data)"),
                        (4, 3, "Rubrique et Caisse créées"),
                        (3, 2, "Retourner succès"),
                        (2, 1, "Retourner statut 201 Created"),
                        (1, 0, "Afficher la nouvelle rubrique")
                    ]),
                    ("[Échec]", [
                        (2, 1, "Retourner statut 400 Bad Request"),
                        (1, 0, "Afficher erreur")
                    ])
                ]
            },
            "postamble": []
        }
    ),
    # 6. Planifier réunion
    (
        "DSD — Planifier réunion",
        "dsd-planifier-reunion.png",
        ["Admin", "CreateReunionSheet", "ContrôleurRéunions", "ServiceRéunions", "Réunions"],
        {
            "preamble": [
                (0, 1, "Saisir date, heure, description et valider"),
                (1, 2, "app/api/groups/[groupId]/reunions/route.ts"),
                (2, 3, "validerDateRéunion(date)")
            ],
            "alt": {
                "operands": [
                    ("[Date valide]", [
                        (3, 4, "enregistrerRéunion(titre, date)"),
                        (4, 3, "Réunion enregistrée OK"),
                        (3, 2, "Retourner succès réunion"),
                        (2, 1, "Retourner statut 201 Created"),
                        (1, 0, "Afficher la réunion planifiée")
                    ]),
                    ("[Erreur de validation]", [
                        (2, 1, "Retourner statut 400 Bad Request"),
                        (1, 0, "Afficher message d'erreur")
                    ])
                ]
            },
            "postamble": []
        }
    ),
    # 7. Ouvrir compte épargne
    (
        "DSD — Ouvrir compte épargne",
        "dsd-ouvrir-compte-epargne.png",
        ["Membre", "CreateAccountActions", "ContrôleurÉpargne", "ServiceÉpargne", "ComptesÉpargne"],
        {
            "preamble": [
                (0, 1, "Cliquer sur Créer un compte épargne"),
                (1, 2, "app/api/groups/[groupId]/epargne/accounts/route.ts"),
                (2, 3, "validerSession()"),
                (3, 4, "verifierCompteExistant(id_membre)")
            ],
            "alt": {
                "operands": [
                    ("[Création autorisée]", [
                        (4, 3, "Compte inexistant (solde 0)"),
                        (3, 4, "créerCompteÉpargne(id_membre)"),
                        (4, 3, "Compte enregistré"),
                        (3, 2, "Retourner le compte créé"),
                        (2, 1, "Retourner statut 201 Created"),
                        (1, 0, "Afficher le compte épargne")
                    ]),
                    ("[Compte déjà existant]", [
                        (4, 3, "Compte trouvé pour ce membre"),
                        (3, 2, "Retourner erreur doublon"),
                        (2, 1, "Retourner statut 409 Conflict"),
                        (1, 0, "Afficher message compte existant")
                    ])
                ]
            },
            "postamble": []
        }
    ),
    # 8. Demander prêts
    (
        "DSD — Demander prêts",
        "dsd-demander-prets.png",
        ["Membre", "DemandePretForm", "ContrôleurPrêts", "ServicePrêts", "Prêts"],
        {
            "preamble": [
                (0, 1, "Saisir montant, motif, garanties et valider"),
                (1, 2, "app/api/groups/[groupId]/prets/route.ts"),
                (2, 3, "validerDemandePret(montant, garants)"),
                (3, 4, "verifierConditionsPret(montant, garants)")
            ],
            "alt": {
                "operands": [
                    ("[Conditions remplies]", [
                        (4, 3, "creerPretEnAttente(donnees)"),
                        (3, 4, "enregistrerGaranties(garants)"),
                        (4, 3, "Prêt et garanties créés"),
                        (3, 2, "Retourner le prêt créé"),
                        (2, 1, "Retourner statut 201 Created"),
                        (1, 0, "Afficher le prêt en attente d'approbation")
                    ]),
                    ("[Fonds insuffisants / Inéligible]", [
                        (4, 3, "Solvabilité ou garanties insuffisantes"),
                        (3, 2, "Retourner erreur éligibilité"),
                        (2, 1, "Retourner statut 400 Bad Request"),
                        (1, 0, "Afficher le motif du refus")
                    ])
                ]
            },
            "postamble": []
        }
    ),
    # 9. Initier paiement Mobile Money
    (
        "DSD — Initier paiement Mobile Money",
        "dsd-initier-paiement-mobile-money.png",
        ["Membre", "MobileMoneyCheckout", "ContrôleurPaiements", "ServicePaiements", "Transactions"],
        {
            "preamble": [
                (0, 1, "Saisir numéro MoMo, montant et valider"),
                (1, 2, "app/api/groups/[groupId]/payments/initiate/route.ts"),
                (2, 3, "validerChampsPaiement()"),
                (3, 4, "verifierCompteMobile(numero)")
            ],
            "alt": {
                "operands": [
                    ("[Compte MoMo valide]", [
                        (4, 3, "creerTransactionEnAttente()"),
                        (3, 2, "Requérir push USSD à l'opérateur"),
                        (2, 1, "Retourner succès initialisation"),
                        (1, 0, "Afficher message de validation du push USSD")
                    ]),
                    ("[Numéro invalide / Solde insuffisant]", [
                        (4, 3, "Compte MoMo ou solde invalide"),
                        (3, 2, "Retourner échec paiement"),
                        (2, 1, "Retourner statut 400 Bad Request"),
                        (1, 0, "Afficher message d'échec de l'opérateur")
                    ])
                ]
            },
            "postamble": []
        }
    ),
    # 10. Consulter journal financier
    (
        "DSD — Consulter journal financier",
        "dsd-consulter-journal-financier.png",
        ["Utilisateur", "FinancesPage", "ContrôleurFinances", "ServiceFinances", "Mouvements"],
        {
            "preamble": [
                (0, 1, "Cliquer sur l'onglet Journal Financier"),
                (1, 2, "app/dashboard/groups/[groupId]/finances/page.tsx"),
                (2, 3, "verifierDroitsAcces()")
            ],
            "alt": {
                "operands": [
                    ("[Accès autorisé]", [
                        (3, 4, "chargerTransactionsEtCaisses()"),
                        (4, 3, "Mouvements et soldes des caisses"),
                        (3, 2, "Retourner données consolidées"),
                        (2, 1, "Retourner statut 200 OK"),
                        (1, 0, "Afficher l'historique et les soldes")
                    ]),
                    ("[Erreur de droits]", [
                        (2, 1, "Retourner statut 403 Forbidden"),
                        (1, 0, "Afficher message d'erreur d'accès")
                    ])
                ]
            },
            "postamble": []
        }
    )
]

def main():
    # 1. Architecture
    generate_architecture_diagram()
    
    # 2. Sequence Diagrams
    for title, fname, parts, spec in SEQUENCES_SPEC:
        sequence_diagram(title, fname, parts, spec)
        
    # 3. Class Diagram
    generate_class_diagram()

if __name__ == "__main__":
    main()

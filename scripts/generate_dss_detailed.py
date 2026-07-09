#!/usr/bin/env python3
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Paths
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR_1 = ROOT / "Docs" / "dss"
OUT_DIR_2 = ROOT / "Docs" / "DSS"

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GRAY = (128, 128, 128)

# Fonts
font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
font_bold_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

if os.path.exists(font_path):
    F_BOLD = ImageFont.truetype(font_bold_path, 12)
    F_REG = ImageFont.truetype(font_path, 11)
    F_ITALIC = ImageFont.truetype(font_path, 10)
    F_TITLE = ImageFont.truetype(font_bold_path, 13)
else:
    F_BOLD = ImageFont.load_default()
    F_REG = ImageFont.load_default()
    F_ITALIC = ImageFont.load_default()
    F_TITLE = ImageFont.load_default()

def draw_dashed_line(draw, x1, y1, x2, y2, dash_len=8, gap_len=6, fill=BLACK, width=1):
    if x1 == x2:  # Vertical line
        y = min(y1, y2)
        y_max = max(y1, y2)
        draw_segment = True
        while y < y_max:
            if draw_segment:
                nxt = min(y + dash_len, y_max)
                draw.line((x1, y, x1, nxt), fill=fill, width=width)
                y = nxt
            else:
                y = min(y + gap_len, y_max)
            draw_segment = not draw_segment
    elif y1 == y2:  # Horizontal line
        x = min(x1, x2)
        x_max = max(x1, x2)
        draw_segment = True
        while x < x_max:
            if draw_segment:
                nxt = min(x + dash_len, x_max)
                draw.line((x, y1, nxt, y1), fill=fill, width=width)
                x = nxt
            else:
                x = min(x + gap_len, x_max)
            draw_segment = not draw_segment
    else:  # Diagonal fallback
        draw.line((x1, y1, x2, y2), fill=fill, width=width)

def draw_solid_arrow(draw, x1, y1, x2, y2, fill=BLACK):
    draw.line((x1, y1, x2, y2), fill=fill, width=1)
    # Arrow head
    arr_size = 8
    if x2 > x1:  # Pointing right
        draw.polygon([(x2, y2), (x2 - arr_size, y2 - 4), (x2 - arr_size, y2 + 4)], fill=fill)
    else:  # Pointing left
        draw.polygon([(x2, y2), (x2 + arr_size, y2 - 4), (x2 + arr_size, y2 + 4)], fill=fill)

def draw_open_arrow(draw, x1, y1, x2, y2, fill=BLACK):
    draw_dashed_line(draw, x1, y1, x2, y2, fill=fill)
    # Open arrow head
    arr_size = 8
    if x2 > x1:  # Pointing right
        draw.line((x2, y2, x2 - arr_size, y2 - 4), fill=fill, width=1)
        draw.line((x2, y2, x2 - arr_size, y2 + 4), fill=fill, width=1)
    else:  # Pointing left
        draw.line((x2, y2, x2 + arr_size, y2 - 4), fill=fill, width=1)
        draw.line((x2, y2, x2 + arr_size, y2 + 4), fill=fill, width=1)

def draw_self_loop(draw, x, y_start, y_end, label, fill=BLACK):
    loop_x = x + 35
    # Draw horizontal line out
    draw.line((x + 5, y_start, loop_x, y_start), fill=fill, width=1)
    # Draw vertical line down
    draw.line((loop_x, y_start, loop_x, y_end), fill=fill, width=1)
    # Draw horizontal line back with solid arrowhead
    draw.line((loop_x, y_end, x + 5, y_end), fill=fill, width=1)
    arr_size = 8
    draw.polygon([(x + 5, y_end), (x + 5 + arr_size, y_end - 4), (x + 5 + arr_size, y_end + 4)], fill=fill)
    
    # Label next to loop
    lines = label.split("\n")
    ty = y_start + (y_end - y_start) / 2 - (len(lines) * 12) / 2 + 6
    for line in lines:
        draw.text((loop_x + 8, ty), line, font=F_REG, fill=fill)
        ty += 13

def generate_dss_diagram(diag_data):
    # Canvas dimensions
    success_loops = diag_data.get("success_loops", [])
    num_loops = len(success_loops)
    
    skip_auth_ref = diag_data.get("skip_auth_ref", False)
    y_offset = -90 if skip_auth_ref else 0
    
    if num_loops == 2:
        width = 800
        height = 635 + y_offset
        lifeline_end_y = 625 + y_offset
        alt_bottom_y = 595 + y_offset
        success_msg_y = 495 + y_offset
        separator_y = 520 + y_offset
        fail_cond_y = 540 + y_offset
        fail_msg_y = 570 + y_offset
    elif num_loops == 1:
        width = 800
        height = 580 + y_offset
        lifeline_end_y = 570 + y_offset
        alt_bottom_y = 540 + y_offset
        success_msg_y = 440 + y_offset
        separator_y = 465 + y_offset
        fail_cond_y = 485 + y_offset
        fail_msg_y = 515 + y_offset
    else:
        width = 800
        height = 535 + y_offset
        lifeline_end_y = 525 + y_offset
        alt_bottom_y = 495 + y_offset
        success_msg_y = 400 + y_offset
        separator_y = 430 + y_offset
        fail_cond_y = 445 + y_offset
        fail_msg_y = 470 + y_offset
    
    img = Image.new("RGB", (width, height), WHITE)
    draw = ImageDraw.Draw(img)

    # Key horizontal positions
    ACTOR_X = 180
    SYSTEM_X = 570
    
    # Header Boxes
    # Actor (Stick figure / Bonhomme en allumette)
    # Head (Perfect circle)
    draw.ellipse((ACTOR_X - 8, 8, ACTOR_X + 8, 24), outline=BLACK, fill=WHITE, width=1)
    # Body
    draw.line((ACTOR_X, 24, ACTOR_X, 42), fill=BLACK, width=1)
    # Arms
    draw.line((ACTOR_X - 12, 32, ACTOR_X + 12, 32), fill=BLACK, width=1)
    # Legs
    draw.line((ACTOR_X, 42, ACTOR_X - 10, 58), fill=BLACK, width=1)
    draw.line((ACTOR_X, 42, ACTOR_X + 10, 58), fill=BLACK, width=1)
    
    # Actor Label with prepended colon and underline
    actor_text = diag_data["actor"]
    if not actor_text.startswith(":"):
        actor_text = ":" + actor_text
    draw.text((ACTOR_X, 61), actor_text, font=F_BOLD, fill=BLACK, anchor="ma")
    left, top, right, bottom = draw.textbbox((ACTOR_X, 61), actor_text, font=F_BOLD, anchor="ma")
    draw.line((left, bottom + 2, right, bottom + 2), fill=BLACK, width=1)
    
    # System Box
    draw.rectangle((SYSTEM_X - 70, 20, SYSTEM_X + 70, 55), outline=BLACK, fill=WHITE, width=1)
    draw.text((SYSTEM_X, 37), ":Système", font=F_BOLD, fill=BLACK, anchor="mm")
    
    # Dashed Lifelines
    draw_dashed_line(draw, ACTOR_X, 78, ACTOR_X, lifeline_end_y, fill=BLACK)
    draw_dashed_line(draw, SYSTEM_X, 55, SYSTEM_X, lifeline_end_y, fill=BLACK)
    
    # ref s'authentifier frame
    if not skip_auth_ref:
        # Outer box
        draw.rectangle((130, 90, 620, 135), outline=BLACK, width=1)
        # Tab with cut corner
        draw.polygon([(130, 90), (175, 90), (175, 101), (169, 107), (130, 107)], outline=BLACK, fill=WHITE, width=1)
        draw.text((150, 98), "ref", font=F_REG, fill=BLACK, anchor="mm")
        # Centered label
        draw.text((375, 112), "s'authentifier", font=F_BOLD, fill=BLACK, anchor="mm")
    
    # Activation Bars (split based on active interactions)
    ACT_W = 10
    
    # Actor Activation Bars
    # Bar 1: Y = 180 to 225
    draw.rectangle((ACTOR_X - ACT_W//2, 180 + y_offset, ACTOR_X + ACT_W//2, 225 + y_offset), outline=BLACK, fill=WHITE, width=1)
    
    # System Activation Bars
    # Bar 1: Y = 180 to 225
    draw.rectangle((SYSTEM_X - ACT_W//2, 180 + y_offset, SYSTEM_X + ACT_W//2, 225 + y_offset), outline=BLACK, fill=WHITE, width=1)
    
    # Messages
    xs_actor = ACTOR_X + ACT_W//2
    xs_system = SYSTEM_X - ACT_W//2
    
    # 1. First Call message (Actor -> System)
    draw_solid_arrow(draw, xs_actor, 180 + y_offset, xs_system, 180 + y_offset)
    draw.text((375, 165 + y_offset), diag_data["msg_1_call"], font=F_REG, fill=BLACK, anchor="mm")
    
    # 2. First Return message (System -> Actor)
    draw_open_arrow(draw, xs_system, 225 + y_offset, xs_actor, 225 + y_offset)
    draw.text((375, 210 + y_offset), diag_data["msg_2_return"], font=F_REG, fill=BLACK, anchor="mm")
    
    # Actor Activation Bar 2: Y = 270 to fail_msg_y
    draw.rectangle((ACTOR_X - ACT_W//2, 270 + y_offset, ACTOR_X + ACT_W//2, fail_msg_y), outline=BLACK, fill=WHITE, width=1)
    
    # System Activation Bar 2: Y = 270 to fail_msg_y
    draw.rectangle((SYSTEM_X - ACT_W//2, 270 + y_offset, SYSTEM_X + ACT_W//2, fail_msg_y), outline=BLACK, fill=WHITE, width=1)
    
    # 3. Second Call message (Actor -> System)
    draw_solid_arrow(draw, xs_actor, 270 + y_offset, xs_system, 270 + y_offset)
    draw.text((375, 255 + y_offset), diag_data["msg_3_call"], font=F_REG, fill=BLACK, anchor="mm")
    
    # 4. Self-loop verification (System)
    verification_lines = diag_data["self_verification"].split("\n")
    y_verification_start = 295 + y_offset
    y_verification_end = y_verification_start + max(30, len(verification_lines) * 13 + 5)
    draw.rectangle((SYSTEM_X + ACT_W//2 - 1, y_verification_start, SYSTEM_X + ACT_W//2 + 5, y_verification_end), outline=BLACK, fill=WHITE, width=1)
    draw_self_loop(draw, SYSTEM_X + ACT_W//2, y_verification_start, y_verification_end, diag_data["self_verification"])
    
    # 5. alt Frame for Success / Failure
    alt_right_x = 780 if num_loops > 0 else 650
    # Outer alt box
    draw.rectangle((100, 350 + y_offset, alt_right_x, alt_bottom_y), outline=BLACK, width=1)
    # alt tab with cut corner
    draw.polygon([(100, 350 + y_offset), (145, 350 + y_offset), (145, 361 + y_offset), (139, 367 + y_offset), (100, 367 + y_offset)], outline=BLACK, fill=WHITE, width=1)
    draw.text((120, 358 + y_offset), "alt", font=F_REG, fill=BLACK, anchor="mm")
    
    # Condition 1: Success
    cond_success = diag_data.get("cond_success", "[Données valides]")
    draw.text((110, (370 if num_loops > 0 else 380) + y_offset), cond_success, font=F_ITALIC, fill=BLACK, anchor="ls")
    
    # Success self loops
    for i, loop_label in enumerate(success_loops):
        loop_y_start = 385 + y_offset + i * 45
        loop_y_end = 415 + y_offset + i * 45
        draw.rectangle((SYSTEM_X + ACT_W//2 - 1, loop_y_start, SYSTEM_X + ACT_W//2 + 5, loop_y_end), outline=BLACK, fill=WHITE, width=1)
        draw_self_loop(draw, SYSTEM_X + ACT_W//2, loop_y_start, loop_y_end, loop_label)
        
    # Return success
    draw_open_arrow(draw, xs_system, success_msg_y, xs_actor, success_msg_y)
    draw.text((375, success_msg_y - 15 if num_loops > 0 else success_msg_y - 12), diag_data["msg_success"], font=F_REG, fill=BLACK, anchor="mm")
    
    # Dash separator line
    draw_dashed_line(draw, 100, separator_y, alt_right_x, separator_y)
    
    # Condition 2: Failure
    draw.text((110, fail_cond_y), diag_data["fail_condition"], font=F_ITALIC, fill=BLACK, anchor="ls")
    draw_open_arrow(draw, xs_system, fail_msg_y, xs_actor, fail_msg_y)
    draw.text((375, fail_msg_y - 15 if num_loops > 0 else fail_msg_y - 12), diag_data["msg_error"], font=F_REG, fill=BLACK, anchor="mm")

    
    # Save Image to both directories
    OUT_DIR_1.mkdir(parents=True, exist_ok=True)
    OUT_DIR_2.mkdir(parents=True, exist_ok=True)
    img.save(OUT_DIR_1 / diag_data["filename"], "PNG")
    img.save(OUT_DIR_2 / diag_data["filename"], "PNG")
    print(f"Saved {diag_data['filename']} to both Docs/dss and Docs/DSS")

def main():
    diagrams = [
        {
            "filename": "dss-creer-cycle.png",
            "title": "Figure: DSS - Créer un cycle",
            "actor": "Administrateur",
            "msg_1_call": "demande la création d'un cycle",
            "msg_2_return": "affiche le formulaire de création",
            "msg_3_call": "saisit le montant, le nombre de tours, le nombre de participants et valide",
            "self_verification": "vérifie les données\ndu formulaire",
            "cond_success": "[Données valides]",
            "success_loops": ["enregistre le cycle", "envoie la notification\naux membres"],
            "fail_condition": "[Champs manquants ou doublons]",
            "msg_success": "affiche « cycle créé avec succès »",
            "msg_error": "affiche « impossible de démarrer le cycle »"
        },
        {
            "filename": "dss-creer-rubrique.png",
            "title": "Figure: DSS - Créer une rubrique",
            "actor": "Administrateur",
            "msg_1_call": "demande la création d'une rubrique",
            "msg_2_return": "affiche le formulaire de création d'une rubrique",
            "msg_3_call": "saisit le nom, montant, fréquence, liste des participants et valide",
            "self_verification": "vérifie les données\ndu formulaire",
            "cond_success": "[Données valides]",
            "success_loops": ["enregistre la rubrique", "envoie la notification\naux membres"],
            "fail_condition": "[Champs manquants ou doublons]",
            "msg_success": "affiche « rubrique créée avec succès »",
            "msg_error": "affiche « erreur lors de la création »"
        },
        {
            "filename": "dss-planifier-reunion.png",
            "title": "Figure: DSS - Planifier une réunion",
            "actor": "Administrateur",
            "msg_1_call": "clique sur planifier une réunion",
            "msg_2_return": "affiche le volet de planification de réunion",
            "msg_3_call": "saisit le titre, la date, le lieu et valide",
            "self_verification": "contrôle la date\nde réunion",
            "cond_success": "[Données valides]",
            "success_loops": ["enregistre la réunion", "envoie les notifications\naux membres"],
            "fail_condition": "[Date de réunion dans le passé]",
            "msg_success": "affiche réunion planifiée",
            "msg_error": "affiche « Date de réunion doit être dans le futur »"
        },
        {
            "filename": "dss-ouvrir-compte.png",
            "title": "Figure: DSS - Ouvrir un compte épargne",
            "actor": "Administrateur",
            "msg_1_call": "clique sur Épargne",
            "msg_2_return": "affiche la liste des comptes et la liste des membres sans compte",
            "msg_3_call": "clique sur Ouvrir un compte à côté du nom du membre",
            "self_verification": "vérifie l'absence du\ncompte pour ce membre",
            "cond_success": "[Compte absent]",
            "success_loops": ["génère un numéro\nde compte", "crée le compte pour\nce membre"],
            "fail_condition": "[Compte existe déjà]",
            "msg_success": "affiche « Compte épargne ouvert »",
            "msg_error": "affiche « Ce membre a déjà un compte »"
        },
        {
            "filename": "dss-demander-pret.png",
            "title": "Figure: DSS - Demander un prêt",
            "actor": "Membre",
            "msg_1_call": "clique sur \"Demander un prêt\"",
            "msg_2_return": "affiche le formulaire de demande",
            "msg_3_call": "saisit le montant, la durée, les avalistes et valide",
            "self_verification": "contrôle l'éligibilité,\nle montant et la\nvalidation des avalistes",
            "cond_success": "[Membre éligible et avalistes validés]",
            "success_loops": ["enregistre la demande\nà « en attente »"],
            "fail_condition": "[Montant invalide, non éligible\nou refus d'avaliste]",
            "msg_success": "affiche « Demande de prêt envoyée »",
            "msg_error": "affiche un message d'erreur"
        },
        {
            "filename": "dss-se-connecter.png",
            "title": "Figure: DSS - Se connecter",
            "actor": "Utilisateur",
            "skip_auth_ref": True,
            "msg_1_call": "clique sur \"Se connecter\"",
            "msg_2_return": "affiche le formulaire de connexion",
            "msg_3_call": "saisit son e-mail, son mot de passe et valide",
            "self_verification": "vérifie les identifiants",
            "cond_success": "[Identifiants valides]",
            "success_loops": ["établit la session\nutilisateur"],
            "fail_condition": "[Identifiants incorrects]",
            "msg_success": "affiche « Connexion réussie »",
            "msg_error": "affiche « Identifiants incorrects »"
        },
        {
            "filename": "dss-consulter-journal.png",
            "title": "Figure: DSS - Consulter le journal financier",
            "actor": "Membre",
            "msg_1_call": "clique sur \"Journal financier\" dans le menu",
            "msg_2_return": "affiche les soldes des caisses et entrées/sorties résumées",
            "msg_3_call": "clique sur \"Voir le détail\" pour affiche l'historique",
            "self_verification": "tri et filtrage chronologique\ndes mouvements financiers",
            "fail_condition": "[Aucun mouvement enregistré]",
            "msg_success": "affiche le journal détaillé des mouvements",
            "msg_error": "affiche \"Aucun mouvement financier enregistré pour le moment.\""
        }
    ]
    
    for diag in diagrams:
        generate_dss_diagram(diag)

if __name__ == "__main__":
    main()
